
import React, { createContext, useState, ReactNode } from 'react';
import { TableData, FileHeaders, AppDisplayMode } from '../types';

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
}

export const DataContext = createContext<DataContextType>({
  tableData: [],
  setTableData: () => {},
  fileHeaders: [],
  setFileHeaders: () => {},
  interfaceDisplayMode: 'normal',
  setInterfaceDisplayMode: () => {},
  pivotSourceData: null,
  setPivotSourceData: () => {},
  statisticalAnalysisData: null,
  setStatisticalAnalysisData: () => {},
  statisticalAnalysisVisibleColumns: null,
  setStatisticalAnalysisVisibleColumns: () => {},
});

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

  return (
    <DataContext.Provider value={{ 
      tableData, setTableData, 
      fileHeaders, setFileHeaders,
      interfaceDisplayMode, setInterfaceDisplayMode,
      pivotSourceData, setPivotSourceData,
      statisticalAnalysisData, setStatisticalAnalysisData,
      statisticalAnalysisVisibleColumns, setStatisticalAnalysisVisibleColumns
    }}>
      {children}
    </DataContext.Provider>
  );
};
