import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function Announcements() {
  const [text, setText] = useState("");

  const save = async () => {
    const announcements = text
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "announcements",
      data: announcements
    });

    alert("Announcements updated");
  };

  return (
    <div>
      <h4>Announcements</h4>

      <textarea
        rows={6}
        placeholder="One announcement per line"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%" }}
      />

      <button onClick={save}>Save</button>
    </div>
  );
}
