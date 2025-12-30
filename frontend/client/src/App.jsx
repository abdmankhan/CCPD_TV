import { useEffect, useState } from "react";
import { socket } from "../src/services/socket";

import Announcements from "./widgets/Announcements";
import Drives from "./widgets/Drives";
import Spotlight from "./widgets/Spotlight";
import Stats from "./widgets/Stats";
import PdfSlideshow from "./widgets/PdfSlideshow";
import YoutubePlayer from "./widgets/YoutubePlayer";
import MediaSlideshow from "./widgets/MediaSlideshow";
import BackgroundMusic from "./widgets/BackgroundMusic";

import logoLeft from "../src/assets/NITW_Logo2.png";

const WIDGETS = {
  announcements: Announcements,
  drives: Drives,
  spotlight: Spotlight,
  stats: Stats,
  pdfslideshow: PdfSlideshow,
  youtube: YoutubePlayer,
  mediaSlideshow: MediaSlideshow,
  backgroundMusic: BackgroundMusic
};

export default function App() {
  const [layout, setLayout] = useState([]);
  const [widgets, setWidgets] = useState({});
  const [header, setHeader] = useState({});
  const [layoutTemplate, setLayoutTemplate] = useState(null);
  const [widgetSlots, setWidgetSlots] = useState({});

  useEffect(() => {
    socket.on("INIT_STATE", (state) => {
    setLayout(state.layout || []);
    setWidgets(state.widgets || {});
    setHeader(state.header || {});
    setLayoutTemplate(state.layoutTemplate || null);
    setWidgetSlots(state.widgetSlots || {});
  });

    socket.on("DASHBOARD_UPDATE", (state) => {
      setLayout(state.layout || []);
      setWidgets(state.widgets || {});
      setHeader(state.header || {});
      setLayoutTemplate(state.layoutTemplate || null);
      setWidgetSlots(state.widgetSlots || {});
    });

    return () => {
    socket.off("INIT_STATE");
    socket.off("DASHBOARD_UPDATE");
  };
  }, []);

  return (
    <div className="tv-root">
      {/* Background Music - Always Present */}
      <BackgroundMusic data={widgets.backgroundMusic} />
      
      <header className="tv-header">
        <img
          src={logoLeft}
          alt="Left Logo"
          className="tv-logo left"
          style={{ marginRight: '20px' }}
        />
        Center for Career Planning and Development
      </header>

      <div className="tv-canvas">
        {layout.map((item) => {
          let type, Comp;
          
          if (layoutTemplate === 'custom' || !layoutTemplate) {
            // Custom layout or legacy: widget type is in the item id
            type = item.i.split("-")[0];
            Comp = WIDGETS[type];
          } else {
            // Template layout: widget type is in widgetSlots
            type = widgetSlots[item.i];
            Comp = type ? WIDGETS[type] : null;
          }

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
