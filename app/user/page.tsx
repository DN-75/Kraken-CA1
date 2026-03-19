"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/hooks/useSession";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBookings, type BookingWithDetails } from "@/hooks/useBooking";
import { uploadProfilePhoto } from "@/utils/uploadProfilePhoto";
import ProfilePhotoModal from "./ProfilePhotoModal";
import type { Enums } from "@/types/database.types";
import {
  IoPersonOutline,
  IoMailOutline,
  IoCheckmarkCircle,
  IoWarningOutline,
  IoTimeOutline,
} from "react-icons/io5";

const TIMEZONES = [
  "Asia/Colombo (UTC+05:30)",
  "Asia/Dubai (UTC+04:00)",
  "Asia/Dhaka (UTC+06:00)",
  "Asia/Bangkok (UTC+07:00)",
  "Asia/Singapore (UTC+08:00)",
  "Asia/Tokyo (UTC+09:00)",
  "Europe/London (UTC+00:00)",
  "Europe/Paris (UTC+01:00)",
  "America/New_York (UTC-05:00)",
  "America/Chicago (UTC-06:00)",
  "America/Denver (UTC-07:00)",
  "America/Los_Angeles (UTC-08:00)",
  "Pacific/Auckland (UTC+12:00)",
  "Australia/Sydney (UTC+10:00)",
];

// Map form values to database values
const mapStatusToDatabase = (value: string): 'undergraduate' | 'school_student' | 'job' => {
  if (value === "undergraduate") return "undergraduate";
  if (value === "postgraduate" || value === "other") return "school_student";
  if (value === "professional") return "job";
  return "undergraduate";
};

// Map database values to display/form values
const mapStatusToForm = (value: 'undergraduate' | 'school_student' | 'job' | string): 'undergraduate' | 'postgraduate' | 'professional' | 'other' => {
  if (value === "undergraduate") return "undergraduate";
  if (value === "job") return "professional";
  if (value === "school_student") return "postgraduate";
  return "undergraduate"; // Default
};

// Map database values to display labels
const getStatusLabel = (value: 'undergraduate' | 'school_student' | 'job' | string | null): string => {
  if (!value) return "N/A";
  if (value === "undergraduate") return "Undergraduate";
  if (value === "postgraduate") return "Post-Graduate Student";
  if (value === "professional") return "Working Professional";
  if (value === "job") return "Working Professional";
  if (value === "school_student") return "Post-Graduate Student";
  if (value === "other") return "Other";
  return "Undergraduate";
};

type FormDataState = {
  name: string;
  email: string;
  bio: string;
  time_zone: string;
  status: string;
};

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function UserProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { patchProfile, isProfessional, loading: sessionLoading } = useSession();
  const { data: userProfile, loading: profileLoading, error: profileError, update } = useUserProfile();

  // Redirect professional users to the professional dashboard
  useEffect(() => {
    if (!sessionLoading && isProfessional) {
      router.replace("/professional");
    }
  }, [sessionLoading, isProfessional, router]);
  const { pending, approved, completed, loading: bookingsLoading, cancelBooking } = useBookings();

  // Initialize tab from URL query parameter
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"profile" | "sessions">(
    tabParam === "sessions" ? "sessions" : "profile"
  );

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "sessions") {
      setActiveTab("sessions");
    } else if (tab === "profile" || !tab) {
      setActiveTab("profile");
    }
  }, [searchParams]);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [photoSaveLoading, setPhotoSaveLoading] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    email: "",
    bio: "",
    time_zone: "",
    status: "undergraduate",
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        email: userProfile.email,
        bio: userProfile.bio || "",
        time_zone: userProfile.time_zone,
        status: mapStatusToForm(userProfile.status ?? ''),
      });
    }
  }, [userProfile]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const success = await withTimeout(
        update({
        name: formData.name || "",
        bio: formData.bio || "",
        time_zone: formData.time_zone as Enums<"time_zone">,
        profile_photo: userProfile?.profile_photo || "",
        status: mapStatusToDatabase(formData.status || "undergraduate"),
      }),
        15000,
        "Profile save took too long. Please try again.",
      );

      if (success) {
        patchProfile({
          name: formData.name || userProfile?.name || "",
          bio: formData.bio || "",
          time_zone: formData.time_zone as Enums<"time_zone">,
        });
        setSuccessMessage("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setSaveError("Failed to update profile. Please try again.");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSavePhoto = async (blob: Blob) => {
    if (!userProfile) return;

    setPhotoSaveLoading(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const photoUrl = await withTimeout(
        uploadProfilePhoto(userProfile.id, blob),
        20000,
        "Photo upload took too long. Please try again.",
      );
      if (!photoUrl) {
        setSaveError("Failed to upload profile photo. Please try again.");
        return;
      }

      const success = await withTimeout(
        update({ profile_photo: photoUrl }),
        15000,
        "Saving profile photo took too long. Please try again.",
      );
      if (!success) {
        setSaveError("Failed to save profile photo. Please try again.");
        return;
      }

      patchProfile({ profile_photo: photoUrl });

      setIsPhotoModalOpen(false);
      setSuccessMessage("Profile photo updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "An error occurred while uploading photo");
    } finally {
      setPhotoSaveLoading(false);
    }
  };

  if (profileLoading || bookingsLoading || (!sessionLoading && isProfessional)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)",
        }}
      >
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col gap-4"
        style={{
          background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)",
        }}
      >
        <div className="text-white text-lg">{profileError || "Failed to load profile"}</div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            document.cookie = "ec_access_token=; path=/; max-age=0; SameSite=Lax";
            router.push("/login");
          }}
          className="px-6 py-2 rounded-full text-white"
          style={{
            background: "linear-gradient(135deg, rgba(28,196,133,0.45), rgba(20,150,100,0.45))",
            backdropFilter: "blur(12px)",
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)",
      }}
    >
      {isPhotoModalOpen && (
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          currentPhoto={userProfile.profile_photo}
          saving={photoSaveLoading}
          onClose={() => setIsPhotoModalOpen(false)}
          onSave={handleSavePhoto}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-emerald-500/20 mb-8 pb-4">
          <button
            onClick={() => setActiveTab("profile")}
            className="text-white font-semibold pb-2 relative transition-colors"
            style={{
              color: activeTab === "profile" ? "white" : "#649c8c",
              borderBottom: activeTab === "profile" ? "3px solid #10B981" : "none",
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className="text-white font-semibold pb-2 relative transition-colors"
            style={{
              color: activeTab === "sessions" ? "white" : "#649c8c",
              borderBottom: activeTab === "sessions" ? "3px solid #10B981" : "none",
            }}
          >
            Sessions
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div
            className="w-full rounded-2xl p-8 sm:p-10"
            style={{
              background: "rgba(17, 49, 39, 0.40)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(16, 185, 129, 0.15)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.05)",
            }}
          >
            {/* Success Message */}
            {successMessage && (
              <div
                className="mb-6 p-4 rounded-lg flex items-center gap-2"
                style={{ background: "rgba(16, 185, 129, 0.2)", borderLeft: "3px solid #10B981" }}
              >
                <IoCheckmarkCircle className="text-emerald-400" size={20} />
                <span className="text-emerald-200">{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div
                className="mb-6 p-4 rounded-lg flex items-center gap-2"
                style={{ background: "rgba(255, 59, 48, 0.2)", borderLeft: "3px solid #FF3B30" }}
              >
                <IoWarningOutline className="text-red-400" size={20} />
                <span className="text-red-200">{saveError}</span>
              </div>
            )}

            {/* Profile Header with Photo */}
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-emerald-500/10">
              <div className="relative">
                {userProfile.profile_photo ? (
                  <img
                    src={userProfile.profile_photo}
                    alt={userProfile.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/30"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-emerald-500/30"
                    style={{ background: "rgba(16, 185, 129, 0.1)" }}
                  >
                    <IoPersonOutline size={40} className="text-emerald-400" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditing) return;
                      setIsPhotoModalOpen(true);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: "#10B981",
                      cursor: isEditing ? "pointer" : "not-allowed",
                      opacity: isEditing ? 1 : 0.6,
                    }}
                    title={isEditing ? "Change profile photo" : "Click Edit Profile first"}
                    aria-label="Change profile photo"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">{userProfile.name}</h1>
                <p style={{ color: "#649c8c" }} className="text-sm mb-4">
                  {userProfile.email}
                </p>
                <div className="inline-block">
                  <div
                    className="px-4 py-1.5 rounded-full text-sm font-semibold"
                    style={{
                      background: "rgba(16, 185, 129, 0.2)",
                      color: "#10B981",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {getStatusLabel(userProfile.status)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2.5 rounded-full font-semibold transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, rgba(28,196,133,0.45), rgba(20,150,100,0.45))",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  color: "white",
                  boxShadow: "inset 0 0 0 0.5px rgba(152,255,152,0.25), inset 0 1px 2px rgba(255,255,255,0.35), 0 6px 16px rgba(0,0,0,0.25)",
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {/* Form Section */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <IoPersonOutline
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
                      size={18}
                      style={{ color: "#649c8c" }}
                    />
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleFormChange}
                      placeholder="Enter your full name"
                      className="w-full rounded-full border-none py-3 pl-11 pr-4 text-sm text-white outline-none bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/40 focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <IoMailOutline
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
                      size={18}
                      style={{ color: "#649c8c" }}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      disabled
                      placeholder="Email address"
                      className="w-full rounded-full border-none py-3 pl-11 pr-4 text-sm text-white/50 outline-none bg-gradient-to-br from-[rgba(2,44,34,0.3)] to-[rgba(2,34,24,0.25)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.2),inset_0.3px_0.5px_1px_rgba(255,255,255,0.25),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/30 cursor-not-allowed"
                    />
                  </div>
                  <p style={{ color: "#649c8c" }} className="text-[11px] mt-2 uppercase tracking-[1px]">
                    Email cannot be changed. Contact support for assistance.
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    Current Status
                  </label>
                  <div className="relative">
                    <IoPersonOutline
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
                      size={18}
                      style={{ color: "#649c8c" }}
                    />
                    <select
                      name="status"
                      value={formData.status || ""}
                      onChange={handleFormChange}
                      className="w-full rounded-full border-none py-3 pl-11 pr-4 text-sm text-white outline-none appearance-none cursor-pointer bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/40 focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2310B981' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1.2rem center",
                        paddingRight: "2.5rem",
                      }}
                    >
                      <option value="undergraduate" className="bg-[#052e16]">Undergraduate</option>
                      <option value="postgraduate" className="bg-[#052e16]">Post-Graduate Student</option>
                      <option value="professional" className="bg-[#052e16]">Working Professional</option>
                      <option value="other" className="bg-[#052e16]">Other</option>
                    </select>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      name="time_zone"
                      value={formData.time_zone || ""}
                      onChange={handleFormChange}
                      className="w-full rounded-full border-none py-3 pl-4 pr-4 text-sm text-white outline-none appearance-none cursor-pointer bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/40 focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2310B981' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1.2rem center",
                        paddingRight: "2.5rem",
                      }}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz} className="bg-[#052e16]">
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleFormChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full rounded-2xl border-none py-3 px-4 text-sm text-white outline-none bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/40 focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)] resize-none"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-2 border-t border-emerald-500/10">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-emerald-400 to-emerald-600 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Full Name Display */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                      Full Name
                    </label>
                    <div className="px-4 py-3 rounded-full text-white" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                      {userProfile.name}
                    </div>
                  </div>

                  {/* Email Display */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                      Email Address
                    </label>
                    <div className="px-4 py-3 rounded-full text-white" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                      {userProfile.email}
                    </div>
                  </div>

                  {/* Status Display */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                      Current Status
                    </label>
                    <div className="px-4 py-3 rounded-full text-white capitalize" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                      {getStatusLabel(userProfile.status)}
                    </div>
                  </div>

                  {/* Timezone Display */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                      Timezone
                    </label>
                    <div className="px-4 py-3 rounded-full text-white" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                      {userProfile.time_zone}
                    </div>
                  </div>
                </div>

                {/* Bio Display */}
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                    Bio
                  </label>
                  <div
                    className="px-4 py-3 rounded-2xl text-white text-sm"
                    style={{ background: "rgba(16, 185, 129, 0.1)" }}
                  >
                    {userProfile.bio || "No bio added yet. Edit profile to add one."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-8">
            {/* Pending Sessions */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4" style={{ marginBottom: "1.5rem" }}>
                  PENDING SESSIONS
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {pending.map((booking) => (
                    <SessionCard
                      key={booking.id}
                      booking={booking}
                      status="pending"
                      onCancel={(id) => cancelBooking(id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Approved Sessions */}
            {approved.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4" style={{ marginBottom: "1.5rem" }}>
                  UPCOMING APPROVED SESSIONS
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {approved.map((booking) => (
                    <SessionCard key={booking.id} booking={booking} status="approved" />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Sessions */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4" style={{ marginBottom: "1.5rem" }}>
                  PAST SESSIONS
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {completed.map((booking) => (
                    <SessionCard key={booking.id} booking={booking} status="completed" />
                  ))}
                </div>
              </div>
            )}

            {/* No Sessions */}
            {pending.length === 0 && approved.length === 0 && completed.length === 0 && (
              <div
                className="w-full rounded-2xl p-12 text-center"
                style={{
                  background: "rgba(17, 49, 39, 0.40)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                }}
              >
                <IoTimeOutline size={48} className="mx-auto text-emerald-400/50 mb-4" />
                <p className="text-white/70 text-lg">No sessions yet. Explore mentors to book your first session!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session Card Component ─────────────────────────────────────────────────
interface SessionCardProps {
  booking: BookingWithDetails;
  status: "pending" | "approved" | "completed";
  onCancel?: (bookingId: string) => void;
}

function SessionCard({ booking, status, onCancel }: SessionCardProps) {
  const { time_slots, professional_profiles } = booking;
  const professional = professional_profiles?.profiles;
  const jobTitle = professional_profiles?.job_title;

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "#F59E0B"; // Amber/Orange
      case "approved":
        return "#10B981"; // Emerald/Green
      case "completed":
        return "#10B981"; // Emerald/Green
      default:
        return "#10B981";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "pending":
        return "PENDING";
      case "approved":
        return "APPROVED";
      case "completed":
        return "COMPLETED";
      default:
        return "PENDING";
    }
  };

  const formatDayTime = (dayOfWeek?: string, startTime?: string, endTime?: string) => {
    if (!dayOfWeek || !startTime || !endTime) return "Time not available";
    return `${dayOfWeek} • ${startTime} - ${endTime}`;
  };

  return (
    <div
      className="rounded-2xl p-6 border border-emerald-500/15"
      style={{
        background: "rgba(17, 49, 39, 0.40)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.05)",
      }}
    >
      {/* Header with Professional Info */}
      <div className="flex items-start gap-4 mb-4 pb-4 border-b border-emerald-500/10">
        <div
          className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-emerald-500/30"
          style={{ background: "rgba(16, 185, 129, 0.1)" }}
        >
          {professional?.profile_photo ? (
            <img
              src={professional.profile_photo}
              alt={professional.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <IoPersonOutline size={24} className="text-emerald-400" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{professional?.name || "Professional"}</h3>
          <p style={{ color: "#649c8c" }} className="text-sm">
            {jobTitle || "Expert"}
          </p>
          <div className="mt-2">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              style={{ background: `${getStatusColor()}33`, color: getStatusColor() }}
            >
              {getStatusLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <IoTimeOutline size={18} style={{ color: "#649c8c" }} />
          <p style={{ color: "#649c8c" }} className="text-sm">
            {formatDayTime(time_slots?.day_of_week, time_slots?.start_time, time_slots?.end_time)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <IoMailOutline size={18} style={{ color: "#649c8c" }} />
          <p style={{ color: "#649c8c" }} className="text-sm">
            Requested on {new Date(booking.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Buttons based on status */}
      <div className="flex gap-3">
        {status === "pending" && (
          <div className="p-[1px] rounded-full w-full" style={{ background: "rgba(220, 38, 38, 0.2)" }}>
            <button
              onClick={() => onCancel?.(booking.id)}
              className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
              style={{
                color: "#FF6B6B",
                background: "transparent",
              }}
            >
              Cancel Request
            </button>
          </div>
        )}

        {status === "approved" && (
          <>
            <div className="p-[1px] rounded-full flex-1" style={{ background: "rgba(250, 204, 21, 0.2)" }}>
              <button
                className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
                style={{
                  color: "#FBBF24",
                  background: "transparent",
                }}
              >
                Pay Now
              </button>
            </div>
            <div className="p-[1px] rounded-full flex-1" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
              <button
                className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
                style={{
                  color: "#10B981",
                  background: "transparent",
                }}
              >
                Join Session
              </button>
            </div>
          </>
        )}

        {status === "completed" && (
          <div className="p-[1px] rounded-full w-full" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
            <button
              className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
              style={{
                color: "#10B981",
                background: "transparent",
              }}
            >
              Rate Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}