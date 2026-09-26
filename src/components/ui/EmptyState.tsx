import React from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon = 'folder_open',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`py-12 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-3 shadow-xs">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
        {title}
      </h3>
      {description && (
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
