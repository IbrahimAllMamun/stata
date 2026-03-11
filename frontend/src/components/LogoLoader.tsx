// src/components/LogoLoader.tsx
interface LogoLoaderProps {
  size?: number;
  className?: string;
}

export default function LogoLoader({
  size = 60,
  className = '',
}: LogoLoaderProps) {

  return (
    <div className={className} style={{ display: 'inline-block', lineHeight: 0 }}>
      <style>{`
        /* ── Icon entry ── */
        @keyframes ll-swirl-orange {
          0%   { opacity: 0; transform-origin: 44px 22px; transform: rotate(-40deg) scale(0.6); }
          30%  { opacity: 1; transform: rotate(6deg) scale(1.04); }
          55%  { transform: rotate(-3deg) scale(0.98); }
          75%  { transform: rotate(1deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes ll-swirl-red {
          0%   { opacity: 0; transform-origin: 44px 72px; transform: rotate(40deg) scale(0.6); }
          30%  { opacity: 1; transform: rotate(-6deg) scale(1.04); }
          55%  { transform: rotate(3deg) scale(0.98); }
          75%  { transform: rotate(-1deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes ll-swirl-teal {
          0%   { opacity: 0; transform-origin: 88px 50px; transform: rotate(60deg) scale(0.6); }
          30%  { opacity: 1; transform: rotate(-8deg) scale(1.06); }
          55%  { transform: rotate(4deg) scale(0.97); }
          75%  { transform: rotate(-2deg) scale(1.01); }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes ll-pop-circle {
          0%   { opacity: 0; transform: scale(0); }
          60%  { transform: scale(1.35); opacity: 1; }
          80%  { transform: scale(0.88); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* ── Text entry: slide in from right + fade ── */
        @keyframes ll-text-in {
          0%   { opacity: 0; transform: translateX(14px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        /* ── Idle pulse (icon only) ── */
        @keyframes ll-pulse-orange {
          0%, 100% { opacity: 1; } 50% { opacity: 1; }
        }
        @keyframes ll-pulse-red {
          0%, 100% { opacity: 1; } 50% { opacity: 1; }
        }
        @keyframes ll-pulse-teal {
          0%, 100% { opacity: 1; } 50% { opacity: 1; }
        }

        .ll-orange-path {
          animation:
            ll-swirl-orange 0.65s cubic-bezier(.22,.68,0,1.2) 0.05s both,
            ll-pulse-orange 2.2s ease-in-out 0.75s infinite;
        }
        .ll-orange-dot {
          animation:
            ll-pop-circle 0.5s cubic-bezier(.22,.68,0,1.3) 0.35s both,
            ll-pulse-orange 2.2s ease-in-out 0.75s infinite;
        }
        .ll-red-path {
          animation:
            ll-swirl-red 0.65s cubic-bezier(.22,.68,0,1.2) 0.18s both,
            ll-pulse-red 2.2s ease-in-out 1s infinite;
        }
        .ll-red-dot {
          animation:
            ll-pop-circle 0.5s cubic-bezier(.22,.68,0,1.3) 0.48s both,
            ll-pulse-red 2.2s ease-in-out 1s infinite;
        }
        .ll-teal-path {
          animation:
            ll-swirl-teal 0.65s cubic-bezier(.22,.68,0,1.2) 0.32s both,
            ll-pulse-teal 2.2s ease-in-out 1.25s infinite;
        }
        .ll-teal-dot {
          animation:
            ll-pop-circle 0.5s cubic-bezier(.22,.68,0,1.3) 0.62s both,
            ll-pulse-teal 2.2s ease-in-out 1.25s infinite;
        }

        /* Text slides in after the last dot pops (~0.75s) */
        .ll-text {
          animation: ll-text-in 0.55s cubic-bezier(.22,.68,0,1.1) 0.72s both;
        }
      `}</style>

      <svg
        width={size * 3}
        height={size}
        viewBox="0 0 286.17 94.75"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Icon - animation identical to standalone LogoLoader ── */}
        <path className="ll-orange-path" fill="#ED7437"
          d="M16.59,36.73s37.56-2.92,55.87-30.8C72.46,5.93,69.05,57.48,16.59,36.73Z" />
        <circle className="ll-orange-dot" fill="#EB6426" cx="47.6" cy="25.8" r="7.65" />

        <path className="ll-red-path" fill="#EE4955"
          d="M71.48,88.82S50.55,57.49,17.28,55.15C17.28,55.15,63.91,32.91,71.48,88.82Z" />
        <circle className="ll-red-dot" fill="#EC2D39" cx="46.77" cy="67.12" r="7.65" />

        <path className="ll-teal-path" fill="#84C8C6"
          d="M88.58,18.68S73,53,88.62,82.48C88.62,82.48,45.11,54.64,88.58,18.68Z" />
        <circle className="ll-teal-dot" fill="#0DADA9" cx="83.21" cy="51.13" r="7.65" />
      </svg>
    </div>
  );
}
