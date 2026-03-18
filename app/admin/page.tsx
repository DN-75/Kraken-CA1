"use client";

import React, { useState } from "react";

/* ── Mock Data ──────────────────────────────────── */
const ALL_REGISTRATION_REQUESTS = [
  {
    id: 1,
    name: "Dr. Julian Vane",
    title: "Senior AI Research Scientist",
    image: "/images/expert-1.jpg",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    title: "FinTech Strategy Consultant",
    image: "/images/expert-2.jpg",
  },
  {
    id: 3,
    name: "Marcus Thorne",
    title: "Cybersecurity Lead Architect",
    image: "/images/expert-3.jpg",
  },
  {
    id: 4,
    name: "Elena Rodriguez",
    title: "Sustainable Energy Engineer",
    image: "/images/expert-4.jpg",
  },
  {
    id: 5,
    name: "Dr. Kenji Sato",
    title: "Biomedical Ethics Specialist",
    image: "/images/expert-5.jpg",
  },
  {
    id: 6,
    name: "Alex Chen",
    title: "Cloud Architecture Expert",
    image: "/images/expert-6.jpg",
  },
  {
    id: 7,
    name: "Lisa Anderson",
    title: "Product Strategy Lead",
    image: "/images/expert-7.jpg",
  },
];

function RequestCard({ request }: any) {
  return (
    <div className="bg-[rgba(6,60,40,0.5)] border border-[rgba(16,185,129,0.15)] rounded-xl p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-all duration-300 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        <img
          src={request.image}
          alt={request.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/30 flex-shrink-0"
        />
        <div>
          <h3 className="text-lg font-semibold text-white">{request.name}</h3>
          <p className="text-emerald-400 text-sm">{request.title}</p>
        </div>
      </div>
      <button style={{ fontFamily: "Inter, Helvetica, sans-serif" }} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-1 text-sm rounded-2xl transition-colors duration-300 whitespace-nowrap ml-4">
        REVIEW
      </button>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
export default function AdminPage() {
  const [visibleCount, setVisibleCount] = useState(5);

  const visibleRequests = ALL_REGISTRATION_REQUESTS.slice(0, visibleCount);
  const hasMore = visibleCount < ALL_REGISTRATION_REQUESTS.length;

  const handleShowMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + 3, ALL_REGISTRATION_REQUESTS.length)
    );
  };

  return (
    <main className="min-h-screen bg-[#021C14] text-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* ═══ Title ════════════════════════════════╗ */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">
            Expert Registration{" "}
            <span className="text-emerald-400">Requests</span>
          </h1>
        </div>

        {/* ═══ Registration Requests ═════════════════ */}
        <div className="space-y-4">
          {visibleRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>

        {/* ═══ Show More Button ══════════════════════ */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleShowMore}
              style={{ fontFamily: "Inter, Helvetica, sans-serif" }}
              className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 font-semibold px-6 py-2 text-sm rounded-2xl transition-all duration-300"
            >
              SHOW MORE
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
