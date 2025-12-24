export default function YoutubePlayer({ data }) {
  if (!data || !data.videoId) {
    return (
      <div className="widget youtube">
        <p>No video selected</p>
      </div>
    );
  }

  const {
    videoId,
    autoplay = true,
    mute = true,
    loop = true
  } = data;

  // Loop requires playlist param = same videoId
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${mute ? 1 : 0}&controls=0&rel=0&loop=${loop ? 1 : 0}&playlist=${loop ? videoId : ""}&fullscreen=1`;

  return (
    <iframe
      src={src}
      title="YouTube Player"
      allow="autoplay; encrypted-media"
      allowFullScreen
      style={{
        width: "100%",
        height: "100%",
        border: "none"
      }}
    />
  );
}
