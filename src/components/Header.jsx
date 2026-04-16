import React from 'react'

export default function Header() {
  return (
    			<div className="border-b border-slate-800 px-6 py-5 flex items-center gap-4 bg-slate-950">
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
  )
}
