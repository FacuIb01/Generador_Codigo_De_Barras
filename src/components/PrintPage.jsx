import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const JSBARCODE_URL =
	"https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";

// Reutilizamos el hook para asegurar que la librería cargue si el usuario hace F5
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

export default function PrintPage() {
	const navigate = useNavigate();
	const [texts, setTexts] = useState([]);
	const jsBarcodeReady = useScript(JSBARCODE_URL);

	useEffect(() => {
		// Recuperamos los datos persistidos
		const savedTexts = localStorage.getItem("printTexts");

		if (savedTexts) {
			setTexts(JSON.parse(savedTexts));
		} else {
			// Si entran directo y no hay datos, los devolvemos al generador
			navigate("/");
		}
	}, [navigate]);

	useEffect(() => {
		// Solo generamos cuando tenemos textos y la librería ya cargó
		if (texts.length > 0 && jsBarcodeReady && window.JsBarcode) {
			texts.forEach((text, i) => {
				window.JsBarcode(`#bc-${i}`, text, {
					format: "CODE128",
					lineColor: "#000",
					width: 2,
					height: 60,
					displayValue: true,
					fontSize: 13,
					margin: 12,
					background: "#fff",
				});
			});

			// Pequeño delay para asegurar que el DOM y los SVGs estén listos
			const timer = setTimeout(() => {
				window.print();
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [texts, jsBarcodeReady]);

	return (
		<div className="p-8 bg-white min-h-screen text-black font-mono">
			<button
				onClick={() => navigate("/")}
				className="mb-8 px-4 py-2 bg-slate-900 text-white rounded-lg print:hidden"
			>
				← Volver al Generador
			</button>

			<div className="space-y-10">
				{texts.map((text, i) => (
					<div
						key={i}
						className="break-inside-avoid border-b border-gray-100 pb-6"
					>
						<h2 className="text-xl font-bold mb-2 uppercase tracking-widest">
							{text}
						</h2>
						<svg id={`bc-${i}`} className="max-w-full"></svg>
					</div>
				))}
			</div>

			<style
				dangerouslySetInnerHTML={{
					__html: `
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `,
				}}
			/>
		</div>
	);
}
