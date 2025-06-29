

import React, { useState } from 'react';
import { IconType, ViewKey } from '../types';

export interface DockItemDefinition {
  id: string;
  label: string;
  icon: IconType;
  action: () => void;
}

interface DockProps {
  items: DockItemDefinition[];
  activeView: ViewKey;
}

// Pre-defined color classes for the dock items
const DOCK_ITEM_COLORS = [
  'dock-item-blue',
  'dock-item-green',
  'dock-item-purple',
  'dock-item-orange',
  'dock-item-red',
  'dock-item-indigo',
  'dock-item-lime',
  'dock-item-gray',
];

export const Dock: React.FC<DockProps> = ({ items, activeView }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getStyle = (index: number, isActive: boolean) => {
    let scale = isActive ? 1.2 : 1;
    let yTransform = isActive ? -10 : 0;

    if (hoveredIndex !== null) {
      const distance = Math.abs(hoveredIndex - index);
      if (distance === 0) {
        scale = 1.5;
        yTransform = -25;
      } else if (distance === 1) {
        scale = 1.3;
        yTransform = -15;
      } else if (distance === 2) {
        scale = 1.1;
        yTransform = -5;
      }
    }
    return {
      transform: `translateY(${yTransform}px) scale(${scale})`,
    };
  };

  return (
    <div
      className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-[1000] h-24 flex items-end justify-center"
      onMouseLeave={() => setHoveredIndex(null)}
      aria-label="Application Dock"
    >
      <div className="flex items-end space-x-4">
        {items.map((item, index) => {
          const isActive = activeView === item.id;
          return (
            <div key={item.id} className="relative flex flex-col items-center">
              <span
                role="tooltip"
                className={`
                  absolute -top-8 px-3 py-1.5 text-sm text-white bg-gray-900 bg-opacity-80 rounded-lg 
                  transition-all duration-200 pointer-events-none
                  ${hoveredIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                `}
              >
                {item.label}
              </span>
              <button
                onClick={item.action}
                aria-label={item.label}
                className={`
                  dock-item
                  ${DOCK_ITEM_COLORS[index % DOCK_ITEM_COLORS.length]}
                  ${isActive ? 'active' : ''}
                `}
                style={getStyle(index, isActive)}
                onMouseEnter={() => setHoveredIndex(index)}
              >
                <item.icon className="dock-item-icon" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
