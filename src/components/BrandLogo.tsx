interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = 'h-8 w-8' }: BrandLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="基准星 Logo"
      role="img"
    >
      <defs>
        <linearGradient id="fundscope-bg" x1="10" y1="6" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1D4ED8" />
          <stop offset="0.52" stopColor="#2563EB" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="fundscope-red" x1="44" y1="8" x2="55" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
        <filter id="fundscope-shadow" x="7" y="12" width="46" height="37" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="0.8" stdDeviation="0.8" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width="64" height="64" rx="16" fill="url(#fundscope-bg)" />
      <g opacity="0.7" fill="#DBEAFE">
        <circle cx="12" cy="15" r="1" />
        <circle cx="18" cy="10" r="0.8" />
        <circle cx="31" cy="12" r="0.9" />
        <circle cx="52" cy="31" r="0.9" />
        <circle cx="55" cy="40" r="0.8" />
        <circle cx="32" cy="53" r="0.9" />
        <circle cx="15" cy="50" r="0.8" />
        <circle cx="8" cy="31" r="0.8" />
      </g>

      <g filter="url(#fundscope-shadow)">
        <path
          d="M11 44L23 30.5L35 35.5L45.5 20.5L50.5 14.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="44" r="2.5" fill="white" />
        <circle cx="23" cy="30.5" r="2.7" fill="white" />
        <circle cx="35" cy="35.5" r="2.6" fill="white" />
        <circle cx="45.5" cy="20.5" r="2.6" fill="white" />
      </g>

      <path
        d="M49.5 8.5L52.1 14L57.5 16.5L52.1 19L49.5 24.5L46.9 19L41.5 16.5L46.9 14L49.5 8.5Z"
        fill="url(#fundscope-red)"
      />
      <path
        d="M49.5 12.2L50.9 15.1L53.8 16.5L50.9 17.9L49.5 20.8L48.1 17.9L45.2 16.5L48.1 15.1L49.5 12.2Z"
        fill="#F43F5E"
        opacity="0.9"
      />
    </svg>
  );
}
