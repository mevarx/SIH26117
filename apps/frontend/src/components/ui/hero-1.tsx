"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SocialLink {
  label: string;
  href: string;
}

export interface Hero1Props {
  /** Brand / logo name shown top-left */
  brand?: React.ReactNode;
  /** Main headline — can be a string or JSX */
  headline?: React.ReactNode;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA button href or action */
  ctaHref?: string;
  /** On CTA Click callback */
  onCtaClick?: () => void;
  /** Small description text at the bottom-left */
  description?: string;
  /** Social links rendered at the bottom-right */
  socialLinks?: SocialLink[];
  /** Sign-in / live credibility badge label */
  signInLabel?: string;
  /** Callback for when badge is clicked */
  onSignInClick?: () => void;
  /** Additional wrapper CSS classes */
  className?: string;
}

const DEFAULT_SOCIAL: SocialLink[] = [
  { label: "Problem SIH26117", href: "https://github.com/rav-builds/DEMO-SIH26117" },
  { label: "Architecture Spec", href: "#capabilities" },
  { label: "Zero-Trust Audit", href: "#capabilities" },
];

export default function Hero1({
  brand = "Sovereign AI",
  headline = (
    <>
      Sovereign intelligence for
      <br />
      high-stakes environments.
    </>
  ),
  ctaLabel = "Enter Workbench",
  ctaHref = "#",
  onCtaClick,
  description = "Local reasoning, hybrid document retrieval, and sandboxed code execution\nrunning strictly inside your perimeter with 0 outbound requests, always.",
  socialLinks = DEFAULT_SOCIAL,
  signInLabel = "0 Outbound Leaks",
  onSignInClick,
  className,
}: Hero1Props) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any },
    },
  };

  const backgroundVariants = {
    hidden: { opacity: 0, scale: 1.05 },
    visible: {
      opacity: 0.9,
      scale: 1,
      transition: { duration: 1.2, ease: "easeOut" as any },
    },
  };

  const handleScrollToCapabilities = () => {
    const el = document.getElementById("capabilities");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className={cn(
        "relative w-full min-h-screen flex flex-col justify-between text-white selection:bg-[var(--accent)] selection:text-black",
        className
      )}
      style={{ backgroundColor: "#06060c" }}
    >
      {/* ── Background Grid Image ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={backgroundVariants}
        className="absolute bottom-0 left-0 w-full sm:w-[85%] md:w-[65%] h-[80%] md:h-[75%] pointer-events-none select-none z-0 overflow-hidden"
      >
        <img
          src="https://assets.watermelon.sh/hero-1.avif"
          alt="Geometric structural grid"
          className="absolute inset-0 h-full w-full object-cover object-bottom-left opacity-90"
        />
        {/* Radial fade — edges blend into the dark bg */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 20% 80%, transparent 40%, #06060c 85%)",
          }}
        />
      </motion.div>

      {/* ── Clean Minimal Top Header (Unwanted Navbar Removed) ── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 lg:px-20"
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-1 group select-none">
          {typeof brand === "string" ? (
            <span className="relative text-white font-semibold text-lg tracking-tight select-none">
              {brand}
              <span className="absolute -top-1 -right-2 text-xs text-[var(--accent)] select-none">
                •
              </span>
            </span>
          ) : (
            brand
          )}
        </div>

        {/* Live Credibility Status Badge */}
        {signInLabel && (
          <button
            type="button"
            onClick={onSignInClick || onCtaClick}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 text-white/90 text-xs sm:text-sm font-medium bg-white/5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.06)] transition-all duration-300 cursor-pointer select-none"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--status-ok)] animate-pulse" />
            <span>{signInLabel}</span>
          </button>
        )}
      </motion.header>

      {/* ── Main Hero Content Area ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex-1 flex flex-col justify-between px-6 pt-10 pb-10 md:px-12 lg:px-20 md:pt-14 md:pb-12"
      >
        {/* Top Section: Headline & CTA Button */}
        <div className="flex flex-col gap-6 md:gap-8 max-w-[850px] mt-[3vh]">
          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-medium leading-[1.08] tracking-[-0.04em] text-white"
          >
            {headline}
          </motion.h1>

          {/* CTA Pill Button with Hover Micro-animations */}
          <motion.div variants={itemVariants} className="w-fit">
            <a
              href={ctaHref}
              onClick={(e) => {
                if (onCtaClick) {
                  e.preventDefault();
                  onCtaClick();
                }
              }}
              className="inline-flex w-fit items-center gap-4 bg-[var(--accent)] text-black font-semibold text-sm p-1.5 pl-5 rounded-lg hover:brightness-110 transition-all duration-300 shadow-[0_4px_24px_rgba(var(--accent-rgb),0.35)] group cursor-pointer"
            >
              <span className="text-sm font-semibold">{ctaLabel}</span>
              <span className="w-8 h-8 rounded-md bg-black flex items-center justify-center shrink-0 overflow-hidden relative">
                <ArrowUpRight className="w-4 h-4 text-white transition-transform duration-300 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[-2px]" />
              </span>
            </a>
          </motion.div>
        </div>

        {/* Bottom Section: Description & Controls */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 lg:gap-10 mt-auto pt-14 w-full relative"
        >
          {/* Left Column: Description paragraph */}
          <div className="max-w-2xl">
            <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed font-normal whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Right Columns: Social Links & Smooth Scroll to Discover Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-6 sm:gap-10 pb-1 w-full lg:w-auto">
            {/* Scroll Indicator Button */}
            <button
              type="button"
              onClick={handleScrollToCapabilities}
              className="flex items-center gap-2.5 text-white/60 hover:text-white text-xs sm:text-sm tracking-wide transition-colors cursor-pointer select-none order-2 sm:order-1"
            >
              <span>Scroll to Discover</span>
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <ArrowDown className="w-4 h-4 text-white/70" strokeWidth={1.5} />
              </motion.span>
            </button>

            {/* Spec Links */}
            <div className="flex items-center gap-6 lg:gap-8 order-1 sm:order-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-white/60 text-xs sm:text-sm hover:text-white transition-colors duration-250 tracking-wide"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
