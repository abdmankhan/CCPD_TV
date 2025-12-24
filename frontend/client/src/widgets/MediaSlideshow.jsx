import { useEffect, useState } from "react";

export default function MediaSlideshow({ data = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!data.length) return;

    const current = data[index];
    const duration = (current.duration || 5) * 1000;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % data.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [index, data]);

  if (!data.length) {
    return (
      <div className="media-slideshow empty">
        <p>No media configured</p>
      </div>
    );
  }

  const item = data[index];

  return (
    <div className="media-slideshow">
      {item.type === "image" && (
        <img
          src={item.url}
          alt="Slide"
          className="media-image"
          draggable={false}
        />
      )}

      {item.type === "pdf" && (
        <iframe
          title="PDF Slide"
          src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
            item.url
          )}`}
          className="media-pdf"
        />
      )}
    </div>
  );
}
