import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border bg-white text-slate-900 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
