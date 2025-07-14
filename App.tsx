





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
import { WorkflowAutomationView } from './components/views/WorkflowAutomationView';
import AiDocument from './components/views/AiDocument'; // Import the new view
import { DataCleaningView } from './components/views/DataCleaningView';
import { DOCK_ITEMS, NAV_MENU_ITEMS, SIDEBAR_SECTIONS } from './constants';
import { IconType, ViewKey, Theme, IconProps, RecentProject, PivotReportState } from './types'; 
import { DataContext, DataProvider } from './contexts/DataContext';

// Polyfill process.env for browser environment and set the API key.
// In a real production environment, this would be handled by build tools and environment variables.
if (typeof process === 'undefined') {
  // @ts-ignore
  globalThis.process = { env: {} };
}
// @ts-ignore
process.env.API_KEY = "AIzaSyCm5LAy0zEhFCRCp6e4c7nGIcyExJLViIc";

const AppContent: React.FC = () => {
  const { 
    activePivotId, 
    setActivePivotId,
    pivotReports, 
    setPivotReports,
    recentProjects, 
    setRecentProjects,
    tableData,
    fileHeaders,
    setTableData,
    setFileHeaders,
  } = useContext(DataContext);
  
  const [activeView, setActiveView] = useState<ViewKey>('welcome');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [genericFeatureName, setGenericFeatureName] = useState("Selected");
  const [isDockVisible, setIsDockVisible] = useState(true);

  const handleViewChange = useCallback((viewKey: ViewKey, context?: any) => {
    setActiveView(viewKey);
    if (context?.pivotId) {
      setActivePivotId(context.pivotId);
    }
  }, [setActivePivotId]);


  // Effect to update recent projects when activePivotId changes
  useEffect(() => {
    if (!activePivotId || !pivotReports.length) return;

    const activeReport = pivotReports.find(r => r.id === activePivotId);
    if (!activeReport) return;

    setRecentProjects(prev => {
      const newRecentItem: RecentProject = {
        id: activeReport.id,
        name: activeReport.name,
        lastAccessed: Date.now(),
      };
      // Remove existing entry for this report, if any
      const filtered = prev.filter(p => p.id !== activeReport.id);
      // Add the new/updated entry to the front and limit to 5
      const updatedRecents = [newRecentItem, ...filtered].slice(0, 5);
      return updatedRecents;
    });
  }, [activePivotId, pivotReports, setRecentProjects]);


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
    'statisticalAnalysis', 'workflow', 'aiAssistant', 'diagrammingMatrix', 'routePlanner',
    'workflowAutomation', 'aiDocument', 'dataCleaning'
  ];

  const noPaddingViews: ViewKey[] = ['welcome', 'diagrammingMatrix', 'routePlanner', 'workflowAutomation'];
  
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
  
  const isDiagramOrWelcome = noPaddingViews.includes(activeView);
  
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
          activePivotId={activePivotId}
          recentProjects={recentProjects}
        />
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'} ${isDiagramOrWelcome ? '' : 'p-6'} ${activeView === 'diagrammingMatrix' || activeView === 'routePlanner' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          <div style={{ display: activeView === 'welcome' ? 'block' : 'none', height: '100%' }}><WelcomeView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}><DashboardView /></div>
          <div style={{ display: activeView === 'dataUpload' ? 'block' : 'none' }}><DataUploadView /></div>
          <div style={{ display: activeView === 'dataTable' ? 'block' : 'none' }}><DataTableView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'visualizations' ? 'block' : 'none' }}><VisualizationView /></div>
          <div style={{ display: activeView === 'settings' ? 'block' : 'none' }}><SettingsView /></div>
          <div style={{ display: activeView === 'dataCleaning' ? 'block' : 'none' }}><DataCleaningView /></div>
          <div style={{ display: activeView === 'aiAssistant' ? 'block' : 'none', height: '100%' }}><AIAssistantView /></div>
          <div style={{ display: activeView === 'aiDocument' ? 'block' : 'none', height: '100%' }}><AiDocument /></div>
          <div style={{ display: activeView === 'onlineConnectors' ? 'block' : 'none' }}><OnlineConnectorsView /></div>
          <div style={{ display: activeView === 'projectDetails' ? 'block' : 'none' }}><ProjectDetailsView /></div>
          <div style={{ display: activeView === 'advancedAITools' ? 'block' : 'none' }}><AdvancedAIToolsView /></div>
          <div style={{ display: activeView === 'pivotTable' ? 'block' : 'none' }}><PivotTableView /></div>
          <div style={{ display: activeView === 'about' ? 'block' : 'none' }}><AboutView /></div>
          <div style={{ display: activeView === 'statisticalAnalysis' ? 'block' : 'none' }}><StatisticalAnalysisView /></div>
          <div style={{ display: activeView === 'workflow' ? 'block' : 'none' }}><WorkflowView /></div>
          <div style={{ display: activeView === 'diagrammingMatrix' ? 'flex' : 'none', height: '100%' }}><DiagrammingMatrixView onNavigate={handleViewChange} /></div>
          <div style={{ display: activeView === 'routePlanner' ? 'block' : 'none', height: '100%' }}><RoutePlannerView theme={defaultTheme} reduceMotion={false} /></div>
          <div style={{ display: activeView === 'workflowAutomation' ? 'block' : 'none', height: '100%' }}>
            <WorkflowAutomationView 
              context={{
                  tableData,
                  fileHeaders,
                  setPivotReports: setPivotReports as React.Dispatch<React.SetStateAction<PivotReportState[]>>,
                  setActivePivotId,
                  setActiveView: handleViewChange,
              }}
            />
          </div>
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
        <span className="text-3xl" role="img" aria-label="AI Assistant">🤖</span>
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
