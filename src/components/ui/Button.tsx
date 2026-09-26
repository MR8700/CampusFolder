import React from 'react';
import Icon from '@/components/ui/Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98] shadow-xs focus-visible:ring-2 focus-visible:ring-primary/40',
  secondary:
    'bg-secondary text-on-secondary hover:bg-secondary/90 active:scale-[0.98] shadow-xs focus-visible:ring-2 focus-visible:ring-secondary/40',
  outline:
    'bg-transparent text-on-surface border border-outline-variant hover:bg-surface-container active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/20',
  text:
    'bg-transparent text-on-surface hover:text-primary hover:bg-surface-container active:scale-[0.98]',
  danger:
    'bg-error text-on-error hover:bg-error/90 active:scale-[0.98] shadow-xs focus-visible:ring-2 focus-visible:ring-error/40',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-xl font-bold gap-1.5',
  md: 'h-10 px-4 text-xs sm:text-sm rounded-xl font-bold gap-2',
  lg: 'h-12 px-5 text-sm sm:text-base rounded-2xl font-bold gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all select-none cursor-pointer outline-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : leftIcon ? (
        <Icon name={leftIcon} size={size === 'sm' ? 15 : size === 'md' ? 18 : 20} />
      ) : null}

      <span>{children}</span>

      {!isLoading && rightIcon && (
        <Icon name={rightIcon} size={size === 'sm' ? 15 : size === 'md' ? 18 : 20} />
      )}
    </button>
  );
}
