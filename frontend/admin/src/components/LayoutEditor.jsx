import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import GridLayout from "react-grid-layout";
import axios from "axios";
import { BACKEND_URL } from "../config";

import Announcements from "./widgets/Announcements";
import Drives from "./widgets/Drives";
import Spotlight from "./widgets/Spotlight";
import Stats from "./widgets/Stats";
import PdfSlideshow from "./widgets/PdfSlideshow";
import YoutubePlayer from "./widgets/YoutubePlayer";
import MediaSlideshow from "./widgets/MediaSlideshow";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const WIDGETS = {
  announcements: Announcements,
  drives: Drives,
  spotlight: Spotlight,
  stats: Stats,
  pdfslideshow: PdfSlideshow,
  youtube: YoutubePlayer,
  mediaSlideshow: MediaSlideshow
};

const socket = io(BACKEND_URL);

export default function LayoutEditor() {
  useEffect(() => {
    socket.on("INIT_STATE", (state) => {
      if (state.layout) {
        setLayout(state.layout);
      }
    });

    return () => {
      socket.off("INIT_STATE");
      socket.off("DASHBOARD_UPDATE");
    };
  }, []);

  const canvasRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    if (canvasRef.current) {
      setGridWidth(canvasRef.current.offsetWidth);
    }
  }, []);

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
        y: 0,
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
        <div className="palette-content">
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
        </div>
      </aside>

      {/* CANVAS */}
      <main className="canvas" ref={canvasRef}>
        <GridLayout
          layout={layout}
          cols={12}
          rowHeight={90}
          width={gridWidth}
          onLayoutChange={handleLayoutChange}
          isResizable
          compactType={null}
          verticalCompact={false}
          maxRows={6}
          isBounded={true}
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
