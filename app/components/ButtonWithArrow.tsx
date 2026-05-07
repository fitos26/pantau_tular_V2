import { ArrowRight } from "lucide-react";
import ButtonBase from "./ButtonBase";
import React from "react";

interface ButtonWithArrowProps {
  children: React.ReactNode;
  href: string;
}

export default function ButtonWithArrow({ children, href }: ButtonWithArrowProps) {
  return (
    <ButtonBase href={href} className="flex items-center gap-2">
      {children}
      <div className="w-6 h-6 flex items-center justify-center bg-white rounded-full">
        <ArrowRight size={16} className="text-green-600" />
      </div>
    </ButtonBase>
  );
}