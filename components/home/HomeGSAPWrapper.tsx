"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface HomeGSAPWrapperProps {
  children: React.ReactNode;
}

export default function HomeGSAPWrapper({ children }: HomeGSAPWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // ── 1. Hero Entrance Animations ───────────────────────
    const heroTl = gsap.timeline({
      defaults: { ease: "power4.out", duration: 1.2 }
    });

    // Hero title reveal
    heroTl.from(".gsap-hero-title", {
      y: 60,
      autoAlpha: 0,
      clearProps: "all"
    })
    // Hero description reveal
    .from(".gsap-hero-subtitle", {
      y: 30,
      autoAlpha: 0,
      clearProps: "all"
    }, "-=0.9")
    // Search bar container slide up
    .from(".gsap-hero-search", {
      y: 20,
      autoAlpha: 0,
      clearProps: "all"
    }, "-=0.75")
    // Category links staggered fade
    .from(".gsap-hero-tags > a", {
      y: 15,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.8,
      clearProps: "all"
    }, "-=0.6");

    // Parallax scrolling on Hero Background
    gsap.to(".gsap-hero-bg", {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: ".gsap-hero-section",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // ── 2. Why Choose Section ─────────────────────────────
    gsap.from(".gsap-why-header > *", {
      y: 40,
      autoAlpha: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power3.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: ".gsap-why-section",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    gsap.from(".gsap-why-card", {
      y: 50,
      autoAlpha: 0,
      stagger: 0.15,
      duration: 0.9,
      ease: "power2.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: ".gsap-why-cards-container",
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // ── 3. Meet Top Rated Mentors Section ─────────────────
    gsap.from(".gsap-mentors-header > *", {
      y: 40,
      autoAlpha: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power3.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: ".gsap-mentors-section",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    gsap.from(".gsap-mentor-card", {
      y: 60,
      autoAlpha: 0,
      stagger: 0.18,
      duration: 1,
      ease: "power3.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: ".gsap-mentors-cards-container",
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // ── 4. About Us Section ───────────────────────────────
    gsap.from(".gsap-about-header > *", {
      y: 40,
      autoAlpha: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power3.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: ".gsap-about-section",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    gsap.from(".gsap-about-card", {
      y: 50,
      autoAlpha: 0,
      stagger: 0.12,
      duration: 0.9,
      ease: "power2.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: ".gsap-about-cards-container",
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // ── 5. Contact Us Section ─────────────────────────────
    gsap.from(".gsap-contact-card", {
      scale: 0.96,
      y: 35,
      autoAlpha: 0,
      duration: 1.1,
      ease: "power3.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: ".gsap-contact-section",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

  }, { scope: containerRef });

  return <div ref={containerRef}>{children}</div>;
}
