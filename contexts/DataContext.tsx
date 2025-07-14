
import React, { createContext, useState, ReactNode } from 'react';
import { TableData, FileHeaders, AppDisplayMode, PivotReportState, ChartState, initialChartState, DashboardWidget, RecentProject } from '../types';

interface DataContextType {
  tableData: TableData;
  setTableData: React.Dispatch<React.SetStateAction<TableData>>;
  fileHeaders: FileHeaders;
  setFileHeaders: React.Dispatch<React.SetStateAction<FileHeaders>>;
  interfaceDisplayMode: AppDisplayMode;
  setInterfaceDisplayMode: React.Dispatch<React.SetStateAction<AppDisplayMode>>;
  
  pivotSourceData: TableData | null;
  setPivotSourceData: React.Dispatch<React.SetStateAction<TableData | null>>;
  
  statisticalAnalysisData: TableData | null;
  setStatisticalAnalysisData: React.Dispatch<React.SetStateAction<TableData | null>>;
  statisticalAnalysisVisibleColumns: Set<string> | null;
  setStatisticalAnalysisVisibleColumns: React.Dispatch<React.SetStateAction<Set<string> | null>>;
  
  // State for VisualizationView
  visualizationState: { chart1: ChartState; chart2: ChartState };
  setVisualizationState: React.Dispatch<React.SetStateAction<{ chart1: ChartState; chart2: ChartState }>>;
  
  // State for PivotTableView
  pivotReports: PivotReportState[];
  setPivotReports: React.Dispatch<React.SetStateAction<PivotReportState[]>>;
  activePivotId: string | null;
  setActivePivotId: React.Dispatch<React.SetStateAction<string | null>>;

  // State for DashboardView
  dashboardWidgets: DashboardWidget[];
  setDashboardWidgets: React.Dispatch<React.SetStateAction<DashboardWidget[]>>;

  // State for Recent Projects
  recentProjects: RecentProject[];
  setRecentProjects: React.Dispatch<React.SetStateAction<RecentProject[]>>;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [tableData, setTableData] = useState<TableData>([]);
  const [fileHeaders, setFileHeaders] = useState<FileHeaders>([]);
  const [interfaceDisplayMode, setInterfaceDisplayMode] = useState<AppDisplayMode>('normal');
  const [pivotSourceData, setPivotSourceData] = useState<TableData | null>(null);
  const [statisticalAnalysisData, setStatisticalAnalysisData] = useState<TableData | null>(null);
  const [statisticalAnalysisVisibleColumns, setStatisticalAnalysisVisibleColumns] = useState<Set<string> | null>(null);
  
  // Centralized state for views
  const [visualizationState, setVisualizationState] = useState({
    chart1: initialChartState,
    chart2: { ...initialChartState, chartOptions: {...initialChartState.chartOptions, chartStyleId: 'cyberpunkNight'} }
  });
  const [pivotReports, setPivotReports] = useState<PivotReportState[]>([]);
  const [activePivotId, setActivePivotId] = useState<string | null>(null);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);


  return (
    <DataContext.Provider value={{ 
      tableData, setTableData, 
      fileHeaders, setFileHeaders,
      interfaceDisplayMode, setInterfaceDisplayMode,
      pivotSourceData, setPivotSourceData,
      statisticalAnalysisData, setStatisticalAnalysisData,
      statisticalAnalysisVisibleColumns, setStatisticalAnalysisVisibleColumns,
      visualizationState, setVisualizationState,
      pivotReports, setPivotReports,
      activePivotId, setActivePivotId,
      dashboardWidgets, setDashboardWidgets,
      recentProjects, setRecentProjects
    }}>
      {children}
    </DataContext.Provider>
  );
};
