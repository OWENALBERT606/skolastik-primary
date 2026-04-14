"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  BookOpen, BarChart3, Users, FileText, GraduationCap, TrendingUp,
  Check, CheckCircle2, ChevronLeft, ChevronRight, DollarSign,
  Bell, Shield, ArrowRight, Menu, X, Phone, Mail, MapPin, Star, Clock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FadeUp, FadeLeft, FadeRight, ScaleIn, StaggerGrid, StaggerItem,
  HoverLift, SectionTitle, ParallaxSection,
} from "./animations";

// Skolastik brand: navy #1e3a6e, gold #e8a020

const features = [
  {
    icon: GraduationCap, color: "bg-blue-900/10 text-blue-800",
    title: "Student Management",
    desc: "Complete student profiles, enrollment history, health info, and parent contacts — all in one place.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.04.59.jpeg",
    items: ["Admission & enrollment", "Promotion & transfer", "Medical & personal records", "Student portal access"],
  },
  {
    icon: BookOpen, color: "bg-amber-500/10 text-amber-600",
    title: "Academic Management",
    desc: "Manage classes, streams, subjects, timetables, and academic years with full control.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.05.48.jpeg",
    items: ["Classes & streams", "Subject & paper setup", "Academic years & terms", "Bulk promotions"],
  },
  {
    icon: FileText, color: "bg-blue-900/10 text-blue-800",
    title: "Report Card Generation",
    desc: "Auto-generate O-Level and A-Level report cards with divisions, aggregates, positions, and comments.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.06.13.jpeg",
    items: ["O-Level & A-Level formats", "Division & aggregate points", "Class & stream positions", "Bulk PDF generation"],
  },
  {
    icon: CheckCircle2, color: "bg-amber-500/10 text-amber-600",
    title: "Continuous Assessment",
    desc: "Track BOT, MTE, and EOT marks per subject with AOI scoring and full approval workflows.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.06.36.jpeg",
    items: ["BOT / MTE / EOT entry", "AOI topic scoring", "Marks approval workflow", "Grade computation"],
  },
  {
    icon: Shield, color: "bg-blue-900/10 text-blue-800",
    title: "Exams Management",
    desc: "Manage exam schedules, paper configurations, mark entry, and result locking per term.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.07.30.jpeg",
    items: ["Exam scheduling", "Paper & subject config", "Mark entry per teacher", "Result locking & publishing"],
  },
  {
    icon: DollarSign, color: "bg-amber-500/10 text-amber-600",
    title: "Finance Management",
    desc: "Full fee lifecycle — invoicing, payments, receipts, bursaries, and carry-forward balances.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 17.48.19.jpeg",
    items: ["Auto & manual invoicing", "Payment receipts", "Bursary allocations", "Term carry-forward"],
  },
  {
    icon: TrendingUp, color: "bg-blue-900/10 text-blue-800",
    title: "Salary & Payroll",
    desc: "Process staff payroll, manage deductions, allowances, and generate payslips each month.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/modern-dashboard-with-charts-and-reports.png",
    items: ["Monthly payroll batches", "Deductions & allowances", "Payslip generation", "Leave management"],
  },
  {
    icon: BarChart3, color: "bg-amber-500/10 text-amber-600",
    title: "Inventory & Stores",
    desc: "Track school assets, stock levels, vendors, and expense records across departments.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/student-analytics-dashboard-with-graphs.png",
    items: ["Stock management", "Vendor records", "Expense tracking", "Category management"],
  },
  {
    icon: Users, color: "bg-blue-900/10 text-blue-800",
    title: "Timetable Generation",
    desc: "AI-powered timetable generation that avoids clashes and respects teacher availability.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/multi-campus-management-interface.png",
    items: ["Genetic algorithm engine", "Clash-free scheduling", "Per-stream timetables", "PDF export"],
  },
  {
    icon: CheckCircle2, color: "bg-amber-500/10 text-amber-600",
    title: "Student Attendance",
    desc: "Daily student attendance tracking per class and stream with absence reports for parents.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.04.59.jpeg",
    items: ["Daily roll call", "Absence alerts to parents", "Attendance reports", "Term summaries"],
  },
  {
    icon: Users, color: "bg-blue-900/10 text-blue-800",
    title: "Teacher Attendance",
    desc: "Track teacher presence, punctuality, and lesson coverage across all streams and subjects.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.05.48.jpeg",
    items: ["Daily check-in tracking", "Lesson coverage logs", "Absence reports", "HR integration"],
  },
  {
    icon: Bell, color: "bg-amber-500/10 text-amber-600",
    title: "Communication",
    desc: "Send SMS, email, and in-app notifications to parents, students, and staff instantly.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/feature-2.png",
    items: ["SMS & email blasts", "In-app messaging", "Event notifications", "Notice board"],
  },
  {
    icon: GraduationCap, color: "bg-blue-900/10 text-blue-800",
    title: "Teacher Portal",
    desc: "Dedicated portal for teachers to enter marks, view timetables, and manage their subjects.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.06.36.jpeg",
    items: ["Subject mark entry", "Timetable view", "Student lists", "Attendance entry"],
  },
  {
    icon: BookOpen, color: "bg-amber-500/10 text-amber-600",
    title: "DOS Portal",
    desc: "Director of Studies portal for academic oversight, approvals, report cards, and timetables.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 13.07.30.jpeg",
    items: ["Marks approval", "Report card publishing", "Timetable management", "Academic analytics"],
  },
  {
    icon: DollarSign, color: "bg-blue-900/10 text-blue-800",
    title: "Bursar Portal",
    desc: "Dedicated finance portal for bursars to manage fees, invoices, payments, and expenses.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/WhatsApp Image 2026-03-26 at 17.48.19.jpeg",
    items: ["Invoice management", "Payment recording", "Expense tracking", "Financial reports"],
  },
  {
    icon: Users, color: "bg-amber-500/10 text-amber-600",
    title: "Parents Portal",
    desc: "Parents can view their child's results, fee balances, attendance, and receive school updates.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/image.png",
    items: ["Results & report cards", "Fee balance & receipts", "Attendance alerts", "School announcements"],
  },
  {
    icon: GraduationCap, color: "bg-blue-900/10 text-blue-800",
    title: "Students Portal",
    desc: "Students can access their results, timetables, assignments, and school communications.",
    visual: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20",
    image: "/features/student-analytics-dashboard-with-graphs.png",
    items: ["Results & grades", "Timetable access", "School notices", "Profile management"],
  },
  {
    icon: Shield, color: "bg-amber-500/10 text-amber-600",
    title: "Learning Management",
    desc: "Manage learning materials, assignments, and subject-level content delivery to students.",
    visual: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    image: "/features/modern-dashboard-with-charts-and-reports.png",
    items: ["Subject content upload", "Assignment management", "Per-subject teacher view", "Student progress tracking"],
  },
];

const stats = [
  { value: "10,000+", label: "Students managed" },
  { value: "50+",     label: "Schools onboarded" },
  { value: "99.9%",   label: "Uptime SLA" },
  { value: "< 2s",    label: "Average page load" },
];

const testimonials = [
  { name: "Sr. Mary Nakato", role: "Headteacher, St. Joseph's Girls",
    quote: "Skolastik cut our report card processing from 3 days to 2 hours. Parents love getting results on time.", stars: 5 },
  { name: "Mr. David Ssemakula", role: "Director of Studies, Kampala High",
    quote: "The marks approval workflow is exactly what we needed. Teachers submit, I review, results are locked — no more errors.", stars: 5 },
  { name: "Mrs. Grace Apio", role: "Bursar, Gulu Secondary",
    quote: "Fee tracking used to be a nightmare. Now I see every student's balance, invoices, and payment history instantly.", stars: 5 },
];

const AUTOPLAY_MS = 5000;

// ── Hero Slider data ──────────────────────────────────────────────────────────

const heroSlides = [
  {
    image: "/features/WhatsApp Image 2026-03-26 at 13.04.59.jpeg",
    tag: "🎓 School Dashboard",
    title: "Everything your school needs",
    subtitle: "in one place",
    desc: "Real-time overview of academics, fees, staff, and student performance — all on a single dashboard.",
  },
  {
    image: "/features/WhatsApp Image 2026-03-26 at 13.05.48.jpeg",
    tag: "📊 Academic Management",
    title: "Marks, results &",
    subtitle: "report cards — automated",
    desc: "Teachers enter marks, the system computes grades, divisions, and positions. Generate PDF report cards in bulk.",
  },
  {
    image: "/video-clips/2148892566.jpg",
    tag: "💰 Fee Management",
    title: "Full fee lifecycle",
    subtitle: "from invoice to receipt",
    desc: "Auto-invoicing, payment recording, bursaries, installment plans, and real-time balance tracking.",
  },
  {
    image: "/features/WhatsApp Image 2026-03-26 at 13.06.36.jpeg",
    tag: "📅 Timetable Generation",
    title: "AI-powered timetables",
    subtitle: "clash-free in seconds",
    desc: "Genetic algorithm engine generates conflict-free timetables for every stream and exports to PDF.",
  },
  {
    image: "/video-clips/41232.jpg",
    tag: "👥 Multi-Portal Access",
    title: "Dedicated portals",
    subtitle: "for every role",
    desc: "Teacher, DOS, Bursar, Parents, and Students each get their own tailored portal experience.",
  },
  {
    image: "/video-clips/shallow-focus-shot-people-wearing-same-uniform-standing-line.jpg",
    tag: "📈 Analytics & Insights",
    title: "Data-driven decisions",
    subtitle: "for school leaders",
    desc: "Performance trends, fee collection rates, subject pass rates, and teacher workload — all visualised.",
  },
];

// ── Hero Slider Component ─────────────────────────────────────────────────────

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => setCurrent(i => (i + 1) % heroSlides.length), 4500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused]);

  const prev = () => setCurrent(i => (i - 1 + heroSlides.length) % heroSlides.length);
  const next = () => setCurrent(i => (i + 1) % heroSlides.length);
  const slide = heroSlides[current];

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "92vh", minHeight: "560px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {heroSlides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,20,50,0.82) 0%, rgba(10,20,50,0.55) 55%, rgba(10,20,50,0.15) 100%)" }} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <span
              key={`tag-${current}`}
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 animate-fade-in"
              style={{ backgroundColor: "rgba(232,160,32,0.2)", color: "#e8a020", border: "1px solid rgba(232,160,32,0.4)" }}
            >
              {slide.tag}
            </span>
            <h1
              key={`title-${current}`}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white mb-2 animate-fade-in"
            >
              {slide.title}{" "}
              <span style={{ color: "#e8a020" }}>{slide.subtitle}</span>
            </h1>
            <p
              key={`desc-${current}`}
              className="text-lg text-blue-100 max-w-lg leading-relaxed mb-8 animate-fade-in"
            >
              {slide.desc}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg" className="text-white px-8 gap-2 hover:opacity-90 font-semibold" style={{ backgroundColor: "#e8a020", color: "#1e3a6e" }}>
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="px-8 text-white border-white/40 hover:bg-white/10">
                  See features
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width:  i === current ? "24px" : "8px",
              height: "8px",
              backgroundColor: i === current ? "#e8a020" : "rgba(255,255,255,0.5)",
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 right-6 z-20 text-white/60 text-xs font-medium">
        {current + 1} / {heroSlides.length}
      </div>
    </section>
  );
}

// ── Trusted Schools Section ───────────────────────────────────────────────────

type SchoolBadge = { id: string; name: string; logo: string | null; address: string | null };

function TrustedSchoolsSection() {
  const [schools, setSchools] = useState<SchoolBadge[]>([]);

  useEffect(() => {
    fetch("/api/public/schools")
      .then(r => r.json())
      .then(setSchools)
      .catch(() => {});
  }, []);

  if (schools.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50 dark:bg-[#0d1117] border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Trusted by schools across Uganda</p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {schools.length} school{schools.length !== 1 ? "s" : ""} already on board
          </h2>
        </SectionTitle>

        <StaggerGrid className="flex flex-wrap justify-center gap-5">
          {schools.map(school => (
            <StaggerItem key={school.id}>
              <HoverLift>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
                  {school.logo ? (
                    <Image src={school.logo} alt={school.name} width={36} height={36} className="w-9 h-9 rounded-lg object-contain shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: "#1e3a6e" }}>
                      {school.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[160px]">{school.name}</p>
                    {school.address && <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[160px]">{school.address}</p>}
                  </div>
                </div>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

export default function WelcomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contactPending, startContact] = useTransition();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [obForm, setObForm] = useState({ name: "", school: "", email: "", phone: "" });
  const [obLoading, setObLoading] = useState(false);
  const [obDone, setObDone] = useState(false);

  // Show popup after 3s, only if not dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem("ob_popup_dismissed");
    if (dismissed) return;
    const t = setTimeout(() => setShowOnboarding(true), 3000);
    return () => clearTimeout(t);
  }, []);

  function dismissOnboarding() {
    localStorage.setItem("ob_popup_dismissed", "1");
    setShowOnboarding(false);
  }

  async function submitOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setObLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: obForm.name,
          school: obForm.school,
          email: obForm.email,
          phone: obForm.phone,
          subject: "School Onboarding Request",
          message: `New onboarding request from ${obForm.name} at ${obForm.school}.\nEmail: ${obForm.email}\nPhone: ${obForm.phone}`,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setObDone(true);
      localStorage.setItem("ob_popup_dismissed", "1");
    } catch {
      // silent fail — don't block UX
    } finally {
      setObLoading(false);
    }
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => setTestimonialIdx(i => (i + 1) % testimonials.length), AUTOPLAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [testimonialIdx]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">

      {/* ONBOARDING POPUP */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #2a4f96 100%)" }}>
              <button
                onClick={dismissOnboarding}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold tracking-widest text-white/60 uppercase">Skolastik</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "rgba(232,160,32,0.25)", color: "#e8a020" }}>New</span>
              </div>
              <h2 className="text-xl font-extrabold text-white leading-tight">
                Onboard your school today
              </h2>
              <p className="text-sm text-blue-200 mt-1">
                Join 50+ schools already running smarter with Skolastik.
              </p>
            </div>

            <div className="px-6 py-5">
              {obDone ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
                    <CheckCircle2 className="h-7 w-7 text-green-500" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">We'll be in touch!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Thanks for your interest. Our team will reach out within 24 hours.
                  </p>
                  <button
                    onClick={dismissOnboarding}
                    className="mt-2 w-full py-2.5 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#1e3a6e" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={submitOnboarding} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                      <input
                        required
                        value={obForm.name}
                        onChange={e => setObForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="John Ssemakula"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">School Name *</label>
                      <input
                        required
                        value={obForm.school}
                        onChange={e => setObForm(f => ({ ...f, school: e.target.value }))}
                        placeholder="Kampala High School"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={obForm.email}
                      onChange={e => setObForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@school.ug"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                    <input
                      value={obForm.phone}
                      onChange={e => setObForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+256 7XX XXX XXX"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={obLoading}
                    className="w-full py-2.5 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                    style={{ backgroundColor: "#1e3a6e" }}
                  >
                    {obLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Get Started Free <ArrowRight className="h-4 w-4" /></>}
                  </button>

                  <button
                    type="button"
                    onClick={dismissOnboarding}
                    className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
                  >
                    Maybe later
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logos/Gemini_Generated_Image_3r32d3r32d3r32d3.png" alt="Skolastik" width={38} height={38} className="rounded-lg object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-wide" style={{ color: "#1e3a6e" }}>
                SKOLA<span style={{ color: "#e8a020" }}>STIK</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase">School Solutions</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {["Features", "How it works", "Testimonials", "Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-slate-600 dark:text-slate-400 hover:text-[#1e3a6e] dark:hover:text-blue-400 transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/login">
              <Button size="sm" style={{ backgroundColor: "#1e3a6e" }} className="hover:opacity-90 text-white">Get started</Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
            {["Features", "How it works", "Testimonials", "Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-slate-600 dark:text-slate-400 py-1">
                {item}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Sign in</Button></Link>
              <Link href="/login" className="flex-1">
                <Button size="sm" className="w-full text-white" style={{ backgroundColor: "#1e3a6e" }}>Get started</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SLIDER */}
      <HeroSlider />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-24 bg-gradient-to-br from-[#f8f6f0] via-[#eef3fb] to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(30,58,110,0.07)" }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(232,160,32,0.08)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeLeft className="space-y-6">
              <Badge className="px-3 py-1 text-sm border bg-[#eef3fb] dark:bg-blue-950/60 text-[#1e3a6e] dark:text-blue-300 border-[#c5d5ee] dark:border-blue-800">
                🎓 Built for African Schools
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                Run your school{" "}
                <span style={{ color: "#1e3a6e" }} className="dark:text-blue-400">smarter,</span>{" "}
                <span style={{ color: "#e8a020" }}>not harder</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                Skolastik School Solutions is an all-in-one school management platform — academics, fees, staff, report cards, and parent communication in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button size="lg" className="text-white px-8 gap-2 hover:opacity-90" style={{ backgroundColor: "#1e3a6e" }}>
                    Get started free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="px-8 border-[#1e3a6e] text-[#1e3a6e] dark:border-blue-400 dark:text-blue-400 hover:bg-[#eef3fb] dark:hover:bg-blue-950/40">
                    See features
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {["No setup fee", "Free onboarding", "Cancel anytime"].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4" style={{ color: "#e8a020" }} /> {t}
                  </div>
                ))}
              </div>
            </FadeLeft>
            <FadeRight delay={0.15}>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                  <Image src="/features/WhatsApp Image 2026-03-26 at 13.04.59.jpeg" width={720} height={480} className="w-full object-cover" priority alt="skolastik" />
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#eef3fb" }}>
                    <TrendingUp className="h-4 w-4" style={{ color: "#1e3a6e" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Report cards ready</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Generated in seconds</p>
                  </div>
                </motion.div>
              </div>
            </FadeRight>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-10" style={{ backgroundColor: "#1e3a6e" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
            {stats.map(s => (
              <StaggerItem key={s.label}>
                <p className="text-3xl font-extrabold" style={{ color: "#e8a020" }}>{s.value}</p>
                <p className="text-sm text-blue-100 mt-1">{s.label}</p>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* TRUSTED BY SCHOOLS */}
      <TrustedSchoolsSection />

      {/* FEATURES GRID */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle className="text-center mb-14">
            <Badge className="mb-4 border bg-[#eef3fb] dark:bg-blue-950/60 text-[#1e3a6e] dark:text-blue-300 border-[#c5d5ee] dark:border-blue-800">Everything you need</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">One platform, every school need</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From admissions to graduation — Skolastik covers every workflow your school runs daily.
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "#e8a020" }}>{features.length} powerful modules included</p>
          </SectionTitle>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <StaggerItem key={f.title}>
                <HoverLift>
                  <div onClick={() => setActiveFeature(i)}
                    className={`group relative rounded-2xl cursor-pointer border transition-all duration-200 h-full overflow-hidden ${f.visual} ${
                      activeFeature === i ? "shadow-md" : "border-slate-200 dark:border-slate-800"
                    }`}
                    style={activeFeature === i ? { borderColor: "#1e3a6e" } : {}}
                  >
                    {/* Hover image overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <Image
                        src={f.image}
                        alt={f.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-[#1e3a6e]/80" />
                      <div className="absolute inset-0 p-5 flex flex-col justify-end z-10">
                        <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                        <ul className="space-y-1.5">
                          {f.items.map(item => (
                            <li key={item} className="flex items-center gap-2 text-sm text-blue-100">
                              <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "#e8a020" }} /> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Default content */}
                    <div className="relative z-0 p-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                        <f.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{f.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                      <ul className="mt-3 space-y-1">
                        {f.items.map(item => (
                          <li key={item} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <Check className="h-3 w-3 shrink-0" style={{ color: "#e8a020" }} /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeLeft className="space-y-5">
              <Badge className="border bg-[#eef3fb] dark:bg-blue-950/60 text-[#1e3a6e] dark:text-blue-300 border-[#c5d5ee] dark:border-blue-800">Academic Management</Badge>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Marks, results, and report cards — automated</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Teachers enter marks per exam, the system computes totals, grades, divisions, and positions automatically. Approve results with one click and generate PDF report cards in bulk.
              </p>
              <ul className="space-y-2">
                {["BOT, MTE, EOT exam marks", "AOI / continuous assessment", "O-Level & A-Level report cards", "Bulk PDF generation"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#e8a020" }} /> {item}
                  </li>
                ))}
              </ul>
            </FadeLeft>
            <FadeRight delay={0.1}>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                <Image src="/features/image.png" alt="Academic dashboard" width={640} height={400} className="w-full object-cover" />
              </div>
            </FadeRight>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeLeft delay={0.1} className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                <Image src="/features/WhatsApp Image 2026-03-26 at 17.48.19.jpeg" alt="Analytics" width={640} height={400} className="w-full object-cover" />
              </div>
            </FadeLeft>
            <FadeRight className="order-1 lg:order-2 space-y-5">
              <Badge className="border bg-[#fff8ec] dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-[#fcd38a] dark:border-amber-800">Analytics</Badge>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Data-driven decisions for school leaders</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Real-time dashboards show performance trends, fee collection rates, subject pass rates, and teacher workload.
              </p>
              <ul className="space-y-2">
                {["Performance trends by class & stream", "Subject pass/fail rates", "Fee collection overview", "Teacher workload reports"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#e8a020" }} /> {item}
                  </li>
                ))}
              </ul>
            </FadeRight>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle className="text-center mb-12">
            <Badge className="mb-4 border bg-[#eef3fb] dark:bg-blue-950/60 text-[#1e3a6e] dark:text-blue-300 border-[#c5d5ee] dark:border-blue-800">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Trusted by school leaders</h2>
          </SectionTitle>
          <ScaleIn>
            <div className="relative max-w-3xl mx-auto">
              <motion.div
                key={testimonialIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center"
              >
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: testimonials[testimonialIdx].stars }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 italic leading-relaxed mb-6">
                  "{testimonials[testimonialIdx].quote}"
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{testimonials[testimonialIdx].name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{testimonials[testimonialIdx].role}</p>
              </motion.div>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setTestimonialIdx(i)}
                    className="h-2 rounded-full transition-all"
                    style={{ width: i === testimonialIdx ? "16px" : "8px", backgroundColor: i === testimonialIdx ? "#1e3a6e" : "#cbd5e1" }} />
                ))}
                <button onClick={() => setTestimonialIdx(i => (i + 1) % testimonials.length)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* PRICING */}
      {/* <section className="py-24 bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 border" style={{ backgroundColor: "#eef3fb", color: "#1e3a6e", borderColor: "#c5d5ee" }}>Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Start free, scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "Starter", price: "Free", period: "forever", desc: "Perfect for small schools getting started.",
                features: ["Up to 200 students", "Basic academics", "Fee tracking", "Email support"], cta: "Get started", highlight: false },
              { name: "Growth", price: "UGX 150k", period: "/ term", desc: "For growing schools that need more power.",
                features: ["Up to 800 students", "Full academics + report cards", "Fee management", "SMS notifications", "Priority support"], cta: "Start trial", highlight: false },
              { name: "Scale", price: "UGX 300k", period: "/ term", desc: "For large schools with complex needs.",
                features: ["Unlimited students", "Multi-stream support", "Analytics dashboard", "Payroll management", "Dedicated support"], cta: "Start trial", highlight: true },
              { name: "Enterprise", price: "Custom", period: "", desc: "For school networks and multi-campus groups.",
                features: ["Multiple schools", "Custom integrations", "SLA guarantee", "On-site training"], cta: "Contact us", highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-6 border flex flex-col ${
                plan.highlight ? "text-white shadow-xl" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`} style={plan.highlight ? { backgroundColor: "#1e3a6e", borderColor: "#1e3a6e" } : {}}>
                {plan.highlight && (
                  <Badge className="self-start mb-3 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", borderColor: "rgba(255,255,255,0.3)" }}>
                    Most popular
                  </Badge>
                )}
                <h3 className={`font-bold text-lg ${plan.highlight ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>{plan.name}</h3>
                <div className="mt-2 mb-1 flex items-end gap-1">
                  <span className={`text-3xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900 dark:text-slate-100"}`}
                    style={plan.highlight ? { color: "#e8a020" } : {}}>{plan.price}</span>
                  {plan.period && <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-slate-500 dark:text-slate-400"}`}>{plan.period}</span>}
                </div>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-blue-200" : "text-slate-500 dark:text-slate-400"}`}>{plan.desc}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-blue-100" : "text-slate-600 dark:text-slate-400"}`}>
                      <Check className="h-4 w-4 shrink-0" style={{ color: plan.highlight ? "#e8a020" : "#e8a020" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button className="w-full hover:opacity-90" size="sm"
                    style={plan.highlight
                      ? { backgroundColor: "#e8a020", color: "#1e3a6e" }
                      : { backgroundColor: "#1e3a6e", color: "white" }}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* NEWSLETTER */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #162d56 100%)" }}>
        <FadeUp>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Stay in the loop</h2>
            <p className="text-blue-200 mb-8 text-sm">Get product updates, school management tips, and Uganda education news delivered to your inbox.</p>
            <form onSubmit={e => { e.preventDefault(); const el = (e.currentTarget.elements as any).email; if (el?.value) { el.value = ""; toast.success("You're subscribed! We'll keep you in the loop."); } }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input name="email" type="email" required placeholder="Enter your email address"
                className="flex-1 rounded-xl px-4 py-3 text-sm bg-white/10 border border-white/20 text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/30" />
              <button type="submit" className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#e8a020" }}>
                Subscribe
              </button>
            </form>
            <p className="text-blue-400 text-xs mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </FadeUp>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle className="text-center mb-14">
            <Badge className="mb-4 border bg-[#eef3fb] dark:bg-blue-950/60 text-[#1e3a6e] dark:text-blue-300 border-[#c5d5ee] dark:border-blue-800">Contact</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Get in touch</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Have questions about Skolastik? Want a demo for your school? Fill in the form and we'll get back to you within 24 hours.
            </p>
          </SectionTitle>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact form */}
            <FadeLeft>
            <form
              onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const form = e.currentTarget as HTMLFormElement;
                startContact(async () => {
                  try {
                    const res = await fetch("/api/contact", {
                      method:  "POST",
                      headers: { "Content-Type": "application/json" },
                      body:    JSON.stringify({
                        name:    fd.get("name"),
                        school:  fd.get("school"),
                        email:   fd.get("email"),
                        phone:   fd.get("phone"),
                        subject: fd.get("subject"),
                        message: fd.get("message"),
                      }),
                    });
                    if (res.ok) {
                      toast.success("Message sent! We'll get back to you within 24 hours.");
                      form.reset();
                    } else {
                      toast.error("Failed to send message. Please try again or email us directly.");
                    }
                  } catch {
                    toast.error("Something went wrong. Please try again.");
                  }
                });
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-5 shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Full Name *</label>
                  <input required name="name" type="text" placeholder="e.g. John Ssemakula"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--tw-ring-color": "#1e3a6e" } as any} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">School Name</label>
                  <input name="school" type="text" placeholder="e.g. Kampala High School"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email Address *</label>
                  <input required name="email" type="email" placeholder="you@school.ug"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Phone Number</label>
                  <input name="phone" type="tel" placeholder="+256 7XX XXX XXX"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Subject *</label>
                <select required name="subject"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2">
                  <option value="">Select a topic</option>
                  <option>Request a Demo</option>
                  <option>Pricing Enquiry</option>
                  <option>Technical Support</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Message *</label>
                <textarea required name="message" rows={4} placeholder="Tell us about your school and what you need..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-none" />
              </div>
              <button type="submit"
                disabled={contactPending}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#1e3a6e" }}>
                {contactPending ? "Sending..." : <><span>Send Message</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
            </FadeLeft>

            {/* Contact details */}
            <FadeRight delay={0.1}>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Contact Information</h3>
                <div className="space-y-5">
                  {[
                    { icon: Phone, label: "Phone", value: "+256 709 704 128", sub: "Mon–Fri, 8am–6pm EAT" },
                    { icon: Phone, label: "WhatsApp", value: "+256 709 704 128", sub: "Quick support via WhatsApp" },
                    { icon: Mail, label: "Email", value: "maripatechagency@gmail.com", sub: "We reply within 24 hours" },
                    { icon: Mail, label: "Support", value: "support@skolastik.app", sub: "Technical help & onboarding" },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#eef3fb] dark:bg-blue-950/60">
                        <item.icon className="h-5 w-5" style={{ color: "#1e3a6e" }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Follow us</h4>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: "Facebook", href: "#" },
                    { label: "Twitter / X", href: "#" },
                    { label: "LinkedIn", href: "#" },
                    { label: "Instagram", href: "#" },
                    { label: "YouTube", href: "#" },
                  ].map(s => (
                    <a key={s.label} href={s.href}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 transition-colors">
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            </FadeRight>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#0a0f1a] border-t border-slate-200 dark:border-slate-800">
        {/* Main footer grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">

            {/* Brand + contact */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Image src="/logos/Gemini_Generated_Image_3r32d3r32d3r32d3.png" alt="Skolastik" width={32} height={32} className="rounded-lg object-contain" />
                <span className="font-extrabold text-base tracking-wide text-slate-900 dark:text-white">
                  SKOLA<span style={{ color: "#e8a020" }}>STIK</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Uganda's all-in-one school management platform. Built for secondary schools, trusted by educators.
              </p>
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "#1e3a6e" }} /> +256 709 704 128</div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "#1e3a6e" }} /> support@skolastik.app</div>
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "#1e3a6e" }} /> Kampala, Uganda</div>
              </div>
            </div>

            {/* Navigate */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Navigate</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["Home", "Features", "How it works", "Testimonials", "Contact"].map(l => (
                  <li key={l}><a href={l === "Home" ? "#" : `#${l.toLowerCase().replace(/ /g, "-")}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Solution</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["Academic Management", "Fee Management", "Report Cards", "Timetable", "Payroll", "Communication"].map(l => (
                  <li key={l}><a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Portals</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["Teacher Portal", "DOS Portal", "Bursar Portal", "Parents Portal", "Students Portal", "Admin Portal"].map(l => (
                  <li key={l}><a href="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Follow Us</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["Facebook", "Instagram", "LinkedIn", "Twitter / X", "YouTube"].map(l => (
                  <li key={l}><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
            <p>© Copyright <span className="font-semibold" style={{ color: "#1e3a6e" }}>Skolastik.com</span> All rights reserved. {new Date().getFullYear()}</p>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Privacy & Policy</a>
              <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
