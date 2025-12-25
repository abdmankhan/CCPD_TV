import { useState,useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import PlaylistEditorModal from "../modals/PlaylistEditorModal";
import { useDashboard } from "../../context/DashboardContext";

export default function MediaPlaylistWidget() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const { dashboard } = useDashboard();
  useEffect(() => {
    if (!dashboard) return;

    const slides = dashboard.widgets?.mediaSlideshow;
    if (!slides || slides.length === 0) return;

    setItems(
      slides.map((s) => ({
        id: crypto.randomUUID(),
        sourceType: "image",
        backendUrl: s.url,
        duration: s.duration,
        previewUrl: s.url,
      }))
    );
  }, [dashboard]);

  const uploadImage = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("duration", 6);

    setLoading(true);
    setMsg("");

    try {
      const res = await axios.post(`${BACKEND_URL}/upload-file`, form);

      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sourceType: "image",
          previewUrl: URL.createObjectURL(file),
          backendUrl: res.data.items[0].url,
          duration: 6,
        },
      ]);
    } catch {
      setMsg("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach(uploadImage);
    };
    input.click();
  };

  /* PUSH PLAYLIST */
  const save = async () => {
    setLoading(true);
    setMsg("");

    try {
      await axios.post(`${BACKEND_URL}/update-playlist`, {
        playlist: items.map((i) => ({
          type: "image",
          url: i.backendUrl,
          duration: i.duration,
        })),
      });
      setMsg("Playlist pushed to TV");
    } catch {
      setMsg("Failed to push playlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-box">
      <h4>Media Playlist</h4>

      <div className="editor-actions">
        <button onClick={pickImage}>➕ Add Image</button>

        <button onClick={() => setOpen(true)} disabled={items.length === 0}>
          ✏️ Edit
        </button>

        <button onClick={save}>Save Playlist</button>
      </div>

      {open && (
        <PlaylistEditorModal
          items={items}
          setItems={setItems}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
