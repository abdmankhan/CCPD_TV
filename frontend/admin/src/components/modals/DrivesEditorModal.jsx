import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { useDashboard } from "../../context/DashboardContext";

export default function DrivesEditorModal({ onClose }) {
  const { dashboard, setDashboard } = useDashboard();
  const [drives, setDrives] = useState([]);

  const getDefaultDriveFields = () => ({
    company: "",
    role: "SDE",
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    })(),
    time: "9:00 AM",
    venue: "CCPD",
  });

  const defaults = getDefaultDriveFields();

  const [company, setCompany] = useState(defaults.company);
  const [role, setRole] = useState(defaults.role);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [venue, setVenue] = useState(defaults.venue);

  useEffect(() => {
    if (dashboard?.widgets?.drives) {
      setDrives(dashboard.widgets.drives);
    }
  }, [dashboard]);

  const addDrive = () => {
    if (!company.trim()) return;

    setDrives((prev) => [...prev, { company, role, date, time, venue }]);

    const d = getDefaultDriveFields();
    setCompany(d.company);
    setRole(d.role);
    setDate(d.date);
    setTime(d.time);
    setVenue(d.venue);
  };

  const deleteDrive = (i) => {
    setDrives((prev) => prev.filter((_, idx) => idx !== i));
  };

  const parseDDMMYYYY = (str) => {
    if (!str) return new Date(0);
    const [dd, mm, yyyy] = str.split("-");
    return new Date(`${yyyy}-${mm}-${dd}`);
  };
  const save = async () => {
    const sortedDrives = [...drives].sort(
      (a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date)
    );
    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "drives",
      data: drives,
    });
    setDashboard((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        drives: sortedDrives,
      },
    }));
    onClose();
  };

  return createPortal(
    <div className="fullscreen-overlay">
      <div className="fullscreen-modal">
        <div className="modal-header">
          <h2>Manage Placement Drives</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          <div className="form-row">
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
              placeholder="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              placeholder="Time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <input
              placeholder="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
            <button onClick={addDrive}>Add</button>
          </div>

          <ul className="drive-list">
            {drives.map((d, i) => (
              <li key={i} className="drive-item">
                <div className="drive-text">
                  <strong>{d.company}</strong>

                  {d.role && <span> — {d.role}</span>}

                  {(d.date || d.time) && (
                    <span>
                      {" "}
                      | {d.date}
                      {d.time && ` @ ${d.time}`}
                    </span>
                  )}

                  {d.venue && <div className="venue">Venue: {d.venue}</div>}
                </div>

                <button onClick={() => deleteDrive(i)}>✕</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-footer">
          <button className="save-btn" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
