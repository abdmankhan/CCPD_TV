import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function MediaSlideshow() {
  const [items, setItems] = useState([]);

  const [type, setType] = useState("image");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(5);

  const addItem = () => {
    if (!url) {
      alert("URL is required");
      return;
    }

    setItems([
      ...items,
      {
        type,
        url,
        duration: Number(duration) || 5,
      },
    ]);

    setUrl("");
    setDuration(6);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (from, to) => {
    if (to < 0 || to >= items.length) return;

    const updated = [...items];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);

    setItems(updated);
  };

  const saveToTV = async () => {
    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "mediaSlideshow",
      data: items,
    });

    alert("Media slideshow updated on TV");
  };

  return (
    <div className="editor media-editor">
      <h4>Media Slideshow</h4>

      {/* ADD MEDIA */}
      <div className="media-form">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
        </select>

        <input
          placeholder="Media URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <input
          type="number"
          min="1"
          placeholder="Duration (sec)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <button onClick={addItem}>Add</button>
      </div>

      {/* PLAYLIST */}
      <ul className="media-list">
        {items.map((item, index) => (
          <li key={index} className="media-item">
            <span>
              {index + 1}. {item.type} — {item.duration}s
            </span>

            <div className="actions">
              <button onClick={() => moveItem(index, index - 1)}>↑</button>
              <button onClick={() => moveItem(index, index + 1)}>↓</button>
              <button onClick={() => removeItem(index)}>✕</button>
            </div>
          </li>
        ))}
      </ul>

      <button className="save" onClick={saveToTV}>
        Save to TV
      </button>
    </div>
  );
}
