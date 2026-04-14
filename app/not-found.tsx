import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Skolastik School Solutions",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#eef3fb] to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-4 text-center">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <Image
          src="/logos/Gemini_Generated_Image_3r32d3r32d3r32d3.png"
          alt="Skolastik"
          width={40}
          height={40}
          className="rounded-lg object-contain"
        />
        <span className="font-extrabold text-lg tracking-wide" style={{ color: "#1e3a6e" }}>
          SKOLA<span style={{ color: "#e8a020" }}>STIK</span>
        </span>
      </div>

      {/* 404 number */}
      <div
        className="text-[120px] sm:text-[160px] font-black leading-none select-none"
        style={{ color: "#1e3a6e", opacity: 0.08 }}
        aria-hidden="true"
      >
        404
      </div>

      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 -mt-8"
        style={{ backgroundColor: "#eef3fb" }}
      >
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#1e3a6e" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
        Page not found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-base leading-relaxed">
        Oops — the page you're looking for doesn't exist or may have been moved.
        Let's get you back on track.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#1e3a6e" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go home
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors border"
          style={{ borderColor: "#1e3a6e", color: "#1e3a6e" }}
        >
          Sign in
        </Link>
      </div>

      {/* Help links */}
      <div className="mt-12 flex flex-wrap gap-6 justify-center text-xs text-slate-400 dark:text-slate-500">
        <a href="#features" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Features</a>
        <a href="#contact" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Contact support</a>
        <span>hello@skolastik.com</span>
      </div>
    </div>
  );
}
