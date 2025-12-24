import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function PdfSlideshow() {
  const [urls, setUrls] = useState("");
  const [interval, setIntervalTime] = useState(5);

  const saveSlides = async () => {
    const images = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (images.length === 0) {
      alert("Please enter at least one image URL");
      return;
    }

    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "pdfslideshow",
      data: {
        images,
        interval
      }
    });

    alert("Slides sent to TV");
  };

  return (
    <div className="editor">
      <h4>PDF Slideshow (Images)</h4>

      <textarea
        placeholder="Paste image URLs (one per line)"
        rows={6}
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
      />

      <input
        type="number"
        min="1"
        value={interval}
        onChange={(e) => setIntervalTime(Number(e.target.value))}
        placeholder="Seconds per slide"
      />

      <button onClick={saveSlides}>Save</button>
    </div>
  );
}
