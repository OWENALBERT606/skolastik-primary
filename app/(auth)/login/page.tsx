import type { Metadata } from "next";
import LoginForm from "@/components/Forms/LoginForm";
import { buildMetadata } from "@/lib/seo";
import Image from "next/image";

export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description: "Sign in to your school management account.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — hero image ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/pexels-mickael-ange-konan-2156070331-34526411.jpg"
          alt="School"
          fill
          className="object-cover"
          priority
        />
        {/* dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2044]/80 via-[#1e3a6e]/70 to-[#0f2044]/60" />

        {/* content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* logo */}
          <div className="flex items-center gap-3">
            <Image src="/sckola.png" width={44} height={44} alt="Logo" className="rounded-lg" />
            <span className="text-white font-bold text-xl tracking-tight">Skolastik</span>
          </div>

          {/* tagline */}
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Empowering<br />Primary Education
            </h1>
            <p className="text-blue-200 text-base leading-relaxed max-w-sm">
              A complete school management platform built for Uganda's primary education system.
            </p>

            {/* stats row */}
            <div className="flex gap-8 mt-10">
              {[
                { label: "Schools", value: "50+" },
                { label: "Students", value: "20K+" },
                { label: "Teachers", value: "1K+" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-blue-300 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* bottom quote */}
          <p className="text-blue-300/70 text-xs">
            © {new Date().getFullYear()} Skolastik School Solutions
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-md">
          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <Image src="/sckola.png" width={40} height={40} alt="Logo" className="rounded-lg" />
            <span className="font-bold text-xl text-slate-800 dark:text-white">Skolastik</span>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
