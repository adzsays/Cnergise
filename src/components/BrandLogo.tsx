import { cn } from "@/lib/utils";

interface BrandLogoProps {
  mark?: boolean;
  className?: string;
}

// Single source of truth: the app-icon tile (Ink tile, Paper / Indigo / Mist / Volt quadrants)
// so the in-app logo, favicon and phone icon always share the same colours in every theme.
const Q = "M60 60 L60 12 A24 24 0 0 1 60 60 Z";

function Tile({ x = 0 }: { x?: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect width="64" height="64" rx="14" fill="#0D1017" />
      <g transform="translate(0.8 0.8) scale(0.52)">
        <path d={Q} fill="#F3F1EA" />
        <path d={Q} fill="#7C83FF" transform="rotate(90 60 60)" />
        <path d={Q} fill="#7F8180" transform="rotate(180 60 60)" />
        <path d={Q} fill="#D6FF3D" transform="rotate(270 60 60)" />
      </g>
    </g>
  );
}

export function BrandLogo({ mark = false, className }: BrandLogoProps) {
  if (mark) {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label="Cnergise" className={cn("block shrink-0 w-auto", className)}>
        <Tile />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 300 64" role="img" aria-label="Cnergise" className={cn("block shrink-0 w-auto text-foreground", className)}>
      <Tile />
      <text x="80" y="45" fill="currentColor" fontFamily="Sora, sans-serif" fontWeight="600" fontSize="38" letterSpacing="-1">
        cnergise
      </text>
    </svg>
  );
}
