import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function Drives() {
  const [drives, setDrives] = useState([]);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");

  const addDrive = () => {
    if (!company) {
      alert("Company name is required");
      return;
    }

    setDrives([
      ...drives,
      { company, role, date, time, venue }
    ]);

    setCompany("");
    setRole("");
    setDate("");
    setTime("");
    setVenue("");
  };

  const saveDrives = async () => {
    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "drives",
      data: drives
    });

    alert("Drives updated on TV");
  };

  return (
    <div className="editor drives-editor">
      <h4>Placement Drives</h4>

      <input
        placeholder="Company *"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />

      <input
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      <input
        placeholder="Date (e.g. 25 Sept 2025)"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <input
        placeholder="Time (e.g. 10:00 AM)"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <input
        placeholder="Venue"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
      />

      <button onClick={addDrive}>Add Drive</button>

      <ul>
        {drives.map((d, i) => (
          <li key={i}>
            {d.company} {d.date && `– ${d.date}`} {d.time && `– ${d.time}`}
          </li>
        ))}
      </ul>

      <button className="save" onClick={saveDrives}>
        Save to TV
      </button>
    </div>
  );
}
