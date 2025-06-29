




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
import { DOCK_ITEMS, NAV_MENU_ITEMS, SIDEBAR_SECTIONS } from './constants';
import { IconType, ViewKey, Theme } from './types'; 
import { DataProvider } from './contexts/DataContext';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewKey>('welcome');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [genericFeatureName, setGenericFeatureName] = useState("Selected");

  const handleViewChange = useCallback((viewKey: ViewKey) => {
    setActiveView(viewKey);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
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
    'statisticalAnalysis', 'workflow', 'aiAssistant'
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
    darkBg: 'gray-900'
  };

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
        />
        <main 
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${activeView === 'welcome' ? '' : 'p-6'} ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
        >
          <div style={{ display: activeView === 'welcome' ? 'block' : 'none', height: '100%' }}><WelcomeView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}><DashboardView /></div>
          <div style={{ display: activeView === 'dataUpload' ? 'block' : 'none' }}><DataUploadView /></div>
          <div style={{ display: activeView === 'dataTable' ? 'block' : 'none' }}><DataTableView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'visualizations' ? 'block' : 'none' }}><VisualizationView /></div>
          <div style={{ display: activeView === 'settings' ? 'block' : 'none' }}><SettingsView /></div>
          <div style={{ display: activeView === 'aiAssistant' ? 'block' : 'none' }}><AIAssistantView /></div>
          <div style={{ display: activeView === 'onlineConnectors' ? 'block' : 'none' }}><OnlineConnectorsView /></div>
          <div style={{ display: activeView === 'projectDetails' ? 'block' : 'none' }}><ProjectDetailsView /></div>
          <div style={{ display: activeView === 'advancedAITools' ? 'block' : 'none' }}><AdvancedAIToolsView /></div>
          <div style={{ display: activeView === 'pivotTable' ? 'block' : 'none' }}><PivotTableView /></div>
          <div style={{ display: activeView === 'about' ? 'block' : 'none' }}><AboutView /></div>
          <div style={{ display: activeView === 'statisticalAnalysis' ? 'block' : 'none' }}><StatisticalAnalysisView /></div>
          <div style={{ display: activeView === 'workflow' ? 'block' : 'none' }}><WorkflowView /></div>
          <div style={{ display: isGenericViewActive ? 'block' : 'none' }}><GenericPlaceholderView featureName={genericFeatureName} /></div>
        </main>
      </div>

      <Dock items={dockItemsWithActions} activeView={activeView} />
      
      <button 
        onClick={toggleChat}
        className="fixed bottom-24 right-6 bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white p-4 rounded-full shadow-lg z-[1001] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-400 flex items-center justify-center" // always 'flex' or 'block'
        aria-label="Toggle AI Chat"
      >
        <ChatBotIcon className="w-6 h-6" />
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

// Placeholder for ChatBotIcon - ideally use an SVG library or actual SVG
const ChatBotIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.55 19.05 A8 8 0 0110 21 8 8 0 012 13 8 8 0 0110 5 8 8 0 0117.55 10.95 M19 13 A7 7 0 1112 6 V 3 M16 16 S 19 13 21 13 M12 17H12.01 M12 13H12.01 M7 13H7.01" />
  </svg>
);