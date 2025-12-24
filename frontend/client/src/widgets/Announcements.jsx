export default function Announcements({ data = [] }) {
  return (
    <>
      <h2>Announcements</h2>
      <ul>
        {data.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </>
  );
}
