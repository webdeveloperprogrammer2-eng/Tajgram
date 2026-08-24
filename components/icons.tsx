import type { CSSProperties, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ active, ...props }: IconProps & { active?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M3.5 10.2 12 3.4l8.5 6.8V20a1 1 0 0 1-1 1h-4.6v-6.1H9.1V21H4.5a1 1 0 0 1-1-1z"
        fill={active ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.8" cy="10.8" r="7.1" />
      <path d="m16.2 16.2 4.1 4.1" />
    </Svg>
  );
}

export function ReelsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="4.4" />
      <path d="M2.9 8.6h18.2M8.4 2.9 11 8.5M15.2 2.9l2.6 5.6" />
      <path d="m10.6 12.3 4.6 2.6-4.6 2.6z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2c-4.9 0-8.8 3.6-8.8 8 0 2.5 1.2 4.7 3.2 6.2v3.4l3.3-1.8c.7.2 1.5.3 2.3.3 4.9 0 8.8-3.6 8.8-8s-3.9-8.1-8.8-8.1z" />
      <path d="m7.9 12.4 2.6-2.7 2.2 1.7 2.7-2.4-2.4 3.2-2.2-1.7z" />
    </Svg>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12 20.3S3.6 15.5 3.6 9.6c0-2.7 2-4.8 4.6-4.8 1.8 0 3 .9 3.8 2.1.8-1.2 2-2.1 3.8-2.1 2.6 0 4.6 2.1 4.6 4.8 0 5.9-8.4 10.7-8.4 10.7z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function CreateIcon({ active, ...props }: IconProps & { active?: boolean }) {
  return (
    <Svg {...props}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4.2"
        fill={active ? "currentColor" : "none"}
      />
      <path d="M12 8.2v7.6M8.2 12h7.6" stroke={active ? "#fff" : "currentColor"} />
    </Svg>
  );
}

export function ProfileIcon({ active, ...props }: IconProps & { active?: boolean }) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" fill={active ? "currentColor" : "none"} />
      <circle cx="12" cy="9.7" r="3" stroke={active ? "#fff" : "currentColor"} />
      <path
        d="M6.2 18.6a6.2 6.2 0 0 1 11.6 0"
        stroke={active ? "#fff" : "currentColor"}
      />
    </Svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </Svg>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.7 11.6c0 4.4-3.9 8-8.7 8-1 0-2-.2-2.9-.5l-4.8 2.2 1.5-4.2a7.7 7.7 0 0 1-2.5-5.5c0-4.4 3.9-8 8.7-8s8.7 3.6 8.7 8z" />
    </Svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21.4 3.2 2.9 9.9l6.6 2.6 2.6 6.6z" />
      <path d="m21.4 3.2-11.9 9.3" />
    </Svg>
  );
}

export function BookmarkIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M5.6 3.5h12.8v17.2L12 16.1l-6.4 4.6z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={2.4}>
      <path d="M6 12h.01M12 12h.01M18 12h.01" />
    </Svg>
  );
}

export function EmojiIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.3 14.4a4.6 4.6 0 0 0 7.4 0" />
      <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={2.4} />
    </Svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={0}>
      <path d="M8 5.5 19 12 8 18.5z" fill="currentColor" />
    </Svg>
  );
}

export function SoundIcon({ muted, ...props }: IconProps & { muted?: boolean }) {
  return (
    <Svg {...props}>
      <path d="M4 9.4h3l4-3.4v12l-4-3.4H4z" fill="currentColor" />
      {muted ? (
        <path d="m15 9.5 4.5 5m0-5-4.5 5" />
      ) : (
        <path d="M15.4 8.6a4.6 4.6 0 0 1 0 6.8M18.2 6.4a8 8 0 0 1 0 11.2" />
      )}
    </Svg>
  );
}

/** Круг с галочкой, который «рисуется» при появлении блока «all caught up». */
export function CheckCircleIcon({ size = 96, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="tg-caught-up" x1="0" y1="96" x2="96" y2="0">
          <stop offset="0" stopColor="#f9ce34" />
          <stop offset="0.5" stopColor="#ee2a7b" />
          <stop offset="1" stopColor="#6228d7" />
        </linearGradient>
      </defs>
      <circle
        cx="48"
        cy="48"
        r="44"
        stroke="url(#tg-caught-up)"
        strokeWidth="2.5"
        className="animate-draw"
        style={{ strokeDasharray: 277, "--dash": 277 } as CSSProperties}
      />
      <path
        d="M30 46.5 43 60l24-25"
        stroke="url(#tg-caught-up)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw"
        style={
          {
            strokeDasharray: 55,
            "--dash": 55,
            animationDelay: "0.35s",
          } as CSSProperties
        }
      />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={2.2}>
      <path d="m9.5 5 7 7-7 7" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={2.2}>
      <path d="m14.5 5-7 7 7 7" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.6 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.2 1.3z" />
    </Svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 3.5h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-3" />
      <path d="M10 8.2 6 12l4 3.8M6 12h9" />
    </Svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2" />
      <circle cx="12" cy="12" r="4.6" />
      <path d="M17.3 6.8h.01" strokeWidth={2.6} />
    </Svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </Svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.4" />
      <circle cx="8.6" cy="10" r="1.7" />
      <path d="m3.5 17.5 5-4.6 4.2 3.6 3-2.6 4.8 3.9" />
    </Svg>
  );
}
