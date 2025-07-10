import React, { useState, useRef, useEffect } from 'react';
import { IconType, ViewKey, DockItemConfig } from '../types';

export interface DockItemDefinition extends DockItemConfig {
  action: () => void;
}

interface DockProps {
  items: DockItemDefinition[];
  activeView: ViewKey;
}

const MAX_SCALE = 1.8;
const NEIGHBOR_DISTANCE = 2; 
const BASE_SIZE = 56;

export const Dock: React.FC<DockProps> = ({ items, activeView }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [itemStyles, setItemStyles] = useState<{ [key: number]: React.CSSProperties }>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  useEffect(() => {
    const activeIndex = items.findIndex(item => item.id === activeView);

    const newStyles: { [key: number]: React.CSSProperties } = {};
    let spotlightTransform = '';
    let spotlightOpacity = 0;

    for (let i = 0; i < items.length; i++) {
        let scale = 1;
        if (hoveredIndex !== null) {
            const distance = Math.abs(i - hoveredIndex);
            if (distance <= NEIGHBOR_DISTANCE) {
                const falloff = (Math.cos((distance / NEIGHBOR_DISTANCE) * (Math.PI / 2)) + 1) / 2;
                scale = 1 + (MAX_SCALE - 1) * falloff;
            }
        } else if (i === activeIndex) {
            scale = 1.2;
        }
        
        const translateY = -(scale - 1) * (BASE_SIZE / 2.5);
        newStyles[i] = {
            transform: `translateY(${translateY}px) scale(${scale})`,
            width: `${BASE_SIZE}px`,
            height: `${BASE_SIZE}px`,
        };
    }

    const targetIndex = hoveredIndex ?? (activeIndex !== -1 ? activeIndex : null);

    if (targetIndex !== null && itemRefs.current[targetIndex]) {
        const targetElement = itemRefs.current[targetIndex]!;
        const containerElement = containerRef.current;
        if (containerElement) {
            const containerRect = containerElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            const spotlightX = targetRect.left - containerRect.left + targetRect.width / 2 - 75;
            spotlightTransform = `translateX(${spotlightX}px)`;
            spotlightOpacity = hoveredIndex !== null ? 1 : 0.5;
        }
    }
    
    setItemStyles(newStyles);
    setSpotlightStyle({
        transform: spotlightTransform,
        opacity: spotlightOpacity,
    });

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
            className={`glass-dock-item ${hoveredIndex === index ? 'tooltip-visible' : ''}`}
            onMouseEnter={() => setHoveredIndex(index)}
            style={itemStyles[index]}
          >
            <span className="dock-tooltip">{item.label}</span>
            <span style={{ color: item.color || 'white' }}>
              <item.icon className="dock-item-icon" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};