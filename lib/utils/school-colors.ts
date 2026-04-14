// lib/utils/school-colors.ts
// Shared server-side helper — fetches school brand colors and returns an
// inline <style> string that overrides Tailwind CSS custom properties
// AND remaps hardcoded blue/indigo utility classes to the school palette.

import { db } from "@/prisma/db";

/** Convert a 6-digit hex color to "H S% L%" (CSS hsl custom-property format). */
export function hexToHsl(hex: string): string | null {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Given a primary hex color, derive a full tonal scale (50–950) as HSL strings.
 * Lightness values mirror Tailwind's blue scale pattern.
 */
function buildTonalScale(hex: string): Record<number, string> | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const [hStr, sStr] = hsl.split(" ");
  const h = hStr;
  // Saturation: keep school saturation but clamp for very light/dark shades
  const s = sStr;
  // Lightness steps matching Tailwind blue scale
  const steps: Record<number, number> = {
    50: 97, 100: 93, 200: 86, 300: 74, 400: 60,
    500: 50, 600: 42, 700: 34, 800: 26, 900: 18, 950: 12,
  };
  const scale: Record<number, string> = {};
  for (const [shade, l] of Object.entries(steps)) {
    scale[Number(shade)] = `hsl(${h} ${s} ${l}%)`;
  }
  return scale;
}

/**
 * Generate CSS that remaps Tailwind's hardcoded blue-* and indigo-* utility
 * classes to the school primary color tonal scale.
 * This means bg-blue-600, text-blue-500, border-blue-200 etc. all become
 * the school color automatically — no component changes needed.
 */
function buildColorOverrides(hex: string): string {
  const scale = buildTonalScale(hex);
  if (!scale) return "";

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const prefixes = ["blue", "indigo"];

  const rules: string[] = [];

  for (const prefix of prefixes) {
    for (const shade of shades) {
      const color = scale[shade];
      const darkColor = scale[shade]; // same hue, dark mode handled by lightness

      // bg-*
      rules.push(`.bg-${prefix}-${shade} { background-color: ${color} !important; }`);
      rules.push(`.dark .bg-${prefix}-${shade} { background-color: ${color} !important; }`);
      // text-*
      rules.push(`.text-${prefix}-${shade} { color: ${color} !important; }`);
      rules.push(`.dark .text-${prefix}-${shade} { color: ${color} !important; }`);
      // border-*
      rules.push(`.border-${prefix}-${shade} { border-color: ${color} !important; }`);
      rules.push(`.dark .border-${prefix}-${shade} { border-color: ${color} !important; }`);
      // ring-*
      rules.push(`.ring-${prefix}-${shade} { --tw-ring-color: ${color} !important; }`);
      rules.push(`.dark .ring-${prefix}-${shade} { --tw-ring-color: ${color} !important; }`);
      // from-* / to-* (gradients)
      rules.push(`.from-${prefix}-${shade} { --tw-gradient-from: ${color} !important; }`);
      rules.push(`.to-${prefix}-${shade} { --tw-gradient-to: ${color} !important; }`);
      // hover: variants
      rules.push(`.hover\\:bg-${prefix}-${shade}:hover { background-color: ${color} !important; }`);
      rules.push(`.hover\\:text-${prefix}-${shade}:hover { color: ${color} !important; }`);
      rules.push(`.hover\\:border-${prefix}-${shade}:hover { border-color: ${color} !important; }`);
      // dark:bg-* etc (already covered by .dark .bg-* above)
      // focus:ring-*
      rules.push(`.focus\\:ring-${prefix}-${shade}:focus { --tw-ring-color: ${color} !important; }`);
    }
  }

  return rules.join("\n");
}

/**
 * Fetch primaryColor / accentColor for the given school and return a CSS
 * string ready for <style dangerouslySetInnerHTML>.
 * Returns null when no colors are configured (default theme stays untouched).
 */
export async function getSchoolColorStyle(schoolId: string): Promise<string | null> {
  let primaryColor: string | null = null;
  let accentColor:  string | null = null;

  try {
    const rows = await db.$queryRaw<{ primaryColor: string | null; accentColor: string | null }[]>`
      SELECT "primaryColor", "accentColor" FROM "School" WHERE "id" = ${schoolId} LIMIT 1
    `;
    primaryColor = rows[0]?.primaryColor ?? null;
    accentColor  = rows[0]?.accentColor  ?? null;
  } catch { /* ignore — colors simply won't apply */ }

  if (!primaryColor && !accentColor) return null;

  const primaryHsl = primaryColor ? hexToHsl(primaryColor) : null;
  const accentHsl  = accentColor  ? hexToHsl(accentColor)  : null;

  // Derive tints for secondary surfaces
  const secondaryHsl = primaryHsl
    ? (() => { const [h] = primaryHsl.split(" "); return `${h} 40% 93%`; })()
    : null;
  const secondaryDarkHsl = primaryHsl
    ? (() => { const [h] = primaryHsl.split(" "); return `${h} 30% 16%`; })()
    : null;

  // Remap all hardcoded blue/indigo classes to school primary
  const colorOverrides = primaryColor ? buildColorOverrides(primaryColor) : "";

  return `
    :root {
      ${primaryHsl   ? `--primary: ${primaryHsl}; --ring: ${primaryHsl}; --chart-1: ${primaryHsl};` : ""}
      ${accentHsl    ? `--accent: ${accentHsl}; --chart-2: ${accentHsl};` : ""}
      ${secondaryHsl ? `--secondary: ${secondaryHsl}; --secondary-foreground: ${primaryHsl};` : ""}
    }
    .dark {
      ${primaryHsl       ? `--primary: ${primaryHsl}; --ring: ${primaryHsl}; --chart-1: ${primaryHsl};` : ""}
      ${accentHsl        ? `--accent: ${accentHsl}; --chart-2: ${accentHsl};` : ""}
      ${secondaryDarkHsl ? `--secondary: ${secondaryDarkHsl}; --secondary-foreground: ${primaryHsl};` : ""}
    }
    ${colorOverrides}
  `;
}
