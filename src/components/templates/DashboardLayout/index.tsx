import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

interface DashboardLayoutProps {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-dashboard-bg p-4 relative">
      <button
        onClick={() => navigate('/settings')}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
        title="Configuración"
      >
        <Settings size={16} />
      </button>
      <div className="h-full grid grid-cols-2 grid-rows-2 gap-4">
        <div className="col-start-1 row-start-1">{topLeft}</div>
        <div className="col-start-2 row-start-1">{topRight}</div>
        <div className="col-start-1 row-start-2">{bottomLeft}</div>
        <div className="col-start-2 row-start-2">{bottomRight}</div>
      </div>
    </div>
  );
};