"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  IoAddOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/hooks/useSession";
import { useProProfile, type UpdateProPayload } from "@/hooks/useProProfiles";
import { uploadProfilePhoto } from "@/utils/uploadProfilePhoto";
import ProfilePhotoModal from "@/app/user/ProfilePhotoModal";
import SessionPopup from "@/components/SessionPopup";
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

const DAYS_OF_WEEK: Enums<"day_of_week">[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
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

type TimeSlotData = {
  id: string;
  day_of_week: Enums<"day_of_week">;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
};

type GroupedTimeSlots = Partial<Record<Enums<"day_of_week">, TimeSlotData[]>>;

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

type RawBookingForProfessional = Pick<
  Tables<"bookings">,
  "id" | "status" | "is_paid" | "created_at" | "payment_link" | "zoom_link"
> & {
  time_slots:
    | Pick<Tables<"time_slots">, "day_of_week" | "start_time" | "end_time">
    | Pick<Tables<"time_slots">, "day_of_week" | "start_time" | "end_time">[]
    | null;
  user_profiles:
    | {
        id: string;
        status: Enums<"user_status">;
        profiles:
          | Pick<Tables<"profiles">, "name" | "profile_photo" | "bio" | "time_zone">
          | Pick<Tables<"profiles">, "name" | "profile_photo" | "bio" | "time_zone">[]
          | null;
      }
    | {
        id: string;
        status: Enums<"user_status">;
        profiles:
          | Pick<Tables<"profiles">, "name" | "profile_photo" | "bio" | "time_zone">
          | Pick<Tables<"profiles">, "name" | "profile_photo" | "bio" | "time_zone">[]
          | null;
      }[]
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

function getProfessionalStatusMeta(status: string) {
  if (status === "approved") {
    return {
      label: "Approved",
      textColor: "#A7F3D0",
      background: "rgba(16, 185, 129, 0.22)",
      border: "1px solid rgba(16, 185, 129, 0.45)",
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      textColor: "#FCA5A5",
      background: "rgba(220, 38, 38, 0.22)",
      border: "1px solid rgba(248, 113, 113, 0.45)",
    };
  }

  return {
    label: "Pending Approval",
    textColor: "#FDE68A",
    background: "rgba(245, 158, 11, 0.22)",
    border: "1px solid rgba(245, 158, 11, 0.45)",
  };
}

function normalizeTimeLabel(time: string): string {
  const [hour = "00", minute = "00"] = time.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

const MOCK_ZOOM_LINK = "https://zoom.us/j/12345678901?pwd=mockSessionLink";

function normalizeSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatTo12Hour(time?: string): string {
  if (!time) return "--.--";
  const [hourPart = "0", minutePart = "00"] = time.split(":");
  const hour = Number.parseInt(hourPart, 10);
  const minute = Number.parseInt(minutePart, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "--.--";
  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}.${String(minute).padStart(2, "0")} ${period}`;
}

function normalizeBookingForProfessional(raw: RawBookingForProfessional): BookingForProfessional {
  const normalizedTimeSlot = normalizeSingle(raw.time_slots);
  const normalizedUserProfile = normalizeSingle(raw.user_profiles);
  const normalizedProfile = normalizeSingle(normalizedUserProfile?.profiles);

  return {
    ...raw,
    time_slots: normalizedTimeSlot,
    user_profiles: normalizedUserProfile
      ? {
          ...normalizedUserProfile,
          profiles: normalizedProfile,
        }
      : null,
  };
}

const glassPanelStyle: CSSProperties = {
  background: "rgba(17, 49, 39, 0.40)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(16, 185, 129, 0.15)",
  boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.05)",
};

const glassSurfaceStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(2, 44, 34, 0.45), rgba(2, 34, 24, 0.35))",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 0px 1.5px rgba(255,255,255,0.3), inset 0.3px 0.5px 1px rgba(255,255,255,0.35), 0 4px 5px rgba(0,0,0,0.2)",
};

const glassSurfaceMutedStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(2, 44, 34, 0.3), rgba(2, 34, 24, 0.25))",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 0px 1.5px rgba(255,255,255,0.2), inset 0.3px 0.5px 1px rgba(255,255,255,0.25), 0 4px 5px rgba(0,0,0,0.2)",
};

const primaryButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(28, 196, 133, 0.45), rgba(20, 150, 100, 0.45))",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 0 0 0.5px rgba(152,255,152,0.25), inset 0 1px 2px rgba(255,255,255,0.35), 0 6px 16px rgba(0,0,0,0.25)",
};

const inactivePillStyle: CSSProperties = {
  background: "rgba(2, 44, 34, 0.28)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 0 0 0.5px rgba(152,255,152,0.08), inset 0 1px 2px rgba(255,255,255,0.12)",
};

const warningButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(251, 191, 36, 0.22), rgba(180, 83, 9, 0.28))",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 0 0 0.5px rgba(254,240,138,0.2), inset 0 1px 2px rgba(255,255,255,0.18), 0 6px 16px rgba(0,0,0,0.2)",
};

const dangerButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(220, 38, 38, 0.24), rgba(127, 29, 29, 0.3))",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 0 0 0.5px rgba(254,202,202,0.18), inset 0 1px 2px rgba(255,255,255,0.16), 0 6px 16px rgba(0,0,0,0.2)",
};

const pageBackdropStyle: CSSProperties = {
  background:
    "radial-gradient(circle at top, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.08) 24%, transparent 48%), linear-gradient(180deg, #021b14 0%, #053529 45%, #021b14 100%)",
};

const actionButtonClass =
  "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)] disabled:cursor-not-allowed";

const iconButtonHoverClass =
  "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed";

export default function ProfessionalDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, patchProfile, isProfessional, loading: sessionLoading } = useSession();
  const { data: proProfile, loading: profileLoading, error: profileError, update } = useProProfile();

  const [activeTab, setActiveTab] = useState<"profile" | "availability" | "requests" | "upcoming">("profile");
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
  const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);
  const [viewingUpcomingId, setViewingUpcomingId] = useState<string | null>(null);
  const [selectedRequestProfile, setSelectedRequestProfile] = useState<BookingForProfessional | null>(null);
  const [selectedUpcomingSession, setSelectedUpcomingSession] = useState<BookingForProfessional | null>(null);

  // Time slots state
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [groupedSlots, setGroupedSlots] = useState<GroupedTimeSlots>({});
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(true);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);
  const [addingSlot, setAddingSlot] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState({
    day_of_week: "Monday" as Enums<"day_of_week">,
    start_time: "09:00",
    end_time: "10:00",
  });

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

  const professionalStatusMeta = useMemo(
    () => getProfessionalStatusMeta(proProfile?.status ?? "pending_approval"),
    [proProfile?.status],
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
    const tab = searchParams.get("tab");
    if (tab === "profile" || tab === "availability" || tab === "requests" || tab === "upcoming") {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const authHeaders: Record<string, string> = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {};

        const response = await fetch("/api/professional/bookings", {
          method: "GET",
          headers: authHeaders,
        });

        const result = (await response.json()) as {
          error?: string;
          bookings?: RawBookingForProfessional[];
        };

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch bookings");
        }

        const normalizedBookings = (result.bookings ?? []).map(normalizeBookingForProfessional);

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

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const sessionResult = await withTimeout(
      supabase.auth.getSession(),
      8000,
      "Session lookup timed out",
    );

    const {
      data: { session },
    } = sessionResult;

    if (!session?.access_token) {
      return {};
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }, []);

  const fetchTimeSlots = useCallback(async () => {
    if (!profile?.id || !isProfessional) {
      setTimeSlots([]);
      setGroupedSlots({});
      setTimeSlotsLoading(false);
      return;
    }

    setTimeSlotsLoading(true);
    setTimeSlotsError(null);

    try {
      if (!profile?.id) {
        setTimeSlots([]);
        setGroupedSlots({});
        return;
      }

      const response = await fetch("/api/professional/time-slots", {
        method: "GET",
        headers: await getAuthHeaders(),
      });

      const result = (await response.json()) as {
        error?: string;
        slots?: TimeSlotData[];
        grouped?: GroupedTimeSlots;
      };

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch time slots");
      }

      const fetchedSlots = result.slots ?? [];
      const fetchedGrouped = (result.grouped ?? {}) as GroupedTimeSlots;

      setTimeSlots(fetchedSlots);
      setGroupedSlots(fetchedGrouped);
    } catch (err) {
      setTimeSlotsError(err instanceof Error ? err.message : "Failed to fetch time slots");
      setTimeSlots([]);
      setGroupedSlots({});
    } finally {
      setTimeSlotsLoading(false);
    }
  }, [profile?.id, isProfessional, getAuthHeaders]);

  useEffect(() => {
    void fetchTimeSlots();
  }, [fetchTimeSlots]);

  const handleNewSlotChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewSlot((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTimeSlot = async (e: FormEvent) => {
    e.preventDefault();

    if (newSlot.end_time <= newSlot.start_time) {
      setTimeSlotsError("End time must be after start time.");
      return;
    }

    setAddingSlot(true);
    setTimeSlotsError(null);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/professional/time-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(newSlot),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Failed to add time slot");
      }

      setSuccessMessage(result.message || "Time slot added successfully.");
      await fetchTimeSlots();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setTimeSlotsError(err instanceof Error ? err.message : "Failed to add time slot");
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    setDeletingSlotId(slotId);
    setTimeSlotsError(null);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/professional/time-slots/${slotId}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete time slot");
      }

      setSuccessMessage(result.message || "Time slot deleted successfully.");
      await fetchTimeSlots();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setTimeSlotsError(err instanceof Error ? err.message : "Failed to delete time slot");
    } finally {
      setDeletingSlotId(null);
    }
  };

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

  const refreshBookings = useCallback(async () => {
    if (!profile?.id || !isProfessional) return;

    setBookingsLoading(true);
    setBookingsError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authHeaders: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const response = await fetch("/api/professional/bookings", {
        method: "GET",
        headers: authHeaders,
      });

      const result = (await response.json()) as {
        error?: string;
        bookings?: RawBookingForProfessional[];
      };

      if (!response.ok) {
        throw new Error(result.error || "Failed to refresh bookings");
      }

      const normalizedBookings = (result.bookings ?? []).map(normalizeBookingForProfessional);
      setPendingRequests(normalizedBookings.filter((booking) => booking.status === "pending"));
      setUpcomingSessions(normalizedBookings.filter((booking) => booking.status === "approved"));
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : "Failed to refresh bookings");
    } finally {
      setBookingsLoading(false);
    }
  }, [profile?.id, isProfessional]);

  useEffect(() => {
    const refreshActiveTabData = () => {
      if (activeTab === "availability") {
        void fetchTimeSlots();
      }

      if (activeTab === "requests" || activeTab === "upcoming") {
        void refreshBookings();
      }
    };

    refreshActiveTabData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshActiveTabData();
      }
    };

    window.addEventListener("focus", refreshActiveTabData);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshActiveTabData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTab, fetchTimeSlots, refreshBookings]);

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

  const handleViewRequestProfile = async (booking: BookingForProfessional) => {
    setViewingRequestId(booking.id);
    setSaveError(null);

    try {
      const response = await fetch(`/api/professional/bookings/${booking.id}`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });

      const result = (await response.json()) as {
        error?: string;
        booking?: BookingForProfessional;
      };

      if (!response.ok || !result.booking) {
        throw new Error(result.error || "Failed to load user details");
      }

      setSelectedRequestProfile(normalizeBookingForProfessional(result.booking as RawBookingForProfessional));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load user details");
      setSelectedRequestProfile(booking);
    } finally {
      setViewingRequestId(null);
    }
  };

  const handleViewUpcomingSession = async (booking: BookingForProfessional) => {
    setViewingUpcomingId(booking.id);
    setSaveError(null);

    try {
      const response = await fetch(`/api/professional/bookings/${booking.id}`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });

      const result = (await response.json()) as {
        error?: string;
        booking?: BookingForProfessional;
      };

      if (!response.ok || !result.booking) {
        throw new Error(result.error || "Failed to load session details");
      }

      const normalizedFetched = normalizeBookingForProfessional(result.booking as RawBookingForProfessional);

      const fallbackUserProfile = normalizeSingle(booking.user_profiles);
      const fallbackUser = normalizeSingle(fallbackUserProfile?.profiles);
      const fetchedUserProfile = normalizeSingle(normalizedFetched.user_profiles);
      const fetchedUser = normalizeSingle(fetchedUserProfile?.profiles);

      const mergedUserProfile = fetchedUserProfile ?? fallbackUserProfile;
      const mergedUser: Pick<Tables<"profiles">, "name" | "profile_photo" | "bio" | "time_zone"> | null =
        mergedUserProfile
          ? {
              name: fetchedUser?.name ?? fallbackUser?.name ?? "User",
              profile_photo: fetchedUser?.profile_photo ?? fallbackUser?.profile_photo ?? null,
              bio: fetchedUser?.bio ?? fallbackUser?.bio ?? null,
              time_zone: (fetchedUser?.time_zone ?? fallbackUser?.time_zone ?? "Asia/Colombo") as Enums<"time_zone">,
            }
          : null;

      setSelectedUpcomingSession({
        ...normalizedFetched,
        user_profiles: mergedUserProfile
          ? {
              ...mergedUserProfile,
              profiles: mergedUser,
            }
          : null,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load session details");
      setSelectedUpcomingSession(booking);
    } finally {
      setViewingUpcomingId(null);
    }
  };

  if (sessionLoading || profileLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4" style={pageBackdropStyle}>
        <div className="relative z-10 w-full max-w-md rounded-2xl p-8 text-center" style={glassPanelStyle}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "#10B981" }}>
            ExpertConnect
          </p>
          <div className="mt-4 text-lg text-white">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!proProfile) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4" style={pageBackdropStyle}>
        <div className="relative z-10 w-full max-w-md rounded-2xl p-8 text-center" style={glassPanelStyle}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "#10B981" }}>
            ExpertConnect
          </p>
          <div className="mt-4 text-lg text-white">{profileError || "Failed to load profile"}</div>
          <div className="mt-6 rounded-full p-[1px]" style={{ background: "rgba(28, 196, 133, 0.1)" }}>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                document.cookie = "ec_access_token=; path=/; max-age=0; SameSite=Lax";
                router.push("/login");
              }}
              className={`w-full rounded-full px-6 py-3 text-sm font-semibold text-white ${actionButtonClass}`}
              style={primaryButtonStyle}
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={pageBackdropStyle}>
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

      {selectedUpcomingSession && (
        <SessionPopup
          professionalName={normalizeSingle(normalizeSingle(selectedUpcomingSession.user_profiles)?.profiles)?.name || "User"}
          professionalRole={getUserStatusLabel(normalizeSingle(selectedUpcomingSession.user_profiles)?.status)}
          sessionDate={selectedUpcomingSession.time_slots?.day_of_week || "Day not set"}
          sessionTime={`${formatTo12Hour(selectedUpcomingSession.time_slots?.start_time)} to ${formatTo12Hour(selectedUpcomingSession.time_slots?.end_time)}`}
          sessionTimeZone={normalizeSingle(normalizeSingle(selectedUpcomingSession.user_profiles)?.profiles)?.time_zone || "Asia/Colombo"}
          zoomLink={selectedUpcomingSession.zoom_link || MOCK_ZOOM_LINK}
          onClose={() => setSelectedUpcomingSession(null)}
        />
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl p-2" style={glassPanelStyle}>
          <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white ${actionButtonClass}`}
            style={activeTab === "profile" ? primaryButtonStyle : { ...inactivePillStyle, color: "#649c8c" }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("availability")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white ${actionButtonClass}`}
            style={activeTab === "availability" ? primaryButtonStyle : { ...inactivePillStyle, color: "#649c8c" }}
          >
            Availability
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white ${actionButtonClass}`}
            style={activeTab === "requests" ? primaryButtonStyle : { ...inactivePillStyle, color: "#649c8c" }}
          >
            Session Requests
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white ${actionButtonClass}`}
            style={activeTab === "upcoming" ? primaryButtonStyle : { ...inactivePillStyle, color: "#649c8c" }}
          >
            Upcoming Sessions
          </button>
          </div>
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
          <div className="w-full rounded-2xl p-8 sm:p-10" style={glassPanelStyle}>
            <div className="mb-8 flex flex-col gap-6 border-b border-emerald-500/10 pb-8 lg:flex-row lg:items-start">
              <div className="relative">
                {proProfile.profile_photo ? (
                  <Image
                    src={proProfile.profile_photo}
                    alt={proProfile.name}
                    width={96}
                    height={96}
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
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${iconButtonHoverClass}`}
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
                <div
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-2"
                  style={{
                    color: professionalStatusMeta.textColor,
                    background: professionalStatusMeta.background,
                    border: professionalStatusMeta.border,
                  }}
                >
                  {professionalStatusMeta.label}
                </div>
                <p style={{ color: "#A7F3D0" }} className="text-sm">
                  {proProfile.job_title || proProfile.field}
                </p>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`rounded-full px-5 py-2.5 font-semibold text-white ${actionButtonClass}`}
                style={primaryButtonStyle}
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
                  <div className="flex flex-wrap gap-2 rounded-2xl p-4" style={glassSurfaceStyle}>
                    {SKILL_OPTIONS.map((skill) => {
                      const selected = formData.selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${actionButtonClass}`}
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
                  <div className="w-full rounded-full p-[1px] sm:max-w-xs" style={{ background: "rgba(28, 196, 133, 0.1)" }}>
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className={`flex w-full items-center justify-center gap-2 rounded-full border-0 py-3 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-80 ${actionButtonClass}`}
                      style={primaryButtonStyle}
                    >
                      {saveLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
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
                  <div className="flex flex-wrap gap-2 rounded-2xl p-4" style={glassSurfaceStyle}>
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
                            ? `${skill.skill_other_label}`
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
                    style={glassSurfaceStyle}
                  >
                    {proProfile.bio || "No bio added yet. Edit profile to add one."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "availability" && (
          <div className="w-full rounded-2xl p-8 sm:p-10 space-y-8" style={glassPanelStyle}>
            <div className="border-b border-emerald-500/10 pb-6">
              <h2 className="text-2xl font-bold text-white">Manage Availability</h2>
              <p className="text-sm mt-2" style={{ color: "#A7F3D0" }}>
                Add weekly recurring time slots that will be shown on your public profile.
              </p>
            </div>

            <form id="availability-setup" onSubmit={handleAddTimeSlot} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    Day
                  </label>
                  <select
                    name="day_of_week"
                    value={newSlot.day_of_week}
                    onChange={handleNewSlotChange}
                    className="w-full rounded-full border-none py-3 px-4 text-sm text-white outline-none appearance-none cursor-pointer bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)]"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day} className="bg-[#052e16]">
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={newSlot.start_time}
                    onChange={handleNewSlotChange}
                    required
                    className="w-full rounded-full border-none py-3 px-4 text-sm text-white outline-none bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px]" style={{ color: "#10B981" }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={newSlot.end_time}
                    onChange={handleNewSlotChange}
                    required
                    className="w-full rounded-full border-none py-3 px-4 text-sm text-white outline-none bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)] focus:bg-[rgba(2,44,34,0.8)] focus:shadow-[0_0_20px_rgba(16,185,129,0.25),0_0_0_2px_rgba(16,185,129,0.4)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingSlot}
                className={`inline-flex items-center justify-center gap-2 rounded-full border-0 py-3 px-6 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-80 ${actionButtonClass}`}
                style={primaryButtonStyle}
              >
                <IoAddOutline size={18} />
                {addingSlot ? "Adding..." : "Add Time Slot"}
              </button>
            </form>

            {timeSlotsError && (
              <div
                className="rounded-xl p-4 text-red-200"
                style={{
                  background: "rgba(127, 29, 29, 0.35)",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                }}
              >
                {timeSlotsError}
              </div>
            )}

            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white">Your Time Slots</h3>

              {timeSlotsLoading ? (
                <div className="rounded-xl p-5 text-sm text-white/70" style={glassSurfaceStyle}>
                  Loading time slots...
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="rounded-xl p-5 text-sm" style={{ ...glassSurfaceStyle, color: "#A7F3D0" }}>
                  No time slots added yet.
                </div>
              ) : (
                <div className="space-y-5">
                  {DAYS_OF_WEEK.filter((day) => (groupedSlots[day]?.length ?? 0) > 0).map((day) => (
                    <div key={day}>
                      <p className="text-emerald-300 text-xs uppercase tracking-wider font-bold mb-2">{day}</p>
                      <div className="space-y-2">
                        {(groupedSlots[day] ?? []).map((slot) => (
                          <div
                            key={slot.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
                            style={glassSurfaceStyle}
                          >
                            <div className="text-sm text-white">
                              {normalizeTimeLabel(slot.start_time)} - {normalizeTimeLabel(slot.end_time)}
                              <span className="ml-2 text-xs" style={{ color: slot.is_booked ? "#F59E0B" : "#6EE7B7" }}>
                                {slot.is_booked ? "(Booked)" : "(Available)"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTimeSlot(slot.id)}
                              disabled={slot.is_booked || deletingSlotId === slot.id}
                              className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold disabled:cursor-not-allowed ${actionButtonClass}`}
                              style={{
                                ...(slot.is_booked ? warningButtonStyle : dangerButtonStyle),
                                color: slot.is_booked ? "#FCD34D" : "#FCA5A5",
                                opacity: slot.is_booked ? 0.8 : 1,
                              }}
                            >
                              <IoTrashOutline size={14} />
                              {slot.is_booked
                                ? "Booked"
                                : deletingSlotId === slot.id
                                  ? "Deleting..."
                                  : "Delete"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                className="w-full rounded-2xl p-12 flex items-center justify-center"
                style={glassPanelStyle}
              >
                <div className="text-white/70 text-lg">Loading session requests...</div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div
                className="w-full rounded-2xl p-12 text-center"
                style={glassPanelStyle}
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
                    loadingAction={processingBookingId === booking.id || viewingRequestId === booking.id}
                    onViewProfile={() => void handleViewRequestProfile(booking)}
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
                className="w-full rounded-2xl p-12 flex items-center justify-center"
                style={glassPanelStyle}
              >
                <div className="text-white/70 text-lg">Loading upcoming sessions...</div>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div
                className="w-full rounded-2xl p-12 text-center"
                style={glassPanelStyle}
              >
                <IoCalendarOutline size={48} className="mx-auto text-emerald-400/50 mb-4" />
                <p className="text-white/70 text-lg">No upcoming booked sessions yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {upcomingSessions.map((booking) => (
                  <ProfessionalBookingCard
                    key={booking.id}
                    booking={booking}
                    type="upcoming"
                    loadingAction={viewingUpcomingId === booking.id}
                    onViewSession={() => void handleViewUpcomingSession(booking)}
                  />
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
      <div className="px-4 py-3 rounded-full text-white" style={glassSurfaceStyle}>
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
  onViewSession,
}: {
  booking: BookingForProfessional;
  type: "request" | "upcoming";
  loadingAction?: boolean;
  onViewProfile?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onViewSession?: () => void;
}) {
  const userProfile = normalizeSingle(booking.user_profiles);
  const user = normalizeSingle(userProfile?.profiles);

  return (
    <div
      className="rounded-2xl p-6 border border-emerald-500/15"
      style={glassPanelStyle}
    >
      <div className="flex items-start gap-4 mb-4 pb-4 border-b border-emerald-500/10">
        <div
          className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-emerald-500/30"
          style={{ background: "rgba(16, 185, 129, 0.1)" }}
        >
          {user?.profile_photo ? (
            <Image
              src={user.profile_photo}
              alt={user.name || "User"}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
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
              className={`w-full py-2.5 text-sm font-semibold rounded-full disabled:opacity-70 disabled:cursor-not-allowed ${actionButtonClass}`}
              style={{
                ...glassSurfaceMutedStyle,
                color: "#93C5FD",
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
                className={`w-full py-2.5 text-sm font-semibold rounded-full disabled:opacity-70 disabled:cursor-not-allowed ${actionButtonClass}`}
                style={{
                  ...primaryButtonStyle,
                  color: "#ECFDF5",
                }}
              >
                {loadingAction ? "Processing..." : "Accept"}
              </button>
            </div>
            <div className="p-[1px] rounded-full flex-1" style={{ background: "rgba(220, 38, 38, 0.35)" }}>
              <button
                onClick={onReject}
                disabled={loadingAction}
                className={`w-full py-2.5 text-sm font-semibold rounded-full disabled:opacity-70 disabled:cursor-not-allowed ${actionButtonClass}`}
                style={{
                  ...dangerButtonStyle,
                  color: "#FECACA",
                }}
              >
                {loadingAction ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center rounded-full px-4 py-2" style={glassSurfaceStyle}>
            <span className="text-sm" style={{ color: "#A7F3D0" }}>
              Payment: {booking.is_paid ? "Paid" : "Pending"}
            </span>
          </div>

          {booking.is_paid && (
            <div className="p-[1px] rounded-full w-full" style={{ background: "rgba(59, 130, 246, 0.35)" }}>
              <button
                type="button"
                onClick={onViewSession}
                disabled={loadingAction}
                className={`w-full py-2.5 text-sm font-semibold rounded-full ${actionButtonClass}`}
                style={{
                  ...glassSurfaceMutedStyle,
                  color: "#93C5FD",
                }}
              >
                {loadingAction ? "Opening..." : "View Session"}
              </button>
            </div>
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
  const userProfile = normalizeSingle(booking.user_profiles);
  const user = normalizeSingle(userProfile?.profiles);
  const userStatus = userProfile?.status;

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
            className="cursor-pointer rounded-full p-2 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500/10 hover:text-white"
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
              <Image
                src={user.profile_photo}
                alt={user.name || "User"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
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
