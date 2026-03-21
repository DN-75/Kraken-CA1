"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { IoCheckmarkDone, IoClose } from "react-icons/io5";
import { useSession } from "@/hooks/useSession";

interface ProfessionalData {
  id: string;
  name: string;
  profile_photo: string | null;
  bio: string | null;
  time_zone: string;
  job_title: string | null;
  job: string | null;
  field: string | null;
  national_id: string | null;
  phone_number: string | null;
  university: string | null;
  degree: string | null;
  portfolio: string | null;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  status: string;
  skills: string[];
  verify_time_slot: string | null;
}

function InfoField({ label, value }: { label: string; value: string }) {
  const isLink = 
    value.includes("http") || 
    value.includes("linkedin.com") || 
    value.includes("instagram.com") || 
    value.includes("facebook.com");

  const getFullUrl = (val: string) => {
    if (val.includes("http")) return val;
    if (val.includes("linkedin.com")) return `https://${val}`;
    if (val.includes("instagram.com")) return `https://${val}`;
    if (val.includes("facebook.com")) return `https://${val}`;
    return val;
  };

  return (
    <div>
      <p className="text-emerald-400 text-xs font-semibold mb-2 uppercase tracking-wider">
        {label}
      </p>
      {isLink ? (
        <a
          href={getFullUrl(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-full border border-[rgba(16,185,129,0.15)] py-3 px-4 text-sm text-emerald-400 hover:text-emerald-300 bg-[rgba(6,60,40,0.7)] hover:underline transition-colors block"
        >
          {value}
        </a>
      ) : (
        <div className="w-full rounded-full border border-[rgba(16,185,129,0.15)] py-3 px-4 text-sm text-white bg-[rgba(6,60,40,0.7)]">
          {value}
        </div>
      )}
    </div>
  );
}

export default function ExpertReviewPage() {
  const router = useRouter();
  const params = useParams();
  const professionalId = params.id as string;
  
  const { loading, profile, isAdmin } = useSession();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

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

  // Fetch professional data
  useEffect(() => {
    async function fetchProfessionalData() {
      if (!isAdmin || !profile || !professionalId) return;
      
      setFetchLoading(true);
      setFetchError(null);

      try {
        const response = await fetch(`/api/admin/professionals/${professionalId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch professional data');
        }

        const { data } = await response.json();
        setProfessionalData(data);
      } catch (err) {
        console.error('Error fetching professional data:', err);
        setFetchError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setFetchLoading(false);
      }
    }

    if (isAdmin && profile && professionalId) {
      fetchProfessionalData();
    }
  }, [isAdmin, profile, professionalId]);

  // Handle approve/reject actions
  const handleAction = async (action: 'approve' | 'reject') => {
    if (!professionalId) return;

    setActionLoading(action);

    try {
      const response = await fetch(`/api/admin/professionals/${professionalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} professional`);
      }

      // Success - redirect back to admin page
      router.push('/admin');
    } catch (err) {
      console.error(`Error ${action}ing professional:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} professional`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#021C14] text-white py-8 px-6 flex items-center justify-center">
        <p className="text-emerald-300">Checking access...</p>
      </main>
    );
  }

  if (!profile || !isAdmin) {
    return (
      <main className="min-h-screen bg-[#021C14] text-white py-8 px-6 flex items-center justify-center">
        <p className="text-emerald-300">Redirecting...</p>
      </main>
    );
  }

  if (fetchLoading) {
    return (
      <main className="min-h-screen bg-[#021C14] text-white py-8 px-6 flex items-center justify-center">
        <p className="text-emerald-300">Loading professional data...</p>
      </main>
    );
  }

  if (fetchError || !professionalData) {
    return (
      <main className="min-h-screen bg-[#021C14] text-white py-8 px-6 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">Error: {fetchError || 'Professional not found'}</p>
        <button
          onClick={() => router.push('/admin')}
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          Back to Admin
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#021C14] text-white py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* ═══ Photo Modal ════════════════════════════╗ */}
        {showPhotoModal && professionalData.profile_photo && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setShowPhotoModal(false)}
          >
            <div
              className="relative bg-[rgba(17,49,39,0.95)] border border-emerald-500/20 rounded-2xl p-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={professionalData.profile_photo}
                alt={professionalData.name}
                width={640}
                height={640}
                className="w-full h-auto rounded-xl"
              />
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <IoClose size={24} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ Header ════════════════════════════════╗ */}
        <div className="bg-[rgba(6,60,40,0.5)] border border-[rgba(16,185,129,0.15)] rounded-xl p-8 mb-8 flex items-center gap-6">
          <button
            onClick={() => professionalData.profile_photo && setShowPhotoModal(true)}
            className="w-20 h-20 rounded-full border-2 border-emerald-500/40 flex items-center justify-center shrink-0 bg-[rgba(16,185,129,0.1)] hover:border-emerald-400/60 hover:bg-[rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer group overflow-hidden"
          >
              {professionalData.profile_photo ? (
                <Image
                  src={professionalData.profile_photo}
                  alt={professionalData.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
            ) : (
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
            )}
          </button>
          <div>
            <h1 className="text-3xl font-bold">{professionalData.name}</h1>
          </div>
        </div>

        {/* ═══ Information Grid ══════════════════════ */}
        <div className="bg-[rgba(6,60,40,0.5)] border border-[rgba(16,185,129,0.15)] rounded-xl p-8 mb-8">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Full Name" value={professionalData.name} />
            <InfoField label="Current Job Title" value={professionalData.job_title || 'Not provided'} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Employer" value={professionalData.job || 'Not provided'} />
            <InfoField label="National ID" value={professionalData.national_id ? `${professionalData.national_id}`:'Not provided'} />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Phone Number" value={professionalData.phone_number || 'Not provided'} />
            <InfoField label="Field of Expertise" value={professionalData.field || 'Not provided'} />
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="University" value={professionalData.university || 'Not provided'} />
            <InfoField label="Degree" value={professionalData.degree || 'Not provided'} />
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Portfolio Link" value={professionalData.portfolio || 'Not provided'} />
            <InfoField label="LinkedIn" value={professionalData.linkedin || 'Not provided'} />
          </div>

          {/* Row 6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Instagram" value={professionalData.instagram || 'Not provided'} />
            <InfoField label="Facebook" value={professionalData.facebook || 'Not provided'} />
          </div>

          {/* Row 7 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField label="Time Zone" value={professionalData.time_zone} />
            <InfoField label="Preferred Verification Time" value={professionalData.verify_time_slot || 'Not specified'} />
          </div>

          {/* Skills & Technologies */}
          {professionalData.skills.length > 0 && (
            <div>
              <p className="text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-wider">
                Skills & Technologies
              </p>
              <div className="flex flex-wrap gap-2 rounded-xl border border-[rgba(16,185,129,0.15)] bg-[rgba(6,60,40,0.5)] p-3.5">
                {professionalData.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="bg-emerald-500/8 border border-white/10 rounded-full px-3.5 py-1 text-sm text-white flex items-center gap-2"
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
          )}
        </div>

        {/* ═══ Professional Bio ══════════════════════ */}
        {professionalData.bio && (
          <div className="bg-[rgba(6,60,40,0.5)] border border-[rgba(16,185,129,0.15)] rounded-xl p-8 mb-8">
            <p className="text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-wider">
              Professional Bio
            </p>
            <p className="text-[#649c8c] leading-relaxed text-sm">
              "{professionalData.bio}"
            </p>
          </div>
        )}

        {/* ═══ Action Buttons ════════════════════════ */}
        {professionalData.status === 'pending_approval' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => handleAction('reject')}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-red-500/60 bg-red-500/10 hover:bg-red-500/20 px-8 py-3 text-sm font-semibold text-red-400 transition-all duration-300 shadow-[0_4px_15px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'reject' ? (
                <span>Rejecting...</span>
              ) : (
                <>
                  <IoClose size={18} />
                  Reject
                </>
              )}
            </button>
            <button 
              onClick={() => handleAction('approve')}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-2 rounded-full border-0 bg-linear-to-br from-emerald-400 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.45)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'approve' ? (
                <span>Approving...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Approve
                </>
              )}
            </button>
          </div>
        )}

        {/* ═══ Already Processed Message ═════════════ */}
        {professionalData.status !== 'pending_approval' && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-emerald-300 text-lg mb-4">
              This professional has already been <span className="font-semibold">{professionalData.status}</span>
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              Back to Admin
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
