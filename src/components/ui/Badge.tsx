import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: string;
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: 'bg-primary-fixed text-primary font-bold border border-primary/20',
  secondary: 'bg-secondary/15 text-secondary font-bold border border-secondary/30',
  tertiary: 'bg-tertiary-fixed text-tertiary font-bold border border-tertiary/20',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold border border-amber-500/30',
  error: 'bg-error-container text-on-error-container font-bold border border-error/20',
  neutral: 'bg-surface-container-high text-on-surface-variant font-medium border border-outline-variant/30',
  outline: 'bg-transparent text-on-surface border border-outline-variant font-medium',
};

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  icon,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const sizeStyle = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md uppercase tracking-wider ${VARIANT_STYLES[variant]} ${sizeStyle} ${className}`}
      {...rest}
    >
      {icon && (
        <span className="material-symbols-outlined text-[13px] leading-none shrink-0">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
