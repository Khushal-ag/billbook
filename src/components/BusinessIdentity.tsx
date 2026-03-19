import { cn } from "@/lib/utils";

interface BusinessIdentityProps {
  name?: string | null;
  logoUrl?: string | null;
  size?: "sm" | "md";
  showName?: boolean;
  className?: string;
  nameClassName?: string;
}

const SIZE_STYLES = {
  sm: {
    container: "gap-2",
    image: "h-8 w-8 rounded-md",
    fallback: "h-8 w-8 rounded-md text-xs",
  },
  md: {
    container: "gap-3",
    image: "h-12 w-auto max-w-[160px] rounded",
    fallback: "h-12 w-12 rounded-md text-sm",
  },
} as const;

function getBusinessInitials(name?: string | null) {
  const value = name?.trim() || "";
  if (!value) return "B";
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return value.slice(0, 2).toUpperCase();
}

export function BusinessIdentity({
  name,
  logoUrl,
  size = "md",
  showName = true,
  className,
  nameClassName,
}: BusinessIdentityProps) {
  const styles = SIZE_STYLES[size];
  const initials = getBusinessInitials(name);

  return (
    <div className={cn("flex items-center", styles.container, className)}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name ? `${name} logo` : "Company logo"}
          className={cn("shrink-0 bg-muted object-contain", styles.image)}
        />
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center bg-primary font-medium text-primary-foreground",
            styles.fallback,
          )}
          aria-hidden
        >
          {initials}
        </div>
      )}
      {showName && name ? <p className={nameClassName}>{name}</p> : null}
    </div>
  );
}
