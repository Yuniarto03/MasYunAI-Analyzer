

import React, { useState, useCallback, useEffect, useContext } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dock, DockItemDefinition } from './components/Dock';
import FuturisticBackground from './components/FuturisticBackground';
import { AIChat } from './components/AIChat';
import { WelcomeView } from './components/views/WelcomeView';
import { DashboardView } from './components/views/DashboardView';
import { DataUploadView } from './components/views/DataUploadView';
import { DataTableView } from './components/views/DataTableView';
import VisualizationView from './components/views/VisualizationView';
import { SettingsView } from './components/views/SettingsView';
import { OnlineConnectorsView } from './components/views/OnlineConnectorsView';
import { ProjectDetailsView } from './components/views/ProjectDetailsView';
import { AdvancedAIToolsView } from './components/views/AdvancedAIToolsView';
import { GenericPlaceholderView } from './components/views/GenericPlaceholderView';
import { PivotTableView } from './components/views/PivotTableView'; 
import { FeaturesStatusModal } from './components/FeaturesStatusModal'; 
import { AboutView } from './components/views/AboutView';
import { StatisticalAnalysisView } from './components/views/StatisticalAnalysisView';
import { WorkflowView } from './components/views/WorkflowView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { DiagrammingMatrixView } from './components/views/DiagrammingMatrixView';
import { RoutePlannerView } from './components/views/RoutePlannerView';
import MapView from './components/views/MapView';
import { DOCK_ITEMS, NAV_MENU_ITEMS, SIDEBAR_SECTIONS } from './constants';
import { IconType, ViewKey, Theme, IconProps } from './types'; 
import { DataProvider } from './contexts/DataContext';

// Polyfill process.env for browser environment and set the API key.
// In a real production environment, this would be handled by build tools and environment variables.
if (typeof process === 'undefined') {
  // @ts-ignore
  globalThis.process = { env: {} };
}
// @ts-ignore
process.env.API_KEY = "AIzaSyCm5LAy0zEhFCRCp6e4c7nGIcyExJLViIc";

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewKey>('welcome');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [genericFeatureName, setGenericFeatureName] = useState("Selected");
  const [isDockVisible, setIsDockVisible] = useState(true);

  const handleViewChange = useCallback((viewKey: ViewKey) => {
    setActiveView(viewKey);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleDock = useCallback(() => {
    setIsDockVisible(prev => !prev);
  }, []);
  
  useEffect(() => {
    if (!process.env.API_KEY) {
      console.warn("API_KEY environment variable is not set. AI features may not work.");
    }
    const timer = setTimeout(() => {
      setShowFeaturesModal(true);
    }, 1500); 
    
    return () => clearTimeout(timer);
  }, []);

  // Effect for handling the Ctrl+B / Cmd+B shortcut to toggle the sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Use event.metaKey for Command key on macOS
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]); // Dependency array ensures the listener always uses the latest toggleSidebar function

  const handleCloseFeaturesModal = () => {
    setShowFeaturesModal(false);
  };

  const mainViews: ViewKey[] = [
    'welcome', 'dashboard', 'dataUpload', 'dataTable', 'visualizations', 'settings',
    'onlineConnectors', 'projectDetails', 'advancedAITools', 'pivotTable', 'about',
    'statisticalAnalysis', 'workflow', 'aiAssistant', 'diagrammingMatrix', 'routePlanner', 'map'
  ];
  
  useEffect(() => {
    if (!mainViews.includes(activeView)) {
        const featureName = DOCK_ITEMS.find(item => item.id === activeView)?.label || 
                            NAV_MENU_ITEMS.flatMap(m => m.subItems).find(s => s.viewId === activeView)?.name ||
                            SIDEBAR_SECTIONS.flatMap(s => s.items).find(i => i.viewId === activeView)?.name ||
                            "Selected";
        setGenericFeatureName(featureName);
    }
  }, [activeView]);

  const dockItemsWithActions: DockItemDefinition[] = DOCK_ITEMS.map(item => ({
    ...item,
    action: () => handleViewChange(item.id as ViewKey),
  }));
  
  const isGenericViewActive = !mainViews.includes(activeView);

  const defaultTheme: Theme = {
    accent1: 'blue-400',
    accent2: 'purple-500',
    accent3: 'green-400',
    accent4: 'yellow-400',
    darkBg: 'gray-900',
    textColor: 'text-gray-200',
    cardBg: 'bg-gray-800/80 backdrop-blur-sm',
    borderColor: 'border-gray-700',
    darkGray: 'darkGray',
    mediumGray: 'mediumGray',
  };
  
  const isDiagramOrWelcome = activeView === 'welcome' || activeView === 'diagrammingMatrix';
  
  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <FuturisticBackground theme={defaultTheme} reduceMotion={false} />
      <Navbar 
        onToggleSidebar={toggleSidebar} 
        isSidebarOpen={isSidebarOpen}
        onNavigate={handleViewChange}
      />
      
      <div className="flex flex-1 overflow-hidden pt-16"> 
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={handleViewChange}
          activeView={activeView}
        />
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'} ${isDiagramOrWelcome ? '' : 'p-6'} ${activeView === 'diagrammingMatrix' || activeView === 'routePlanner' || activeView === 'map' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          <div style={{ display: activeView === 'welcome' ? 'block' : 'none', height: '100%' }}><WelcomeView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}><DashboardView /></div>
          <div style={{ display: activeView === 'dataUpload' ? 'block' : 'none' }}><DataUploadView /></div>
          <div style={{ display: activeView === 'dataTable' ? 'block' : 'none' }}><DataTableView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'visualizations' ? 'block' : 'none' }}><VisualizationView /></div>
          <div style={{ display: activeView === 'map' ? 'block' : 'none', height: '100%' }}><MapView /></div>
          <div style={{ display: activeView === 'settings' ? 'block' : 'none' }}><SettingsView /></div>
          <div style={{ display: activeView === 'aiAssistant' ? 'block' : 'none' }}><AIAssistantView /></div>
          <div style={{ display: activeView === 'onlineConnectors' ? 'block' : 'none' }}><OnlineConnectorsView /></div>
          <div style={{ display: activeView === 'projectDetails' ? 'block' : 'none' }}><ProjectDetailsView /></div>
          <div style={{ display: activeView === 'advancedAITools' ? 'block' : 'none' }}><AdvancedAIToolsView /></div>
          <div style={{ display: activeView === 'pivotTable' ? 'block' : 'none' }}><PivotTableView /></div>
          <div style={{ display: activeView === 'about' ? 'block' : 'none' }}><AboutView /></div>
          <div style={{ display: activeView === 'statisticalAnalysis' ? 'block' : 'none' }}><StatisticalAnalysisView /></div>
          <div style={{ display: activeView === 'workflow' ? 'block' : 'none' }}><WorkflowView /></div>
          <div style={{ display: activeView === 'diagrammingMatrix' ? 'flex' : 'none', height: '100%' }}><DiagrammingMatrixView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'routePlanner' ? 'block' : 'none', height: '100%' }}><RoutePlannerView theme={defaultTheme} reduceMotion={false} /></div>
          <div style={{ display: isGenericViewActive ? 'block' : 'none' }}><GenericPlaceholderView featureName={genericFeatureName} /></div>
        </main>
      </div>

      {isDockVisible && <Dock items={dockItemsWithActions} activeView={activeView} />}
      
      <button 
        onClick={toggleDock}
        className="fixed bottom-6 left-6 bg-gray-700 bg-opacity-50 hover:bg-opacity-80 backdrop-blur-sm text-gray-300 hover:text-white p-3 rounded-full shadow-lg z-[1001] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-400"
        aria-label={isDockVisible ? "Hide Dock" : "Show Dock"}
        title={isDockVisible ? "Hide Dock" : "Show Dock"}
      >
        {isDockVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
      </button>

      <button 
        onClick={toggleChat}
        className="fixed bottom-24 right-6 bg-gradient-to-br from-purple-600 to-blue-500 w-14 h-14 rounded-full shadow-lg z-[1001] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-400 flex items-center justify-center overflow-hidden"
        aria-label="Toggle AI Chat"
      >
        <MasYunIcon className="w-full h-full object-cover" />
      </button>

      {isChatOpen && <AIChat onClose={toggleChat} />}
      <FeaturesStatusModal isOpen={showFeaturesModal} onClose={handleCloseFeaturesModal} />
    </div>
  );
};


export const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

const EyeIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.436-7.104a1.011 1.011 0 011.637 0l4.436 7.104a1.012 1.012 0 010 .639l-4.436 7.104a1.011 1.011 0 01-1.637 0l-4.436-7.104z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.572M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
  </svg>
);


const base64Icon = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAH0AfQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1VWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8MTIxMjJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+qKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigA-..';
const MasYunIcon: React.FC<IconProps> = ({ className }) => (
  <img src={base64Icon} alt="MasYunAI" className={className} />
);

// const ChatBotIcon: IconType = ({ className }) => (
//   <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.55 19.05 A8 8 0 0110 21 8 8 0 012 13 8 8 0 0110 5 8 8 0 0117.55 10.95 M19 13 A7 7 0 1112 6 V 3 M16 16 S 19 13 21 13 M12 17H12.01 M12 13H12.01 M7 13H7.01" />
//   </svg>
// );