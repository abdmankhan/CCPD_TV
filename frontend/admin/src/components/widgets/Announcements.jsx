import { useState } from "react";
import api from "../../services/api";
import { BACKEND_URL } from "../../config";

export default function Announcements() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!text.trim()) {
      alert("Please enter at least one announcement");
      return;
    }

    const announcements = text
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    if (announcements.length === 0) {
      alert("Please enter at least one announcement");
      return;
    }

    setLoading(true);
    try {
      await api.post(`${BACKEND_URL}/update-widget`, {
        widget: "announcements",
        data: announcements
      });
      alert(`✓ ${announcements.length} announcement(s) saved successfully!`);
    } catch (error) {
      alert("Failed to save announcements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="widget-container" style={{ height: 'auto', overflow: 'visible' }}>
      <div className="widget-header">
        <h4>Announcements</h4>
      </div>

      <div className="widget-body" style={{ overflow: 'visible', flex: 'none' }}>
        <textarea
          className="widget-textarea"
          rows={Math.max(6, text.split('\n').length + 1)}
          placeholder={`One announcement per line\nExample:\n- Training session tomorrow at 10 AM`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          style={{ resize: 'none', overflow: 'hidden' }}
        />
      </div>

      <div className="widget-footer">
        <button className="widget-btn" onClick={save} disabled={loading}>
          {loading ? "⏳ Saving..." : "💾 Save Announcements"}
        </button>
      </div>
    </div>
  );
}
