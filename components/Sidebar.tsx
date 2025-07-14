


import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { SIDEBAR_SECTIONS, ProjectIcon } from '../constants';
import { IconType, ViewKey, SidebarItemConfig, RecentProject } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onNavigate: (viewKey: ViewKey, context?: any) => void;
  activeView: ViewKey;
  activePivotId: string | null;
  recentProjects: RecentProject[];
}

const ChevronDownIcon: IconType = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} {...props}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const SidebarItem: React.FC<{ 
  item: SidebarItemConfig; 
  onNavigate: () => void;
  isActive: boolean;
  itemRef: React.RefObject<HTMLAnchorElement>;
}> = ({ item, onNavigate, isActive, itemRef }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate();
  };
  
  return (
    <a
      ref={itemRef}
      href="#"
      onClick={handleClick}
      className={`sidebar-item group ${isActive ? 'sidebar-item-active' : ''}`}
      title={item.name}
    >
      <item.icon className="sidebar-item-icon" />
      <span className="text-sm font-medium">{item.name}</span>
    </a>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onNavigate, activeView, activePivotId, recentProjects }) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({});
  
  const staticItemsRef = useRef<Record<string, React.RefObject<HTMLAnchorElement>>>({});
  SIDEBAR_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      if (!staticItemsRef.current[item.viewId]) {
        staticItemsRef.current[item.viewId] = React.createRef<HTMLAnchorElement>();
      }
    });
  });

  const recentProjectsRefs = useRef<Record<string, React.RefObject<HTMLAnchorElement>>>({});
  recentProjects.forEach(p => {
    if (!recentProjectsRefs.current[p.id]) {
        recentProjectsRefs.current[p.id] = React.createRef();
    }
  });
  

  useLayoutEffect(() => {
    const activeItemRef = (activeView === 'pivotTable' && activePivotId)
      ? recentProjectsRefs.current[activePivotId]?.current
      : staticItemsRef.current[activeView]?.current;

    if (activeItemRef) {
      setIndicatorStyle({
        top: activeItemRef.offsetTop,
        height: activeItemRef.offsetHeight,
        opacity: 1,
      });
    } else {
       setIndicatorStyle({ opacity: 0 });
    }
  }, [activeView, activePivotId, isOpen, collapsedSections, recentProjects]);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <aside 
      className={`sidebar panel-holographic fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 text-white p-2 transition-transform duration-300 ease-in-out z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto hide-scrollbar`}
    >
      {SIDEBAR_SECTIONS.map((section, sectionIndex) => {
        const isCollapsed = collapsedSections[section.title] || false;
        const isRecentProjects = section.title === 'Recent Projects';

        return (
          <div key={sectionIndex} className="mb-2">
            <button 
              onClick={() => toggleSection(section.title)}
              className="flex items-center justify-between w-full text-left text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 py-1 rounded-md hover:bg-gray-700/30 transition-colors"
              aria-expanded={!isCollapsed}
              aria-controls={`section-content-${sectionIndex}`}
            >
              <span>{section.title}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            <div
              id={`section-content-${sectionIndex}`}
              className={`relative transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}
            >
              <div 
                className="sidebar-indicator"
                style={indicatorStyle}
              />
              <div className="space-y-1">
                {isRecentProjects ? (
                  recentProjects.length > 0 ? (
                    recentProjects.map(project => (
                      <SidebarItem
                        key={project.id}
                        item={{ name: project.name, viewId: 'pivotTable', icon: ProjectIcon }}
                        onNavigate={() => onNavigate('pivotTable', { pivotId: project.id })}
                        isActive={activeView === 'pivotTable' && activePivotId === project.id}
                        itemRef={recentProjectsRefs.current[project.id]}
                      />
                    ))
                  ) : (
                    <p className="px-2 text-xs text-gray-500">No recent projects.</p>
                  )
                ) : (
                  section.items.map((item) => (
                    <SidebarItem 
                      key={item.viewId} 
                      item={item} 
                      onNavigate={() => onNavigate(item.viewId)}
                      isActive={activeView === item.viewId}
                      itemRef={staticItemsRef.current[item.viewId]}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
};