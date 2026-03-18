"use client";

import { AuthProvider } from "@/hooks/useSession";
import { ProfessionalsProvider } from "@/hooks/useProfessionalsContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfessionalsProvider>
        <Navbar />
        {children}
        <Footer />
      </ProfessionalsProvider>
    </AuthProvider>
  );
}
