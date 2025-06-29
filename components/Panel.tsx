import React from 'react';

// Extend PanelProps with standard HTML attributes for a div element.
// This allows passing props like onMouseDown, etc.
interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  // Separate the component-specific props from the standard HTML attributes.
  ({ title, children, className = '', ...props }, ref) => {
    return (
      // Spread the remaining props onto the div element.
      <div ref={ref} className={`panel-holographic p-6 rounded-lg ${className}`} {...props}>
        {title && <h2 className="text-xl font-semibold text-blue-300 mb-4 pb-2 border-b border-blue-400/20">{title}</h2>}
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
