import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

function extractVideoId(url) {
  if (!url) return "";

  // Full URL
  const match = url.match(
    /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : url; // fallback = raw ID
}

export default function YoutubePlayer() {
  const [url, setUrl] = useState("");
  const [loop, setLoop] = useState(true);
  const [mute, setMute] = useState(true);

  const saveVideo = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) return alert("Invalid YouTube URL");

    await axios.post(`${BACKEND_URL}/update-widget`, {
      widget: "youtube",
      data: {
        videoId,
        autoplay: true,
        mute,
        loop
      }
    });

    alert("YouTube video sent to TV");
  };

  return (
    <div className="editor youtube-editor">
      <h4>YouTube Video</h4>

      <input
        placeholder="YouTube URL or Video ID"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <label>
        <input
          type="checkbox"
          checked={mute}
          onChange={() => setMute(!mute)}
        />
        Mute (required for autoplay)
      </label>

      <label>
        <input
          type="checkbox"
          checked={loop}
          onChange={() => setLoop(!loop)}
        />
        Loop video
      </label>

      <button onClick={saveVideo}>Play on TV</button>
    </div>
  );
}
