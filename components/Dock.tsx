import React, { useState, useRef, useEffect } from 'react';
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

export const Dock: React.FC<DockProps> = ({ items, activeView }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [spotlightStyle, setSpotlightStyle] = useState({});

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  useEffect(() => {
    const activeIndex = items.findIndex(item => item.id === activeView);
    const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;

    if (targetIndex !== -1 && itemRefs.current[targetIndex]) {
      const targetElement = itemRefs.current[targetIndex]!;
      const containerElement = containerRef.current;
      if (!containerElement) return;

      const containerRect = containerElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      const newStyle = {
        transform: `translateX(${targetRect.left - containerRect.left + containerElement.scrollLeft}px)`,
        width: `${targetRect.width}px`,
        opacity: 1,
      };
      setSpotlightStyle(newStyle);
    } else {
        setSpotlightStyle({ opacity: 0 });
    }
  }, [hoveredIndex, activeView, items]);

  return (
    <div
      ref={containerRef}
      className="glass-dock-container"
      onMouseLeave={() => setHoveredIndex(null)}
      aria-label="Application Dock"
    >
      <div
        className="dock-spotlight"
        style={spotlightStyle}
      />
      <div className="glass-dock-items">
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={el => { itemRefs.current[index] = el; }}
            onClick={item.action}
            aria-label={item.label}
            className="glass-dock-item"
            onMouseEnter={() => setHoveredIndex(index)}
          >
            <span className="dock-tooltip">{item.label}</span>
            <item.icon className="dock-item-icon" />
          </button>
        ))}
      </div>
    </div>
  );
};