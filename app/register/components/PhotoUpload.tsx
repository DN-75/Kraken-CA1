import Image from "next/image";
import { IoAddCircleOutline } from "react-icons/io5";

interface PhotoUploadProps {
  id: string;
  photo: string | null;
  onPhoto: (url: string) => void;
  title?: string;
  subtitle?: string;
}

export function PhotoUpload({
  id,
  photo,
  onPhoto,
  title = "Upload Profile Photo",
  subtitle = "JPG or PNG, max 5MB. A professional photo helps you stand out.",
}: PhotoUploadProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
      <div className="relative shrink-0">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-emerald-500/50 bg-[rgba(6,78,59,0.5)]">
          {photo ? (
            <Image
              src={photo}
              alt="Profile"
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <IoAddCircleOutline size={32} className="text-emerald-500/60" />
          )}
        </div>
        <label
          htmlFor={id}
          className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-emerald-400 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        >
          <svg width="12" height="12" fill="#022c22" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onPhoto(URL.createObjectURL(file));
              }
            }}
          />
        </label>
      </div>
      <div>
        <p className="mb-1 text-[15px] font-semibold text-white">{title}</p>
        <p className="m-0 text-[13px] text-[#649c8c]">{subtitle}</p>
      </div>
    </div>
  );
}

