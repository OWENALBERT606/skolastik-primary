"use client";

// BookLoader — animated open book with flipping pages
// Pure CSS via inline <style> — no external animation libraries needed.
// Usage: <BookLoader /> or <BookLoader label="Loading students…" size="lg" />

type Props = {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
};

const sizes = {
  sm: { book: 48,  page: 22, spine: 4  },
  md: { book: 72,  page: 33, spine: 6  },
  lg: { book: 100, page: 46, spine: 8  },
};

export default function BookLoader({ label, size = "md", fullScreen = false }: Props) {
  const s = sizes[size];

  const wrapper = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center py-12 gap-4";

  return (
    <div className={wrapper} role="status" aria-label={label ?? "Loading…"}>
      <style>{`
        /* ── Book shell ─────────────────────────────────────────── */
        .sl-book {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        /* ── Spine (centre divider) ─────────────────────────────── */
        .sl-spine {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 2px;
          background: #3b82f6;
          z-index: 10;
        }

        /* ── Cover halves ───────────────────────────────────────── */
        .sl-cover-left,
        .sl-cover-right {
          position: absolute;
          bottom: 0;
          border-radius: 3px 0 0 3px;
          background: #1d4ed8;
          transform-origin: right center;
        }
        .sl-cover-right {
          border-radius: 0 3px 3px 0;
          transform-origin: left center;
        }

        /* ── Pages ──────────────────────────────────────────────── */
        .sl-page {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform-origin: left center;
          border-radius: 0 2px 2px 0;
          backface-visibility: hidden;
          animation: sl-flip 1.8s ease-in-out infinite;
        }

        .sl-page:nth-child(1) { animation-delay: 0s;    background: #eff6ff; }
        .sl-page:nth-child(2) { animation-delay: 0.3s;  background: #dbeafe; }
        .sl-page:nth-child(3) { animation-delay: 0.6s;  background: #bfdbfe; }
        .sl-page:nth-child(4) { animation-delay: 0.9s;  background: #93c5fd; }

        @keyframes sl-flip {
          0%   { transform: rotateY(0deg)   scaleX(1); opacity: 1; }
          40%  { transform: rotateY(-160deg) scaleX(1); opacity: 1; }
          50%  { transform: rotateY(-180deg) scaleX(-1); opacity: 0.6; }
          90%  { transform: rotateY(-360deg) scaleX(1); opacity: 1; }
          100% { transform: rotateY(-360deg) scaleX(1); opacity: 1; }
        }

        /* ── Shadow ─────────────────────────────────────────────── */
        .sl-shadow {
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(59,130,246,0.25) 0%, transparent 70%);
          animation: sl-shadow-pulse 1.8s ease-in-out infinite;
        }
        @keyframes sl-shadow-pulse {
          0%, 100% { transform: scaleX(1);   opacity: 0.6; }
          50%       { transform: scaleX(0.7); opacity: 0.3; }
        }

        /* ── Dots ───────────────────────────────────────────────── */
        .sl-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          animation: sl-bounce 1.2s ease-in-out infinite;
        }
        .sl-dot:nth-child(2) { animation-delay: 0.2s; }
        .sl-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes sl-bounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1;   }
        }
      `}</style>

      {/* Book */}
      <div
        className="sl-book"
        style={{ width: s.book, height: s.book * 0.72 }}
      >
        {/* Left cover */}
        <div
          className="sl-cover-left"
          style={{ width: s.book / 2 - s.spine / 2, height: s.book * 0.72, right: "50%", left: "auto" }}
        />
        {/* Right cover */}
        <div
          className="sl-cover-right"
          style={{ width: s.book / 2 - s.spine / 2, height: s.book * 0.72, left: "50%" }}
        />
        {/* Spine */}
        <div className="sl-spine" style={{ width: s.spine, height: s.book * 0.72 }} />

        {/* Flipping pages */}
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="sl-page"
            style={{
              width:  s.page,
              height: s.book * 0.68,
              marginLeft: -s.page,
            }}
          />
        ))}
      </div>

      {/* Shadow under book */}
      <div
        className="sl-shadow"
        style={{ width: s.book * 0.9, height: 8, marginTop: -4 }}
      />

      {/* Bouncing dots */}
      <div className="flex items-center gap-1.5 mt-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="sl-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>

      {/* Label */}
      {label && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 tracking-wide">
          {label}
        </p>
      )}
    </div>
  );
}
