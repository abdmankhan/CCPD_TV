export default function Spotlight({ data }) {
  if (!data) return null;
  return (
    <>
      <h2>{data.company}</h2>
      <p>{data.role}</p>
      <p>{data.ctc}</p>
    </>
  );
}
