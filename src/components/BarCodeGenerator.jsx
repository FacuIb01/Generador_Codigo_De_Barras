import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const JSBARCODE_URL =
	"https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
const DOCX_URL = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js";

function useScript(src) {
	const [ready, setReady] = useState(false);
	useEffect(() => {
		if (document.querySelector(`script[src="${src}"]`)) {
			setReady(true);
			return;
		}
		const s = document.createElement("script");
		s.src = src;
		s.onload = () => setReady(true);
		document.head.appendChild(s);
	}, [src]);
	return ready;
}

function BarcodePreview({ text, barcodeReady }) {
	const svgRef = useRef(null);

	useEffect(() => {
		if (!barcodeReady || !text || !svgRef.current || !window.JsBarcode) return;
		try {
			window.JsBarcode(svgRef.current, text, {
				format: "CODE128",
				lineColor: "#0f172a",
				width: 2.2,
				height: 90,
				displayValue: true,
				fontSize: 13,
				fontOptions: "bold",
				margin: 12,
				background: "transparent",
				font: "monospace",
			});
		} catch {}
	}, [text, barcodeReady]);

	return <svg ref={svgRef} className="w-full" />;
}

export default function BarcodeGenerator() {
	const [inputText, setInputText] = useState("");
	const [currentText, setCurrentText] = useState("");
	const [batchText, setBatchText] = useState("");
	const [batchMode, setBatchMode] = useState(false);
	const [batchTexts, setBatchTexts] = useState([]);
	const [status, setStatus] = useState({ msg: "", type: "" });
	const [loading, setLoading] = useState(false);
	const [generated, setGenerated] = useState(false);
	const [animate, setAnimate] = useState(false);
	const navigate = useNavigate();

	const jsBarcodeReady = useScript(JSBARCODE_URL);
	const docxReady = useScript(DOCX_URL);

	const setMsg = (msg, type = "") => setStatus({ msg, type });

	const generateBarcode = () => {
		const txt = inputText.trim();
		if (!txt) {
			setMsg("Ingresá un texto primero.", "error");
			return;
		}
		setBatchTexts([]);
		setCurrentText(txt);
		setAnimate(false);
		setTimeout(() => {
			setGenerated(true);
			setAnimate(true);
		}, 10);
		setMsg("Código generado correctamente.", "success");
	};

	const generateBatch = () => {
		const lines = batchText
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l);
		if (!lines.length) {
			setMsg("Ingresá al menos un texto.", "error");
			return;
		}
		setBatchTexts(lines);
		setCurrentText(lines[0]);
		setAnimate(false);
		setTimeout(() => {
			setGenerated(true);
			setAnimate(true);
		}, 10);
		setMsg(
			`${lines.length} código${lines.length > 1 ? "s" : ""} listos para exportar.`,
			"success",
		);
	};

	const svgToPng = (text) =>
		new Promise((resolve) => {
			const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			el.style.cssText = "position:absolute;visibility:hidden;";
			document.body.appendChild(el);
			try {
				window.JsBarcode(el, text, {
					format: "CODE128",
					lineColor: "#000000",
					width: 2.2,
					height: 90,
					displayValue: true,
					fontSize: 13,
					margin: 12,
					background: "#ffffff",
				});
			} catch {
				document.body.removeChild(el);
				resolve(null);
				return;
			}
			const svgData = new XMLSerializer().serializeToString(el);
			document.body.removeChild(el);
			const blob = new Blob([svgData], { type: "image/svg+xml" });
			const url = URL.createObjectURL(blob);
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.width || 420;
				canvas.height = img.height || 130;
				const ctx = canvas.getContext("2d");
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
				URL.revokeObjectURL(url);
				resolve(canvas.toDataURL("image/png"));
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				resolve(null);
			};
			img.src = url;
		});

	const downloadWord = async () => {
		if (!docxReady || !jsBarcodeReady) {
			setMsg("Cargando librerías...", "");
			return;
		}
		setLoading(true);
		setMsg("Generando documento Word...", "");
		const { Document, Packer, Paragraph, TextRun, ImageRun } = window.docx;
		const texts = batchTexts.length ? batchTexts : [currentText];
		const children = [];

		for (let i = 0; i < texts.length; i++) {
			const txt = texts[i];
			children.push(
				new Paragraph({
					children: [
						new TextRun({
							text: txt,
							bold: true,
							size: 28,
							font: "Courier New",
						}),
					],
					spacing: { after: 160 },
				}),
			);
			const dataUrl = await svgToPng(txt);
			if (dataUrl) {
				const base64 = dataUrl.split(",")[1];
				const binary = atob(base64);
				const bytes = new Uint8Array(binary.length);
				for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
				children.push(
					new Paragraph({
						children: [
							new ImageRun({
								data: bytes,
								transformation: { width: 400, height: 120 },
								type: "png",
							}),
						],
						spacing: { after: i < texts.length - 1 ? 560 : 160 },
					}),
				);
			}
		}

		try {
			const doc = new Document({
				sections: [
					{
						properties: {
							page: {
								size: { width: 12240, height: 15840 },
								margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
							},
						},
						children,
					},
				],
			});
			const blob = await Packer.toBlob(doc);
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "codigos_de_barras.docx";
			a.click();
			URL.revokeObjectURL(url);
			setMsg("Word descargado correctamente.", "success");
		} catch (e) {
			setMsg("Error al generar el Word.", "error");
		}
		setLoading(false);
	};

	const printBarcode = () => {
		const texts = batchTexts.length ? batchTexts : [currentText];

		if (texts.length === 0 || !texts[0]) {
			setMsg("No hay códigos para imprimir.", "error");
			return;
		}

		// 1. Guardamos los textos en localStorage para que sobrevivan al F5
		localStorage.setItem("printTexts", JSON.stringify(texts));

		// 2. Navegamos sin pasar el state
		navigate("/print");
	};
	const displayTexts = batchTexts.length
		? batchTexts
		: currentText
			? [currentText]
			: [];

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
			{/* Header */}
			<div className="border-b border-slate-800 px-6 py-5 flex items-center gap-4">
				<div className="flex gap-1">
					{[..."▮▯▮▮▯▮▯▯▮▮"].map((c, i) => (
						<span
							key={i}
							className={`text-lg ${c === "▮" ? "text-cyan-400" : "text-slate-700"}`}
						>
							{c}
						</span>
					))}
				</div>
				<div>
					<h1 className="text-lg font-bold tracking-widest text-white uppercase">
						Code-128 Generator
					</h1>
					<p className="text-xs text-slate-500 tracking-wider">
						Impresión directa · Exportación Word
					</p>
				</div>
			</div>

			<div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
				{/* Tabs */}
				<div className="flex gap-2 border-b border-slate-800 pb-0">
					<button
						onClick={() => setBatchMode(false)}
						className={`px-4 py-2 text-sm tracking-wide border-b-2 transition-colors ${!batchMode ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
					>
						TEXTO ÚNICO
					</button>
					<button
						onClick={() => setBatchMode(true)}
						className={`px-4 py-2 text-sm tracking-wide border-b-2 transition-colors ${batchMode ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
					>
						MULTI-TEXTO
					</button>
				</div>

				{/* Input area */}
				{!batchMode ? (
					<div className="flex gap-3">
						<input
							type="text"
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && generateBarcode()}
							placeholder="Ej: holaquetal"
							className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm tracking-wider"
						/>
						<button
							onClick={generateBarcode}
							className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-widest rounded-lg transition-all active:scale-95"
						>
							GENERAR
						</button>
					</div>
				) : (
					<div className="space-y-3">
						<textarea
							value={batchText}
							onChange={(e) => setBatchText(e.target.value)}
							placeholder={
								"holaquetal\nproducto002\notro-texto\n(uno por línea)"
							}
							rows={5}
							className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm tracking-wider resize-none"
						/>
						<button
							onClick={generateBatch}
							className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-widest rounded-lg transition-all active:scale-95"
						>
							GENERAR TODOS
						</button>
					</div>
				)}

				{/* Status */}
				{status.msg && (
					<p
						className={`text-xs tracking-wider ${status.type === "error" ? "text-red-400" : status.type === "success" ? "text-emerald-400" : "text-slate-400"}`}
					>
						{status.type === "error"
							? "✗ "
							: status.type === "success"
								? "✓ "
								: "⋯ "}
						{status.msg}
					</p>
				)}

				{/* Preview */}
				{generated && displayTexts.length > 0 ? (
					<div
						className={`transition-all duration-500 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
					>
						{/* Actions */}
						<div className="flex gap-2 mb-4 flex-wrap">
							<button
								onClick={printBarcode}
								className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 font-bold text-xs tracking-widest rounded-lg hover:bg-slate-100 transition-all active:scale-95"
							>
								<span>⎙</span> IMPRIMIR
							</button>
							<button
								onClick={downloadWord}
								disabled={loading}
								className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-white font-bold text-xs tracking-widest rounded-lg hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
							>
								<span>↓</span> {loading ? "GENERANDO..." : "DESCARGAR WORD"}
							</button>
						</div>

						{/* Barcode cards */}
						<div className="space-y-4">
							{displayTexts.map((txt, i) => (
								<div
									key={txt + i}
									className="bg-white rounded-xl p-5 border border-slate-200"
									style={{ transitionDelay: `${i * 60}ms` }}
								>
									<p className="text-slate-950 font-bold text-base tracking-widest mb-3 font-mono">
										{txt}
									</p>
									<div className="bg-white">
										{jsBarcodeReady && (
											<BarcodePreview
												text={txt}
												barcodeReady={jsBarcodeReady}
											/>
										)}
									</div>
								</div>
							))}
						</div>

						{batchTexts.length > 1 && (
							<p className="text-xs text-slate-500 tracking-wider mt-3">
								{batchTexts.length} códigos · El Word incluirá todos
							</p>
						)}
					</div>
				) : !generated ? (
					<div className="border border-dashed border-slate-800 rounded-xl p-12 text-center">
						<div className="flex justify-center gap-1 mb-4">
							{[..."▮▯▮▮▯▮▯▯▮▮▯▮"].map((c, i) => (
								<span
									key={i}
									className={`text-2xl ${c === "▮" ? "text-slate-700" : "text-slate-800"}`}
								>
									{c}
								</span>
							))}
						</div>
						<p className="text-slate-600 text-sm tracking-wider">
							Ingresá un texto para generar el código
						</p>
					</div>
				) : null}
			</div>
		</div>
	);
}
