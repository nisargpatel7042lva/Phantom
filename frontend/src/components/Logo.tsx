import { cn } from "@/lib/utils";

// The PHANTOM diamond mark — outer diamond outline with a solid inner
// diamond, matching the app's favicon (src/app/icon.svg). Rendered as
// inline SVG so it scales crisply and inherits sizing via className.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
    >
      <path
        d="M32 4 L60 32 L32 60 L4 32 Z"
        stroke="#00D4FF"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M32 20 L44 32 L32 44 L20 32 Z" fill="#00D4FF" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "font-sans font-semibold tracking-wide text-phantom-accent",
          textClassName,
        )}
      >
        PHANTOM
      </span>
    </span>
  );
}
