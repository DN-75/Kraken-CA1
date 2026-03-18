"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoPersonOutline,
  IoMailOutline,
  IoCheckmarkCircle,
  IoWarningOutline,
  IoTimeOutline,
  IoBriefcaseOutline,
  IoSchoolOutline,
  IoCallOutline,
  IoLinkOutline,
  IoCashOutline,
  IoCalendarOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/hooks/useSession";
import { useProProfile, type UpdateProPayload } from "@/hooks/useProProfiles";
import { uploadProfilePhoto } from "@/utils/uploadProfilePhoto";
import ProfilePhotoModal from "@/app/user/ProfilePhotoModal";
import type { Enums, Tables } from "@/types/database.types";

const TIMEZONES: Enums<"time_zone">[] = [
  "Asia/Colombo",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Kathmandu",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Baghdad",
  "Asia/Tehran",
  "Asia/Kabul",
  "Asia/Tbilisi",
  "Asia/Yerevan",
  "Asia/Tashkent",
  "Asia/Almaty",
  "Asia/Yangon",
  "Asia/Bangkok",
  "Asia/Ho_Chi_Minh",
  "Asia/Jakarta",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Manila",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Hong_Kong",
  "Asia/Seoul",
  "Asia/Tokyo",
];

const SKILL_OPTIONS: Enums<"skill_tag">[] = [
  "Web Development",
  "Mobile Development",
  "Machine Learning",
  "Data Science",
  "UI/UX Design",
  "Cybersecurity",
  "Cloud Computing",
  "DevOps",
  "Blockchain",
  "Project Management",
  "Digital Marketing",
  "Content Writing",
  "Finance",
  "Law",
  "Medicine",
  "Accounting",
  "Photography",
  "Video Editing",
  "Business Strategy",
  "Human Resources",
  "Other",
];

type FormDataState = {
  name: string;
  email: string;
  bio: string;
  time_zone: Enums<"time_zone">;
  job_title: string;
  job: string;
  national_id: string;
  phone_number: string;
  field: string;
  university: string;
  degree: string;
  portfolio: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  price_per_hour: string;
  selectedSkills: Enums<"skill_tag">[];
  otherSkillLabel: string;
};

type BookingForProfessional = Pick<
  Tables<"bookings">,
  "id" | "status" | "is_paid" | "created_at" | "payment_link" | "zoom_link"
> & {
  time_slots: Pick<Tables<"time_slots">, "day_of_week" | "start_time" | "end_time"> | null;
  user_profiles:
    | {
        id: string;
        status: Enums<"user_status">;
        profiles: Pick<Tables<"profiles">, "name" | "profile_photo" | "bio" | "time_zone"> | null;
      }
    | null;
};

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function formatPrice(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatDayTime(
  dayOfWeek?: string | null,
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (!dayOfWeek || !startTime || !endTime) return "Time not available";
  return `${dayOfWeek} • ${startTime} - ${endTime}`;
}

function getUserStatusLabel(status: Enums<"user_status"> | undefined): string {
  if (status === "undergraduate") return "Undergraduate";
  if (status === "school_student") return "School Student";
  if (status === "job") return "Working Professional";
  return "Not specified";
}

export default function ProfessionalDashboardClient() {
  const router = useRouter();
  const { profile, patchProfile, isProfessional, loading: sessionLoading } = useSession();
  const { data: proProfile, loading: profileLoading, error: profileError, update } = useProProfile();

  const [activeTab, setActiveTab] = useState<"profile" | "requests" | "upcoming">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [photoSaveLoading, setPhotoSaveLoading] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<BookingForProfessional[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<BookingForProfessional[]>([]);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [selectedRequestProfile, setSelectedRequestProfile] = useState<BookingForProfessional | null>(null);

  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    email: "",
    bio: "",
    time_zone: "Asia/Colombo",
    job_title: "",
    job: "",
    national_id: "",
    phone_number: "",
    field: "",
    university: "",
    degree: "",
    portfolio: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    price_per_hour: "0",
    selectedSkills: [],
    otherSkillLabel: "",
  });

  const hasOtherSkill = useMemo(
    () => formData.selectedSkills.includes("Other"),
    [formData.selectedSkills],
  );

  useEffect(() => {
    if (!sessionLoading && profile && !isProfessional) {
      router.replace("/user");
      return;
    }

    if (!sessionLoading && !profile) {
      router.replace("/login");
    }
  }, [sessionLoading, profile, isProfessional, router]);

  useEffect(() => {
    if (!proProfile) return;

    const existingOtherSkill =
      proProfile.skills.find((skill) => skill.skill === "Other")?.skill_other_label ?? "";

    setFormData({
      name: proProfile.name,
      email: proProfile.email,
      bio: proProfile.bio || "",
      time_zone: proProfile.time_zone as Enums<"time_zone">,
      job_title: proProfile.job_title || "",
      job: proProfile.job || "",
      national_id: proProfile.national_id || "",
      phone_number: proProfile.phone_number || "",
      field: proProfile.field,
      university: proProfile.university || "",
      degree: proProfile.degree || "",
      portfolio: proProfile.portfolio || "",
      linkedin: proProfile.linkedin || "",
      instagram: proProfile.instagram || "",
      facebook: proProfile.facebook || "",
      price_per_hour: String(proProfile.price_per_hour),
      selectedSkills: proProfile.skills.map((s) => s.skill),
      otherSkillLabel: existingOtherSkill,
    });
  }, [proProfile]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!profile?.id || !isProfessional) {
        setPendingRequests([]);
        setUpcomingSessions([]);
        setBookingsLoading(false);
        return;
      }

      setBookingsLoading(true);
      setBookingsError(null);

      try {
        const { data: professionalProfile, error: proError } = await supabase
          .from("professional_profiles")
          .select("id")
          .eq("profile_id", profile.id)
          .single();

        if (proError || !professionalProfile) {
          throw new Error("Could not load professional profile");
        }

        const { data: bookingsData, error: bookingsFetchError } = await supabase
          .from("bookings")
          .select(`
            id,
            status,
            is_paid,
            payment_link,
            zoom_link,
            created_at,
            time_slots (
              day_of_week,
              start_time,
              end_time
            ),
            user_profiles (
              id,
              status,
              profiles (
                name,
                profile_photo,
                bio,
                time_zone
              )
            )
          `)
          .eq("professional_profile_id", professionalProfile.id)
          .order("created_at", { ascending: false });

        if (bookingsFetchError) {
          throw new Error(bookingsFetchError.message);
        }

        const normalizedBookings = (bookingsData ?? []) as unknown as BookingForProfessional[];

        setPendingRequests(normalizedBookings.filter((booking) => booking.status === "pending"));
        setUpcomingSessions(normalizedBookings.filter((booking) => booking.status === "approved"));
      } catch (err) {
        setBookingsError(err instanceof Error ? err.message : "Failed to fetch bookings");
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [profile?.id, isProfessional]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleSkill = (skill: Enums<"skill_tag">) => {
    setFormData((prev) => {
      const exists = prev.selectedSkills.includes(skill);
      const nextSkills = exists
        ? prev.selectedSkills.filter((value) => value !== skill)
        : [...prev.selectedSkills, skill];

      return {
        ...prev,
        selectedSkills: nextSkills,
        otherSkillLabel: nextSkills.includes("Other") ? prev.otherSkillLabel : "",
      };
    });
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!proProfile) return;

    if (formData.selectedSkills.length === 0) {
      setSaveError("Please select at least one skill.");
      return;
    }

    if (hasOtherSkill && !formData.otherSkillLabel.trim()) {
      setSaveError("Please provide a label for the Other skill.");
      return;
    }

    setSaveLoading(true);
    setSaveError(null);
    setSuccessMessage(null);

    const payload: UpdateProPayload = {
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      time_zone: formData.time_zone,
      national_id: formData.national_id.trim(),
      phone_number: formData.phone_number.trim(),
      field: formData.field.trim(),
      university: formData.university.trim(),
      degree: formData.degree.trim(),
      job: formData.job.trim(),
      job_title: formData.job_title.trim(),
      portfolio: formData.portfolio.trim(),
      linkedin: formData.linkedin.trim(),
      instagram: formData.instagram.trim(),
      facebook: formData.facebook.trim(),
      price_per_hour: formatPrice(formData.price_per_hour),
      skills: formData.selectedSkills.map((skill) => ({
        skill,
        skill_other_label: skill === "Other" ? formData.otherSkillLabel.trim() : undefined,
      })),
    };

    try {
      const success = await withTimeout(
        update(payload),
        20000,
        "Profile save took too long. Please try again.",
      );

      if (!success) {
        setSaveError("Failed to update profile. Please try again.");
        return;
      }

      patchProfile({
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        time_zone: formData.time_zone,
      });

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSavePhoto = async (blob: Blob) => {
    if (!proProfile) return;

    setPhotoSaveLoading(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const photoUrl = await withTimeout(
        uploadProfilePhoto(proProfile.id, blob),
        20000,
        "Photo upload took too long. Please try again.",
      );

      if (!photoUrl) {
        throw new Error("Failed to upload profile photo.");
      }

      const success = await withTimeout(
        update({ profile_photo: photoUrl }),
        15000,
        "Saving profile photo took too long. Please try again.",
      );

      if (!success) {
        throw new Error("Failed to save profile photo.");
      }

      patchProfile({ profile_photo: photoUrl });
      setIsPhotoModalOpen(false);
      setSuccessMessage("Profile photo updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update profile photo");
    } finally {
      setPhotoSaveLoading(false);
    }
  };

  const refreshBookings = async () => {
    if (!profile?.id || !isProfessional) return;

    setBookingsLoading(true);
    setBookingsError(null);

    try {
      const { data: professionalProfile, error: proError } = await supabase
        .from("professional_profiles")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (proError || !professionalProfile) {
        throw new Error("Could not load professional profile");
      }

      const { data: bookingsData, error: bookingsFetchError } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          is_paid,
          payment_link,
          zoom_link,
          created_at,
          time_slots (
            day_of_week,
            start_time,
            end_time
          ),
          user_profiles (
            id,
            status,
            profiles (
              name,
              profile_photo,
              bio,
              time_zone
            )
          )
        `)
        .eq("professional_profile_id", professionalProfile.id)
        .order("created_at", { ascending: false });

      if (bookingsFetchError) {
        throw new Error(bookingsFetchError.message);
      }

      const normalizedBookings = (bookingsData ?? []) as unknown as BookingForProfessional[];
      setPendingRequests(normalizedBookings.filter((booking) => booking.status === "pending"));
      setUpcomingSessions(normalizedBookings.filter((booking) => booking.status === "approved"));
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : "Failed to refresh bookings");
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: "approve" | "reject") => {
    setProcessingBookingId(bookingId);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/professional/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} booking`);
      }

      setSuccessMessage(
        action === "approve"
          ? "Booking request approved successfully."
          : "Booking request rejected successfully.",
      );

      await refreshBookings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : `Failed to ${action} booking`);
    } finally {
      setProcessingBookingId(null);
    }
  };

  if (sessionLoading || profileLoading) {
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

  if (!proProfile) {
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
          currentPhoto={proProfile.profile_photo}
          saving={photoSaveLoading}
          onClose={() => setIsPhotoModalOpen(false)}
          onSave={handleSavePhoto}
        />
      )}

      {selectedRequestProfile && (
        <RequestUserProfileModal
          booking={selectedRequestProfile}
          onClose={() => setSelectedRequestProfile(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 border-b border-emerald-500/20 mb-8 pb-4 overflow-x-auto">
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
            onClick={() => setActiveTab("requests")}
            className="text-white font-semibold pb-2 relative transition-colors"
            style={{
              color: activeTab === "requests" ? "white" : "#649c8c",
              borderBottom: activeTab === "requests" ? "3px solid #10B981" : "none",
            }}
          >
            Session Requests
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className="text-white font-semibold pb-2 relative transition-colors"
            style={{
              color: activeTab === "upcoming" ? "white" : "#649c8c",
              borderBottom: activeTab === "upcoming" ? "3px solid #10B981" : "none",
            }}
          >
            Upcoming Sessions
          </button>
        </div>

        {successMessage && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-2"
            style={{ background: "rgba(16, 185, 129, 0.2)", borderLeft: "3px solid #10B981" }}
          >
            <IoCheckmarkCircle className="text-emerald-400" size={20} />
            <span className="text-emerald-200">{successMessage}</span>
          </div>
        )}

        {saveError && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-2"
            style={{ background: "rgba(255, 59, 48, 0.2)", borderLeft: "3px solid #FF3B30" }}
          >
            <IoWarningOutline className="text-red-400" size={20} />
            <span className="text-red-200">{saveError}</span>
          </div>
        )}

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
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-emerald-500/10">
              <div className="relative">
                {proProfile.profile_photo ? (
                  <img
                    src={proProfile.profile_photo}
                    alt={proProfile.name}
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">{proProfile.name}</h1>
                <p style={{ color: "#649c8c" }} className="text-sm mb-2">
                  {proProfile.email}
                </p>
                <p style={{ color: "#A7F3D0" }} className="text-sm">
                  {proProfile.job_title || proProfile.field}
                </p>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2.5 rounded-full font-semibold transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, rgba(28,196,133,0.45), rgba(20,150,100,0.45))",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  color: "white",
                  boxShadow:
                    "inset 0 0 0 0.5px rgba(152,255,152,0.25), inset 0 1px 2px rgba(255,255,255,0.35), 0 6px 16px rgba(0,0,0,0.25)",
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                    icon={<IoPersonOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled
                    placeholder="Email address"
                    icon={<IoMailOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Current Job Title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleFormChange}
                    placeholder="Senior Software Engineer"
                    icon={<IoBriefcaseOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Employer"
                    name="job"
                    value={formData.job}
                    onChange={handleFormChange}
                    placeholder="Company name"
                    icon={<IoBriefcaseOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="National ID"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleFormChange}
                    placeholder="Your national ID"
                    icon={<IoPersonOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Phone Number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleFormChange}
                    placeholder="+94 77 123 4567"
                    icon={<IoCallOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Field of Expertise"
                    name="field"
                    value={formData.field}
                    onChange={handleFormChange}
                    placeholder="Web Development"
                    icon={<IoPersonOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Hourly Rate"
                    name="price_per_hour"
                    type="number"
                    value={formData.price_per_hour}
                    onChange={handleFormChange}
                    placeholder="2500"
                    icon={<IoCashOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="University"
                    name="university"
                    value={formData.university}
                    onChange={handleFormChange}
                    placeholder="University"
                    icon={<IoSchoolOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleFormChange}
                    placeholder="Degree"
                    icon={<IoSchoolOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <SelectField
                    label="Timezone"
                    name="time_zone"
                    value={formData.time_zone}
                    onChange={handleFormChange}
                    options={TIMEZONES}
                  />

                  <InputField
                    label="Portfolio"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleFormChange}
                    placeholder="https://your-portfolio.com"
                    icon={<IoLinkOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="LinkedIn"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleFormChange}
                    placeholder="https://linkedin.com/in/username"
                    icon={<IoLinkOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Instagram"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleFormChange}
                    placeholder="https://instagram.com/username"
                    icon={<IoLinkOutline size={18} style={{ color: "#649c8c" }} />}
                  />

                  <InputField
                    label="Facebook"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleFormChange}
                    placeholder="https://facebook.com/username"
                    icon={<IoLinkOutline size={18} style={{ color: "#649c8c" }} />}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]"
                    style={{ color: "#10B981" }}
                  >
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2 rounded-2xl p-4" style={{ background: "rgba(16, 185, 129, 0.08)" }}>
                    {SKILL_OPTIONS.map((skill) => {
                      const selected = formData.selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={{
                            background: selected ? "rgba(16,185,129,0.25)" : "rgba(6,78,59,0.35)",
                            color: selected ? "#A7F3D0" : "#D1FAE5",
                            border: selected
                              ? "1px solid rgba(16,185,129,0.45)"
                              : "1px solid rgba(16,185,129,0.20)",
                          }}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hasOtherSkill && (
                  <InputField
                    label="Other Skill Label"
                    name="otherSkillLabel"
                    value={formData.otherSkillLabel}
                    onChange={handleFormChange}
                    placeholder="Type your custom skill"
                    icon={<IoPersonOutline size={18} style={{ color: "#649c8c" }} />}
                  />
                )}

                <div>
                  <label
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]"
                    style={{ color: "#10B981" }}
                  >
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleFormChange}
                    placeholder="Tell users about your background and expertise..."
                    rows={4}
                    className="w-full rounded-2xl border-none py-3 px-4 text-sm text-white outline-none bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/40 focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)] resize-none"
                  />
                </div>

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
                  <ReadOnlyField label="Full Name" value={proProfile.name} />
                  <ReadOnlyField label="Email Address" value={proProfile.email} />
                  <ReadOnlyField label="Current Job Title" value={proProfile.job_title || "N/A"} />
                  <ReadOnlyField label="Employer" value={proProfile.job || "N/A"} />
                  <ReadOnlyField label="National ID" value={proProfile.national_id || "N/A"} />
                  <ReadOnlyField label="Phone Number" value={proProfile.phone_number || "N/A"} />
                  <ReadOnlyField label="Field of Expertise" value={proProfile.field} />
                  <ReadOnlyField label="Hourly Rate" value={`Rs. ${proProfile.price_per_hour} / hr`} />
                  <ReadOnlyField label="University" value={proProfile.university || "N/A"} />
                  <ReadOnlyField label="Degree" value={proProfile.degree || "N/A"} />
                  <ReadOnlyField label="Timezone" value={proProfile.time_zone} />
                  <ReadOnlyField label="Portfolio" value={proProfile.portfolio || "N/A"} />
                  <ReadOnlyField label="LinkedIn" value={proProfile.linkedin || "N/A"} />
                  <ReadOnlyField label="Instagram" value={proProfile.instagram || "N/A"} />
                  <ReadOnlyField label="Facebook" value={proProfile.facebook || "N/A"} />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2 rounded-2xl p-4" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                    {proProfile.skills.length > 0 ? (
                      proProfile.skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{
                            background: "rgba(16,185,129,0.2)",
                            color: "#A7F3D0",
                            border: "1px solid rgba(16,185,129,0.35)",
                          }}
                        >
                          {skill.skill === "Other" && skill.skill_other_label
                            ? `${skill.skill} (${skill.skill_other_label})`
                            : skill.skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-emerald-100/70">No skills added yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                    Bio
                  </label>
                  <div
                    className="px-4 py-3 rounded-2xl text-white text-sm"
                    style={{ background: "rgba(16, 185, 129, 0.1)" }}
                  >
                    {proProfile.bio || "No bio added yet. Edit profile to add one."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-6">
            {bookingsError && (
              <div
                className="rounded-xl p-4 text-red-200"
                style={{
                  background: "rgba(127, 29, 29, 0.35)",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                }}
              >
                {bookingsError}
              </div>
            )}

            {bookingsLoading ? (
              <div
                className="w-full rounded-2xl p-12 text-center"
                style={{
                  background: "rgba(17, 49, 39, 0.40)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                }}
              >
                <p className="text-white/70 text-lg">Loading session requests...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
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
                <p className="text-white/70 text-lg">No pending session requests right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {pendingRequests.map((booking) => (
                  <ProfessionalBookingCard
                    key={booking.id}
                    booking={booking}
                    type="request"
                    loadingAction={processingBookingId === booking.id}
                    onViewProfile={() => setSelectedRequestProfile(booking)}
                    onApprove={() => handleBookingAction(booking.id, "approve")}
                    onReject={() => handleBookingAction(booking.id, "reject")}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "upcoming" && (
          <div className="space-y-6">
            {bookingsError && (
              <div
                className="rounded-xl p-4 text-red-200"
                style={{
                  background: "rgba(127, 29, 29, 0.35)",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                }}
              >
                {bookingsError}
              </div>
            )}

            {bookingsLoading ? (
              <div
                className="w-full rounded-2xl p-12 text-center"
                style={{
                  background: "rgba(17, 49, 39, 0.40)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                }}
              >
                <p className="text-white/70 text-lg">Loading upcoming sessions...</p>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div
                className="w-full rounded-2xl p-12 text-center"
                style={{
                  background: "rgba(17, 49, 39, 0.40)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                }}
              >
                <IoCalendarOutline size={48} className="mx-auto text-emerald-400/50 mb-4" />
                <p className="text-white/70 text-lg">No upcoming booked sessions yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {upcomingSessions.map((booking) => (
                  <ProfessionalBookingCard key={booking.id} booking={booking} type="upcoming" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  disabled = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-full border-none py-3 pl-11 pr-4 text-sm text-white outline-none bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/40 focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
        {label}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-full border-none py-3 pl-4 pr-4 text-sm text-white outline-none appearance-none cursor-pointer bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] placeholder:text-emerald-200/40 focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2310B981' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1.2rem center",
            paddingRight: "2.5rem",
          }}
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#052e16]">
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
        {label}
      </label>
      <div className="px-4 py-3 rounded-full text-white" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
        {value}
      </div>
    </div>
  );
}

function ProfessionalBookingCard({
  booking,
  type,
  loadingAction = false,
  onViewProfile,
  onApprove,
  onReject,
}: {
  booking: BookingForProfessional;
  type: "request" | "upcoming";
  loadingAction?: boolean;
  onViewProfile?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const user = booking.user_profiles?.profiles;

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
      <div className="flex items-start gap-4 mb-4 pb-4 border-b border-emerald-500/10">
        <div
          className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-emerald-500/30"
          style={{ background: "rgba(16, 185, 129, 0.1)" }}
        >
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt={user.name || "User"} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <IoPersonOutline size={24} className="text-emerald-400" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{user?.name || "User"}</h3>
          <p style={{ color: "#649c8c" }} className="text-sm">
            {user?.time_zone || "Timezone not available"}
          </p>
          <div className="mt-2">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              style={{
                background: type === "request" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                color: type === "request" ? "#F59E0B" : "#10B981",
              }}
            >
              {type === "request" ? "PENDING REQUEST" : "UPCOMING APPROVED"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <IoTimeOutline size={18} style={{ color: "#649c8c" }} />
          <p style={{ color: "#649c8c" }} className="text-sm">
            {formatDayTime(booking.time_slots?.day_of_week, booking.time_slots?.start_time, booking.time_slots?.end_time)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <IoCalendarOutline size={18} style={{ color: "#649c8c" }} />
          <p style={{ color: "#649c8c" }} className="text-sm">
            Requested on {new Date(booking.created_at).toLocaleDateString()}
          </p>
        </div>
        {booking.zoom_link && (
          <div className="flex items-center gap-3">
            <IoLinkOutline size={18} style={{ color: "#649c8c" }} />
            <a
              href={booking.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
              style={{ color: "#A7F3D0" }}
            >
              Zoom Link
            </a>
          </div>
        )}
      </div>

      {type === "request" ? (
        <div className="space-y-3">
          <div className="p-[1px] rounded-full w-full" style={{ background: "rgba(59, 130, 246, 0.35)" }}>
            <button
              onClick={onViewProfile}
              disabled={loadingAction}
              className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                color: "#93C5FD",
                background: "transparent",
              }}
            >
              View User Profile
            </button>
          </div>

          <div className="flex gap-3">
            <div className="p-[1px] rounded-full flex-1" style={{ background: "rgba(16, 185, 129, 0.35)" }}>
              <button
                onClick={onApprove}
                disabled={loadingAction}
                className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  color: "#10B981",
                  background: "transparent",
                }}
              >
                {loadingAction ? "Processing..." : "Accept"}
              </button>
            </div>
            <div className="p-[1px] rounded-full flex-1" style={{ background: "rgba(220, 38, 38, 0.35)" }}>
              <button
                onClick={onReject}
                disabled={loadingAction}
                className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  color: "#FF6B6B",
                  background: "transparent",
                }}
              >
                {loadingAction ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-full px-4 py-2" style={{ background: "rgba(16,185,129,0.12)" }}>
          <span className="text-sm" style={{ color: "#A7F3D0" }}>
            Payment: {booking.is_paid ? "Paid" : "Pending"}
          </span>
          {booking.payment_link ? (
            <a
              href={booking.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
              style={{ color: "#10B981" }}
            >
              View Payment Link
            </a>
          ) : (
            <span className="text-sm" style={{ color: "#649c8c" }}>
              Payment link not set
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function RequestUserProfileModal({
  booking,
  onClose,
}: {
  booking: BookingForProfessional;
  onClose: () => void;
}) {
  const user = booking.user_profiles?.profiles;
  const userStatus = booking.user_profiles?.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-xl rounded-2xl border border-emerald-500/20 p-6 sm:p-7"
        style={{
          background: "rgba(2, 44, 34, 0.95)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-white">User Profile Preview</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-emerald-500/10 hover:text-white"
            aria-label="Close profile preview"
          >
            <IoCloseOutline size={20} />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-4 border-b border-emerald-500/10 pb-5">
          <div
            className="h-16 w-16 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-emerald-500/30"
            style={{ background: "rgba(16, 185, 129, 0.1)" }}
          >
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt={user.name || "User"} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <IoPersonOutline size={24} className="text-emerald-400" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.name || "User"}</p>
            <p className="text-sm" style={{ color: "#649c8c" }}>
              {user?.time_zone || "Timezone not available"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.10)" }}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "#10B981" }}>
              Current Status
            </p>
            <p className="text-sm text-white">{getUserStatusLabel(userStatus)}</p>
          </div>

          <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.10)" }}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "#10B981" }}>
              Session Requested
            </p>
            <p className="text-sm text-white">
              {formatDayTime(booking.time_slots?.day_of_week, booking.time_slots?.start_time, booking.time_slots?.end_time)}
            </p>
          </div>

          <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.10)" }}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[1px]" style={{ color: "#10B981" }}>
              Bio
            </p>
            <p className="text-sm text-white/90">
              {user?.bio?.trim() ? user.bio : "This user has not added a bio yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
