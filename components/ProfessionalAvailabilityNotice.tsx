"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/hooks/useSession";

type AvailabilityResponse = {
  slots?: { id: string }[];
  error?: string;
};

export default function ProfessionalAvailabilityNotice() {
  const pathname = usePathname();
  const { profile, loading, isProfessional } = useSession();
  const [checking, setChecking] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (loading || !profile || !isProfessional) {
        setShouldShow(false);
        setChecking(false);
        return;
      }

      setChecking(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setShouldShow(false);
          return;
        }

        const response = await fetch("/api/professional/time-slots", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const result = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          setShouldShow(false);
          return;
        }

        setShouldShow((result.slots?.length ?? 0) === 0);
      } catch {
        setShouldShow(false);
      } finally {
        setChecking(false);
      }
    };

    void checkAvailability();
  }, [loading, profile, isProfessional, pathname]);

  if (checking || !shouldShow) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-2 bg-[rgba(120,53,15,0.94)] border-b border-amber-300/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-100">You have not added any available time slots yet.</p>
          <p className="text-xs text-amber-200/90">Add your availability so users can book sessions.</p>
        </div>
        <Link
          href="/professional?tab=availability#availability-setup"
          className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-amber-100 border border-amber-200/60 hover:bg-amber-200/15 transition-colors"
        >
          Add Availability
        </Link>
      </div>
    </div>
  );
}
