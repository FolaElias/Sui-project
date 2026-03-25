// SuiVault trademark snow crystal logo
export default function SuiLogo({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00F0FF" />
          <stop offset="50%"  stopColor="#9945FF" />
          <stop offset="100%" stopColor="#FF2EF7" />
        </linearGradient>
        <linearGradient id="crystalGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#4DA2FF" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
      </defs>

      {/* ── 6 main arms (0°, 60°, 120°, 180°, 240°, 300°) ── */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          {/* Main arm shaft */}
          <line x1="50" y1="50" x2="50" y2="8"
            stroke="url(#crystalGrad)" strokeWidth="3" strokeLinecap="round" />

          {/* Upper branch pair — outer */}
          <line x1="50" y1="20" x2="42" y2="13"
            stroke="url(#crystalGrad2)" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="20" x2="58" y2="13"
            stroke="url(#crystalGrad2)" strokeWidth="2" strokeLinecap="round" />

          {/* Lower branch pair — inner */}
          <line x1="50" y1="32" x2="44" y2="26"
            stroke="url(#crystalGrad2)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="50" y1="32" x2="56" y2="26"
            stroke="url(#crystalGrad2)" strokeWidth="1.8" strokeLinecap="round" />

          {/* Tip diamond */}
          <circle cx="50" cy="9" r="2"
            fill="url(#crystalGrad)" opacity="0.9" />
        </g>
      ))}

      {/* ── Inner hex ring (rotated 30°) ── */}
      {[30, 90, 150, 210, 270, 330].map(deg => (
        <g key={`hex-${deg}`} transform={`rotate(${deg} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="38"
            stroke="#4DA2FF" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          {/* Small tick at end */}
          <line x1="46" y1="39" x2="54" y2="39"
            stroke="#00F0FF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        </g>
      ))}

      {/* ── Center hexagon ── */}
      <polygon
        points="50,42 57,46 57,54 50,58 43,54 43,46"
        fill="none"
        stroke="url(#crystalGrad)"
        strokeWidth="1.5"
        opacity="0.8"
      />

      {/* ── Center glow dot ── */}
      <circle cx="50" cy="50" r="4" fill="url(#crystalGrad)" />
      <circle cx="50" cy="50" r="2" fill="white" opacity="0.9" />
    </svg>
  )
}
