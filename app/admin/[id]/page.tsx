"use client";

import React from "react";
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
      <div className="bg-[rgba(2,28,20,0.8)] border border-emerald-500/20 rounded-lg px-4 py-3 text-white text-sm">
        {value}
      </div>
    </div>
  );
}

export default function ExpertReviewPage() {
  return (
    <main className="min-h-screen bg-[#021C14] text-white py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* ═══ Header ════════════════════════════════╗ */}
        <div className="bg-[rgba(6,60,40,0.5)] border border-emerald-500/20 rounded-2xl p-8 mb-8 flex items-center gap-6">
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
            <h1 className="text-3xl font-bold mb-1">{EXPERT_DATA.name}</h1>
            <p className="text-emerald-400 text-sm">{EXPERT_DATA.status}</p>
          </div>
        </div>

        {/* ═══ Information Grid ══════════════════════ */}
        <div className="bg-[rgba(6,60,40,0.5)] border border-emerald-500/20 rounded-2xl p-8 mb-8">
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
            <div className="flex flex-wrap gap-3">
              {EXPERT_DATA.skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="bg-[rgba(2,28,20,0.8)] border border-emerald-500/20 rounded-full px-4 py-2 text-sm text-white flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
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
        <div className="bg-[rgba(6,60,40,0.5)] border border-emerald-500/20 rounded-2xl p-8 mb-8">
          <p className="text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-wider">
            Professional Bio
          </p>
          <p className="text-gray-300 leading-relaxed italic text-sm">
            "{EXPERT_DATA.bio}"
          </p>
        </div>

        {/* ═══ Action Buttons ════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="border-2 border-red-500 text-red-400 hover:bg-red-500/10 font-semibold px-8 py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
            <IoClose size={18} />
            Reject Application
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2">
            <IoCheckmarkDone size={18} />
            Approve Application
          </button>
        </div>
      </div>
    </main>
  );
}
