export type MascotMood =
  | 'idle'
  | 'thinking'
  | 'roasting'
  | 'smug'
  | 'shocked'
  | 'celebrating'
  | 'disappointed'
  | 'disgusted'

interface Props {
  mood: MascotMood
  size?: number
}

export function AiMascot({ mood, size = 56 }: Props) {
  return (
    <div
      className={`ai-mascot ai-mascot--${mood}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mascot-bg" x1="8" y1="4" x2="56" y2="60">
            <stop stopColor="#00f5d4" />
            <stop offset="1" stopColor="#ff006e" />
          </linearGradient>
          <linearGradient id="mascot-shine" x1="20" y1="12" x2="44" y2="36">
            <stop stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="4" y="8" width="56" height="48" rx="16" fill="url(#mascot-bg)" />
        <rect x="4" y="8" width="56" height="48" rx="16" fill="url(#mascot-shine)" />
        <rect x="7" y="11" width="50" height="42" rx="14" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        <ellipse className="mascot-eye mascot-eye-l" cx="22" cy="30" rx="5" ry="6" fill="#0f1020" />
        <ellipse className="mascot-eye mascot-eye-r" cx="42" cy="30" rx="5" ry="6" fill="#0f1020" />
        <circle className="mascot-shine-l" cx="24" cy="28" r="1.5" fill="#fff" opacity="0.9" />
        <circle className="mascot-shine-r" cx="44" cy="28" r="1.5" fill="#fff" opacity="0.9" />

        <path className="mascot-mouth mascot-mouth--idle" d="M24 40 Q32 46 40 40" stroke="#0f1020" strokeWidth="2.5" strokeLinecap="round" />
        <path className="mascot-mouth mascot-mouth--thinking" d="M28 41 Q32 39 36 41" stroke="#0f1020" strokeWidth="2.5" strokeLinecap="round" />
        <path className="mascot-mouth mascot-mouth--roasting" d="M22 38 Q32 48 42 38" stroke="#0f1020" strokeWidth="2.5" strokeLinecap="round" />
        <path className="mascot-mouth mascot-mouth--smug" d="M26 42 Q32 38 38 42" stroke="#0f1020" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse className="mascot-mouth mascot-mouth--shocked" cx="32" cy="42" rx="4" ry="5" fill="#0f1020" />
        <path className="mascot-mouth mascot-mouth--celebrating" d="M22 39 Q32 50 42 39" stroke="#0f1020" strokeWidth="2.5" strokeLinecap="round" />
        <path className="mascot-mouth mascot-mouth--disappointed" d="M26 44 Q32 40 38 44" stroke="#0f1020" strokeWidth="2.5" strokeLinecap="round" />
        <line className="mascot-mouth mascot-mouth--disgusted" x1="26" y1="42" x2="38" y2="42" stroke="#0f1020" strokeWidth="2.5" strokeLinecap="round" />

        <line x1="32" y1="8" x2="32" y2="2" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
        <circle className="mascot-antenna-dot" cx="32" cy="2" r="2.5" fill="#22d3ee" />
      </svg>
    </div>
  )
}
