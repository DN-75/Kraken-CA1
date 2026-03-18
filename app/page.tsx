"use client";

import Link from "next/link";
import {
  IoSearchOutline,
  IoShieldCheckmarkOutline,
  IoCardOutline,
  IoVideocamOutline,
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoRocketOutline,
  IoPeopleOutline,
} from "react-icons/io5";
import { useProfessionals } from "@/hooks/useProProfiles";
import ProfessionalCard from "@/components/ProfessionalCard";

/* ── Data ─────────────────────────────────────────────── */
const CATEGORIES = [
  "Product Manager",
  "Career Coaches",
  "Software Engineers",
  "Data Scientist",
  "Marketing",
];

const FEATURES = [
  {
    icon: <IoShieldCheckmarkOutline size={22} />,
    title: "Verified Experts",
    desc: "Every Mentor is Automatically & Manually vetted for their expertise and experience. We ensure top-tier guidance from industry leaders.",
  },
  {
    icon: <IoCardOutline size={22} />,
    title: "Secure Payments",
    desc: "Every Mentor is Automatically & Manually vetted for their expertise and experience. We ensure top-tier guidance from industry leaders.",
  },
  {
    icon: <IoVideocamOutline size={22} />,
    title: "Video Consultations",
    desc: "Every Mentor is Automatically & Manually vetted for their expertise and experience. We ensure top-tier guidance from industry leaders.",
  },
];

const ABOUT_HIGHLIGHTS = [
  {
    icon: <IoShieldCheckmarkOutline size={20} />,
    title: "Verified Mentors",
    desc: "Handpicked experts from top industries, rigorously vetted for quality.",
  },
  {
    icon: <IoVideocamOutline size={20} />,
    title: "1-on-1 Sessions",
    desc: "Fast booking for private video consultations tailored to you.",
  },
  {
    icon: <IoRocketOutline size={20} />,
    title: "Career Growth",
    desc: "Guidance matched to your goals, career stage, and ambitions.",
  },
];

const CONTACT_ITEMS = [
  {
    icon: <IoMailOutline size={18} />,
    label: "Email",
    value: "support@expertconnect.com",
  },
  {
    icon: <IoCallOutline size={18} />,
    label: "Phone",
    value: "+94 77 123 4567",
  },
  {
    icon: <IoLocationOutline size={18} />,
    label: "Location",
    value: "Colombo, Sri Lanka",
  },
];

/* ── Page ─────────────────────────────────────────────── */
export default function Home() {
  const { data: professionals, loading, error } = useProfessionals(3);
  console.log(professionals)
  return (
    <main>
      {/* ═══ Hero ═══════════════════════════════════════ */}
      <section className="relative min-h-[600px] md:max-lg:min-h-[520px] max-sm:min-h-[480px] max-[400px]:min-h-[420px] flex flex-col items-center justify-center text-center py-[60px] px-5 pt-[80px] md:max-lg:pt-[70px] md:max-lg:pb-[48px] max-sm:py-[40px] max-sm:px-4 max-sm:pt-[60px] max-[400px]:py-[32px] max-[400px]:px-3 max-[400px]:pt-[48px] overflow-hidden">

        <div
          className="hero-bg absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/images/hero-bg4.png)",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
          }}
        />

        <div className="relative z-[1] max-w-[700px] w-full">
          <h1 className="text-5xl lg:max-xl:text-[2.5rem] md:max-lg:text-[2.2rem] max-sm:text-[2rem] max-[400px]:text-[1.65rem] font-extrabold leading-[1.15] mb-5 text-white">
            1-on-1 Experts Guidance
            <br className="max-sm:hidden" />
            for Your <span className="text-[var(--emerald-primary)]">Growth</span>
          </h1>

          <p className="text-[0.95rem] max-sm:text-[0.88rem] md:max-lg:text-[0.9rem] text-white/65 leading-[1.7] max-w-[520px] md:max-lg:max-w-[420px] max-sm:max-w-full mx-auto mb-8">
            Get personalized advice from verified professionals in top
            industries. Accelerate your career with direct mentorship and
            actionable insights.
          </p>

          {/* Search bar */}
          <div className="flex max-sm:flex-wrap items-center bg-white/[0.08] border border-white/10 rounded-full max-sm:rounded-2xl py-1.5 pl-6 pr-1.5 max-sm:p-3 max-sm:px-4 max-w-[520px] mx-auto mb-6 gap-3 max-sm:gap-2.5 backdrop-blur-[10px]">
            <IoSearchOutline size={20} className="text-white/50 shrink-0 max-sm:hidden" />
            <input
              type="text"
              placeholder="Search By Skill, Industry or Role"
              className="flex-1 max-sm:w-full max-sm:min-w-0 bg-transparent border-none outline-none text-white text-sm font-[inherit] placeholder:text-white/45"
            />
            <button className="bg-[var(--emerald-primary)] hover:bg-[#0ea371] text-white border-none py-2.5 px-6 max-sm:w-full max-sm:text-center max-sm:py-3 max-sm:px-5 rounded-full text-[0.85rem] font-semibold cursor-pointer whitespace-nowrap transition-colors duration-200">
              Find an Expert
            </button>
          </div>

          {/* Category tags */}
          <div className="flex flex-wrap justify-center gap-2.5 max-sm:gap-2 max-[400px]:gap-1.5 mt-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/10 text-white/70 py-2 px-4 max-sm:py-1.5 max-sm:px-3 max-[400px]:py-[5px] max-[400px]:px-2.5 rounded-lg text-[0.8rem] max-sm:text-[0.75rem] max-[400px]:text-[0.7rem] cursor-pointer transition-all duration-200 hover:bg-[rgba(16,185,129,0.12)] hover:border-[rgba(16,185,129,0.3)] hover:text-[var(--emerald-glow)] [&>svg]:opacity-60"
              >
                <IoPersonOutline size={14} />
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Why Choose ═════════════════════════════════ */}
      <section className="py-20 md:max-lg:py-14 max-sm:py-12 px-5 max-sm:px-4 text-center">
        <p className="text-[1.1rem] max-sm:text-base text-white/60 mb-2 font-medium">Why Choose</p>
        <h2 className="text-[2.2rem] lg:max-xl:text-[1.9rem] md:max-lg:text-[1.7rem] max-sm:text-[1.6rem] max-[400px]:text-[1.35rem] font-extrabold text-white mb-2">
          Expert<span className="text-[var(--emerald-primary)]">Connect</span> ?
        </h2>
        <p className="text-sm max-sm:text-[0.85rem] text-white/55 max-w-[520px] mx-auto mb-12 md:max-lg:mb-9 max-sm:mb-7 leading-[1.7]">
          Get personalized advice from verified professionals in top industries.
          Accelerate your career with direct mentorship and actionable insights.
        </p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] max-sm:grid-cols-1 md:max-lg:grid-cols-2 gap-6 md:max-lg:gap-[18px] max-sm:gap-4 max-w-[900px] lg:max-xl:max-w-[700px] md:max-lg:max-w-full max-sm:p-0 md:max-lg:px-2 mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-9 px-7 md:max-lg:p-7 md:max-lg:px-[22px] max-sm:p-6 max-sm:px-5 text-left transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(16,185,129,0.08)]"
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center mb-5 text-[var(--emerald-primary)]">
                {f.icon}
              </div>
              <h3 className="text-[1.05rem] font-bold text-white mb-3">{f.title}</h3>
              <p className="text-[0.85rem] text-white/55 leading-[1.7]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Top Rated Mentors ══════════════════════════ */}
      <section className="py-20 md:max-lg:py-14 max-sm:py-12 px-5 max-sm:px-4">
        <div className="max-w-[900px] mx-auto mb-12 md:max-lg:mb-9 md:max-lg:text-center max-sm:mb-7 max-sm:text-center">
          <h2 className="text-[2rem] md:max-lg:text-[1.7rem] max-sm:text-[1.5rem] max-[400px]:text-[1.3rem] font-extrabold text-white mb-2">
            Meet Top Rated Mentors
          </h2>
          <p className="text-sm text-white/50">
            Book a session with our verified professionals today
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:max-lg:grid-cols-2 max-sm:grid-cols-1 gap-6 md:max-lg:gap-[18px] max-sm:gap-4 max-w-[900px] lg:max-xl:max-w-[700px] md:max-lg:max-w-full max-sm:p-0 md:max-lg:px-2 mx-auto">
          {loading ? (
            // Loading skeleton
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="relative rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse"
                >
                  <div className="w-full h-[200px] bg-white/5" />
                  <div className="p-5 max-sm:p-4">
                    <div className="h-5 w-32 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-24 bg-white/5 rounded mb-2" />
                    <div className="h-3 w-28 bg-white/5 rounded" />
                  </div>
                  <div className="flex items-center justify-between py-3.5 px-5 max-sm:py-3 max-sm:px-4 border-t border-[var(--card-border)]">
                    <div className="h-5 w-16 bg-white/10 rounded" />
                    <div className="h-4 w-20 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </>
          ) : error ? (
            // Error state
            <div className="col-span-full text-center py-8">
              <p className="text-white/50">Unable to load professionals</p>
            </div>
          ) : professionals.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-8">
              <p className="text-white/50">No professionals available yet</p>
            </div>
          ) : (
            // Render professional cards
            professionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))
          )}
        </div>
      </section>

      {/* ═══ About Us ════════════════════════════════════ */}
      <section id="about" className="py-14 md:max-lg:py-10 max-sm:py-9 px-5 max-sm:px-4">
        <div className="text-center mb-8">
          <p className="text-[1.1rem] max-sm:text-base text-white/60 mb-2 font-medium">Who We Are</p>
          <h2 className="text-[2.2rem] lg:max-xl:text-[1.9rem] md:max-lg:text-[1.7rem] max-sm:text-[1.6rem] max-[400px]:text-[1.35rem] font-extrabold text-white mb-2">
            About <span className="text-[var(--emerald-primary)]">Us</span>
          </h2>
          <p className="text-sm text-white/50 mt-1.5 tracking-[0.2px]">
            Bridging ambition with expertise — one conversation at a time.
          </p>
        </div>

        <div className="max-w-[820px] lg:max-xl:max-w-full md:max-lg:max-w-full mx-auto grid grid-cols-3 md:max-lg:grid-cols-2 max-sm:grid-cols-1 gap-3.5 max-sm:gap-3">
          {/* Mission card - large */}
          <div className="col-span-full relative rounded-[18px] border border-[var(--card-border)] bg-gradient-to-br from-[rgba(6,60,40,0.7)] to-[rgba(2,28,20,0.9)] p-7 max-sm:p-[18px] md:max-lg:p-[22px] pb-6 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.8px] text-[var(--emerald-primary)] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-[20px] py-[5px] px-3.5 mb-3.5">
              <IoPeopleOutline size={14} /> Our Mission
            </span>
            <p className="text-[0.88rem] max-sm:text-[0.82rem] leading-[1.75] text-white/[0.72] max-w-[640px]">
              ExpertConnect was built to democratize mentorship. We connect
              ambitious individuals with verified, world-class professionals
              for personalized one-on-one guidance that accelerates careers
              and transforms potential into achievement.
            </p>
          </div>

          {/* Highlight cards */}
          {ABOUT_HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="about-bento-card rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-[22px] px-5 max-sm:p-[18px] max-sm:px-4 transition-all duration-300 relative overflow-hidden hover:border-[rgba(16,185,129,0.35)] hover:-translate-y-[3px]"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.15)] text-[var(--emerald-primary)] mb-3">
                {item.icon}
              </span>
              <h3 className="text-[0.88rem] font-bold text-white mb-1.5">{item.title}</h3>
              <p className="text-[0.78rem] text-white/55 leading-[1.6]">{item.desc}</p>
            </div>
          ))}

          {/* Stats strip */}
          <div className="col-span-full flex flex-wrap items-center justify-center gap-7 md:max-lg:gap-[18px] max-sm:gap-4 rounded-2xl border border-[var(--card-border)] bg-[linear-gradient(90deg,rgba(6,60,40,0.4),rgba(16,185,129,0.06),rgba(6,60,40,0.4))] py-5 px-6 max-sm:p-4">
            <div className="flex flex-col items-center gap-[3px]">
              <span className="text-2xl max-sm:text-xl font-extrabold text-[var(--emerald-primary)] leading-none">500+</span>
              <span className="text-[0.65rem] text-white/45 uppercase tracking-[0.5px]">Verified Experts</span>
            </div>
            <div className="w-px h-[30px] bg-[rgba(16,185,129,0.18)]" />
            <div className="flex flex-col items-center gap-[3px]">
              <span className="text-2xl max-sm:text-xl font-extrabold text-[var(--emerald-primary)] leading-none">10K+</span>
              <span className="text-[0.65rem] text-white/45 uppercase tracking-[0.5px]">Sessions</span>
            </div>
            <div className="w-px h-[30px] bg-[rgba(16,185,129,0.18)]" />
            <div className="flex flex-col items-center gap-[3px]">
              <span className="text-2xl max-sm:text-xl font-extrabold text-[var(--emerald-primary)] leading-none">4.9</span>
              <span className="text-[0.65rem] text-white/45 uppercase tracking-[0.5px]">Avg Rating</span>
            </div>
            <div className="w-px h-[30px] bg-[rgba(16,185,129,0.18)]" />
            <div className="flex flex-col items-center gap-[3px]">
              <span className="text-2xl max-sm:text-xl font-extrabold text-[var(--emerald-primary)] leading-none">98%</span>
              <span className="text-[0.65rem] text-white/45 uppercase tracking-[0.5px]">Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Contact Us ══════════════════════════════════ */}
      <section id="contact" className="py-12 md:max-lg:py-10 max-sm:py-9 px-5 max-sm:px-4">
        <div className="relative max-w-[750px] lg:max-xl:max-w-full md:max-lg:max-w-full mx-auto rounded-[20px] border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-[12px] p-8 px-7 pb-7 max-sm:p-5 max-sm:px-4 md:max-lg:p-6 md:max-lg:px-5 overflow-hidden">
          <div className="absolute -bottom-[50px] -left-[50px] w-[160px] h-[160px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none" />
          <div className="text-center mb-4">
            <p className="text-[1.1rem] max-sm:text-base text-white/60 mb-2 font-medium">Get In Touch</p>
            <h2 className="text-[1.6rem] md:max-lg:text-[1.5rem] max-sm:text-[1.35rem] font-extrabold text-white mb-1.5">
              Contact <span className="text-[var(--emerald-primary)]">Us</span>
            </h2>
            <p className="text-[0.82rem] text-white/60 leading-[1.6] max-w-[400px] mx-auto">
              Have questions or feedback? Reach out and our team will respond
              within 24 hours.
            </p>
          </div>
          <div className="flex md:max-lg:flex-col max-sm:flex-col justify-center gap-2.5 md:max-lg:gap-2 max-sm:gap-2 mb-[18px]">
            {CONTACT_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-[10px] border border-[rgba(16,185,129,0.14)] bg-white/[0.025] py-2 px-3 flex-1 min-w-0 overflow-hidden"
              >
                <span className="w-7 h-7 rounded-lg bg-[rgba(16,185,129,0.12)] text-[var(--emerald-primary)] inline-flex items-center justify-center shrink-0">
                  {item.icon}
                </span>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-[0.62rem] text-white/45 mb-px uppercase tracking-[0.3px]">{item.label}</p>
                  <p className="text-[0.72rem] text-white/85 break-all">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          <form className="grid gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full border border-[rgba(16,185,129,0.18)] bg-white/[0.035] text-white rounded-[10px] py-[9px] px-3 text-[0.8rem] font-[inherit] outline-none transition-all duration-200 focus:border-[rgba(52,211,153,0.7)] focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] placeholder:text-white/[0.38]"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full border border-[rgba(16,185,129,0.18)] bg-white/[0.035] text-white rounded-[10px] py-[9px] px-3 text-[0.8rem] font-[inherit] outline-none transition-all duration-200 focus:border-[rgba(52,211,153,0.7)] focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] placeholder:text-white/[0.38]"
              />
            </div>
            <input
              type="text"
              placeholder="Subject"
              className="w-full border border-[rgba(16,185,129,0.18)] bg-white/[0.035] text-white rounded-[10px] py-[9px] px-3 text-[0.8rem] font-[inherit] outline-none transition-all duration-200 focus:border-[rgba(52,211,153,0.7)] focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] placeholder:text-white/[0.38]"
            />
            <textarea
              placeholder="Your Message"
              rows={3}
              className="w-full border border-[rgba(16,185,129,0.18)] bg-white/[0.035] text-white rounded-[10px] py-[9px] px-3 text-[0.8rem] font-[inherit] outline-none transition-all duration-200 focus:border-[rgba(52,211,153,0.7)] focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] placeholder:text-white/[0.38] min-h-[80px] resize-y"
            />
            <button
              type="submit"
              className="border-none rounded-[10px] py-2.5 px-4 bg-[var(--emerald-primary)] hover:bg-[#0ea371] hover:-translate-y-px text-white font-bold text-[0.8rem] cursor-pointer transition-all duration-200 w-full"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
