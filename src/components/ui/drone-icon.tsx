import React from "react";
import { cn } from "@/lib/utils";

interface DroneIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  invert?: boolean;
  orange?: boolean;
  className?: string;
}

export function DroneIcon({
  invert,
  orange = false,
  className = "h-5 w-5",
  alt = "Drone Icon",
  ...props
}: DroneIconProps) {
  const isWhite = invert || (className && className.includes("text-white"));

  return (
    <img
      src="/drone-icon.png"
      alt={alt}
      className={cn(
        "object-contain select-none shrink-0 transition-all",
        isWhite ? "brightness-0 invert" : "",
        orange ? "brightness-0 invert drop-shadow-[0_0_8px_rgba(255,85,0,0.9)]" : "",
        className
      )}
      {...props}
    />
  );
}
