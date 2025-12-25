import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { useDashboard } from "../../context/DashboardContext";
import DrivesEditorModal from "../modals/DrivesEditorModal";

export default function DrivesWidget() {
  const { dashboard } = useDashboard();
  const [open, setOpen] = useState(false);

  const drives = dashboard?.widgets?.drives || [];

  return (
    <div className="editor-box drives-widget">
      <div className="widget-header">
        <h4>Scheduled Drives</h4>
      </div>

      <div className="widget-body">
        {drives.length === 0 ? (
          <p className="muted">No drives added</p>
        ) : (
          <ul className="drive-summary">
            {drives.slice(0, 3).map((d, i) => (
              <li key={i}>
                <strong>{d.company}</strong>
                {d.date && <span> — {d.date}</span>}
              </li>
            ))}
            {drives.length > 3 && (
              <li className="more">
                +{drives.length - 3} more
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="widget-footer">
        <button className="edit-btn" onClick={() => setOpen(true)}>
          ✏️ Edit Drives
        </button>
      </div>

      {open && <DrivesEditorModal onClose={() => setOpen(false)} />}
    </div>
  );
}
