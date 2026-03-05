interface BolkarLogoProps {
  size?: number;
  className?: string;
}

export default function BolkarLogo({ size = 28, className = "" }: BolkarLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Metallic gold gradient — top highlight → mid warm gold → bronze shadow → base reflection */}
        <linearGradient id="blk-g" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fdf0bc" />
          <stop offset="18%"  stopColor="#e8c44e" />
          <stop offset="45%"  stopColor="#c8911f" />
          <stop offset="70%"  stopColor="#7e5208" />
          <stop offset="88%"  stopColor="#a87318" />
          <stop offset="100%" stopColor="#d9a930" />
        </linearGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="44" stroke="url(#blk-g)" strokeWidth="7.5" />

      {/* Waveform bars — symmetric, tallest centre */}
      <rect x="23" y="42" width="5.5" height="16" rx="2.75" fill="url(#blk-g)" />
      <rect x="31" y="37" width="5.5" height="26" rx="2.75" fill="url(#blk-g)" />
      <rect x="39" y="31" width="5.5" height="38" rx="2.75" fill="url(#blk-g)" />
      <rect x="47" y="37" width="5.5" height="26" rx="2.75" fill="url(#blk-g)" />
      <rect x="55" y="42" width="5.5" height="16" rx="2.75" fill="url(#blk-g)" />

      {/* Sound arcs — inner & outer, opening right */}
      <path
        d="M64,42 Q71,50 64,58"
        stroke="url(#blk-g)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M69,35 Q79.5,50 69,65"
        stroke="url(#blk-g)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
