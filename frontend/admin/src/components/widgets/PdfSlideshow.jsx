import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function PdfSlideshow() {
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState(5);

  const save = async () => {
    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "pdfslideshow",
      data: { url, interval }
    });

    alert("PDF slideshow updated");
  };

  return (
    <div>
      <h4>PDF Slideshow</h4>

      <input
        placeholder="PDF URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <input
        type="number"
        min="1"
        value={interval}
        onChange={(e) => setInterval(+e.target.value)}
      />

      <button onClick={save}>Save</button>
    </div>
  );
}
