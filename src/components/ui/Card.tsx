import React from 'react';

export type CardVariant = 'compact' | 'standard' | 'detailed';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
}

const VARIANT_CONTAINER: Record<CardVariant, string> = {
  compact:
    'p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-outline-variant/60 shadow-xs transition-all active:scale-[0.99]',
  standard:
    'p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-outline-variant/60 hover:shadow-md shadow-xs transition-all',
  detailed:
    'p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-md transition-all',
};

export default function Card({
  variant = 'standard',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`relative overflow-hidden ${VARIANT_CONTAINER[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
