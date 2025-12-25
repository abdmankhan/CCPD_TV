import { useEffect, useRef, useState } from "react";

export default function Announcements({ data = [] }) {
  const containerRef = useRef(null);
  const itemRef = useRef(null);

  const [visibleCount, setVisibleCount] = useState(1);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (!itemRef.current) return;

    const el = itemRef.current;
    if (el.scrollHeight > el.clientHeight) {
      el.classList.add("scrollable");
    }
  }, [startIndex]);

  useEffect(() => {
    if (!containerRef.current || !itemRef.current) return;

    const containerHeight = containerRef.current.offsetHeight;
    const itemHeight = itemRef.current.offsetHeight;

    const count = Math.max(1, Math.floor(containerHeight / itemHeight));
    setVisibleCount(count);
  }, [data]);

  useEffect(() => {
    if (!data || data.length <= visibleCount) return;

    const interval = setInterval(() => {
      setStartIndex((prev) => {
        const next = prev + visibleCount;
        return next >= data.length ? 0 : next;
      });
    }, 2000); // ⏱️ 2 seconds per page

    return () => clearInterval(interval);
  }, [data, visibleCount]);

  const visibleAnnouncements = data.slice(
    startIndex,
    startIndex + visibleCount
  );

  return (
    <div className="widget announcements">
      <div className="announcements-header">
        <h3>Announcements</h3>
      </div>

      <div className="announcements-body" ref={containerRef}>
        {data.length === 0 ? (
          <p className="empty">No announcements</p>
        ) : (
          <ul className="announcement-list page">
            {visibleAnnouncements.map((a, i) => (
              <li
                key={`${startIndex}-${i}`}
                ref={i === 0 ? itemRef : null}
                className="announcement-item"
              >
                <span
                  className="content"
                  ref={(el) => {
                    if (!el) return;

                    const parent = el.parentElement;
                    const overflow = el.scrollHeight - parent.clientHeight;

                    // Only scroll if content actually overflows
                    if (overflow > 0) {
                      el.style.transition = "transform 6s linear";
                      el.style.transform = `translateY(-${overflow}px)`;
                    }
                  }}
                >
                  {a}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
