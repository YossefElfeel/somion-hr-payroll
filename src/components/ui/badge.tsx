import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  bg?: string;
  text?: string;
  ring?: string;
}

export function Badge({
  className,
  bg = "bg-slate-100",
  text = "text-slate-700",
  ring,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        bg,
        text,
        ring && `ring-1 ring-inset ${ring}`,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
