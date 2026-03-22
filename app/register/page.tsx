"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
    IoPersonOutline,
    IoMailOutline,
    IoCheckmarkCircle,
    IoArrowForward,
    IoArrowBack,
    IoLinkOutline,
    IoLogoLinkedin,
    IoLogoInstagram,
    IoGlobeOutline,
    IoCloseCircle,
} from "react-icons/io5";
import {HiOutlineUserGroup, HiOutlineShieldCheck} from "react-icons/hi2";
import {supabase} from "@/lib/supabaseClient";
import {InteractiveNebulaShader} from "@/components/ui/liquid-shader";
import type {Database} from "@/types/database.types";
import {Field} from "./components/Field";
import {PasswordField} from "./components/PasswordField";
import {PhotoUpload} from "./components/PhotoUpload";
import {StepHeader} from "./components/StepHeader";
import {FIELD_ICON, FIELD_LABEL, ROUND_INPUT} from "./components/registerUiStyles";
import {uploadProfilePhoto} from "@/utils/uploadProfilePhoto";

type Role = "seeker" | "expert" | null;
type UserStatus = Database["public"]["Enums"]["user_status"];
type TimeZone = Database["public"]["Enums"]["time_zone"];
type SkillTag = Database["public"]["Enums"]["skill_tag"];

const ALL_SKILLS = [
    "Web Development", "Mobile Development", "Machine Learning", "Data Science",
    "UI/UX Design", "Cybersecurity", "Cloud Computing", "DevOps", "Blockchain",
    "Project Management", "Digital Marketing", "Content Writing", "Finance",
    "Law", "Medicine", "Accounting", "Photography", "Video Editing",
    "Business Strategy", "Human Resources", "Other",
];

const TIMEZONES = [
    "Asia/Colombo (UTC+05:30)", "Asia/Dubai (UTC+04:00)", "Asia/Dhaka (UTC+06:00)",
    "Asia/Bangkok (UTC+07:00)", "Asia/Singapore (UTC+08:00)", "Asia/Tokyo (UTC+09:00)",
    "Europe/London (UTC+00:00)", "Europe/Paris (UTC+01:00)", "America/New_York (UTC-05:00)",
    "America/Chicago (UTC-06:00)", "America/Denver (UTC-07:00)", "America/Los_Angeles (UTC-08:00)",
    "Pacific/Auckland (UTC+12:00)", "Australia/Sydney (UTC+10:00)",
];

const WINDOWS = [
    "Monday 6:00 AM", "Monday 9:00 AM", "Monday 12:00 PM", "Monday 3:00 PM", "Monday 6:00 PM", "Monday 9:00 PM",
    "Tuesday 6:00 AM", "Tuesday 9:00 AM", "Tuesday 12:00 PM", "Tuesday 3:00 PM", "Tuesday 6:00 PM", "Tuesday 9:00 PM",
    "Wednesday 6:00 AM", "Wednesday 9:00 AM", "Wednesday 12:00 PM", "Wednesday 3:00 PM", "Wednesday 6:00 PM", "Wednesday 9:00 PM",
    "Thursday 6:00 AM", "Thursday 9:00 AM", "Thursday 12:00 PM", "Thursday 3:00 PM", "Thursday 6:00 PM", "Thursday 9:00 PM",
    "Friday 6:00 AM", "Friday 9:00 AM", "Friday 12:00 PM", "Friday 3:00 PM", "Friday 6:00 PM", "Friday 9:00 PM",
    "Saturday 9:00 AM", "Saturday 12:00 PM", "Saturday 3:00 PM", "Saturday 6:00 PM", "Saturday 9:00 PM",
    "Sunday 9:00 AM", "Sunday 12:00 PM", "Sunday 3:00 PM", "Sunday 6:00 PM", "Sunday 9:00 PM",
];

// ── Shared Tailwind class strings ──────────────────────────────────────────────

const CARD_BASE =
    "w-full rounded-2xl border border-emerald-500/15 bg-[rgba(17,49,39,0.55)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)] backdrop-blur-2xl sm:p-8 md:p-10";

const SECTION_INTRO = "mt-3 mb-7 text-sm text-[#649c8c]";

const SELECT_INPUT =
    ROUND_INPUT + " appearance-none cursor-pointer";

const ACTION_ROW = "mt-2 flex gap-3 border-t border-emerald-500/10 pt-6";

const BACK_BTN =
    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/70 cursor-pointer";

const SUBMIT_BTN =
    "flex flex-1 items-center justify-center gap-2 rounded-full border-0 " +
    "bg-gradient-to-br from-emerald-400 to-emerald-600 py-3 text-sm font-semibold text-white " +
    "shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all duration-200 " +
    "disabled:cursor-not-allowed disabled:opacity-80 cursor-pointer";

const TWO_COL_GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2";

const LOCAL_PHONE_PATTERN = /^0\d{9}$/;


// ── Main component ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState<Role>(null);

    // Seeker fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [seekerPhoto, setSeekerPhoto] = useState<string | null>(null);
    const [seekerStatus, setSeekerStatus] = useState("");
    const [seekerTimezone, setSeekerTimezone] = useState("UTC+5.5");
    const [seekerBio, setSeekerBio] = useState("");
    const [seekerPassword, setSeekerPassword] = useState("");
    const [seekerConfirmPassword, setSeekerConfirmPassword] = useState("");
    const [showSeekerPassword, setShowSeekerPassword] = useState(false);
    const [showSeekerConfirmPassword, setShowSeekerConfirmPassword] = useState(false);
    const [seekerSubmitting, setSeekerSubmitting] = useState(false);
    const [seekerSubmitError, setSeekerSubmitError] = useState<string | null>(null);
    const [seekerSubmitSuccess, setSeekerSubmitSuccess] = useState<string | null>(null);

    // Expert fields
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [jobTitle, setJobTitle] = useState("");
    const [employer, setEmployer] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [phone, setPhone] = useState("");
    const [expertise, setExpertise] = useState("");
    const [university, setUniversity] = useState("");
    const [degree, setDegree] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>(["Web Development"]);
    const [otherSkillLabel, setOtherSkillLabel] = useState("");
    const [portfolio, setPortfolio] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [instagram, setInstagram] = useState("");
    const [facebook, setFacebook] = useState("");
    const [timezone, setTimezone] = useState("Asia/Colombo (UTC+05:30)");
    const [verifyWindow, setVerifyWindow] = useState("Monday 9:00 AM");
    const [bio, setBio] = useState("");
    const [expertUsername, setExpertUsername] = useState("");
    const [expertEmail, setExpertEmail] = useState("");
    const [expertPassword, setExpertPassword] = useState("");
    const [expertConfirmPassword, setExpertConfirmPassword] = useState("");
    const [showExpertPassword, setShowExpertPassword] = useState(false);
    const [showExpertConfirmPassword, setShowExpertConfirmPassword] = useState(false);
    const [expertSubmitting, setExpertSubmitting] = useState(false);
    const [expertSubmitError, setExpertSubmitError] = useState<string | null>(null);
    const [expertSubmitSuccess, setExpertSubmitSuccess] = useState<string | null>(null);

    const toggleSkill = (skill: string) => {
        setSelectedSkills((prev) => {
            const next = prev.includes(skill)
                ? prev.filter((s) => s !== skill)
                : [...prev, skill];

            if (!next.includes("Other")) {
                setOtherSkillLabel("");
            }

            return next;
        });
    };

    const handleContinue = () => {
        if (step === 1 && selectedRole) {
            setStep(selectedRole === "expert" ? 3 : 2);
        } else if (step === 2) {
            handleFinalSubmit();
        }
    };

    const mapSeekerStatus = (value: string): UserStatus => {
        if (value === "undergraduate") return "undergraduate";
        if (value === "postgraduate" || value === "professional") return "job";
        return "school_student";
    };

    const mapSeekerTimezone = (value: string): TimeZone => {
        const map: Record<string, TimeZone> = {
            "UTC+0": "Asia/Dubai", "UTC+1": "Asia/Baghdad", "UTC+2": "Asia/Riyadh",
            "UTC+3": "Asia/Riyadh", "UTC+5": "Asia/Karachi", "UTC+5.5": "Asia/Colombo",
            "UTC+6": "Asia/Dhaka", "UTC+7": "Asia/Bangkok", "UTC+8": "Asia/Singapore",
            "UTC+9": "Asia/Tokyo", "UTC+10": "Asia/Tokyo",
        };
        return map[value] ?? "Asia/Colombo";
    };

    const mapProfessionalTimezone = (value: string): TimeZone =>
        (value.split(" ")[0] as TimeZone) || "Asia/Colombo";

    const handleFinalSubmit = async (e?: React.FormEvent) => {
            e?.preventDefault();
            setSeekerSubmitError(null);
            setSeekerSubmitSuccess(null);
            if (!fullName.trim() || !email.trim()) {
                setSeekerSubmitError("Full name and email are required.");
                return;
            }
            if (!seekerPassword || seekerPassword.length < 6) {
                setSeekerSubmitError("Password must be at least 6 characters.");
                return;
            }
            if (seekerPassword !== seekerConfirmPassword) {
                setSeekerSubmitError("Passwords do not match.");
                return;
            }
            setSeekerSubmitting(true);
            try {
                const {data: authData, error: authError} = await supabase.auth.signUp({
                    email: email.trim(),
                    password: seekerPassword,
                    options: {data: {role: "user", full_name: fullName.trim()}},
                });
                if (authError) throw new Error(authError.message);

                const userId = authData.user?.id;

                if (!userId) throw new Error("Account was created but user id is missing.");

                // ✅ Upload photo — soft fail if it doesn't work
                let photoUrl: string | null = null;
                let photoWarning = false;
                // ✅ Upload photo and get public URL
                if (seekerPhoto) {  // or profilePhoto for expert
                    photoUrl = await uploadProfilePhoto(userId, seekerPhoto);
                    if (!photoUrl) photoWarning = true;  // upload silently failed
                }

                const {error: profileError} = await supabase.from("profiles").insert({
                    id: userId, role: "user",
                    name: fullName.trim(),
                    bio: seekerBio.trim() || null,
                    profile_photo: photoUrl,
                    time_zone: mapSeekerTimezone(seekerTimezone),
                });
                if (profileError) throw new Error(profileError.message);

                const {error: userProfileError} = await supabase.from("user_profiles").insert({
                    profile_id: userId,
                    status: mapSeekerStatus(seekerStatus),
                });

                if (userProfileError) throw new Error(userProfileError.message);
                // ✅ Correct — use else, or add return
                if (photoWarning) {
                    setSeekerSubmitSuccess("Account created! Photo upload failed — you can add it later in settings.");
                } else {
                    setSeekerSubmitSuccess("Registration complete. You can now log in.");
                }
                setTimeout(() => router.push("/login"), 2500); // ← runs once at the end
            } catch
                (error) {
                setSeekerSubmitError(error instanceof Error ? error.message : "Failed to register.");
            } finally {
                setSeekerSubmitting(false);
            }
        }
    ;

    const handleProfessionalFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setExpertSubmitError(null);
        setExpertSubmitSuccess(null);
        const normalizedPhone = phone.trim();
        if (!expertUsername.trim() || !expertEmail.trim() || !fullName.trim()) {
            setExpertSubmitError("Username, full name and email are required.");
            return;
        }
        if (!expertPassword || expertPassword.length < 6) {
            setExpertSubmitError("Password must be at least 6 characters.");
            return;
        }
        if (expertPassword !== expertConfirmPassword) {
            setExpertSubmitError("Passwords do not match.");
            return;
        }
        if (!jobTitle.trim()) {
            setExpertSubmitError("Current job title is required.");
            return;
        }
        if (!employer.trim()) {
            setExpertSubmitError("Employer is required.");
            return;
        }
        if (!nationalId.trim()) {
            setExpertSubmitError("National ID is required.");
            return;
        }
        if (!normalizedPhone) {
            setExpertSubmitError("Phone number is required.");
            return;
        }
        if (!LOCAL_PHONE_PATTERN.test(normalizedPhone)) {
            setExpertSubmitError("Phone number must start with 0 and contain exactly 10 digits.");
            return;
        }
        if (!expertise.trim()) {
            setExpertSubmitError("Field of expertise is required.");
            return;
        }
        if (!university.trim()) {
            setExpertSubmitError("University is required.");
            return;
        }
        if (!degree.trim()) {
            setExpertSubmitError("Degree is required.");
            return;
        }
        if (!linkedin.trim()) {
            setExpertSubmitError("LinkedIn profile is required.");
            return;
        }
        if (!bio.trim()) {
            setExpertSubmitError("Professional bio is required.");
            return;
        }
        if (selectedSkills.length === 0) {
            setExpertSubmitError("Select at least one skill.");
            return;
        }
        if (selectedSkills.includes("Other") && !otherSkillLabel.trim()) {
            setExpertSubmitError("Please provide a label for the 'Other' skill.");
            return;
        }
        setExpertSubmitting(true);
        try {
            const {data: authData, error: authError} = await supabase.auth.signUp({
                email: expertEmail.trim(), password: expertPassword,
                options: {
                    data: {
                        role: "professional", full_name: fullName.trim(),
                        username: expertUsername.trim(),
                    },
                },
            });
            if (authError) throw new Error(authError.message);
            const userId = authData.user?.id;
            if (!userId) throw new Error("Account was created but user id is missing.");

            // ✅ Upload photo — soft fail if it doesn't work
            let photoUrl: string | null = null;
            let photoWarning = false;

            if (profilePhoto) {  // or profilePhoto for expert
                photoUrl = await uploadProfilePhoto(userId, profilePhoto);
                if (!photoUrl) photoWarning = true;  // upload silently failed
            }

            const {error: profileError} = await supabase.from("profiles").insert({
                id: userId,
                role: "professional",
                name: fullName.trim(),
                bio: bio.trim() || null,
                profile_photo: photoUrl,
                time_zone: mapProfessionalTimezone(timezone),
            });
            if (profileError) throw new Error(profileError.message);

            // Look up verify_time_id from verify_time_options table
            let verifyTimeId: number | null = null;
            if (verifyWindow) {
                const {data: verifyTimeData} = await supabase
                    .from("verify_time_options")
                    .select("id")
                    .eq("label", verifyWindow)
                    .single();
                verifyTimeId = verifyTimeData?.id ?? null;
            }

            const {data: professionalProfile, error: professionalProfileError} = await supabase
                .from("professional_profiles")
                .insert({
                    profile_id: userId, national_id: nationalId.trim() || null,
                    linkedin: linkedin.trim() || null, instagram: instagram.trim() || null,
                    facebook: facebook.trim() || null, field: expertise.trim(),
                    university: university.trim() || null, degree: degree.trim() || null,
                    job: employer.trim() || null, job_title: jobTitle.trim() || null,
                    phone_number: normalizedPhone || null, portfolio: portfolio.trim() || null,
                    verify_time_id: verifyTimeId,
                })
                .select("id")
                .single();
            if (professionalProfileError) throw new Error(professionalProfileError.message);
            if (!professionalProfile?.id) throw new Error("Professional profile id is missing.");
            const skillRows = selectedSkills.map((skill) => ({
                professional_profile_id: professionalProfile.id,
                skill: skill as SkillTag,
                skill_other_label: skill === "Other" ? otherSkillLabel.trim() : null,
            }));
            const {error: skillsError} = await supabase.from("professional_skills").insert(skillRows);
            if (skillsError) throw new Error(skillsError.message);
            if (photoWarning) {
                setExpertSubmitSuccess("Account created! Photo upload failed — you can add it later in settings.");
            } else {
                setExpertSubmitSuccess("Registration submitted. You can now log in.");
            }
            setTimeout(() => router.push("/login"), 2500);
        } catch (error) {
            setExpertSubmitError(error instanceof Error ? error.message : "Failed to register.");
        } finally {
            setExpertSubmitting(false);
        }
    };

    const totalSteps = selectedRole === "expert" ? 3 : 2;
    const progressPct = step === 1 ? 100 / totalSteps : 100;

    // ── Role card helper ─────────────────────────────────────────────────────
    const roleCardClass = (active: boolean) =>
        `text-left rounded-xl p-6 cursor-pointer transition-all duration-200 border
        ${active
            ? "bg-emerald-500/[0.12] border-emerald-500/55 shadow-[0_0_24px_rgba(16,185,129,0.1)]"
            : "bg-white/[0.04] border-white/[0.08]"
        }`;
    const isStep3Valid =
        expertUsername.trim() !== "" &&
        expertEmail.trim() !== "" &&
        expertPassword.length >= 6 &&
        expertConfirmPassword === expertPassword;

    return (
        <div
            className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20 md:py-10">

            {/* Liquid Shader Background - covers full page with larger spread */}
            <InteractiveNebulaShader
                disableCenterDimming={true}
                className="z-0"
                fullPage={true}
                spread={true}
            />

            {/* ════════════════ STEP 1 — Role Selection ════════════════ */}
            {step === 1 && (
                <div className={`${CARD_BASE} max-w-2xl`}>
                    <StepHeader title="Get Started" step={1} totalSteps={totalSteps} progressPct={progressPct}/>

                    <p className="mb-7 mt-6 text-center text-sm text-[#649c8c]">
                        Choose your journey on the platform. How will you participate?
                    </p>

                    {/* Role grid */}
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Service Seeker */}
                        <button type="button" onClick={() => setSelectedRole("seeker")}
                                className={roleCardClass(selectedRole === "seeker")}>
                            <div
                                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                                <HiOutlineUserGroup size={24} className="text-emerald-400"/>
                            </div>
                            <h3 className="mb-2 mt-0 text-[17px] font-bold text-white">Service Seeker</h3>
                            <p className="mb-4 mt-0 text-[13px] leading-relaxed text-[#649c8c]">
                                Access top-tier professionals, get personalized advice, and accelerate your career
                                growth.
                            </p>
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {["Connect with global experts", "Flexible booking hours"].map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/80">
                                        <IoCheckmarkCircle size={17} className="shrink-0 text-emerald-400"/>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </button>

                        {/* Professional Expert */}
                        <button type="button" onClick={() => setSelectedRole("expert")}
                                className={roleCardClass(selectedRole === "expert")}>
                            <div
                                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                                <HiOutlineShieldCheck size={24} className="text-emerald-400"/>
                            </div>
                            <h3 className="mb-2 mt-0 text-[17px] font-bold text-white">Professional Expert</h3>
                            <p className="mb-4 mt-0 text-[13px] leading-relaxed text-[#649c8c]">
                                Share your expertise, build your personal brand, and earn by helping others succeed.
                            </p>
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {["Set your own consultation rates", "Verified expert badge"].map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/80">
                                        <IoCheckmarkCircle size={17} className="shrink-0 text-emerald-400"/>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={handleContinue}
                            disabled={!selectedRole}
                            className={`flex items-center gap-2 rounded-full border-0 bg-gradient-to-br from-emerald-400 to-emerald-600 px-10 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all duration-200 ${!selectedRole ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                        >
                            Continue <IoArrowForward size={16}/>
                        </button>
                        <p className="m-0 text-sm text-[#649c8c]">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-emerald-400 no-underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            )}

            {/* ════════════════ STEP 2 — Service Seeker Profile ════════════════ */}
            {step === 2 && (
                <div className={`${CARD_BASE} max-w-3xl`}>
                    <StepHeader title="Join the Network" step={2} totalSteps={2} progressPct={100}/>
                    <p className={SECTION_INTRO}>
                        Complete your <span className="text-emerald-400">Service Seeker</span> profile to get
                        started.
                    </p>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleFinalSubmit();
                    }}
                          className="flex flex-col gap-5">

                        <PhotoUpload
                            id="seeker-photo-upload"
                            photo={seekerPhoto}
                            onPhoto={setSeekerPhoto}
                        />

                        <div className={TWO_COL_GRID}>
                            {/* Full Name */}
                            <Field label="Full Name" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="John Doe" value={fullName}
                                       onChange={(e) => setFullName(e.target.value)}
                                       required
                                       className={ROUND_INPUT}/>
                            </Field>

                            {/* Email */}
                            <Field label="Email Address" icon={<IoMailOutline size={18}/>} required>
                                <input type="email" placeholder="john@example.com" value={email}
                                       onChange={(e) => setEmail(e.target.value)}
                                       required
                                       className={ROUND_INPUT}/>
                            </Field>

                            {/* Password */}
                            <PasswordField
                                label="Password"
                                value={seekerPassword}
                                onChange={setSeekerPassword}
                                show={showSeekerPassword}
                                onToggle={() => setShowSeekerPassword((v) => !v)}
                                required
                            />

                            {/* Confirm Password */}
                            <PasswordField
                                label="Confirm Password"
                                value={seekerConfirmPassword}
                                onChange={setSeekerConfirmPassword}
                                show={showSeekerConfirmPassword}
                                onToggle={() => setShowSeekerConfirmPassword((v) => !v)}
                                placeholder="Confirm password"
                                required
                            />

                            {/* Current Status */}
                            <Field label="Current Status" icon={<IoPersonOutline size={18}/>}>
                                <select value={seekerStatus} onChange={(e) => setSeekerStatus(e.target.value)}
                                        className={SELECT_INPUT}>
                                    <option value="" className="bg-[#052e16]">Select status</option>
                                    <option value="undergraduate" className="bg-[#052e16]">Undergraduate</option>
                                    <option value="postgraduate" className="bg-[#052e16]">Post-Graduate Student
                                    </option>
                                    <option value="professional" className="bg-[#052e16]">Working Professional
                                    </option>
                                    <option value="other" className="bg-[#052e16]">Other</option>
                                </select>
                            </Field>

                            {/* Time Zone */}
                            <Field label="Time Zone" icon={<IoGlobeOutline size={18}/>}>
                                <select value={seekerTimezone} onChange={(e) => setSeekerTimezone(e.target.value)}
                                        className={SELECT_INPUT}>
                                    {[
                                        ["UTC-12", "(UTC-12:00) International Date Line West"],
                                        ["UTC-11", "(UTC-11:00) Midway Island, Samoa"],
                                        ["UTC-10", "(UTC-10:00) Hawaii"],
                                        ["UTC-9", "(UTC-09:00) Alaska"],
                                        ["UTC-8", "(UTC-08:00) Pacific Time (US & Canada)"],
                                        ["UTC-7", "(UTC-07:00) Mountain Time (US & Canada)"],
                                        ["UTC-6", "(UTC-06:00) Central Time (US & Canada)"],
                                        ["UTC-5", "(UTC-05:00) Eastern Time (US & Canada)"],
                                        ["UTC-4", "(UTC-04:00) Atlantic Time (Canada)"],
                                        ["UTC-3", "(UTC-03:00) Buenos Aires, Georgetown"],
                                        ["UTC+0", "(UTC+00:00) Dublin, Edinburgh, London"],
                                        ["UTC+1", "(UTC+01:00) Amsterdam, Berlin, Paris"],
                                        ["UTC+2", "(UTC+02:00) Athens, Istanbul, Jerusalem"],
                                        ["UTC+3", "(UTC+03:00) Baghdad, Kuwait, Riyadh"],
                                        ["UTC+5.5", "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi"],
                                        ["UTC+8", "(UTC+08:00) Beijing, Hong Kong, Singapore"],
                                        ["UTC+9", "(UTC+09:00) Osaka, Sapporo, Tokyo"],
                                        ["UTC+10", "(UTC+10:00) Brisbane, Melbourne, Sydney"],
                                    ].map(([val, label]) => (
                                        <option key={val} value={val} className="bg-[#052e16]">{label}</option>
                                    ))}
                                </select>
                            </Field>

                            {/* Short Bio — full width */}
                            <div className="col-span-full">
                                <label className={FIELD_LABEL}>Short Bio</label>
                                <textarea
                                    placeholder="Tell us about your goals and what you're looking for..."
                                    rows={4}
                                    value={seekerBio}
                                    onChange={(e) => setSeekerBio(e.target.value)}
                                    className={
                                        ROUND_INPUT.replace("rounded-full", "rounded-2xl") +
                                        " resize-y px-4 leading-relaxed"
                                    }
                                    style={{minHeight: "100px"}}
                                />
                            </div>
                        </div>

                        {seekerSubmitError && (
                            <p className="m-0 text-[13px] text-red-300">{seekerSubmitError}</p>
                        )}
                        {seekerSubmitSuccess && (
                            <p className="m-0 text-[13px] text-green-300">{seekerSubmitSuccess}</p>
                        )}

                        <div className={ACTION_ROW}>
                            <button type="button" onClick={() => setStep(1)} className={BACK_BTN}>
                                <IoArrowBack size={16}/> Back
                            </button>
                            <button type="submit" disabled={seekerSubmitting} className={SUBMIT_BTN}>
                                {seekerSubmitting ? "Registering..." : <>Register Now <IoArrowForward
                                    size={16}/></>}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-[13px] text-[#649c8c]">
                        By clicking Register, you agree to ExpertConnect&apos;s{" "}
                        <Link href="#" className="text-emerald-400 no-underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="#" className="text-emerald-400 no-underline">Privacy Policy</Link>.
                    </p>
                </div>
            )}

            {/* ════════════════ STEP 3 — Professional Account (Credentials) ════════════════ */}
            {step === 3 && (
                <div className={`${CARD_BASE} max-w-3xl`}>
                    <StepHeader title="Professional Account" step={2} totalSteps={3} progressPct={66.67}/>
                    <p className={SECTION_INTRO}>
                        Set up your account credentials before completing your professional profile.
                    </p>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setStep(4);
                    }} className="flex flex-col gap-5">
                        <div className={TWO_COL_GRID}>
                            {/* Username */}
                            <Field label="Username" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="your_username" value={expertUsername}
                                       onChange={(e) => setExpertUsername(e.target.value)}
                                       required
                                       className={ROUND_INPUT}/>
                            </Field>

                            {/* Email */}
                            <Field label="Email Address" icon={<IoMailOutline size={18}/>} required>
                                <input type="email" placeholder="expert@example.com" value={expertEmail}
                                       onChange={(e) => setExpertEmail(e.target.value)}
                                       required
                                       className={ROUND_INPUT}/>
                            </Field>

                            {/* Password */}
                            <div className="flex flex-col gap-1.5">
                                <PasswordField
                                    label="Password"
                                    value={expertPassword}
                                    onChange={setExpertPassword}
                                    show={showExpertPassword}
                                    onToggle={() => setShowExpertPassword((v) => !v)}
                                    required
                                />
                                {expertPassword.length > 0 && (
                                    <p className={`text-[12px] px-2 ${
                                        expertPassword.length >= 6 ? "text-emerald-400" : "text-red-400"
                                    }`}>
                                        {expertPassword.length >= 6
                                            ? "✓ Password looks good"
                                            : `✗ Must be at least 6 characters (${expertPassword.length}/6)`}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-1.5">
                                <PasswordField
                                    label="Confirm Password"
                                    value={expertConfirmPassword}
                                    onChange={setExpertConfirmPassword}
                                    show={showExpertConfirmPassword}
                                    onToggle={() => setShowExpertConfirmPassword((v) => !v)}
                                    placeholder="Confirm password"
                                    required
                                />
                                {expertConfirmPassword.length > 0 && (
                                    <p className={`text-[12px] px-2 ${
                                        expertPassword === expertConfirmPassword ? "text-emerald-400" : "text-red-400"
                                    }`}>
                                        {expertPassword === expertConfirmPassword
                                            ? "✓ Passwords match"
                                            : "✗ Passwords do not match"}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={ACTION_ROW}>
                            <button type="button" onClick={() => setStep(1)} className={BACK_BTN}>
                                <IoArrowBack size={16}/> Back
                            </button>
                            <button type="submit"
                                    className={`${SUBMIT_BTN} ${!isStep3Valid ? "opacity-5 cursor-not-allowed" : "cursor-pointer"}`}
                                    disabled={!isStep3Valid}>
                                Continue <IoArrowForward size={16}/>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ════════════════ STEP 4 — Professional Profile ════════════════ */}
            {step === 4 && (
                <div className={`${CARD_BASE} max-w-4xl`}>
                    <StepHeader title="Professional Profile" step={3} totalSteps={3} progressPct={100}/>
                    <p className={SECTION_INTRO}>
                        Complete your <span className="text-emerald-400">Professional Expert</span> profile for
                        verification.
                    </p>

                    <form onSubmit={handleProfessionalFinalSubmit} className="flex flex-col gap-5">
                        <PhotoUpload
                            id="photo-upload"
                            photo={profilePhoto}
                            onPhoto={setProfilePhoto}
                            title="Profile Photo"
                            subtitle="Upload a professional headshot. JPEG or PNG, max 5MB."
                        />

                        <div className={TWO_COL_GRID}>
                            {/* Full Name */}
                            <Field label="Full Name" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="Dr. Sarah Jenkins" value={fullName}
                                       onChange={(e) => setFullName(e.target.value)} required className={ROUND_INPUT}/>
                            </Field>

                            {/* Job Title */}
                            <Field label="Current Job Title" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="Senior AI Research Lead" value={jobTitle}
                                       onChange={(e) => setJobTitle(e.target.value)} required className={ROUND_INPUT}/>
                            </Field>

                            {/* Employer */}
                            <Field label="Employer" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="Google LLC" value={employer}
                                       onChange={(e) => setEmployer(e.target.value)} required className={ROUND_INPUT}/>
                            </Field>

                            {/* National ID */}
                            <Field label="National ID" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="19**********" value={nationalId}
                                       onChange={(e) => setNationalId(e.target.value)} required className={ROUND_INPUT}/>
                            </Field>

                            {/* Phone */}
                            <Field label="Phone Number" icon={<IoPersonOutline size={18}/>} required>
                                <input type="tel" placeholder="0712345678" value={phone}
                                       onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                       inputMode="numeric"
                                       maxLength={10}
                                       pattern="0[0-9]{9}"
                                       title="Phone number must start with 0 and contain exactly 10 digits."
                                       required
                                       className={ROUND_INPUT}/>
                            </Field>

                            {/* Field of Expertise */}
                            <Field label="Field of Expertise" icon={<IoPersonOutline size={18}/>} required>
                                <select value={expertise} onChange={(e) => setExpertise(e.target.value)}
                                        required
                                        className={SELECT_INPUT}>
                                    <option value="" className="bg-[#052e16]">Select your domain</option>
                                    {["Software Engineering", "Data Science", "Machine Learning",
                                        "Product Management", "Design", "Finance", "Law", "Medicine", "Other"
                                    ].map((o) => (
                                        <option key={o} value={o} className="bg-[#052e16]">{o}</option>
                                    ))}
                                </select>
                            </Field>

                            {/* University */}
                            <Field label="University" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="Stanford University" value={university}
                                       onChange={(e) => setUniversity(e.target.value)} required className={ROUND_INPUT}/>
                            </Field>

                            {/* Degree */}
                            <Field label="Degree" icon={<IoPersonOutline size={18}/>} required>
                                <input type="text" placeholder="Ph.D. Computer Science" value={degree}
                                       onChange={(e) => setDegree(e.target.value)} required className={ROUND_INPUT}/>
                            </Field>

                            {/* Portfolio */}
                            <Field label="Portfolio Link" icon={<IoLinkOutline size={18}/>}>
                                <input type="url" placeholder="https://portfolio.com" value={portfolio}
                                       onChange={(e) => setPortfolio(e.target.value)} className={ROUND_INPUT}/>
                            </Field>

                            {/* LinkedIn */}
                            <Field label="LinkedIn" icon={<IoLogoLinkedin size={18}/>} required>
                                <input type="url" placeholder="https://linkedin.com/in/username" value={linkedin}
                                       onChange={(e) => setLinkedin(e.target.value)} required className={ROUND_INPUT}/>
                            </Field>

                            {/* Instagram */}
                            <Field label="Instagram" icon={<IoLogoInstagram size={18}/>}>
                                <input type="url" placeholder="instagram.com/username" value={instagram}
                                       onChange={(e) => setInstagram(e.target.value)} className={ROUND_INPUT}/>
                            </Field>

                            {/* Facebook */}
                            <Field label="Facebook" icon={<IoGlobeOutline size={18}/>}>
                                <input type="url" placeholder="facebook.com/username" value={facebook}
                                       onChange={(e) => setFacebook(e.target.value)} className={ROUND_INPUT}/>
                            </Field>

                            {/* Timezone */}
                            <Field label="Time Zone" icon={<IoGlobeOutline size={18}/>}>
                                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                                        className={SELECT_INPUT}>
                                    {TIMEZONES.map((tz) => (
                                        <option key={tz} value={tz} className="bg-[#052e16]">{tz}</option>
                                    ))}
                                </select>
                            </Field>

                            {/* Verification Window */}
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <label
                                        className="m-0 text-[11px] font-semibold uppercase tracking-[2px] text-emerald-400">
                                        Preferred Verification Window
                                    </label>
                                    {/* Tooltip */}
                                    <div className="group relative inline-flex">
                                        <span
                                            className="cursor-help text-[11px] font-semibold text-emerald-400 underline decoration-dotted">
                                            Learn more
                                        </span>
                                        <div
                                            className="pointer-events-none invisible absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-60 -translate-x-1/2 rounded-lg border border-emerald-500/35 bg-[rgba(2,44,34,0.98)] px-3.5 py-2.5 text-xs leading-relaxed text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.4)] group-hover:visible">
                                            Please provide your availability for a one-on-one manual verification
                                            meeting with a site administrator.
                                            <span
                                                className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-emerald-500/35"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <IoPersonOutline size={18} className={FIELD_ICON}/>
                                    <select value={verifyWindow} onChange={(e) => setVerifyWindow(e.target.value)}
                                            className={SELECT_INPUT}>
                                        {WINDOWS.map((w) => (
                                            <option key={w} value={w} className="bg-[#052e16]">{w}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Skills — full width */}
                             <div className="col-span-full">
                                 <label
                                     className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[2px] text-emerald-400">
                                     Skills &amp; Technologies
                                     <span aria-hidden="true" className="ml-1 text-red-400">*</span>
                                     <span className="sr-only">required</span>
                                 </label>
                                <div
                                    className="flex min-h-[60px] flex-wrap gap-2 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] p-3.5 shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.1)]">
                                     {ALL_SKILLS.map((skill) => {
                                         const active = selectedSkills.includes(skill);
                                         return (
                                             <button
                                                key={skill}
                                                type="button"
                                                onClick={() => toggleSkill(skill)}
                                                className={`flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200 ${active
                                                    ? "border border-emerald-500/60 bg-emerald-500/25 text-white"
                                                    : "border border-white/10 bg-white/[0.04] text-[#649c8c]"
                                                }`}
                                            >
                                                {active && <IoCloseCircle size={13} className="text-emerald-400"/>}
                                                {skill}
                                             </button>
                                         );
                                     })}
                                 </div>

                                {selectedSkills.includes("Other") && (
                                    <div className="mt-3">
                                        <label className={FIELD_LABEL}>
                                            Other Skill Label
                                            <span aria-hidden="true" className="ml-1 text-red-400">*</span>
                                            <span className="sr-only">required</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Technical Writing"
                                            value={otherSkillLabel}
                                            onChange={(e) => setOtherSkillLabel(e.target.value)}
                                            required
                                            className={ROUND_INPUT}
                                        />
                                    </div>
                                )}
                             </div>

                            {/* Bio — full width */}
                            <div className="col-span-full">
                                <label className={FIELD_LABEL}>
                                    Professional Bio
                                    <span aria-hidden="true" className="ml-1 text-red-400">*</span>
                                    <span className="sr-only">required</span>
                                </label>
                                <textarea
                                    placeholder="Briefly describe your journey and accomplishments..."
                                    rows={4}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    required
                                    className={
                                        ROUND_INPUT.replace("rounded-full", "rounded-2xl") +
                                        " resize-y px-4 leading-relaxed"
                                    }
                                    style={{minHeight: "100px"}}
                                />
                            </div>
                        </div>

                        {expertSubmitError && (
                            <p className="m-0 text-[13px] text-red-300">{expertSubmitError}</p>
                        )}
                        {expertSubmitSuccess && (
                            <p className="m-0 text-[13px] text-green-300">{expertSubmitSuccess}</p>
                        )}

                        <div className={ACTION_ROW}>
                            <button type="button" onClick={() => setStep(3)} className={BACK_BTN}>
                                <IoArrowBack size={16}/> Back
                            </button>
                            <button type="submit" disabled={expertSubmitting} className={SUBMIT_BTN}>
                                {expertSubmitting ? "Registering..." : <>Register Now <IoArrowForward
                                    size={16}/></>}
                            </button>
                        </div>
                    </form>

                    <p className="mt-7 text-center text-sm text-[#649c8c]">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-emerald-400 no-underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            )}


        </div>
    );
}
