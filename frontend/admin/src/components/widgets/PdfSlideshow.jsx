import { useState,useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { useDashboard } from "../../context/DashboardContext";

export default function PdfSlideshow() {
  const [file, setFile] = useState(null);
  const [interval, setIntervalTime] = useState(5);
  const [loading, setLoading] = useState(false);
  const { dashboard } = useDashboard();

  useEffect(() => {
  if (!dashboard) return;

  const widget = dashboard.widgets?.pdfslideshow;
  if (!widget) return;

  if (widget.interval) {
    setIntervalTime(widget.interval);
  }

}, [dashboard]);

  const uploadAndSave = async () => {
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("duration", interval);

    try {
      setLoading(true);

      const res = await axios.post(
        `${BACKEND_URL}/upload-file`,
        form
      );

      const images = res.data.items.map(i => i.url);

      await axios.post(`${BACKEND_URL}/update-widget`, {
        widget: "pdfslideshow",
        data: {
          images,
          interval
        }
      });

      alert("PDF slideshow sent to TV");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor">
      <h4>PDF Slideshow</h4>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <input
        type="number"
        min="1"
        value={interval}
        onChange={(e) => setIntervalTime(Number(e.target.value))}
        placeholder="Seconds per slide"
      />

      <button onClick={uploadAndSave} disabled={loading}>
        {loading ? "Uploading..." : "Upload & Save"}
      </button>
    </div>
  );
}
