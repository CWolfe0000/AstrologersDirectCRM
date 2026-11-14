import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "subtle" | "danger" | "link" | "sage" | "dark";
type Size = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-[0_1px_0_rgba(0,0,0,0.05)]",
  secondary: "border border-line bg-surface text-ink hover:bg-canvas-2 hover:border-line-strong",
  ghost: "text-ink hover:bg-canvas-2",
  subtle: "bg-canvas-2 text-ink hover:bg-canvas-3",
  danger: "bg-danger text-white hover:bg-danger/90",
  link: "text-accent hover:text-accent-hover underline-offset-4 hover:underline px-0 h-auto",
  sage: "bg-sage text-white hover:bg-sage-dark",
  dark: "bg-ink text-white hover:bg-ink-2",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
  sm: "h-8 px-3 text-[13px] [&_svg]:size-4",
  md: "h-9 px-4 text-sm [&_svg]:size-4",
  lg: "h-11 px-5 text-[15px] [&_svg]:size-[18px]",
  icon: "h-9 w-9 [&_svg]:size-[18px]",
  "icon-sm": "h-8 w-8 [&_svg]:size-4",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
});

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
