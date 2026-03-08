"use client";
import { useState } from "react";
import Link from "next/link";
import {
  IoPersonOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCheckmarkCircle,
  IoArrowForward,
  IoArrowBack,
} from "react-icons/io5";
import { HiOutlineUserGroup, HiOutlineShieldCheck } from "react-icons/hi2";

type Role = "seeker" | "expert" | null;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleContinue = () => {
    if (selectedRole) setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ role: selectedRole, fullName, email, password });
  };

  const inputBase =
    "w-full pl-11 pr-4 py-3 rounded-full text-sm text-white placeholder-[#649c8c] focus:outline-none focus:ring-2 focus:ring-emerald-500/50";
  const inputStyle = {
    background: "linear-gradient(135deg, rgba(2,44,34,0.45), rgba(2,34,24,0.35))",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow:
      "inset 0 0px 1.5px rgba(255,255,255,0.3),inset 0.3px 0.5px 1px rgba(255,255,255,0.35), 0 4px 5px rgba(0,0,0,0.2)",
  };
  const labelClass = "block text-xs font-semibold tracking-widest uppercase mb-2";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
        background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)",
      }}
    >
      {/* ── Top-left logo ── */}
      <div
        style={{
          position: "absolute",
          top: "24px",
          left: "32px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "#10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="2.5" />
            <circle cx="7" cy="13" r="2.5" />
            <circle cx="17" cy="13" r="2.5" />
            <circle cx="12" cy="18" r="2.5" />
            <circle cx="7" cy="8" r="1.5" opacity="0.6" />
            <circle cx="17" cy="8" r="1.5" opacity="0.6" />
          </svg>
        </div>
        <span style={{ color: "white", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
          Expert<span style={{ color: "#10B981" }}>Connect</span>
        </span>
      </div>

      {/* ── Main Card ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          borderRadius: "20px",
          padding: "40px",
          background: "rgba(17, 49, 39, 0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(16, 185, 129, 0.15)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 40px rgba(16,185,129,0.05)",
        }}
      >
        {/* ── Step header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
          <div>
            <p style={{ color: "#10B981", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
              Registration
            </p>
            <h1 style={{ color: "white", fontSize: "32px", fontWeight: 700, margin: 0 }}>
              {step === 1 ? "Get Started" : "Create Account"}
            </h1>
          </div>
          {/* Step indicator */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", marginTop: "4px" }}>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>Step {step} of 2</p>
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ height: "3px", width: "48px", borderRadius: "999px", background: "#10B981" }} />
              <div style={{ height: "3px", width: "48px", borderRadius: "999px", background: step === 2 ? "#10B981" : "rgba(255,255,255,0.2)" }} />
            </div>
          </div>
        </div>

        {/* ══ STEP 1 ══ */}
        {step === 1 && (
          <>
            <p style={{ textAlign: "center", fontSize: "14px", color: "#649c8c", marginTop: "24px", marginBottom: "32px" }}>
              Choose your journey on the platform. How will you participate?
            </p>

            {/* Role cards — always 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px" }}>
              {/* Service Seeker */}
              <button
                type="button"
                onClick={() => setSelectedRole("seeker")}
                style={{
                  textAlign: "left",
                  padding: "24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: selectedRole === "seeker" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                  border: selectedRole === "seeker" ? "1.5px solid rgba(16,185,129,0.55)" : "1.5px solid rgba(255,255,255,0.08)",
                  boxShadow: selectedRole === "seeker" ? "0 0 24px rgba(16,185,129,0.1)" : "none",
                }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <HiOutlineUserGroup size={24} style={{ color: "#10B981" }} />
                </div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Service Seeker</h3>
                <p style={{ color: "#649c8c", fontSize: "13px", marginBottom: "16px", lineHeight: "1.5" }}>
                  Access top-tier professionals, get personalized advice, and accelerate your career growth.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Connect with global experts", "Flexible booking hours"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                      <IoCheckmarkCircle size={17} style={{ color: "#10B981", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>

              {/* Professional Expert */}
              <button
                type="button"
                onClick={() => setSelectedRole("expert")}
                style={{
                  textAlign: "left",
                  padding: "24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: selectedRole === "expert" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                  border: selectedRole === "expert" ? "1.5px solid rgba(16,185,129,0.55)" : "1.5px solid rgba(255,255,255,0.08)",
                  boxShadow: selectedRole === "expert" ? "0 0 24px rgba(16,185,129,0.1)" : "none",
                }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <HiOutlineShieldCheck size={24} style={{ color: "#10B981" }} />
                </div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Professional Expert</h3>
                <p style={{ color: "#649c8c", fontSize: "13px", marginBottom: "16px", lineHeight: "1.5" }}>
                  Share your expertise, build your personal brand, and earn by helping others succeed.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Set your own consultation rates", "Verified expert badge"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                      <IoCheckmarkCircle size={17} style={{ color: "#10B981", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            </div>

            {/* Continue button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedRole}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 40px",
                  borderRadius: "999px",
                  fontWeight: 600,
                  color: "white",
                  fontSize: "14px",
                  border: "none",
                  cursor: selectedRole ? "pointer" : "not-allowed",
                  opacity: selectedRole ? 1 : 0.4,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
                  transition: "all 0.2s",
                }}
              >
                Continue <IoArrowForward size={16} />
              </button>
              <p style={{ fontSize: "14px", color: "#649c8c", margin: 0 }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#10B981", fontWeight: 600, textDecoration: "none" }}>
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}

        {/* ══ STEP 2 ══ */}
        {step === 2 && (
          <>
            <p style={{ fontSize: "14px", color: "#649c8c", marginTop: "12px", marginBottom: "32px" }}>
              Fill in your details to complete your{" "}
              <span style={{ color: "#10B981" }}>
                {selectedRole === "seeker" ? "Service Seeker" : "Professional Expert"}
              </span>{" "}
              account.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "480px", margin: "0 auto" }}>
              {/* Full Name */}
              <div>
                <label className={labelClass} style={{ color: "#10B981" }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <IoPersonOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10 }} />
                  <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputBase} style={inputStyle} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass} style={{ color: "#10B981" }}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <IoMailOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10 }} />
                  <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} style={inputStyle} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={labelClass} style={{ color: "#10B981" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <IoLockClosedOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10 }} />
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputBase} pr-11`} style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, color: "#649c8c", background: "none", border: "none", cursor: "pointer" }}>
                    {showPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={labelClass} style={{ color: "#10B981" }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <IoLockClosedOutline size={18} style={{ color: "#649c8c", position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10 }} />
                  <input type={showConfirm ? "text" : "password"} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputBase} pr-11`} style={inputStyle} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, color: "#649c8c", background: "none", border: "none", cursor: "pointer" }}>
                    {showConfirm ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "999px", fontWeight: 600, fontSize: "14px", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                >
                  <IoArrowBack size={16} /> Back
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "999px", fontWeight: 600, color: "white", fontSize: "14px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 6px 20px rgba(16,185,129,0.35)" }}
                >
                  Create Account <IoArrowForward size={16} />
                </button>
              </div>
            </form>

            <p style={{ textAlign: "center", fontSize: "14px", color: "#649c8c", marginTop: "32px" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#10B981", fontWeight: 600, textDecoration: "none" }}>
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>

      {/* Copyright Footer */}
      <p style={{ position: "absolute", bottom: "24px", fontSize: "12px", color: "rgba(100,156,140,0.6)", textAlign: "center" }}>
        © 2024 ExpertConnect. All rights reserved. Secure Cloud Mentorship.
      </p>
    </div>
  );
}

