import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)] pt-12 px-5 pb-6 bg-[rgba(2,28,20,0.6)]">
      <div className="max-w-[900px] lg:max-xl:max-w-[700px] md:max-lg:max-w-full mx-auto flex flex-wrap max-sm:flex-col max-sm:items-center max-sm:text-center justify-between items-start gap-8">
        <div>
          <h3 className="text-[1.1rem] font-bold text-white mb-1.5">
            Expert<span className="text-[var(--emerald-primary)]">Connect</span>
          </h3>
          <p className="text-[0.8rem] text-white/45 max-w-[220px] max-sm:max-w-full leading-[1.6]">
            Connecting Ambitious people with world class experts
          </p>
        </div>

        <div className="flex flex-wrap gap-6 md:max-lg:gap-4 max-sm:justify-center max-sm:gap-3.5 max-[400px]:flex-col max-[400px]:gap-2.5">
          <Link href="/about" className="text-[0.82rem] text-white/55 no-underline transition-colors duration-200 hover:text-[var(--emerald-primary)]">About Us</Link>
          <Link href="/careers" className="text-[0.82rem] text-white/55 no-underline transition-colors duration-200 hover:text-[var(--emerald-primary)]">Careers</Link>
          <Link href="/privacy" className="text-[0.82rem] text-white/55 no-underline transition-colors duration-200 hover:text-[var(--emerald-primary)]">Privacy Policy</Link>
          <Link href="/terms" className="text-[0.82rem] text-white/55 no-underline transition-colors duration-200 hover:text-[var(--emerald-primary)]">Term and Conditions</Link>
          <Link href="/contact" className="text-[0.82rem] text-white/55 no-underline transition-colors duration-200 hover:text-[var(--emerald-primary)]">Contact Us</Link>
        </div>
      </div>

      <p className="text-center text-[0.75rem] max-sm:text-[0.7rem] text-white/30 mt-10 max-sm:mt-7 pt-5 border-t border-[rgba(16,185,129,0.08)] max-w-[900px] mx-auto">
        2026 Expert Connect all right reserved
      </p>
    </footer>
  );
}
