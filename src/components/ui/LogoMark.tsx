/**
 * LogoMark — the Sarrows icon (two opposing chevrons forming an S-flow).
 * Use `size` to control pixel dimensions; defaults to 28.
 */
export default function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2535"/>
          <stop offset="100%" stopColor="#BF000A"/>
        </linearGradient>
        <linearGradient id="lm-shine" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="9" fill="url(#lm-bg)"/>
      {/* Top highlight */}
      <rect width="40" height="40" rx="9" fill="url(#lm-shine)"/>

      {/* Top right-pointing chevron */}
      <polyline
        points="8,10 21,17 8,24"
        stroke="white"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom left-pointing chevron */}
      <polyline
        points="32,17 19,24 32,31"
        stroke="white"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
