import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonProps } from "@/components/ui/button";
import { forwardRef } from "react";

// Enhanced Button variants for QR ordering system
export const HeroButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "hero-gradient text-primary-foreground font-semibold px-8 py-3 text-lg transition-smooth hover-lift hover:shadow-lg border-0",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

export const GhostButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

export const GlassButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "glass text-foreground hover:bg-card-glass/80 border-card-border transition-smooth hover-scale",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

HeroButton.displayName = "HeroButton";
GhostButton.displayName = "GhostButton";
GlassButton.displayName = "GlassButton";