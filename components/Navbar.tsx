"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IoPersonOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";

// ── Nav links ────────────────────────────────────────────
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse Mentors" },
  { href: "#contact", label: "Contact Us" },
  { href: "#about", label: "About Us" },
];

// ── Logo SVG (reusable) ─────────────────────────────────
function Logo() {
  return (
    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="2.5" />
      <circle cx="7" cy="13" r="2.5" />
      <circle cx="17" cy="13" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <circle cx="7" cy="8" r="1.5" opacity="0.6" />
      <circle cx="17" cy="8" r="1.5" opacity="0.6" />
    </svg>
  );
}

// ── Profile menu button ──────────────────────────────────
function getProfileRoute(role: string | undefined) {
  if (role === "professional") return "/professional";
  if (role === "admin") return "/admin";
  return "/user";
}

// ── Navbar Component ─────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useSession();

  const [menuOpen, setMenuOpen] = useState(false); // mobile drawer
  const [dropdownOpen, setDropdownOpen] = useState(false); // profile dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    // This is an intentional UI reset on navigation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/login");
  };

  const isLoggedIn = !loading && !!profile;

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-emerald-500/15"
      style={{
        background: "rgba(2, 44, 34, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ── Left: Logo + Desktop Links ──────────────── */}
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#10B981" }}
              >
                <Logo />
              </div>
              <span className="hidden text-[18px] font-bold text-white sm:inline">
                Expert<span style={{ color: "#10B981" }}>Connect</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors ${
                    pathname === href
                      ? "text-emerald-400 font-semibold"
                      : "text-white hover:text-emerald-400"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Right: Auth buttons OR User profile ────── */}
          <div className="flex items-center gap-3">
            {loading ? (
              /* Skeleton while checking auth */
              <div className="w-20 h-9 rounded-full bg-white/5 animate-pulse" />
            ) : isLoggedIn ? (
              /* ── Logged-in: avatar + dropdown ── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-3 cursor-pointer bg-transparent border-none outline-none"
                >
                  <span className="hidden sm:block text-white text-sm font-medium text-right max-w-[140px] truncate">
                    {profile.name}
                  </span>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-500/30"
                    style={{ background: "rgba(16, 185, 129, 0.1)" }}
                  >
                    {profile.profile_photo ? (
                      <img
                        src={profile.profile_photo}
                        alt={profile.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <IoPersonOutline
                        size={18}
                        className="text-emerald-400"
                      />
                    )}
                  </div>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl py-1 border border-emerald-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                    style={{
                      background: "rgba(2, 44, 34, 0.95)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                  >
                    <Link
                      href={getProfileRoute(profile.role)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white hover:bg-emerald-500/10 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <IoPersonOutline size={16} className="text-emerald-400" />
                      My Profile
                    </Link>
                    <div className="border-t border-emerald-500/10 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full cursor-pointer bg-transparent border-none"
                    >
                      <IoLogOutOutline size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Not logged in: Sign In / Sign Up ── */
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold text-white border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(28,196,133,0.45), rgba(20,150,100,0.45))",
                    boxShadow:
                      "inset 0 0 0 0.5px rgba(152,255,152,0.25), inset 0 1px 2px rgba(255,255,255,0.35), 0 6px 16px rgba(0,0,0,0.25)",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 text-white cursor-pointer bg-transparent border-none"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <IoCloseOutline size={24} />
              ) : (
                <IoMenuOutline size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden border-t border-emerald-500/15"
          style={{
            background: "rgba(2, 44, 34, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block px-4 py-3 rounded-lg text-sm transition-colors ${
                  pathname === href
                    ? "text-emerald-400 font-semibold bg-emerald-500/10"
                    : "text-white hover:bg-emerald-500/10"
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Mobile auth actions */}
            {!loading && !isLoggedIn && (
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-emerald-500/15">
                <Link
                  href="/login"
                  className="block text-center px-4 py-3 rounded-full text-sm font-semibold text-white border border-emerald-500/30"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block text-center px-4 py-3 rounded-full text-sm font-semibold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(28,196,133,0.45), rgba(20,150,100,0.45))",
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {!loading && isLoggedIn && (
              <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-emerald-500/15">
                <Link
                  href={getProfileRoute(profile?.role)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm text-white hover:bg-emerald-500/10 transition-colors"
                >
                  <IoPersonOutline size={16} className="text-emerald-400" />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full cursor-pointer bg-transparent border-none text-left"
                >
                  <IoLogOutOutline size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
