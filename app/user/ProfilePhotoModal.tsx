"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { IoCloseOutline, IoCloudUploadOutline } from "react-icons/io5";

type ProfilePhotoModalProps = {
  isOpen: boolean;
  currentPhoto: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (blob: Blob) => Promise<void>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ProfilePhotoModal({
  isOpen,
  currentPhoto,
  saving,
  onClose,
  onSave,
}: ProfilePhotoModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const cropConfig = useMemo(() => {
    if (!imageEl) return null;

    const naturalWidth = imageEl.naturalWidth;
    const naturalHeight = imageEl.naturalHeight;
    const minEdge = Math.min(naturalWidth, naturalHeight);
    const cropSize = minEdge / zoom;

    const maxShiftX = (naturalWidth - cropSize) / 2;
    const maxShiftY = (naturalHeight - cropSize) / 2;

    const centerX = naturalWidth / 2 + (offsetX / 100) * maxShiftX;
    const centerY = naturalHeight / 2 + (offsetY / 100) * maxShiftY;

    const sourceX = clamp(centerX - cropSize / 2, 0, naturalWidth - cropSize);
    const sourceY = clamp(centerY - cropSize / 2, 0, naturalHeight - cropSize);

    return {
      sourceX,
      sourceY,
      cropSize,
    };
  }, [imageEl, zoom, offsetX, offsetY]);

  const previewUrl = useMemo(() => {
    if (!imageEl || !cropConfig) return currentPhoto;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;

    const ctx = canvas.getContext("2d");
    if (!ctx) return currentPhoto;

    ctx.drawImage(
      imageEl,
      cropConfig.sourceX,
      cropConfig.sourceY,
      cropConfig.cropSize,
      cropConfig.cropSize,
      0,
      0,
      320,
      320,
    );

    return canvas.toDataURL("image/jpeg", 0.9);
  }, [imageEl, cropConfig, currentPhoto]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large. Please use a file under 10MB.");
      return;
    }

    setError(null);

    const nextObjectUrl = URL.createObjectURL(file);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(nextObjectUrl);

    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    };
    img.src = nextObjectUrl;
  };

  const handleSave = async () => {
    if (!imageEl || !cropConfig) {
      setError("Please upload an image first.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Unable to prepare image. Try again.");
      return;
    }

    ctx.drawImage(
      imageEl,
      cropConfig.sourceX,
      cropConfig.sourceY,
      cropConfig.cropSize,
      cropConfig.cropSize,
      0,
      0,
      512,
      512,
    );

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setError("Unable to prepare image. Try again.");
          return;
        }

        await onSave(blob);
      },
      "image/jpeg",
      0.92,
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-3xl rounded-2xl border p-5 sm:p-7"
        style={{
          background: "rgba(17, 49, 39, 0.96)",
          borderColor: "rgba(16, 185, 129, 0.2)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Change Profile Picture</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close photo editor"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <label
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400"
              htmlFor="profile-photo-input"
            >
              <IoCloudUploadOutline size={20} />
              Upload From Device
            </label>
            <input
              id="profile-photo-input"
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />

            <div className="rounded-2xl border border-emerald-500/20 bg-black/20 p-4">
              <div className="mb-3 text-sm font-semibold text-emerald-200">Adjust</div>

              <div className="mb-3">
                <label className="mb-1 block text-xs text-white/80">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                  disabled={!imageEl || saving}
                />
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs text-white/80">Horizontal Position</label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                  className="w-full"
                  disabled={!imageEl || saving}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/80">Vertical Position</label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-full"
                  disabled={!imageEl || saving}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-emerald-200">Preview</div>
            <div className="flex items-center justify-center rounded-2xl border border-emerald-500/20 bg-black/20 p-5">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile photo preview"
                  className="h-48 w-48 rounded-full border-2 border-emerald-500/35 object-cover"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-full border-2 border-dashed border-emerald-500/35 text-center text-sm text-white/70">
                  Upload a photo to preview
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !imageEl}
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
