

import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ title, children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`panel-holographic p-6 rounded-lg ${className}`}>
        {title && <h2 className="text-xl font-semibold text-blue-300 mb-4 pb-2 border-b border-blue-400/20">{title}</h2>}
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
