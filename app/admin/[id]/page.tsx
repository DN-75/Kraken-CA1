"use client";

import React, { useState } from "react";
import { IoCheckmarkDone, IoClose } from "react-icons/io5";

/* ── Mock Data ──────────────────────────────────── */
const EXPERT_DATA = {
  id: 1,
  name: "Dr. Sarah Jenkins",
  status: "Expert Review Queue",
  fullName: "Dr. Sarah Jenkins",
  jobTitle: "Senior AI Research Lead",
  employer: "Google LLC",
  nationalId: "ID9*******",
  phone: "+94 00 000 0000",
  expertise: "Artificial Intelligence",
  university: "Stanford University",
  degree: "Ph.D. Computer Science",
  portfolio: "https://portfolio.com",
  linkedin: "linkedin.com/in/username",
  instagram: "instagram.com/username",
  facebook: "facebook.com/username",
  timezone: "Asia/Colombo (UTC+05:30)",
  skills: [
    "Web Development",
    "UI/UX Design",
    "Machine Learning",
    "Python",
    "Data Science",
    "TensorFlow",
    "Cloud Computing",
  ],
  bio: "With over 12 years of experience in artificial intelligence and machine learning, I have led multiple cross-functional teams at top-tier tech companies. My research focuses on neural network optimization and ethical AI frameworks. I'm passionate about mentoring the next generation of engineers and helping scale innovative solutions in the health-tech sector.",
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-emerald-400 text-xs font-semibold mb-2 uppercase tracking-wider">
        {label}
      </p>
      <div className="w-full rounded-full border-none py-3 px-4 text-sm text-white bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] shadow-[inset_0_0px_1.5px_rgba(255,255,255,0.3),inset_0.3px_0.5px_1px_rgba(255,255,255,0.35),0_4px_5px_rgba(0,0,0,0.2)]">
        {value}
      </div>
    </div>
  );
}

export default function ExpertReviewPage() {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  return (
      <div className="max-w-4xl mx-auto">
        {/* ═══ Photo Modal ════════════════════════════╗ */}
        {showPhotoModal && (
          <div
           button
            onClick={() => setShowPhotoModal(true)}
            className="w-20 h-20 rounded-full border-2 border-emerald-500/40 flex items-center justify-center flex-shrink-0 bg-[rgba(16,185,129,0.1)] hover:border-emerald-400/60 hover:bg-[rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/60 flex items-center justify-center group-hover:border-emerald-400/80 transition-colors">
              <svg
                className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </button <IoClose size={24} className="text-white" />
              </button>
            </div>
          </div>
        )}
    <main className="min-h-screen bg-[#021C14] text-white py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* ═══ Header ════════════════════════════════╗ */}
        <div className="bg-[rgba(17,49,39,0.55)] border border-emerald-500/15 rounded-2xl p-8 mb-8 flex items-center gap-6 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)]">
          <div className="w-20 h-20 rounded-full border-2 border-emerald-500/40 flex items-center justify-center flex-shrink-0 bg-[rgba(16,185,129,0.1)]">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/60 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{EXPERT_DATA.name}</h1>
          </div>
        </div>

        {/* ═══ Information Grid ══════════════════════ */}
        <div className="bg-[rgba(17,49,39,0.55)] border border-emerald-500/15 rounded-2xl p-8 mb-8 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)]">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Full Name" value={EXPERT_DATA.fullName} />
            <InfoField label="Current Job Title" value={EXPERT_DATA.jobTitle} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Employer" value={EXPERT_DATA.employer} />
            <InfoField label="National ID" value={EXPERT_DATA.nationalId} />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Phone Number" value={EXPERT_DATA.phone} />
            <InfoField label="Field of Expertise" value={EXPERT_DATA.expertise} />
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="University" value={EXPERT_DATA.university} />
            <InfoField label="Degree" value={EXPERT_DATA.degree} />
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Portfolio Link" value={EXPERT_DATA.portfolio} />
            <InfoField label="LinkedIn" value={EXPERT_DATA.linkedin} />
          </div>

          {/* Row 6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Instagram" value={EXPERT_DATA.instagram} />
            <InfoField label="Facebook" value={EXPERT_DATA.facebook} />
          </div>

          {/* Row 7 */}
          <div className="mb-8">
            <InfoField label="Time Zone" value={EXPERT_DATA.timezone} />
          </div>

          {/* Skills & Technologies */}
          <div>
            <p className="text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-wider">
              Skills & Technologies
            </p>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[rgba(2,44,34,0.45)] to-[rgba(2,34,24,0.35)] p-3.5">
              {EXPERT_DATA.skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-500/[0.08] border border-white/10 rounded-full px-3.5 py-1 text-sm text-white flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="curflex items-center justify-center gap-2 rounded-full border-2 border-red-500/60 bg-red-500/10 hover:bg-red-500/20 px-8 py-3 text-sm font-semibold text-red-400 transition-all duration-300 shadow-[0_4px_15px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)]">
            <IoClose size={18} />
            Reject Application
          </button>
          <button className="flex items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-emerald-400 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.45)] transition-all duration-200 hover:scale-105
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Professional Bio ══════════════════════ */}
        <div className="bg-[rgba(17,49,39,0.55)] border border-emerald-500/15 rounded-2xl p-8 mb-8 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)]">
          <p className="text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-wider">
            Professional Bio
          </p>
          <p className="text-[#649c8c] leading-relaxed italic text-sm">
            "{EXPERT_DATA.bio}"
          </p>
        </div>

        {/* ═══ Action Buttons ════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="border-2 border-white/10 text-white/70 hover:bg-white/[0.06] font-semibold px-8 py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
            <IoClose size={18} />
            Reject Application
          </button>
          <button className="flex items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-emerald-400 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all duration-200">
            <IoCheckmarkDone size={18} />
            Approve Application
          </button>
        </div>
      </div>
    </main>
  );
}
