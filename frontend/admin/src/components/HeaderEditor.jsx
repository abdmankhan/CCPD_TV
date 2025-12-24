import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export default function HeaderEditor() {
  const [title, setTitle] = useState("CCPD, NITW");
  const [leftLogo, setLeftLogo] = useState("");
  const [rightLogo, setRightLogo] = useState("");

  const save = async () => {
    await axios.post(`${BACKEND_URL}/update-header`, {
      title,
      leftLogo,
      rightLogo
    });
    alert("Header updated");
  };

  return (
    <div className="header-editor">
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Left Logo URL" value={leftLogo} onChange={(e) => setLeftLogo(e.target.value)} />
      <input placeholder="Right Logo URL" value={rightLogo} onChange={(e) => setRightLogo(e.target.value)} />
      <button onClick={save}>Save Header</button>
    </div>
  );
}
