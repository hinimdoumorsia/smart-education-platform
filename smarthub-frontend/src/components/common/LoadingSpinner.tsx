// src/components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Chargement...', 
  size = 'md' 
}) => {
  const sizeClass = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5">
      <div className={`spinner-border text-primary ${sizeClass[size]}`} role="status">
        <span className="visually-hidden">{message}</span>
      </div>
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;