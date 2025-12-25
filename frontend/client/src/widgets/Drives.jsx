import { useEffect, useRef, useState } from "react";

const getTodayAndTomorrow = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const fmt = (d) =>
    `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;

  return {
    today: fmt(today),
    tomorrow: fmt(tomorrow),
  };
};

export default function Drives({ data }) {
  const { today, tomorrow } = getTodayAndTomorrow();

  const containerRef = useRef(null);
  const itemRef = useRef(null);

  const [visibleCount, setVisibleCount] = useState(1);
  const [startIndex, setStartIndex] = useState(0);

  // 1️⃣ Calculate visible items automatically
  useEffect(() => {
    if (!containerRef.current || !itemRef.current) return;

    const containerHeight = containerRef.current.offsetHeight;
    const itemHeight = itemRef.current.offsetHeight;

    const count = Math.max(1, Math.floor(containerHeight / itemHeight));
    setVisibleCount(count);
  }, [data]);

  // 2️⃣ Rotate pages every 2 seconds
  useEffect(() => {
    if (!data || data.length <= visibleCount) return;

    const interval = setInterval(() => {
      setStartIndex((prev) => {
        const next = prev + visibleCount;
        return next >= data.length ? 0 : next;
      });
    }, 2000); // ⏱️ pause per page

    return () => clearInterval(interval);
  }, [data, visibleCount]);

  if (!data || data.length === 0) {
    return (
      <div className="widget drives">
        <div className="drives-header">
          <h3>Placement Drives</h3>
        </div>
        <div className="drives-body">
          <p>No active drives</p>
        </div>
      </div>
    );
  }

  const visibleDrives = data.slice(
    startIndex,
    startIndex + visibleCount
  );

  return (
    <div className="widget drives">
      <div className="drives-header">
        <h3>Scheduled Drives</h3>
      </div>

      <div className="drives-body" ref={containerRef}>
        <ul className="drive-list page">
          {visibleDrives.map((drive, i) => {
            const isToday = drive.date === today;
            const isTomorrow = drive.date === tomorrow;

            return (
              <li
                key={`${startIndex}-${i}`}
                ref={i === 0 ? itemRef : null}
                className={`drive-item ${
                  isToday ? "today" : isTomorrow ? "tomorrow" : ""
                }`}
              >
                <div className="company">{drive.company}</div>

                <div className="details">
                  {drive.role && <span>{drive.role}</span>}
                  {drive.date && <span>{drive.date}</span>}
                  {drive.time && <span>{drive.time}</span>}
                  {drive.venue && <span>{drive.venue}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
