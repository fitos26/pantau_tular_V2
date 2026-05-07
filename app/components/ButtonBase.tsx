"use client";
"use client";

import { useRouter } from "next/navigation";

interface ButtonBaseProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
}

export default function ButtonBase({ children, href, className = "", onClick }: ButtonBaseProps) {
  const router = useRouter();

  return (
    <button
      onClick={onClick ?? (() => router.push(href))}
      className={`button-primary ${className}`}
    >
      {children}
    </button>
  );
}