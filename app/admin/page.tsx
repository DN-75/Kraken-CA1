"use client";

import React, { useState } from "react";
import {
  IoCheckmarkDoneOutline,
  IoCloseOutline,
  IoPersonAddOutline,
  IoBarChartOutline,
  IoServerOutline,
  IoWarningOutline,
  IoEyeOutline,
  IoTrashOutline,
} from "react-icons/io5";

/* ── Mock Data ──────────────────────────────────── */
const REGISTRATION_REQUESTS = [
  {
    id: 1,
    name: "Dr. Julian Vane",
    title: "Senior AI Research Scientist",
    expertise: "Artificial Intelligence, Machine Learning",
    email: "julian@expertconnect.com",
    status: "pending",
    date: "2026-03-15",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    title: "FinTech Strategy Consultant",
    expertise: "Finance, Technology, Strategy",
    email: "sarah@expertconnect.com",
    status: "pending",
    date: "2026-03-16",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    id: 3,
    name: "Marcus Thorne",
    title: "Cybersecurity Lead Architect",
    expertise: "Cybersecurity, Cloud, Infrastructure",
    email: "marcus@expertconnect.com",
    status: "pending",
    date: "2026-03-17",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    id: 4,
    name: "Elena Rodriguez",
    title: "Sustainable Energy Engineer",
    expertise: "Renewable Energy, Sustainability",
    email: "elena@expertconnect.com",
    status: "approved",
    date: "2026-03-10",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    id: 5,
    name: "Dr. Kenji Sato",
    title: "Biomedical Ethics Specialist",
    expertise: "Healthcare, Ethics, Research",
    email: "kenji@expertconnect.com",
    status: "approved",
    date: "2026-03-12",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
  },
];

const ADMIN_STATS = [
  {
    label: "Total Professionals",
    value: "124",
    icon: <IoPersonAddOutline size={24} />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    label: "Pending Requests",
    value: "3",
    icon: <IoWarningOutline size={24} />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
  },
  {
    label: "Active Bookings",
    value: "45",
    icon: <IoBarChartOutline size={24} />,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    label: "Total Revenue",
    value: "$12,450",
    icon: <IoServerOutline size={24} />,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
];

/* ── Components ─────────────────────────────────── */
function StatCard({ label, value, icon, color, bgColor }: any) {
  return (
    <div className="bg-[rgba(6,60,40,0.5)] border border-[rgba(16,185,129,0.15)] rounded-lg p-6 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300">
      <div className={`${bgColor} w-fit p-3 rounded-lg mb-4`}>
        <div className={color}>{icon}</div>
      </div>
      <p className="text-gray-300 text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
    </div>
  );
}

function RequestCard({ request, onApprove, onReject }: any) {
  const isApproved = request.status === "approved";

  return (
    <div className="bg-[rgba(6,60,40,0.5)] border border-[rgba(16,185,129,0.15)] rounded-xl p-6 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <img
            src={request.image}
            alt={request.name}
            className="w-14 h-14 rounded-full object-cover border border-emerald-500/20"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{request.name}</h3>
            <p className="text-emerald-400 text-sm">{request.title}</p>
            <p className="text-gray-400 text-xs mt-1">{request.expertise}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isApproved
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-yellow-500/20 text-yellow-300"
          }`}
        >
          {isApproved ? "Approved" : "Pending"}
        </span>
      </div>

      <div className="mb-4 pb-4 border-b border-emerald-500/10">
        <p className="text-gray-400 text-xs mb-1">Email</p>
        <p className="text-white text-sm">{request.email}</p>
        <p className="text-gray-500 text-xs mt-2">Applied: {request.date}</p>
      </div>

      <div className="flex gap-2">
        {!isApproved ? (
          <>
            <button
              onClick={() => onApprove(request.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg py-2 transition-colors duration-300 text-sm font-medium"
            >
              <IoCheckmarkDoneOutline size={16} />
              Approve
            </button>
            <button
              onClick={() => onReject(request.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-2 transition-colors duration-300 text-sm font-medium"
            >
              <IoCloseOutline size={16} />
              Reject
            </button>
          </>
        ) : (
          <>
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg py-2 transition-colors duration-300 text-sm font-medium">
              <IoEyeOutline size={16} />
              View Profile
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-2 transition-colors duration-300 text-sm font-medium">
              <IoTrashOutline size={16} />
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
export default function AdminPage() {
  const [requests, setRequests] = useState(REGISTRATION_REQUESTS);

  const handleApprove = (id: number) => {
    setRequests(
      requests.map((req) =>
        req.id === id ? { ...req, status: "approved" } : req
      )
    );
  };

  const handleReject = (id: number) => {
    setRequests(requests.filter((req) => req.id !== id));
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#021C14] text-white">
      {/* ═══ Header ════════════════════════════════║ */}
      <section className="border-b border-emerald-500/10 bg-[rgba(6,60,40,0.3)] backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-400">
                Manage professionals and monitor platform activity
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="text-lg font-semibold text-emerald-400">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats ═════════════════════════════════║ */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {ADMIN_STATS.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* ═══ Registration Requests ═════════════════ */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Expert Registration Requests
            </h2>
            <p className="text-gray-400">
              {pendingCount} pending request{pendingCount !== 1 ? "s" : ""} •{" "}
              {requests.filter((r) => r.status === "approved").length} approved
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>

        {/* ═══ Empty State (if no requests) ═════════ */}
        {requests.length === 0 && (
          <div className="text-center py-16">
            <IoCheckmarkDoneOutline size={48} className="mx-auto text-emerald-400 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">
              All requests processed!
            </h3>
            <p className="text-gray-400">
              There are no pending registration requests at this time.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
