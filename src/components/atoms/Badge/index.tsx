import React from 'react';

interface BadgeProps {
  variant: 'live' | 'offline' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = '',
}) => {
  const variants = {
    live: 'bg-red-600 text-white animate-pulse',
    offline: 'bg-gray-600 text-gray-300',
    info: 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};