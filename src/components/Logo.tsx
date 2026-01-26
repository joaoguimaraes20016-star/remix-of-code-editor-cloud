import logo from "@/assets/stackit-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "small" | "medium" | "large" | "xlarge";
  className?: string;
  showText?: boolean;
  gradientText?: boolean;
}

export const Logo = ({ size = "medium", className, showText = false, gradientText = true }: LogoProps) => {
  const sizeClasses = {
    small: "h-6 w-6 sm:h-7 sm:w-7",
    medium: "h-8 w-8 sm:h-9 sm:w-9",
    large: "h-12 w-12 sm:h-16 sm:w-16",
    xlarge: "h-20 w-20 sm:h-24 sm:w-24",
  };

  return (
    <div className={cn("flex items-center gap-2 sm:gap-2.5", className)}>
      <img 
        src={logo} 
        alt="Stackit Logo" 
        className={cn(sizeClasses[size], "object-contain")}
      />
      {showText && (
        <span className={cn(
          "font-bold text-base sm:text-xl tracking-tight",
          gradientText 
            ? "text-gradient-brand" 
            : "text-foreground"
        )}>
          Stackit
        </span>
      )}
    </div>
  );
};
