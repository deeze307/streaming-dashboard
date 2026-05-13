import React from 'react';

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
  return (
    <div className="h-screen w-screen bg-dashboard-bg p-4">
      <div className="h-full grid grid-cols-2 grid-rows-2 gap-4">
        {/* Cuadrante 1: Superior Izquierdo */}
        <div className="col-start-1 row-start-1">{topLeft}</div>

        {/* Cuadrante 2: Superior Derecho */}
        <div className="col-start-2 row-start-1">{topRight}</div>

        {/* Cuadrante 3: Inferior Izquierdo */}
        <div className="col-start-1 row-start-2">{bottomLeft}</div>

        {/* Cuadrante 4: Inferior Derecho */}
        <div className="col-start-2 row-start-2">{bottomRight}</div>
      </div>
    </div>
  );
};