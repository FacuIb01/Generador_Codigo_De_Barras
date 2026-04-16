import React from "react";

export default function Footer() {
	return (
		<footer className="w-full border-t border-slate-800 py-8 mt-auto bg-slate-950">
			<div className="flex flex-col items-center justify-center gap-2">
				<p className="text-xs text-slate-500 tracking-widest uppercase">
					Desarrollado por
				</p>
				<a
					href="https://www.linkedin.com/in/facundoibañez/"
					target="_blank"
					rel="noopener noreferrer"
					className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400 transition-all duration-300"
				>
					<span className="text-cyan-500 group-hover:animate-pulse">▮</span>
					F.I IT solutions
					<span className="text-cyan-500 group-hover:animate-pulse">▮</span>
				</a>
			</div>
		</footer>
	);
}
