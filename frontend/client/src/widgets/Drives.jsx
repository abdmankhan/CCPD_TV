export default function Drives({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="widget drives">
        <h3>Placement Drives</h3>
        <p>No active drives</p>
      </div>
    );
  }

  return (
    <div className="widget drives">
      <h3>Placement Drives</h3>

      <ul className="drive-list">
        {data.map((drive, index) => (
          <li key={index} className="drive-item">
            <div className="company">{drive.company}</div>

            <div className="details">
              {drive.role && <span>{drive.role}</span>}
              {drive.date && <span>{drive.date}</span>}
              {drive.time && <span>{drive.time}</span>}
              {drive.venue && <span>{drive.venue}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
