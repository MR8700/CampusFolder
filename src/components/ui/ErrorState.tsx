import React from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isOffline?: boolean;
  className?: string;
}

export default function ErrorState({
  title,
  description,
  onRetry,
  isOffline = false,
  className = '',
}: ErrorStateProps) {
  const defaultTitle = isOffline
    ? 'Vous êtes actuellement hors connexion.'
    : 'Nous n’avons pas pu charger cette ressource.';
  const defaultDesc = isOffline
    ? 'Vérifiez votre connexion internet mobile et réessayez.'
    : 'Une erreur temporaire est survenue lors de la récupération des données. Réessayez.';

  return (
    <div
      className={`py-12 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center mb-3 shadow-xs">
        <Icon name={isOffline ? 'cloud_off' : 'error'} size={28} />
      </div>
      <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
        {title || defaultTitle}
      </h3>
      <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed max-w-sm">
        {description || defaultDesc}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry} leftIcon="refresh">
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
}
