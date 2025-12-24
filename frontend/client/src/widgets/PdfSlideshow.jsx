import { useEffect, useState } from "react";

export default function PdfSlideshow({ data }) {
  if (!data || !data.images || data.images.length === 0) {
    return <div className="widget empty">No slides</div>;
  }

  const { images, interval = 5 } = data;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [images, interval]);

  return (
    <img
      src={images[index]}
      alt="Slide"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        backgroundColor: "black"
      }}
    />
  );
}
