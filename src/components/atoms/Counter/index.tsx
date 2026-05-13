import React from 'react';

interface CounterProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Counter: React.FC<CounterProps> = ({
  value,
  label,
  size = 'md',
  color = 'white',
}) => {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex flex-col items-center">
      <span
        className={`${sizes[size]} font-bold`}
        style={{ color }}
      >
        {value.toLocaleString()}
      </span>
      {label && (
        <span className="text-gray-400 text-sm mt-1">{label}</span>
      )}
    </div>
  );
};