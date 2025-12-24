import { useState } from "react";
import GridLayout from "react-grid-layout";
import axios from "axios";
import { BACKEND_URL } from "../config";

import Announcements from "./widgets/Announcements";
import Drives from "./widgets/Drives";
import Spotlight from "./widgets/Spotlight";
import Stats from "./widgets/Stats";
import PdfSlideshow from "./widgets/PdfSlideshow";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";


const WIDGETS = {
  announcements: Announcements,
  drives: Drives,
  spotlight: Spotlight,
  stats: Stats,
  pdfslideshow: PdfSlideshow
};

export default function LayoutEditor() {
  const [layout, setLayout] = useState([]);

  /* Add widget only once */
  const isWidgetAdded = (type) =>
    layout.some((item) => item.i.startsWith(type + "-"));

  const addWidget = (type) => {
    if (isWidgetAdded(type)) return;

    setLayout((prev) => [
      ...prev,
      {
        i: `${type}-${Date.now()}`,
        x: 0,
        y: Infinity,
        w: 4,
        h: 2,
      },
    ]);
  };

  const removeWidget = (id) => {
    setLayout((prev) => prev.filter((item) => item.i !== id));
  };

  const pushToTV = async () => {
    await axios.post(`${BACKEND_URL}/update-layout`, { layout });
    alert("Layout pushed to TV");
  };

  const handleLayoutChange = (newLayout) => {
    setLayout((prev) => {
      // Prevent unnecessary re-renders
      if (JSON.stringify(prev) === JSON.stringify(newLayout)) {
        return prev;
      }
      return newLayout;
    });
  };

  return (
    <div className="admin">
      {/* LEFT PALETTE */}
      <aside className="palette">
        <h4>Widgets</h4>

        {Object.keys(WIDGETS).map((key) => (
          <button
            key={key}
            onClick={() => addWidget(key)}
            disabled={isWidgetAdded(key)}
          >
            ➕ {key}
          </button>
        ))}

        <button
          className="push"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={pushToTV}
        >
          🚀 Push to TV
        </button>
      </aside>

      {/* CANVAS */}
      <main className="canvas">
        <GridLayout
          layout={layout}
          cols={12}
          rowHeight={90}
          width={1920}
          onLayoutChange={handleLayoutChange}
          isResizable
          compactType={null}
          draggableHandle=".widget"
          draggableCancel=".delete-btn, button, textarea, input"
        >
          {layout.map((item) => {
            const type = item.i.split("-")[0];
            const Comp = WIDGETS[type];

            if (!Comp) return null;

            return (
              <div key={item.i} className="widget">
                <button
                  className="delete-btn"
                  onClick={() => removeWidget(item.i)}
                >
                  ✕
                </button>

                <Comp />
              </div>
            );
          })}
        </GridLayout>
      </main>
    </div>
  );
}
