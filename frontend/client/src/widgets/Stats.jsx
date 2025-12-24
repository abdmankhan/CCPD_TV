export default function Stats({ data }) {
  if (!data) return null;
  return (
    <>
      <h2>Stats</h2>
      <p>Offers: {data.offers}</p>
      <p>Highest: {data.highest}</p>
      <p>Average: {data.avg}</p>
    </>
  );
}
