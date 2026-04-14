"use client";
import { CheckCircle2, Loader2, Mail, ShieldAlert, X } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { ForgotPasswordProps } from "@/types/types";
import toast from "react-hot-toast";
import TextInput from "../FormInputs/TextInput";
import SubmitButton from "../FormInputs/SubmitButton";
import { sendResetLink } from "@/actions/users";
import { Button } from "../ui/button";

// ── Contact-admin popup ───────────────────────────────────────────────────────
function ContactAdminModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(232,160,32,0.12)" }}>
            <ShieldAlert className="h-7 w-7" style={{ color: "#e8a020" }} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Contact Your School Admin
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Password reset via email is only available for school administrators.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Please contact your school admin to have your password reset.
            </p>
          </div>

          <div className="w-full rounded-xl p-3 text-sm text-left space-y-1" style={{ backgroundColor: "rgba(30,58,110,0.06)", border: "1px solid rgba(30,58,110,0.12)" }}>
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide mb-2">This applies to:</p>
            {["Teachers", "Staff members", "Students", "Parents"].map(role => (
              <div key={role} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#e8a020" }} />
                {role}
              </div>
            ))}
          </div>

          <Button
            onClick={onClose}
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: "#1e3a6e" }}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [passErr, setPassErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordProps>();

  const handleResend = async () => {
    setIsResending(true);
    await sendResetLink(email);
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timer); setIsResending(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  async function onSubmit(data: ForgotPasswordProps) {
    try {
      setLoading(true);
      setPassErr("");
      const res = await sendResetLink(data.email);

      if (res.status === 403) {
        // Non-admin account — show the contact-admin popup
        setLoading(false);
        setShowContactAdmin(true);
        return;
      }

      if (res.status === 404) {
        setLoading(false);
        setPassErr(res?.error ?? "No account found with this email.");
        return;
      }

      if (res.status !== 200) {
        setLoading(false);
        setPassErr(res?.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success("Reset instructions sent — check your email");
      setLoading(false);
      setEmail(data.email);
      setSuccess(true);
    } catch (error) {
      setLoading(false);
      console.error("Network Error:", error);
      toast.error("Network error — please try again");
    }
  }

  return (
    <>
      {showContactAdmin && (
        <ContactAdminModal onClose={() => { setShowContactAdmin(false); window.location.href = "/login"; }} />
      )}

      <div className="w-full">
        <div className="rounded-2xl p-8 shadow-2xl border bg-white/50 dark:bg-slate-900/60 border-[rgba(30,58,110,0.15)] dark:border-slate-700 backdrop-blur-sm">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <Image
              src="/sckola.png"
              width={90}
              height={90}
              alt="Skolastik School Solutions"
              className="object-contain rounded-xl"
            />
          </div>

          {success ? (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Check your email</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We&apos;ve sent reset instructions to <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>
                </p>
                <div className="w-full bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3 flex items-start gap-2 text-left">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    The email might take a few minutes. Check your spam folder too.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">Didn&apos;t receive the email?</p>
                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full dark:border-slate-600 dark:text-slate-200"
                >
                  {resendTimer > 0 ? `Resend available in ${resendTimer}s` : "Resend email"}
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full text-sm text-slate-500 dark:text-slate-400">
                    Back to login
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mb-5 text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Forgot Password?</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter your email and we&apos;ll send reset instructions.
                </p>
                <p className="text-xs mt-2" style={{ color: "#e8a020" }}>
                  Only available for school admin accounts.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <TextInput
                  register={register}
                  errors={errors}
                  label="Email Address"
                  name="email"
                  icon={Mail}
                  placeholder="your@email.com"
                />
                {passErr && <p className="text-red-500 text-xs">{passErr}</p>}
                <SubmitButton
                  title="Send Reset Link"
                  loadingTitle="Sending…"
                  loading={loading}
                  className="w-full"
                  loaderIcon={Loader2}
                  showIcon={false}
                />
              </form>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
                Remember your password?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* Bottom accent bar */}
          <div className="mt-6 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #1e3a6e, #e8a020, #1e3a6e)" }} />
        </div>
      </div>
    </>
  );
}
