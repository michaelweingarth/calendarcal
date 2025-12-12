import * as React from "react";
import { cn } from "@/lib/utils";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
};

type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4",
          variant === "destructive"
            ? "border-destructive/50 text-destructive shadow-sm"
            : "border-slate-700 bg-slate-900 text-white shadow",
          className,
        )}
        {...props}
      />
    );
  },
);

Alert.displayName = "Alert";

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return <h5 className={cn("mb-1 font-medium leading-none", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
