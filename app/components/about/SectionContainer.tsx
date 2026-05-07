import { ReactNode } from 'react';

interface SectionContainerProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export default function SectionContainer({ className, children }: Readonly<SectionContainerProps>) {
  return (
    <div className={`max-w-5xl mx-auto w-full ${className}`}>{children}</div>
  );
}