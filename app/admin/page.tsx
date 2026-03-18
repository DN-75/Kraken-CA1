"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

interface PendingProfessional {
  id: string;
  name: string;
  title: string;
  date: string;
  image: string | null;
}

function RequestCard({ request, onClick }: { request: PendingProfessional; onClick: () => void }) {
  return (
    <div className="bg-[rgba(6,60,40,0.5)] border border-[rgba(16,185,129,0.15)] rounded-xl p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-all duration-300 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        {request.image ? (
          <img
            src={request.image}
            alt={request.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/30 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex-shrink-0 bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-emerald-400"
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
        )}
        <div>
          <h3 className="text-lg font-semibold text-white">{request.name}</h3>
          <p className="text-emerald-400 text-sm">{request.title}</p>
          <p className="text-gray-400 text-xs mt-1">{request.date}</p>
        </div>
      </div>
      <button 
        onClick={onClick}
        className="flex items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 px-6 py-1.5 text-base font-medium text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.45)] transition-all duration-200 hover:scale-105 whitespace-nowrap ml-4"
      >
        Review
      </button>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const { loading, profile, isAdmin } = useSession();
  const [visibleCount, setVisibleCount] = useState(5);
  const [pendingProfessionals, setPendingProfessionals] = useState<PendingProfessional[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.replace("/login");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
    }
  }, [loading, profile, isAdmin, router]);

  // Fetch pending professionals
  useEffect(() => {
    async function fetchPendingProfessionals() {
      if (!isAdmin || !profile) return;
      
      setFetchLoading(true);
      setFetchError(null);

      try {
        const response = await fetch('/api/admin/professionals');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch pending professionals');
        }

        const { data } = await response.json();
        setPendingProfessionals(data);
      } catch (err) {
        console.error('Error fetching pending professionals:', err);
        setFetchError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setFetchLoading(false);
      }
    }

    if (isAdmin && profile) {
      fetchPendingProfessionals();
    }
  }, [isAdmin, profile]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#021C14] text-white py-16 px-6 flex items-center justify-center">
        <p className="text-emerald-300">Checking access...</p>
      </main>
    );
  }

  if (!profile || !isAdmin) {
    return (
      <main className="min-h-screen bg-[#021C14] text-white py-16 px-6 flex items-center justify-center">
        <p className="text-emerald-300">Redirecting...</p>
      </main>
    );
  }

  const visibleRequests = pendingProfessionals.slice(0, visibleCount);
  const hasMore = visibleCount < pendingProfessionals.length;

  const handleShowMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + 3, pendingProfessionals.length)
    );
  };

  const handleReview = (id: string) => {
    router.push(`/admin/${id}`);
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

        {/* ═══ Loading State ═════════════════════════ */}
        {fetchLoading && (
          <div className="flex justify-center py-12">
            <p className="text-emerald-300">Loading pending requests...</p>
          </div>
        )}

        {/* ═══ Error State ═══════════════════════════ */}
        {fetchError && (
          <div className="flex justify-center py-12">
            <p className="text-red-400">Error: {fetchError}</p>
          </div>
        )}

        {/* ═══ Empty State ═══════════════════════════ */}
        {!fetchLoading && !fetchError && pendingProfessionals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-emerald-300 text-lg">No pending registration requests</p>
            <p className="text-gray-400 text-sm mt-2">All professionals have been reviewed</p>
          </div>
        )}

        {/* ═══ Registration Requests ═════════════════ */}
        {!fetchLoading && !fetchError && pendingProfessionals.length > 0 && (
          <div className="space-y-4">
            {visibleRequests.map((request) => (
              <RequestCard 
                key={request.id} 
                request={request} 
                onClick={() => handleReview(request.id)}
              />
            ))}
          </div>
        )}

        {/* ═══ Show More Button ══════════════════════ */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleShowMore}
              style={{ fontFamily: "Inter, Helvetica, sans-serif", fontSize: "16px" }}
              className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 font-semibold px-7 py-2.5 rounded-full transition-all duration-300 flex items-center justify-center"
            >
              Show more
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
