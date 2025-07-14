
import React, { useState, useEffect } from 'react';
import { IconType, ViewKey, NavMenuItemConfig as TopNavMenuItemConfig, NavSubMenuItemConfig } from '../types';
import { NAV_MENU_ITEMS } from '../constants';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigate: (viewKey: ViewKey) => void;
}

const MenuIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const SearchIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


interface NavMenuItemProps {
  item: TopNavMenuItemConfig;
  onNavigate: (viewKey: ViewKey) => void;
}

const NavMenuItem: React.FC<NavMenuItemProps> = ({ item, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubItemClick = (subItem: NavSubMenuItemConfig) => {
    onNavigate(subItem.viewId); // All subItems now have a viewId
    setIsOpen(false); // Close dropdown after click
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none">
        {item.name}
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
          {item.subItems.map(subItem => (
            <button
              key={subItem.name}
              onClick={() => handleSubItemClick(subItem)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {subItem.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const dayOfMonth = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Using a clear, readable format that includes all requested elements.
    const timeString = date.toLocaleTimeString('en-US', { hour12: false });
    
    return `${dayName}, ${dayOfMonth}/${month}/${year} ${timeString}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-70 backdrop-blur-md shadow-lg z-50 h-16 flex items-center px-4">
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar} 
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white mr-2"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="text-xl font-bold">
          <span className="text-blue-400">MasYunData</span>
          <span className="text-yellow-400">AI</span>
        </div>
      </div>

      <div className="hidden md:flex items-center ml-6 space-x-1">
        {NAV_MENU_ITEMS.map(menu => (
            <NavMenuItem key={menu.name} item={menu} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="flex-1 flex justify-end items-center">
        <div className="relative mr-4">
          <input
            type="text"
            placeholder="Search data, analytics..."
            className="bg-gray-800 text-white px-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <SearchIcon className="h-5 w-5" />
          </div>
        </div>
        
        <div className="text-sm text-gray-300 mr-4 whitespace-nowrap hidden lg:block" title={new Date().toString()}>
           {formatTime(currentTime)}
        </div>
      </div>
    </nav>
  );
};
