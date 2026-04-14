// app/(school)/school/[slug]/settings/appearance/components/appearance-settings-client.tsx
"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Loader2, Save, CheckCircle2, AlertCircle, Palette, RotateCcw,
  Plus, Trash2, Eye, PencilLine, Check,
} from "lucide-react";
import { updateSchoolColors } from "@/actions/school-settings";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ColorPalette = {
  id:      string;
  name:    string;
  primary: string;
  accent:  string;
};

// ════════════════════════════════════════════════════════════════════════════
// BUILT-IN PRESETS
// ════════════════════════════════════════════════════════════════════════════

const PRESETS: ColorPalette[] = [
  { id: "navy-gold",    name: "Navy & Gold",        primary: "#1e3a6e", accent: "#e8a020" },
  { id: "royal-amber",  name: "Royal Blue & Amber",  primary: "#1a56db", accent: "#f59e0b" },
  { id: "forest-gold",  name: "Forest Green & Gold", primary: "#166534", accent: "#ca8a04" },
  { id: "crimson-gold", name: "Crimson & Gold",      primary: "#991b1b", accent: "#d97706" },
  { id: "purple-gold",  name: "Purple & Gold",       primary: "#6b21a8", accent: "#ca8a04" },
  { id: "teal-orange",  name: "Teal & Orange",       primary: "#0f766e", accent: "#ea580c" },
  { id: "slate-blue",   name: "Slate & Blue",        primary: "#334155", accent: "#2563eb" },
  { id: "brown-cream",  name: "Brown & Cream",       primary: "#78350f", accent: "#d4b896" },
];

const STORAGE_KEY = "school_custom_palettes";

// ════════════════════════════════════════════════════════════════════════════
// HSV ↔ HEX HELPERS
// ════════════════════════════════════════════════════════════════════════════

function hexToHsv(hex: string): [number, number, number] {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [0, 0, 100];
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, v * 100];
}

function hsvToHex(h: number, s: number, v: number): string {
  const hh = h / 360, ss = s / 100, vv = v / 100;
  const i = Math.floor(hh * 6), f = hh * 6 - i;
  const p = vv * (1 - ss), q = vv * (1 - f * ss), t = vv * (1 - (1 - f) * ss);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = vv; g = t;  b = p;  break;
    case 1: r = q;  g = vv; b = p;  break;
    case 2: r = p;  g = vv; b = t;  break;
    case 3: r = p;  g = q;  b = vv; break;
    case 4: r = t;  g = p;  b = vv; break;
    case 5: r = vv; g = p;  b = q;  break;
  }
  return "#" + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
}

function contrastColor(hex: string): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return "#ffffff";
  const r = parseInt(m[1].slice(0,2),16);
  const g = parseInt(m[1].slice(2,4),16);
  const b = parseInt(m[1].slice(4,6),16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#1e293b" : "#ffffff";
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR PICKER
// ════════════════════════════════════════════════════════════════════════════

function ColorPickerPanel({ color, onChange }: { color: string; onChange: (hex: string) => void }) {
  // We keep hue in local state so it's preserved when saturation drops to 0
  const [localH, setLocalH] = useState(() => hexToHsv(color)[0]);
  const [hexInput, setHexInput]  = useState(color);
  const gradRef = useRef<HTMLDivElement>(null);
  const hueRef  = useRef<HTMLDivElement>(null);

  // Sync hex input + hue when parent updates color externally
  useEffect(() => {
    setHexInput(color);
    const [h] = hexToHsv(color);
    if (h > 0) setLocalH(h); // only update hue if it's meaningful
  }, [color]);

  const [, s, v] = hexToHsv(color);
  const h = localH;

  function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

  function handleGrad(e: React.PointerEvent) {
    if (!gradRef.current) return;
    const rect = gradRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top)  / rect.height, 0, 1);
    const newHex = hsvToHex(h, x * 100, (1 - y) * 100);
    onChange(newHex);
    setHexInput(newHex);
  }

  function handleHue(e: React.PointerEvent) {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const newH = x * 360;
    setLocalH(newH);
    const newHex = hsvToHex(newH, s, v < 5 ? 80 : v); // lift value if too dark
    onChange(newHex);
    setHexInput(newHex);
  }

  return (
    <div
      className="w-56 bg-[#1c1c1e] rounded-2xl p-3.5 shadow-2xl space-y-3 border border-white/10"
      style={{ userSelect: "none" }}
    >
      {/* Saturation/Value gradient square */}
      <div
        ref={gradRef}
        className="relative rounded-xl overflow-hidden cursor-crosshair"
        style={{
          height: 148,
          background: `
            linear-gradient(to bottom, transparent, black),
            linear-gradient(to right, white, hsl(${h}, 100%, 50%))
          `,
        }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); handleGrad(e); }}
        onPointerMove={e => { if (e.buttons) handleGrad(e); }}
      >
        {/* Crosshair cursor */}
        <div
          className="absolute pointer-events-none rounded-full border-2 border-white"
          style={{
            width: 14, height: 14,
            left: `${s}%`, top: `${100 - v}%`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 4px rgba(0,0,0,0.9)",
            backgroundColor: color,
          }}
        />
      </div>

      {/* Current swatch + Hue slider row */}
      <div className="flex items-center gap-2.5">
        <div
          className="shrink-0 w-8 h-8 rounded-lg border border-white/20"
          style={{ backgroundColor: color }}
        />
        {/* Hue slider */}
        <div
          ref={hueRef}
          className="relative flex-1 rounded-full cursor-pointer"
          style={{
            height: 12,
            background: "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
          }}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); handleHue(e); }}
          onPointerMove={e => { if (e.buttons) handleHue(e); }}
        >
          <div
            className="absolute pointer-events-none rounded-full border-2 border-white"
            style={{
              width: 18, height: 18,
              left: `${(h / 360) * 100}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 3px rgba(0,0,0,0.7)",
              backgroundColor: `hsl(${h}, 100%, 50%)`,
            }}
          />
        </div>
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={hexInput}
        onChange={e => {
          const val = e.target.value;
          setHexInput(val);
          if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
        }}
        maxLength={7}
        spellCheck={false}
        className="w-full bg-[#2c2c2e] text-white text-xs font-mono rounded-lg px-3 py-1.5
                   border border-white/10 focus:outline-none focus:border-white/30 uppercase tracking-widest"
        placeholder="#000000"
      />
    </div>
  );
}

// Popover wrapper — click swatch to open/close, click outside to close
function ColorPickerPopover({
  color, onChange, label, description,
}: {
  color:       string;
  onChange:    (hex: string) => void;
  label:       string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      )}
      {description && (
        <p className="text-xs text-slate-400 mb-2">{description}</p>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-colors bg-white dark:bg-slate-800
                   border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
      >
        <div
          className="w-6 h-6 rounded-md border border-black/10 shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-mono text-slate-700 dark:text-slate-300 uppercase">{color}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <ColorPickerPanel color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PALETTE CARD
// ════════════════════════════════════════════════════════════════════════════

function PaletteCard({
  palette, active, onSelect, onDelete,
}: {
  palette:  ColorPalette;
  active:   boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
        active
          ? "border-blue-500 ring-2 ring-blue-500/30 scale-[1.03]"
          : "border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.03]"
      }`}
      onClick={onSelect}
    >
      <div className="h-12 flex">
        <div className="flex-1" style={{ backgroundColor: palette.primary }} />
        <div className="w-8"   style={{ backgroundColor: palette.accent  }} />
      </div>
      <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-1">
        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight truncate">
          {palette.name}
        </p>
        {onDelete && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-500 transition-all shrink-0"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {active && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

type Props = {
  schoolId:       string;
  schoolName:     string;
  initialPrimary: string | null;
  initialAccent:  string | null;
  slug:           string;
};

export default function AppearanceSettingsClient({
  schoolId, schoolName, initialPrimary, initialAccent, slug,
}: Props) {
  const DEFAULT_PRIMARY = "#1e3a6e";
  const DEFAULT_ACCENT  = "#e8a020";

  const [primary, setPrimary] = useState(initialPrimary ?? DEFAULT_PRIMARY);
  const [accent,  setAccent]  = useState(initialAccent  ?? DEFAULT_ACCENT);

  const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>([]);
  const [showBuilder,    setShowBuilder]    = useState(false);
  const [newName,        setNewName]        = useState("");
  const [newPrimary,     setNewPrimary]     = useState("#1e3a6e");
  const [newAccent,      setNewAccent]      = useState("#e8a020");

  const [isPending, startTransition] = useTransition();
  const [success,   setSuccess]      = useState<string | null>(null);
  const [error,     setError]        = useState<string | null>(null);

  const isDirty = primary !== (initialPrimary ?? DEFAULT_PRIMARY) ||
                  accent  !== (initialAccent  ?? DEFAULT_ACCENT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCustomPalettes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  function saveCustomPalettes(palettes: ColorPalette[]) {
    setCustomPalettes(palettes);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes)); } catch { /* ignore */ }
  }

  function applyPalette(p: ColorPalette) {
    setPrimary(p.primary);
    setAccent(p.accent);
    setSuccess(null);
    setError(null);
  }

  function handleReset() {
    setPrimary(initialPrimary ?? DEFAULT_PRIMARY);
    setAccent(initialAccent  ?? DEFAULT_ACCENT);
    setSuccess(null);
    setError(null);
  }

  function handleSave() {
    setSuccess(null);
    setError(null);
    startTransition(async () => {
      const res = await updateSchoolColors(schoolId, { primaryColor: primary, accentColor: accent }, slug);
      if (res.ok) setSuccess(res.message);
      else setError(res.message);
    });
  }

  function addCustomPalette() {
    if (!newName.trim()) return;
    const palette: ColorPalette = {
      id:      `custom-${Date.now()}`,
      name:    newName.trim(),
      primary: newPrimary,
      accent:  newAccent,
    };
    saveCustomPalettes([...customPalettes, palette]);
    setNewName("");
    setNewPrimary("#1e3a6e");
    setNewAccent("#e8a020");
    setShowBuilder(false);
  }

  function deleteCustomPalette(id: string) {
    saveCustomPalettes(customPalettes.filter(p => p.id !== id));
  }

  const activePaletteId =
    [...PRESETS, ...customPalettes].find(p => p.primary === primary && p.accent === accent)?.id ?? null;

  return (
    <div className="space-y-6">

      {/* ── Live preview banner ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors"
        style={{ backgroundColor: primary, color: contrastColor(primary) }}
      >
        <div>
          <p className="font-bold text-lg">{schoolName}</p>
          <p className="text-sm opacity-75">Live preview of your school colors</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: accent, color: contrastColor(accent) }}
          >
            Accent Button
          </button>
          <Eye className="h-5 w-5 opacity-50" />
        </div>
      </div>

      {/* ── Built-in palettes ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Built-in Palettes</h2>
          <span className="text-xs text-slate-400 ml-1">— click to apply</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map(p => (
            <PaletteCard
              key={p.id}
              palette={p}
              active={activePaletteId === p.id}
              onSelect={() => applyPalette(p)}
            />
          ))}
        </div>
      </div>

      {/* ── My palettes ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PencilLine className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">My Palettes</h2>
            <span className="text-xs text-slate-400 ml-1">— saved on this device</span>
          </div>
          <button
            type="button"
            onClick={() => setShowBuilder(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                       bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400
                       hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create palette
          </button>
        </div>

        {/* ── Create palette form ──────────────────────────────────────── */}
        {showBuilder && (
          <div className="mb-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">New Palette</p>

            {/* Palette name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Palette Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Our School Colors"
                className="w-full max-w-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
                           px-3 py-2 text-sm text-slate-800 dark:text-slate-200
                           focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>

            {/* Color pickers */}
            <div className="flex flex-wrap gap-6">
              <ColorPickerPopover
                color={newPrimary}
                onChange={setNewPrimary}
                label="Primary Color"
              />
              <ColorPickerPopover
                color={newAccent}
                onChange={setNewAccent}
                label="Accent Color"
              />

              {/* Mini live preview */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Preview</label>
                <div
                  className="rounded-xl px-4 py-3 flex items-center gap-3 h-[42px]"
                  style={{ backgroundColor: newPrimary, color: contrastColor(newPrimary) }}
                >
                  <span className="text-sm font-semibold truncate">{newName || "Palette preview"}</span>
                  <span
                    className="ml-auto px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                    style={{ backgroundColor: newAccent, color: contrastColor(newAccent) }}
                  >
                    Accent
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowBuilder(false); setNewName(""); }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCustomPalette}
                disabled={!newName.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Save Palette
              </button>
            </div>
          </div>
        )}

        {/* Saved custom palettes */}
        {customPalettes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {customPalettes.map(p => (
              <PaletteCard
                key={p.id}
                palette={p}
                active={activePaletteId === p.id}
                onSelect={() => applyPalette(p)}
                onDelete={() => deleteCustomPalette(p.id)}
              />
            ))}
          </div>
        ) : !showBuilder ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            No custom palettes yet — create one above.
          </p>
        ) : null}
      </div>

      {/* ── Fine-tune colors ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Fine-tune Colors</h2>
          <p className="text-sm text-slate-500 mt-1">
            Click a swatch to open the color picker. Changes reflect live in the preview above.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ColorPickerPopover
            color={primary}
            onChange={c => { setPrimary(c); setSuccess(null); }}
            label="Primary Color"
            description="Navigation, buttons, headers."
          />
          <ColorPickerPopover
            color={accent}
            onChange={c => { setAccent(c); setSuccess(null); }}
            label="Accent Color"
            description="Highlights, badges, accent elements."
          />
        </div>

        {/* UI element preview */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Element Preview</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: primary, color: contrastColor(primary) }}>
              Primary Button
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border-2"
              style={{ borderColor: primary, color: primary }}>
              Outline
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: accent, color: contrastColor(accent) }}>
              Badge
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ borderColor: accent, color: accent }}>
              Tag
            </span>
            <div className="flex gap-1 ml-auto">
              {[primary, accent, primary + "99", accent + "99"].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
          <span className="text-xs text-green-500 ml-1">Reload the page to see the full effect site-wide.</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty || isPending}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset changes
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50
                     disabled:cursor-not-allowed text-primary-foreground text-sm font-medium rounded-xl transition-colors"
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            : <><Save className="h-4 w-4" />Save Colors</>
          }
        </button>
      </div>
    </div>
  );
}
