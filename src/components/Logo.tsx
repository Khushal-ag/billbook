import { useId } from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export default function Logo({
  className = "h-8 w-8",
  showText = true,
  textClassName = "text-lg font-bold",
}: LogoProps) {
  const uid = useId();
  const gid = `bb-grad-${uid}`;

  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="BillBook Logo"
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>

        {/* Rounded square background */}
        <rect x="4" y="4" width="92" height="92" rx="22" fill={`url(#${gid})`} />

        {/* Document with folded corner */}
        <path d="M28 16 L58 16 L72 30 L72 84 L28 84 Z" fill="white" fillOpacity={0.95} />
        <path d="M58 16 L58 30 L72 30 Z" fill="white" fillOpacity={0.55} />

        {/* Invoice line items */}
        <rect
          x="35"
          y="38"
          width="30"
          height="3"
          rx="1.5"
          fill="hsl(var(--accent))"
          opacity={0.55}
        />
        <rect
          x="35"
          y="47"
          width="21"
          height="3"
          rx="1.5"
          fill="hsl(var(--accent))"
          opacity={0.4}
        />
        <rect
          x="35"
          y="56"
          width="26"
          height="3"
          rx="1.5"
          fill="hsl(var(--accent))"
          opacity={0.4}
        />

        {/* Separator */}
        <line
          x1="35"
          y1="66"
          x2="65"
          y2="66"
          stroke="hsl(var(--accent))"
          strokeWidth={1.5}
          opacity={0.2}
        />

        {/* Total amount */}
        <rect
          x="35"
          y="72"
          width="12"
          height="3"
          rx="1.5"
          fill="hsl(var(--primary))"
          opacity={0.55}
        />
        <rect
          x="55"
          y="72"
          width="10"
          height="3"
          rx="1.5"
          fill="hsl(var(--primary))"
          opacity={0.75}
        />
      </svg>
      {showText && (
        <span className={textClassName}>
          <span className="font-extrabold tracking-tight">Bill</span>
          <span className="font-medium text-muted-foreground">Book</span>
        </span>
      )}
    </div>
  );
}
