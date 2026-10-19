import lockupLight from "@/assets/brand/cnergise-lockup-on-light.svg.asset.json";
import lockupDark from "@/assets/brand/cnergise-lockup-on-dark.svg.asset.json";
import markLight from "@/assets/brand/cnergise-mark-on-light.svg.asset.json";
import markDark from "@/assets/brand/cnergise-mark-on-dark.svg.asset.json";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  mark?: boolean;
  className?: string;
}

export function BrandLogo({ mark = false, className }: BrandLogoProps) {
  const light = mark ? markLight : lockupLight;
  const dark = mark ? markDark : lockupDark;
  return (
    <>
      <img src={light.url} alt="Cnergise" className={cn("block dark:hidden object-contain shrink-0", className)} />
      <img src={dark.url} alt="Cnergise" className={cn("hidden dark:block object-contain shrink-0", className)} />
    </>
  );
}