import { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import "./App.css";

export default function App() {
	const [image, setImage] = useState(null);
	const [text, setText] = useState("");
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	const svgToImageFile = async (svgText) => {
		const blob = new Blob([svgText], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);

		return new Promise((resolve) => {
			const img = new Image();

			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.width || 900;
				canvas.height = img.height || 700;

				const ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0);

				canvas.toBlob((blob) => resolve(blob), "image/png");
			};

			img.src = url;
		});
	};

	const performOCR = async (file) => {
		setLoading(true);
		setText("");

		const result = await Tesseract.recognize(file, "eng");

		const formattedText = result.data.text
			.replace(/\r?\n|\r/g, " ") // Replace line breaks with spaces
			.replace(/\s+/g, " ") // Remove extra spaces
			.trim();

		setText(formattedText);

		setLoading(false);
	};

	const handleFile = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		setImage(URL.createObjectURL(file));

		if (file.name.toLowerCase().endsWith(".svg")) {
			const svgText = await file.text();

			const imageBlob = await svgToImageFile(svgText);

			const imageFile = new File([imageBlob], "svg.png", {
				type: "image/png"
			});

			performOCR(imageFile);
			return;
		}

		performOCR(file);
	};

	const copyText = async () => {
		await navigator.clipboard.writeText(text);

		setCopied(true);

		setTimeout(() => {
			setCopied(false);
		}, 1500);
	};
	useEffect(() => {
		const handlePaste = async (event) => {
			const items = event.clipboardData?.items;

			if (!items) return;

			for (const item of items) {
				if (item.type.startsWith("image/")) {
					const file = item.getAsFile();

					if (!file) return;

					setImage(URL.createObjectURL(file));

					performOCR(file);

					break;
				}
			}
		};

		window.addEventListener("paste", handlePaste);

		return () => {
			window.removeEventListener("paste", handlePaste);
		};
	}, []);
	return (
		<div className="page">
			<div className="card">
				<div className="header">
					<h1>✨ Image to Text Converter</h1>
					<p>
						Upload images or SVG and extract text instantly using
						OCR
					</p>
				</div>

				<label className="uploadBox">
					📁 Click or Drop Your File Here
					<input
						type="file"
						accept=".png,.jpg,.jpeg,.webp,.svg"
						onChange={handleFile}
						hidden
					/>
				</label>

				{loading && (
					<div className="loading">
						⏳ Extracting text... please wait
					</div>
				)}

				<div className="content">
					{image && (
						<div className="imageBox">
							<img src={image} alt="preview" />
						</div>
					)}

					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Extracted text will appear here..."
						className="textarea"
					/>
				</div>

				<button className="button" onClick={copyText}>
					{copied ? "✓ Copied" : "📋 Copy Text"}
				</button>
			</div>
		</div>
	);
}
