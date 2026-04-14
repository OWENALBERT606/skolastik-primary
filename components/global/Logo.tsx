import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Logo({
  href = "/",
}: {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image
        src="/logos/Gemini_Generated_Image_3r32d3r32d3r32d3.png"
        width={36}
        height={36}
        alt="Skolastik"
        className="rounded-lg object-contain"
      />
      <span className="font-extrabold text-base tracking-wide leading-none">
        SKOLA<span style={{ color: "#e8a020" }}>STIK</span>
      </span>
    </Link>
  );
}
