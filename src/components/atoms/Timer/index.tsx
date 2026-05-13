import React from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  elapsed: string;
  label?: string;
}

export const Timer: React.FC<TimerProps> = ({ elapsed, label = 'En vivo' }) => {
  return (
    <div className="flex items-center gap-2 text-gray-300">
      <Clock size={16} className="text-red-500" />
      <span className="text-sm">{label}:</span>
      <span className="font-mono text-white">{elapsed}</span>
    </div>
  );
};