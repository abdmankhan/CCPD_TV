import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function Spotlight() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [ctc, setCtc] = useState("");

  const save = async () => {
    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "spotlight",
      data: { company, role, ctc }
    });
    alert("Spotlight updated");
  };

  return (
    <div>
      <h4>Company Spotlight</h4>

      <input placeholder="Company" onChange={(e) => setCompany(e.target.value)} />
      <input placeholder="Role" onChange={(e) => setRole(e.target.value)} />
      <input placeholder="CTC" onChange={(e) => setCtc(e.target.value)} />

      <button onClick={save}>Save</button>
    </div>
  );
}
