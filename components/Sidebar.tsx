import React from 'react';
import { SIDEBAR_SECTIONS } from '../constants';
import { IconType, ViewKey, SidebarItemConfig } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onNavigate: (viewKey: ViewKey) => void;
}

const SidebarItem: React.FC<{ item: SidebarItemConfig; onNavigate: (viewKey: ViewKey) => void; }> = ({ item, onNavigate }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(item.viewId); // All items now have a viewId
  };
  
  const commonClasses = "flex items-center space-x-3 p-2 rounded-md transition-colors duration-150 group text-gray-300 hover:bg-gray-700/50 hover:text-white";

  return (
    <a
      href="#"
      onClick={handleClick}
      className={commonClasses}
      title={item.name}
    >
      <item.icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
      <span className="text-sm">{item.name}</span>
    </a>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onNavigate }) => {
  return (
    <aside 
      className={`panel-holographic fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 text-white p-5 transition-transform duration-300 ease-in-out z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto hide-scrollbar`}
    >
      {SIDEBAR_SECTIONS.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            {section.title}
          </h2>
          <div className="space-y-1">
            {section.items.map((item, itemIndex) => (
              <SidebarItem 
                key={itemIndex} 
                item={item} 
                onNavigate={onNavigate} 
              />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
};