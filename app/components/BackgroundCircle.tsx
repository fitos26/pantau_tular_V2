import React from "react";

interface BackgroundCircleProps {
  readonly size: { readonly width: string; readonly height: string };
  readonly position: string;
}

export default function BackgroundCircle({ size, position }: Readonly<BackgroundCircleProps>) {
  return (
    <div
      className={`absolute ${position} transform -translate-x-1/2 bg-[#E3EFE8] rounded-full blur-2xl z-0`}
      style={{ width: size.width, height: size.height }} 
    ></div>
  );
}