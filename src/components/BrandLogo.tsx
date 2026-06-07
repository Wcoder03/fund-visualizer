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
        <linearGradient id="fundscope-red" x1="45" y1="5" x2="57" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8A6A" />
          <stop offset="1" stopColor="#F43F5E" />
        </linearGradient>
        <filter id="fundscope-shadow" x="7" y="9" width="48" height="39" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="0.6" stdDeviation="0.6" floodColor="#0F172A" floodOpacity="0.1" />
        </filter>
      </defs>

      <rect width="64" height="64" rx="16" fill="url(#fundscope-bg)" />
      <g opacity="0.7" fill="#DBEAFE">
        <circle cx="12" cy="16" r="0.9" />
        <circle cx="19" cy="11" r="0.8" />
        <circle cx="30" cy="8" r="0.9" />
        <circle cx="10" cy="27" r="0.8" />
        <circle cx="35" cy="27" r="0.8" />
        <circle cx="53" cy="25" r="0.8" />
        <circle cx="52" cy="39" r="0.8" />
        <circle cx="34" cy="52" r="0.8" />
        <circle cx="16" cy="50" r="0.8" />
      </g>

      <g filter="url(#fundscope-shadow)">
        <path
          d="M12 43L23.5 30L34.5 34.5L44.5 22L51 12"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="43" r="2.3" fill="white" />
        <circle cx="23.5" cy="30" r="2.6" fill="white" />
        <circle cx="34.5" cy="34.5" r="2.6" fill="white" />
        <circle cx="44.5" cy="22" r="2.6" fill="white" />
      </g>

      <path
        d="M51 5.5L53.7 10.3L59 12.5L53.7 14.7L51 20L48.3 14.7L43 12.5L48.3 10.3L51 5.5Z"
        fill="url(#fundscope-red)"
      />
      <path
        d="M51 8.7L52.4 11.5L55.2 12.5L52.4 13.5L51 16.3L49.6 13.5L46.8 12.5L49.6 11.5L51 8.7Z"
        fill="#FF6B7A"
        opacity="0.95"
      />
    </svg>
  );
}
