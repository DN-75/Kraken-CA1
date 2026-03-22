"use client";

import { AuthProvider } from "@/hooks/useSession";
import { ProfessionalsProvider } from "@/hooks/useProfessionalsContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfessionalAvailabilityNotice from "@/components/ProfessionalAvailabilityNotice";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfessionalsProvider>
        <Navbar />
        <div className="pt-16">
          <ProfessionalAvailabilityNotice />
          {children}
        </div>
        <Footer />
      </ProfessionalsProvider>
    </AuthProvider>
  );
}
