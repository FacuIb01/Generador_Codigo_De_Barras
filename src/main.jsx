import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import PrintPage from "./components/PrintPage"
import BarcodeGenerator from "./components/BarCodeGenerator.jsx";
import Footer from "./components/Footer.jsx";

createRoot(document.getElementById("root")).render(
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<BarcodeGenerator />} />
				<Route path="/print" element={<PrintPage />} />
			</Routes>
			<Footer />
		</BrowserRouter>
);
