import { FileContractContainer } from "@metanodejs/file-contract";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

const fileContract = new FileContractContainer();
const FROM_ADDRESS = "77a1f4f69976dc33d05a0b8df190dcd061ca0080";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // FileKey input (nhập tay hoặc auto fill)
  const [fileKey, setFileKey] = useState<string>("");

  const [downloading, setDownloading] = useState(false);

  // Preview ảnh download
  const [downloadPreview, setDownloadPreview] = useState<string | null>(null);

  // ======================
  // HANDLE FILE CHANGE
  // ======================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  // ======================
  // CLEANUP PREVIEW URL
  // ======================
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (downloadPreview) URL.revokeObjectURL(downloadPreview);
    };
  }, [preview, downloadPreview]);

  // ======================
  // UPLOAD FILE
  // ======================
  const handleSubmit = async () => {
    if (!file || loading) return;

    try {
      setLoading(true);

      const key = await fileContract.uploadFile(file, FROM_ADDRESS);

      // Auto fill vào input
      setFileKey(key);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload file thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // DOWNLOAD FILE
  // ======================
  const handleDownload = async () => {
    if (!fileKey || downloading) return;

    try {
      setDownloading(true);
      setDownloadPreview(null);

      const { fileData, fileName, fileExt } = await fileContract.downloadFile(
        fileKey,
        FROM_ADDRESS,
        1,
      );

      // Detect image
      const ext = fileExt.replace(".", "").toLowerCase();
      const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);

      const blob = new Blob([fileData], {
        type: isImage ? `image/${ext}` : "application/octet-stream",
      });

      const url = URL.createObjectURL(blob);

      if (isImage) {
        // 👉 Render ảnh lên UI
        setDownloadPreview(url);
      } else {
        // 👉 Auto download file thường
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Download file thất bại");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-6 space-y-6">
        {/* TITLE */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-white">Upload / Download file</h1>
          <p className="text-sm text-gray-400">Upload file hoặc nhập File Key để download</p>
        </div>

        {/* FILE INPUT */}
        <label
          htmlFor="file"
          className="group flex flex-col items-center justify-center gap-4
                     rounded-xl border border-dashed border-white/20
                     px-6 py-8 cursor-pointer
                     hover:border-cyan-400/60 hover:bg-white/5 transition"
        >
          <input
            id="file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />

          {/* IMAGE PREVIEW */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 rounded-lg object-contain border border-white/10"
            />
          )}

          <div className="text-center">
            <p className="text-sm text-gray-300">
              {file ? (
                <>
                  Đã chọn: <span className="text-cyan-400">{file.name}</span>
                </>
              ) : (
                <>
                  <span className="text-cyan-400">Click để chọn file</span> hoặc kéo thả vào đây
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">Hỗ trợ mọi định dạng</p>
          </div>
        </label>

        {/* UPLOAD BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full rounded-xl py-2.5 font-medium
                     bg-cyan-500 text-black
                     hover:bg-cyan-400
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition"
        >
          {loading ? "Uploading..." : "Submit file"}
        </button>

        {/* FILE KEY INPUT */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400">File Key</label>
          <input
            type="text"
            value={fileKey}
            onChange={(e) => setFileKey(e.target.value)}
            placeholder="Nhập file key"
            className="w-full rounded-lg bg-black/40 border border-white/10
                       px-3 py-2 text-sm text-cyan-400 font-mono
                       placeholder:text-gray-500
                       focus:outline-none focus:border-cyan-400/60"
          />
        </div>

        {/* DOWNLOAD BUTTON */}
        <button
          onClick={handleDownload}
          disabled={!fileKey || downloading}
          className="w-full rounded-lg py-2 text-sm font-medium
                     bg-white/10 text-white
                     hover:bg-white/20
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition"
        >
          {downloading ? "Downloading..." : "Download file"}
        </button>

        {/* DOWNLOADED IMAGE PREVIEW */}
        {downloadPreview && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <p className="text-xs text-gray-400">Downloaded Image</p>
            <img
              src={downloadPreview}
              alt="Downloaded"
              className="w-full rounded-lg object-contain border border-white/10"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
