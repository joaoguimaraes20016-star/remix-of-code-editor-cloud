import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "small" | "medium" | "large" | "xlarge";
  className?: string;
  showText?: boolean;
}

export const Logo = ({ size = "medium", className, showText = false }: LogoProps) => {
  const sizeClasses = {
    small: "h-5 w-5 sm:h-6 sm:w-6",
    medium: "h-6 w-6 sm:h-8 sm:w-8",
    large: "h-10 w-10 sm:h-16 sm:w-16",
    xlarge: "h-16 w-16 sm:h-24 sm:w-24",
  };

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      <div className={cn(
        sizeClasses[size],
        "bg-black rounded-md sm:rounded-lg flex items-center justify-center p-0.5 sm:p-1"
      )}>
        <img 
          src={logo} 
          alt="GRWTH OP Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <span className="font-bold text-sm sm:text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          GRWTH OP
        </span>
      )}
    </div>
  );
};
