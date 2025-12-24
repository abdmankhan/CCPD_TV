export default function Drives({ data = [] }) {
  return (
    <>
      <h2>Today's Drives</h2>
      {data.map((d, i) => (
        <div key={i}>
          {d.company} – {d.role} – {d.time}
        </div>
      ))}
    </>
  );
}
