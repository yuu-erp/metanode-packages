import { FileContractContainer } from "@metanodejs/file-contract";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

const fileContract = new FileContractContainer();

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fileKey, setFileKey] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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
    };
  }, [preview]);

  // ======================
  // SUBMIT UPLOAD
  // ======================
  const handleSubmit = async () => {
    if (!file || loading) return;

    try {
      setLoading(true);
      setFileKey(null);

      const key = await fileContract.uploadFile(file, "77a1f4f69976dc33d05a0b8df190dcd061ca0080");

      setFileKey(key);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload file thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // DOWNLOAD
  // ======================
  const handleDownload = async () => {
    if (!fileKey || downloading) return;

    try {
      setDownloading(true);

      /**
       * Khi bạn implement xong:
       * const blob = await fileContract.downloadFile(fileKey);
       * const url = URL.createObjectURL(blob);
       * const a = document.createElement("a");
       * a.href = url;
       * a.download = "downloaded-file";
       * a.click();
       * URL.revokeObjectURL(url);
       */

      alert(`Download file với fileKey:\n${fileKey}`);
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
          <h1 className="text-2xl font-semibold text-white">Upload your file</h1>
          <p className="text-sm text-gray-400">Chọn file và submit để xử lý</p>
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

          {/* PREVIEW */}
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

        {/* SUBMIT */}
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

        {/* RESULT */}
        {fileKey && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-400">File Key</p>
              <p className="break-all text-sm font-mono text-cyan-400">{fileKey}</p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full rounded-lg py-2 text-sm font-medium
                         bg-white/10 text-white
                         hover:bg-white/20
                         disabled:opacity-40
                         transition"
            >
              {downloading ? "Downloading..." : "Download file"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
