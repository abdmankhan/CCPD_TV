import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

// Required for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfSlideshow({ data }) {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);

  const interval = data?.interval ?? 5; // seconds
  const pdfUrl = data?.url;

  useEffect(() => {
    if (!pdfUrl) return;

    pdfjsLib.getDocument(pdfUrl).promise.then(setPdf);
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdf) return;

    const renderPage = async () => {
      const p = await pdf.getPage(page);
      const viewport = p.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await p.render({ canvasContext: ctx, viewport }).promise;
    };

    renderPage();

    const timer = setTimeout(() => {
      setPage((prev) =>
        prev >= pdf.numPages ? 1 : prev + 1
      );
    }, interval * 1000);

    return () => clearTimeout(timer);
  }, [pdf, page, interval]);

  if (!pdfUrl) {
    return <h2>No PDF selected</h2>;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
