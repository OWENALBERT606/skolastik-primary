"use client";

import { Loader2, Lock, Mail } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { LoginProps } from "@/types/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import TextInput from "../FormInputs/TextInput";
import PasswordInput from "../FormInputs/PasswordInput";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    reset,
  } = useForm<LoginProps>();

  const router = useRouter();

  const identifier  = watch("identifier", "");
  const idUpper     = identifier.toUpperCase();
  const isTeacherId = idUpper.startsWith("TCH");
  const isStaffId   = idUpper.startsWith("STF");
  const isEmail     = identifier.includes("@");
  const isNonAdmin  = identifier.length > 0 && !isEmail;

  const fieldLabel = isEmail
    ? "Email Address"
    : isTeacherId
    ? "Teacher ID"
    : isStaffId
    ? "Staff ID"
    : "ID / Email / Admission No";

  async function onSubmit(data: LoginProps) {
    try {
      setLoading(true);
      setAuthErr("");

      const result = await signIn("credentials", {
        identifier: data.identifier.trim(),
        password:   data.password,
        redirect:   false,
      });

      if (result?.error) {
        setLoading(false);
        toast.error("Invalid credentials");
        setAuthErr("Wrong credentials. Please try again.");
        return;
      }

      reset();
      toast.success("Welcome back!");

      const res = await fetch("/api/auth/redirect");
      const { redirectUrl } = await res.json();
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Network error — please try again");
    }
  }

  return (
    <div className="w-full">
      {/* heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Enter your credentials to access your account
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          register={register}
          errors={errors}
          label={fieldLabel}
          name="identifier"
          icon={Mail}
          placeholder="Email, Staff ID, or Admission No"
        />

        <PasswordInput
          register={register}
          errors={errors}
          label="Password"
          name="password"
          icon={Lock}
          placeholder="Enter your password"
          forgotPasswordLink={isNonAdmin ? undefined : "/forgot-password"}
          contactAdminNote={isNonAdmin}
        />

        {authErr && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm">{authErr}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all
                     bg-[#1e3a6e] hover:bg-[#162d57] active:scale-[0.98]
                     disabled:opacity-60 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 shadow-md shadow-[#1e3a6e]/30"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* hint */}
      <div className="mt-8 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Login guide</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>🔑 Admin → <strong>email</strong></span>
          <span>🧑‍🏫 Teacher → <strong>TCH…</strong></span>
          <span>👤 Staff → <strong>STF…</strong></span>
          <span>🎒 Student → <strong>Admission No</strong></span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Student default password = admission number
        </p>
      </div>

      {/* accent bar */}
      <div
        className="mt-6 h-0.5 rounded-full"
        style={{ background: "linear-gradient(90deg, #1e3a6e, #e8a020, #1e3a6e)" }}
      />
    </div>
  );
}
