import React from "react";
import { cn } from "@/lib/utils";

interface DroneIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  invert?: boolean;
  orange?: boolean;
  className?: string;
}

export function DroneIcon({
  invert,
  orange = true,
  className = "h-5 w-5",
  alt = "Drone Icon",
  ...props
}: DroneIconProps) {
  // If orange is true, illuminate the icon with white core and vibrant aerospace orange glow
  const isWhite = invert || (className && className.includes("text-white"));

  return (
    <img
      src="/drone-icon.png"
      alt={alt}
      className={cn(
        "object-contain select-none shrink-0 transition-all brightness-0 invert",
        orange && "drop-shadow-[0_0_8px_rgba(255,85,0,0.9)]",
        className
      )}
      {...props}
    />
  );
}
