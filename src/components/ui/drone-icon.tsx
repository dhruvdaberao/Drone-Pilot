import React from "react";
import { cn } from "@/lib/utils";

interface DroneIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  invert?: boolean;
  className?: string;
}

export function DroneIcon({
  invert,
  className = "h-5 w-5",
  alt = "Drone Icon",
  ...props
}: DroneIconProps) {
  // If className has text-white or invert is true, invert the black icon into solid white
  const isWhite = invert || (className && className.includes("text-white"));

  return (
    <img
      src="/drone-icon.png"
      alt={alt}
      className={cn(
        "object-contain select-none shrink-0 transition-all",
        isWhite ? "brightness-0 invert" : "",
        className
      )}
      {...props}
    />
  );
}
