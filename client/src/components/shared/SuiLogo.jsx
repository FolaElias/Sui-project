// Sui water-drop logo — teardrop with S-curve, matching official Sui branding
export default function SuiLogo({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 198 254"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Teardrop — tip at top, semicircle at bottom */}
      <path
        d="M99 6
           C 58 52, 14 106, 14 162
           A 85 85 0 0 0 184 162
           C 184 106, 140 52, 99 6 Z"
        fill="#4DA2FF"
      />
      {/* S-curve white stroke */}
      <path
        d="M136 88
           C 136 62, 116 46, 92 52
           C 68 58, 60 84, 74 106
           C 88 128, 136 126, 138 152
           C 140 176, 118 192, 94 188
           C 70 184, 62 166, 70 150"
        stroke="white"
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
