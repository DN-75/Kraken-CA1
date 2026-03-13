"use client";
import { useState } from "react";
import Link from "next/link";
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
  IoAddCircleOutline,
  IoCloseCircle,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from "react-icons/io5";
import { HiOutlineUserGroup, HiOutlineShieldCheck } from "react-icons/hi2";

type Role = "seeker" | "expert" | null;

const ALL_SKILLS = [
  "Web Development","Mobile Development","Machine Learning","Data Science",
  "UI/UX Design","Cybersecurity","Cloud Computing","DevOps","Blockchain",
  "Project Management","Digital Marketing","Content Writing","Finance",
  "Law","Medicine","Accounting","Photography","Video Editing",
  "Business Strategy","Human Resources","Other",
];

const TIMEZONES = [
  "Asia/Colombo (UTC+05:30)","Asia/Dubai (UTC+04:00)","Asia/Dhaka (UTC+06:00)",
  "Asia/Bangkok (UTC+07:00)","Asia/Singapore (UTC+08:00)","Asia/Tokyo (UTC+09:00)",
  "Europe/London (UTC+00:00)","Europe/Paris (UTC+01:00)","America/New_York (UTC-05:00)",
  "America/Chicago (UTC-06:00)","America/Denver (UTC-07:00)","America/Los_Angeles (UTC-08:00)",
  "Pacific/Auckland (UTC+12:00)","Australia/Sydney (UTC+10:00)",
];

const WINDOWS = [
  "Monday 09:00 AM","Monday 02:00 PM","Monday 06:00 PM",
  "Tuesday 09:00 AM","Tuesday 02:00 PM","Tuesday 06:00 PM",
  "Wednesday 09:00 AM","Wednesday 02:00 PM","Wednesday 06:00 PM",
  "Thursday 09:00 AM","Thursday 02:00 PM","Thursday 06:00 PM",
  "Friday 09:00 AM","Friday 02:00 PM","Friday 06:00 PM",
  "Saturday 10:00 AM","Saturday 03:00 PM","Sunday 10:00 AM",
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  // Step 2 — basic account
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

  // Step 3 — professional profile
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [expertise, setExpertise] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Web Development"]);
  const [portfolio, setPortfolio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [timezone, setTimezone] = useState("Asia/Colombo (UTC+05:30)");
  const [verifyWindow, setVerifyWindow] = useState("Monday 09:00 AM");
  const [bio, setBio] = useState("");
  const [expertUsername, setExpertUsername] = useState("");
  const [expertEmail, setExpertEmail] = useState("");
  const [expertPassword, setExpertPassword] = useState("");
  const [expertConfirmPassword, setExpertConfirmPassword] = useState("");
  const [showExpertPassword, setShowExpertPassword] = useState(false);
  const [showExpertConfirmPassword, setShowExpertConfirmPassword] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleContinue = () => {
    if (step === 1 && selectedRole) {
      if (selectedRole === "expert") setStep(3);
      else setStep(2);
    } else if (step === 2) {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log({ role: selectedRole, fullName, email });
  };

  const handleProfessionalFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      role: selectedRole,
      expertUsername,
      expertEmail,
      expertPassword,
      fullName,
      jobTitle,
      employer,
      selectedSkills,
    });
  };

  // ── shared styles ──
  const roundInput: React.CSSProperties = {
    width: "100%", paddingLeft: "44px", paddingRight: "16px",
    paddingTop: "12px", paddingBottom: "12px",
    borderRadius: "999px", fontSize: "14px", color: "white",
    border: "none", outline: "none",
    background: "linear-gradient(135deg, rgba(2,44,34,0.45), rgba(2,34,24,0.35))",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 0px 1.5px rgba(255,255,255,0.3),inset 0.3px 0.5px 1px rgba(255,255,255,0.35), 0 4px 5px rgba(0,0,0,0.2)",
  };

  const roleCardStyle = (active: boolean): React.CSSProperties => ({
    textAlign: "left", padding: "24px", borderRadius: "12px",
    cursor: "pointer", transition: "all 0.2s",
    background: active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
    border: active ? "1.5px solid rgba(16,185,129,0.55)" : "1.5px solid rgba(255,255,255,0.08)",
    boxShadow: active ? "0 0 24px rgba(16,185,129,0.1)" : "none",
  });


  const totalSteps = selectedRole === "expert" ? 3 : 2;
  const progressPct = step === 1 ? 100 / totalSteps : 100;

  return (
    <>
      <style>{`
        .reg-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 16px 48px;
          position: relative;
          background: linear-gradient(135deg, #022c22 0%, #126449 100%);
        }
        .reg-card {
          width: 100%;
          max-width: 800px;
          border-radius: 20px;
          padding: 32px 24px;
          background: rgba(17,49,39,0.55);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(16,185,129,0.15);
          box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 40px rgba(16,185,129,0.05);
        }
        .pro-card {
          width: 100%;
          max-width: 900px;
          border-radius: 20px;
          padding: 32px 24px;
          background: rgba(17,49,39,0.55);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(16,185,129,0.15);
          box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 40px rgba(16,185,129,0.05);
        }
        .reg-role-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }
        .pro-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .reg-header { font-size: 24px; }
        .reg-logo-text { display: none; }
        .pro-header { font-size: 32px; }

        @media (min-width: 480px) {
          .reg-logo-text { display: inline; }
          .reg-card { padding: 36px 32px; }
          .pro-card { padding: 36px 32px; }
          .reg-header { font-size: 28px; }
        }
        @media (min-width: 640px) {
          .reg-role-grid { grid-template-columns: 1fr 1fr; }
          .reg-card { padding: 40px; }
          .pro-card { padding: 40px; }
          .reg-header { font-size: 32px; }
          .pro-form-grid { grid-template-columns: 1fr 1fr; }
          .pro-header { font-size: 40px; }
        }
        @media (min-width: 768px) {
          .reg-page { padding: 40px 24px 48px; }
          .pro-card { padding: 40px; }
          .pro-header { fontSize: 32px; }
        }

        .glass-input::placeholder { color: rgba(167,243,208,0.4); }
        .glass-input:focus {
          background: rgba(2,44,34,0.8) !important;
          border-color: #10B981 !important;
          box-shadow: 0 0 20px rgba(16,185,129,0.25);
          outline: none;
        }
        .round-input::placeholder { color: #649c8c; }
        .round-input:focus {
          outline: none;
          box-shadow: inset 0 0px 1.5px rgba(255,255,255,0.3), 0 0 0 2px rgba(16,185,129,0.4);
        }
        select.glass-input option { background: #052e16; color: white; }

        .tooltip-wrapper { position: relative; }
        .tooltip-box {
          display: none;
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(2, 44, 34, 0.98);
          border: 1px solid rgba(16,185,129,0.35);
          color: rgba(255,255,255,0.9);
          font-size: 12px;
          font-weight: 400;
          line-height: 1.5;
          padding: 10px 14px;
          border-radius: 8px;
          width: 240px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 50;
          pointer-events: none;
          letter-spacing: 0;
          text-transform: none;
        }
        .tooltip-box::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: rgba(16,185,129,0.35);
        }
        .tooltip-wrapper:hover .tooltip-box { display: block; }
      `}</style>

      <div className="reg-page">

        {/* ── Logo ── */}
        <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "10px", zIndex: 10 }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="2.5" /><circle cx="7" cy="13" r="2.5" />
              <circle cx="17" cy="13" r="2.5" /><circle cx="12" cy="18" r="2.5" />
              <circle cx="7" cy="8" r="1.5" opacity="0.6" /><circle cx="17" cy="8" r="1.5" opacity="0.6" />
            </svg>
          </div>
          <span className="reg-logo-text" style={{ color: "white", fontSize: "18px", fontWeight: 700 }}>
            Expert<span style={{ color: "#10B981" }}>Connect</span>
          </span>
        </div>

        {/* ════════════════ STEP 1 — Role Selection ════════════════ */}
        {step === 1 && (
          <div className="reg-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <p style={{ color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Registration</p>
                <h1 className="reg-header" style={{ color: "white", fontWeight: 700, margin: 0 }}>Get Started</h1>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", marginTop: "4px", flexShrink: 0 }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", margin: 0 }}>Step 1 of {totalSteps}</p>
                <div style={{ width: "192px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: "#10B981", borderRadius: "999px", boxShadow: "0 0 12px rgba(16,185,129,0.5)", transition: "width 0.4s ease" }} />
                </div>
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: "14px", color: "#649c8c", marginTop: "24px", marginBottom: "28px" }}>
              Choose your journey on the platform. How will you participate?
            </p>

            <div className="reg-role-grid">
              <button type="button" onClick={() => setSelectedRole("seeker")} style={roleCardStyle(selectedRole === "seeker")}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <HiOutlineUserGroup size={24} style={{ color: "#10B981" }} />
                </div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: "17px", marginBottom: "8px", marginTop: 0 }}>Service Seeker</h3>
                <p style={{ color: "#649c8c", fontSize: "13px", marginBottom: "16px", lineHeight: "1.55", marginTop: 0 }}>
                  Access top-tier professionals, get personalized advice, and accelerate your career growth.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Connect with global experts", "Flexible booking hours"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                      <IoCheckmarkCircle size={17} style={{ color: "#10B981", flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
              </button>

              <button type="button" onClick={() => setSelectedRole("expert")} style={roleCardStyle(selectedRole === "expert")}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <HiOutlineShieldCheck size={24} style={{ color: "#10B981" }} />
                </div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: "17px", marginBottom: "8px", marginTop: 0 }}>Professional Expert</h3>
                <p style={{ color: "#649c8c", fontSize: "13px", marginBottom: "16px", lineHeight: "1.55", marginTop: 0 }}>
                  Share your expertise, build your personal brand, and earn by helping others succeed.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Set your own consultation rates", "Verified expert badge"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                      <IoCheckmarkCircle size={17} style={{ color: "#10B981", flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <button type="button" onClick={handleContinue} disabled={!selectedRole}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 40px", borderRadius: "999px", fontWeight: 600, color: "white", fontSize: "14px", border: "none", cursor: selectedRole ? "pointer" : "not-allowed", opacity: selectedRole ? 1 : 0.4, background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 6px 20px rgba(16,185,129,0.35)", transition: "all 0.2s" }}>
                Continue <IoArrowForward size={16} />
              </button>
              <p style={{ fontSize: "14px", color: "#649c8c", margin: 0 }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#10B981", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
              </p>
            </div>
          </div>
        )}


        {/* ══════��═════════ STEP 2 — Service Seeker Profile ════════════════ */}
        {step === 2 && (
          <div className="pro-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <p style={{ color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Registration</p>
                <h1 className="reg-header" style={{ color: "white", fontWeight: 700, margin: 0 }}>Join the Network</h1>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", marginTop: "4px", flexShrink: 0 }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", margin: 0 }}>Step 2 of 2</p>
                <div style={{ width: "192px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "100%", background: "#10B981", borderRadius: "999px", boxShadow: "0 0 12px rgba(16,185,129,0.5)" }} />
                </div>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#649c8c", marginTop: "12px", marginBottom: "28px" }}>
              Complete your <span style={{ color: "#10B981" }}>Service Seeker</span> profile to get started.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Profile Photo */}
              <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", padding: "20px", borderRadius: "16px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "96px", height: "96px", borderRadius: "50%", overflow: "hidden", background: "rgba(6,78,59,0.5)", border: "2px dashed rgba(16,185,129,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {seekerPhoto
                      ? <img src={seekerPhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <IoAddCircleOutline size={32} style={{ color: "rgba(16,185,129,0.6)" }} />
                    }
                  </div>
                  <label htmlFor="seeker-photo-upload" style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", background: "#10B981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                    <svg width="12" height="12" fill="#022c22" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    <input id="seeker-photo-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) setSeekerPhoto(URL.createObjectURL(f)); }} />
                  </label>
                </div>
                <div>
                  <p style={{ color: "white", fontWeight: 600, fontSize: "15px", margin: "0 0 4px" }}>Upload Profile Photo</p>
                  <p style={{ color: "#649c8c", fontSize: "13px", margin: 0 }}>JPG or PNG, max 5MB. A professional photo helps you stand out.</p>
                </div>
              </div>

              {/* 2-col grid */}
              <div className="pro-form-grid">

                {/* Full Name */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Full Name</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <IoMailOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <IoLockClosedOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type={showSeekerPassword ? "text" : "password"} placeholder="Enter password" value={seekerPassword} onChange={e => setSeekerPassword(e.target.value)} className="round-input" style={{ ...roundInput, paddingRight: "44px" }} />
                    <button
                      type="button"
                      onClick={() => setShowSeekerPassword(v => !v)}
                      aria-label={showSeekerPassword ? "Hide password" : "Show password"}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#649c8c", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {showSeekerPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <IoLockClosedOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type={showSeekerConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={seekerConfirmPassword} onChange={e => setSeekerConfirmPassword(e.target.value)} className="round-input" style={{ ...roundInput, paddingRight: "44px" }} />
                    <button
                      type="button"
                      onClick={() => setShowSeekerConfirmPassword(v => !v)}
                      aria-label={showSeekerConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#649c8c", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {showSeekerConfirmPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  </div>
                </div>

                {/* Current Status */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Current Status</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <select value={seekerStatus} onChange={e => setSeekerStatus(e.target.value)} className="round-input" style={{ ...roundInput, paddingLeft: "44px", appearance: "none" as const, cursor: "pointer" }}>
                      <option value="" style={{ background: "#052e16" }}>Select status</option>
                      <option value="undergraduate" style={{ background: "#052e16" }}>Undergraduate</option>
                      <option value="postgraduate" style={{ background: "#052e16" }}>Post-Graduate Student</option>
                      <option value="professional" style={{ background: "#052e16" }}>Working Professional</option>
                      <option value="other" style={{ background: "#052e16" }}>Other</option>
                    </select>
                  </div>
                </div>

                {/* Time Zone */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Time Zone</label>
                  <div style={{ position: "relative" }}>
                    <IoGlobeOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <select value={seekerTimezone} onChange={e => setSeekerTimezone(e.target.value)} className="round-input" style={{ ...roundInput, paddingLeft: "44px", appearance: "none" as const, cursor: "pointer" }}>
                      {[
                        ["UTC-12","(UTC-12:00) International Date Line West"],
                        ["UTC-11","(UTC-11:00) Midway Island, Samoa"],
                        ["UTC-10","(UTC-10:00) Hawaii"],
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
                        ["UTC+5.5","(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi"],
                        ["UTC+8", "(UTC+08:00) Beijing, Hong Kong, Singapore"],
                        ["UTC+9", "(UTC+09:00) Osaka, Sapporo, Tokyo"],
                        ["UTC+10","(UTC+10:00) Brisbane, Melbourne, Sydney"],
                      ].map(([val, label]) => (
                        <option key={val} value={val} style={{ background: "#052e16" }}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Short Bio — full width */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Short Bio</label>
                  <textarea
                    placeholder="Tell us about your goals and what you're looking for..."
                    rows={4} value={seekerBio} onChange={e => setSeekerBio(e.target.value)}
                    className="round-input"
                    style={{ ...roundInput, paddingLeft: "16px", borderRadius: "16px", resize: "vertical", minHeight: "100px", lineHeight: "1.6" }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", paddingTop: "24px", marginTop: "8px", borderTop: "1px solid rgba(16,185,129,0.1)" }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "999px", fontWeight: 600, fontSize: "14px", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <IoArrowBack size={16} /> Back
                </button>
                <button type="submit"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "999px", fontWeight: 600, color: "white", fontSize: "14px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 6px 20px rgba(16,185,129,0.35)" }}>
                  Register Now <IoArrowForward size={16} />
                </button>
              </div>
            </form>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#649c8c", marginTop: "24px" }}>
              By clicking Register, you agree to ExpertConnect&apos;s{" "}
              <Link href="#" style={{ color: "#10B981", textDecoration: "none" }}>Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" style={{ color: "#10B981", textDecoration: "none" }}>Privacy Policy</Link>.
            </p>
          </div>
        )}

        {/* ════════════════ STEP 3 — Professional Account ════════════════ */}
        {step === 3 && (
          <div className="pro-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <p style={{ color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Registration</p>
                <h1 className="reg-header" style={{ color: "white", fontWeight: 700, margin: 0 }}>Professional Account</h1>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", marginTop: "4px", flexShrink: 0 }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", margin: 0 }}>Step 2 of 3</p>
                <div style={{ width: "192px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "66.67%", background: "#10B981", borderRadius: "999px", boxShadow: "0 0 12px rgba(16,185,129,0.5)" }} />
                </div>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#649c8c", marginTop: "12px", marginBottom: "28px" }}>
              Set up your account credentials before completing your professional profile.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="pro-form-grid">
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Username</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="your_username" value={expertUsername} onChange={e => setExpertUsername(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <IoMailOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="email" placeholder="expert@example.com" value={expertEmail} onChange={e => setExpertEmail(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <IoLockClosedOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type={showExpertPassword ? "text" : "password"} placeholder="Enter password" value={expertPassword} onChange={e => setExpertPassword(e.target.value)} className="round-input" style={{ ...roundInput, paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowExpertPassword(v => !v)} aria-label={showExpertPassword ? "Hide password" : "Show password"}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#649c8c", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {showExpertPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <IoLockClosedOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type={showExpertConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={expertConfirmPassword} onChange={e => setExpertConfirmPassword(e.target.value)} className="round-input" style={{ ...roundInput, paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowExpertConfirmPassword(v => !v)} aria-label={showExpertConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#649c8c", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {showExpertConfirmPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", paddingTop: "24px", marginTop: "8px", borderTop: "1px solid rgba(16,185,129,0.1)" }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "999px", fontWeight: 600, fontSize: "14px", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <IoArrowBack size={16} /> Back
                </button>
                <button type="submit"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "999px", fontWeight: 600, color: "white", fontSize: "14px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 6px 20px rgba(16,185,129,0.35)" }}>
                  Continue <IoArrowForward size={16} />
                </button>
              </div>
            </form>
          </div>
        )}


        {/* ════════════════ STEP 4 — Professional Profile ════════════════ */}
        {step === 4 && (
          <div className="pro-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <p style={{ color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Registration</p>
                <h1 className="reg-header" style={{ color: "white", fontWeight: 700, margin: 0 }}>Professional Profile</h1>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", marginTop: "4px", flexShrink: 0 }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", margin: 0 }}>Step 3 of 3</p>
                <div style={{ width: "192px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "100%", background: "#10B981", borderRadius: "999px", boxShadow: "0 0 12px rgba(16,185,129,0.5)" }} />
                </div>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#649c8c", marginTop: "12px", marginBottom: "28px" }}>
              Complete your <span style={{ color: "#10B981" }}>Professional Expert</span> profile for verification.
            </p>

            <form onSubmit={handleProfessionalFinalSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* ── Profile Photo ── */}
              <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", padding: "20px", borderRadius: "16px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "96px", height: "96px", borderRadius: "50%", overflow: "hidden", background: "rgba(6,78,59,0.5)", border: "2px dashed rgba(16,185,129,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {profilePhoto ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IoAddCircleOutline size={32} style={{ color: "rgba(16,185,129,0.6)" }} />}
                  </div>
                  <label htmlFor="photo-upload" style={{ position: "absolute", bottom: "0", right: "0", width: "28px", height: "28px", background: "#10B981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                    <svg width="12" height="12" fill="#022c22" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    <input id="photo-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) setProfilePhoto(URL.createObjectURL(f)); }} />
                  </label>
                </div>
                <div>
                  <p style={{ color: "white", fontWeight: 600, fontSize: "15px", margin: "0 0 4px" }}>Profile Photo</p>
                  <p style={{ color: "#649c8c", fontSize: "13px", margin: 0 }}>Upload a professional headshot. JPEG or PNG, max 5MB.</p>
                </div>
              </div>

              <div className="pro-form-grid">
                {/* Full Name */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Full Name</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="Dr. Sarah Jenkins" value={fullName} onChange={e => setFullName(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Current Job Title</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="Senior AI Research Lead" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Employer */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Employer</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="Google LLC" value={employer} onChange={e => setEmployer(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* National ID */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>National ID</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="19**********" value={nationalId} onChange={e => setNationalId(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Phone Number</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="tel" placeholder="+94 00 000 0000" value={phone} onChange={e => setPhone(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Field of Expertise */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Field of Expertise</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <select value={expertise} onChange={e => setExpertise(e.target.value)} className="round-input" style={{ ...roundInput, paddingLeft: "44px", appearance: "none" as const, cursor: "pointer" }}>
                      <option value="" style={{ background: "#052e16" }}>Select your domain</option>
                      {["Software Engineering","Data Science","Machine Learning","Product Management","Design","Finance","Law","Medicine","Other"].map(o => <option key={o} value={o} style={{ background: "#052e16" }}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* University */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>University</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="Stanford University" value={university} onChange={e => setUniversity(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Degree */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Degree</label>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="text" placeholder="Ph.D. Computer Science" value={degree} onChange={e => setDegree(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Portfolio */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Portfolio Link</label>
                  <div style={{ position: "relative" }}>
                    <IoLinkOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="url" placeholder="https://portfolio.com" value={portfolio} onChange={e => setPortfolio(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* LinkedIn */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>LinkedIn</label>
                  <div style={{ position: "relative" }}>
                    <IoLogoLinkedin size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="url" placeholder="linkedin.com/in/username" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Instagram</label>
                  <div style={{ position: "relative" }}>
                    <IoLogoInstagram size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="url" placeholder="instagram.com/username" value={instagram} onChange={e => setInstagram(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Facebook */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Facebook</label>
                  <div style={{ position: "relative" }}>
                    <IoGlobeOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <input type="url" placeholder="facebook.com/username" value={facebook} onChange={e => setFacebook(e.target.value)} className="round-input" style={roundInput} />
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Time Zone</label>
                  <div style={{ position: "relative" }}>
                    <IoGlobeOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <select value={timezone} onChange={e => setTimezone(e.target.value)} className="round-input" style={{ ...roundInput, paddingLeft: "44px", appearance: "none" as const, cursor: "pointer" }}>
                      {TIMEZONES.map(tz => <option key={tz} value={tz} style={{ background: "#052e16" }}>{tz}</option>)}
                    </select>
                  </div>
                </div>

                {/* Verification Window */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>Preferred Verification Window</label>
                    <div style={{ position: "relative", display: "inline-flex" }} className="tooltip-wrapper">
                      <span style={{ color: "#10B981", fontSize: "11px", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted", cursor: "help" }}>
                        Learn more
                      </span>
                      <div className="tooltip-box">
                        Please provide your availability for a one-on-one manual verification meeting with a site administrator.
                      </div>
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none" }} />
                    <select value={verifyWindow} onChange={e => setVerifyWindow(e.target.value)} className="round-input" style={{ ...roundInput, paddingLeft: "44px", appearance: "none" as const, cursor: "pointer" }}>
                      {WINDOWS.map(w => <option key={w} value={w} style={{ background: "#052e16" }}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Skills — full width */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Skills &amp; Technologies</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "14px", minHeight: "60px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(2,44,34,0.45), rgba(2,34,24,0.35))", border: "1px solid rgba(16,185,129,0.15)", boxShadow: "inset 0 0px 1.5px rgba(255,255,255,0.1)" }}>
                    {ALL_SKILLS.map(skill => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                          style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, color: active ? "white" : "#649c8c", background: active ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.04)", border: active ? "1px solid rgba(16,185,129,0.6)" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px" }}>
                          {active && <IoCloseCircle size={13} style={{ color: "#10B981" }} />}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bio — full width */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Professional Bio</label>
                  <textarea
                    placeholder="Briefly describe your journey and accomplishments..."
                    rows={4} value={bio} onChange={e => setBio(e.target.value)}
                    className="round-input"
                    style={{ ...roundInput, paddingLeft: "16px", borderRadius: "16px", resize: "vertical", minHeight: "100px", lineHeight: "1.6" }}
                  />
                </div>
              </div>

              {/* ── Action Buttons — pill style like seeker ── */}
              <div style={{ display: "flex", gap: "12px", paddingTop: "24px", marginTop: "8px", borderTop: "1px solid rgba(16,185,129,0.1)" }}>
                <button type="button" onClick={() => setStep(3)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "999px", fontWeight: 600, fontSize: "14px", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <IoArrowBack size={16} /> Back
                </button>
                <button type="submit"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "999px", fontWeight: 600, color: "white", fontSize: "14px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 6px 20px rgba(16,185,129,0.35)" }}>
                  Register Now <IoArrowForward size={16} />
                </button>
              </div>
            </form>

            <p style={{ textAlign: "center", fontSize: "14px", color: "#649c8c", marginTop: "28px" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#10B981", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
            </p>
          </div>
        )}


        {/* Footer */}
        <footer style={{ marginTop: "32px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
          <p>© 2024 ExpertConnect Professional Network. Secure SSL Encrypted.</p>
        </footer>
      </div>
    </>
  );
}

