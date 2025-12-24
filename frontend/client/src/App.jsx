import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../../admin/src/config";

import Announcements from "./widgets/Announcements";
import Drives from "./widgets/Drives";
import Spotlight from "./widgets/Spotlight";
import Stats from "./widgets/Stats";
import PdfSlideshow from "./widgets/PdfSlideshow";
import YoutubePlayer from "./widgets/YoutubePlayer";
import MediaSlideshow from "./widgets/MediaSlideshow";

import logoLeft from "../src/assets/NITW_Logo2.png";

const socket = io(BACKEND_URL);

const WIDGETS = {
  announcements: Announcements,
  drives: Drives,
  spotlight: Spotlight,
  stats: Stats,
  pdfslideshow: PdfSlideshow,
  youtube: YoutubePlayer,
  mediaSlideshow: MediaSlideshow
};

export default function App() {
  const [layout, setLayout] = useState([]);
  const [widgets, setWidgets] = useState({});
  const [header, setHeader] = useState({});

  useEffect(() => {
    socket.on("INIT_STATE", (state) => {
    setLayout(state.layout || []);
    setWidgets(state.widgets || {});
    setHeader(state.header || {});
  });

    socket.on("DASHBOARD_UPDATE", (state) => {
      setLayout(state.layout || []);
      setWidgets(state.widgets || {});
      setHeader(state.header || {});
    });

    return () => {
    socket.off("INIT_STATE");
    socket.off("DASHBOARD_UPDATE");
  };
  }, []);

  return (
    <div className="tv-root">
      <header className="tv-header">
        <img
          src={logoLeft}
          alt="Left Logo"
          className="tv-logo left"
        />
        Center for Career Planning and Development
      </header>

      <div className="tv-canvas">
        {layout.map((item) => {
          const type = item.i.split("-")[0];
          const Comp = WIDGETS[type];

          if (!Comp) return null;

          return (
            <div
              key={item.i}
              className="tv-widget"
              style={{
                gridColumn: `${item.x + 1} / span ${item.w}`,
                gridRow: `${item.y + 1} / span ${item.h}`
              }}
            >
              <Comp data={widgets[type]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
