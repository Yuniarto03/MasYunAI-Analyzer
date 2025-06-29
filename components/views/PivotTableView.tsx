import React, { useState, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { DataContext } from '../../contexts/DataContext';
import { 
    TableRow, FileHeaders, PivotResult, AggregatorType, PivotConfig, PivotHeaderGroup, 
    ChartDataItem, PivotTableUISettings, DEFAULT_PIVOT_UI_SETTINGS, PivotChartType,
    PivotValueFieldConfig, PivotFilterConfig, CalculatedFieldDef, PivotReportState
} from '../../types';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { PIVOT_THEMES } from '../../constants';
import { CalculatedFieldManagerModal } from './CalculatedFieldManagerModal';

const CHART_TYPES: PivotChartType[] = ['bar', 'line', 'pie', 'area', 'donut', 'horizontalBar', 'butterfly'];

// --- START Icon Placeholders ---
const AnalyzeIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75L3 17.25m3.375-1.5L6.75 17.25m8.885-11.218c.244.243.49.48.731.714m-2.253-2.253c.22.22.433.435.64.643m-11.218 8.885c.243-.244.48-.49.714-.731m2.253 2.253c.22-.22.435-.433.643-.64M12 3v2.25m0 13.5V21m-6.75-12H3m18 0h-2.25m-13.5 9H3m18 0h-2.25M12 6.75A5.25 5.25 0 1012 17.25 5.25 5.25 0 0012 6.75z" /></svg>;
const ResetIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.696a8.25 8.25 0 00-11.664 0l-3.181 3.183" /></svg>;
const CloseIcon: React.FC<{className?: string}> = ({className = "w-3 h-3"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const ChartIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m-5.25-1.5L9 3.75 12 3m0 0l3 3.75m3-3.75L15 6.75m-3 0v3m0 6v3m6-3v3m-6-3h-3m6 0h3" /></svg>;
const ExpandAllIcon: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6H9m6.75 0L21 9m-5.25 0L21 15M3.75 15H9m-5.25 0L9 9m0 6l-5.25-5.25m16.5 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>;
const CollapseAllIcon: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25m9-5.25H21M15 9l5.25-5.25M15 15H9m5.25 0l5.25 5.25M3.75 9H9m-5.25 0L9 15m0-6L3.75 3.75m11.25 11.25V21M15 15h4.5m-4.5 0l5.25 5.25" /></svg>;
const FilterIcon: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>;
const PlusIcon: React.FC<{className?: string}> = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const CalculatorIcon: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h3m-3-3v3m0-3V7m0 3H9m6 0h3m-3 3h3m-6-3h.01M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01M9 16h.01M12 16h.01M15 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const DrilldownIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
// --- END Icon Placeholders ---


type CellValue = TableRow[string]; 
type ValuesForOneField = CellValue[];
type AggregatedValuesMapValue = ValuesForOneField[];

const createNewReportState = (name: string): PivotReportState => ({
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    name,
    config: { rowFields: [], colFields: [], valueFields: [], filters: [] },
    calculatedFieldDefinitions: [],
    pivotResult: null,
    expandedRows: {},
    uiSettings: { ...DEFAULT_PIVOT_UI_SETTINGS },
});


const isNumeric = (value: any): boolean => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return false;
  const numericString = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
  const num = parseFloat(numericString);
  return !isNaN(num) && isFinite(num);
};


const formatCellValue = (value: any, settings: PivotTableUISettings): string => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return settings.emptyCellText;
    }
    let numToFormat: number | null = null;
    if (typeof value === 'number') {
        numToFormat = value;
    } else if (typeof value === 'string') {
        const cleanedValue = value.replace(/,/g, ''); 
        if (isNumeric(cleanedValue)) { 
            numToFormat = parseFloat(cleanedValue);
        }
    }

    if (numToFormat !== null) {
        return numToFormat.toLocaleString(undefined, {
            minimumFractionDigits: settings.decimalPlaces,
            maximumFractionDigits: settings.decimalPlaces,
            useGrouping: settings.useThousandsSeparator,
        });
    }
    return String(value);
};


// --- Filter Modal Component ---
const FilterValuesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (field: string, selectedValues: (string | number)[]) => void;
    field: string;
    allValues: (string | number)[];
    currentSelection: (string | number)[];
}> = ({ isOpen, onClose, onSave, field, allValues, currentSelection }) => {
    const [selection, setSelection] = useState<(string | number)[]>(currentSelection);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSelection(currentSelection);
    }, [currentSelection, isOpen]);

    if (!isOpen) return null;

    const filteredValues = allValues.filter(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));

    const handleToggle = (value: string | number) => {
        setSelection(prev => 
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    const handleSelectAll = () => setSelection(filteredValues);
    const handleDeselectAll = () => setSelection([]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1060] p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-fuchsia-700/70 rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-fuchsia-300 mb-4">Filter: <span className="text-white">{field}</span></h3>
                <input
                    type="text"
                    placeholder="Search values..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 mb-3"
                />
                <div className="flex space-x-2 mb-3">
                    <button onClick={handleSelectAll} className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">Select All Visible</button>
                    <button onClick={handleDeselectAll} className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">Deselect All</button>
                </div>
                <ul className="flex-1 overflow-y-auto space-y-1 pr-2">
                    {filteredValues.map(val => (
                        <li key={String(val)}>
                            <label className="flex items-center space-x-3 p-1 rounded hover:bg-gray-700/50 cursor-pointer">
                                <input type="checkbox" checked={selection.includes(val)} onChange={() => handleToggle(val)} className="h-4 w-4 text-fuchsia-500 bg-gray-700 border-gray-600 rounded focus:ring-fuchsia-400" />
                                <span className="text-gray-300 text-sm">{String(val)}</span>
                            </label>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-end space-x-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
                    <button onClick={() => onSave(field, selection)} className="px-4 py-2 text-sm text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-md">Apply Filter</button>
                </div>
            </div>
        </div>
    );
};

const chartTooltipProps = {
    wrapperClassName: "!shadow-xl !rounded-lg !border-none",
    contentStyle: {
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.5), rgba(34, 197, 94, 0.5), rgba(217, 70, 239, 0.5))',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '0.5rem',
    },
    itemStyle: { color: '#f0f0f0', textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
    labelStyle: { color: '#ffffff', fontWeight: 'bold' },
};


export const PivotTableView: React.FC = () => {
  const { tableData, fileHeaders, pivotSourceData, setPivotSourceData } = useContext(DataContext); 

  const [pivotReports, setPivotReports] = useState<PivotReportState[]>([]);
  const [activePivotId, setActivePivotId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentDataMap, setCurrentDataMap] = useState<Map<string, AggregatedValuesMapValue>>(new Map());
  
  const [selectedAvailableField, setSelectedAvailableField] = useState<string | null>(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterModalField, setFilterModalField] = useState<string>('');
  
  const [renamingReportId, setRenamingReportId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [isCalcFieldModalOpen, setIsCalcFieldModalOpen] = useState(false);

  const activePivot = useMemo(() => pivotReports.find(p => p.id === activePivotId), [pivotReports, activePivotId]);
  
  const updateActivePivot = useCallback((updater: (prev: PivotReportState) => PivotReportState) => {
    setPivotReports(prevReports =>
      prevReports.map(report =>
        report.id === activePivotId ? updater(report) : report
      )
    );
  }, [activePivotId]);

  const aggregate = useCallback((valuesArray: CellValue[], aggregatorType: AggregatorType, fieldIsTextual: boolean): number | string | undefined => {
    let currentAggregator = aggregatorType;
    if (fieldIsTextual && currentAggregator !== 'countNonEmpty' && currentAggregator !== 'count') {
       currentAggregator = 'countNonEmpty';
    }

    const numericValues = valuesArray.map(v => {
      if (v === null || v === undefined) return NaN;
      if (typeof v === 'string') {
          const cleanedV = v.replace(/,/g, ''); 
          return parseFloat(cleanedV);
      }
      return parseFloat(String(v));
    }).filter(v => !isNaN(v) && isFinite(v));
    
    const nonEmptyValues = valuesArray.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    
    switch (currentAggregator) {
      case 'sum':
        return numericValues.length > 0 ? numericValues.reduce((s, a) => s + a, 0) : undefined;
      case 'count':
        return valuesArray.length; 
      case 'countNonEmpty':
        return nonEmptyValues.length;
      case 'average':
        return numericValues.length > 0 ? numericValues.reduce((s, a) => s + a, 0) / numericValues.length : undefined;
      case 'min':
        return numericValues.length > 0 ? Math.min(...numericValues) : undefined;
      case 'max':
        return numericValues.length > 0 ? Math.max(...numericValues) : undefined;
      default:
        return undefined;
    }
  }, []);

  const isValueFieldTextual = useCallback((field: string, data: TableRow[]): boolean => {
    if (!data || data.length === 0) return false;
    // Check against original headers, not calculated fields, for textual check
    if (!fileHeaders.includes(field)) return false; 
    return data.some(row => {
      const val = row[field];
      return typeof val === 'string' && !isNumeric(val);
    });
  }, [fileHeaders]);

  const getAllPossibleRowKeys = useCallback((structure: PivotHeaderGroup[]): string[] => {
      let keys: string[] = [];
      const recurse = (groups: PivotHeaderGroup[], currentPath: string[] = []) => {
          for (const group of groups) {
              const newPath = [...currentPath, group.name];
              const canBeExpanded = group.subGroups && group.subGroups.length > 0 && !group.subGroups.every(sg => sg.valueFieldLabel);
              if (canBeExpanded) {
                  keys.push(newPath.join('|'));
                  recurse(group.subGroups, newPath);
              }
          }
      };
      recurse(structure);
      return keys;
  }, []);

    // --- EFFECT FOR GENERATING PIVOT FROM DataTableView ---
    useEffect(() => {
        if (pivotSourceData && pivotSourceData.length > 0) {
            setIsLoading(true);
            
            // This logic is a self-contained version of generatePivotData, using pivotSourceData
            setTimeout(() => {
                try {
                    const dataToUse = pivotSourceData;
                    const sourceHeaders = Object.keys(dataToUse[0] || {});

                    const reportName = `Report from Table (${pivotReports.length + 1})`;
                    const newReport = createNewReportState(reportName);
                    
                    // Auto-configure fields
                    const numeric = sourceHeaders.filter(h => isValueFieldTextual(h, dataToUse) === false);
                    const categoric = sourceHeaders.filter(h => isValueFieldTextual(h, dataToUse) === true);
                    
                    if(categoric.length > 0) newReport.config.rowFields.push(categoric[0]);
                    if(categoric.length > 1) newReport.config.colFields.push(categoric[1]);
                    if(numeric.length > 0) newReport.config.valueFields.push({ field: numeric[0], aggregator: 'sum', displayName: numeric[0]});
                    
                    if (newReport.config.valueFields.length === 0 && categoric.length > 0) {
                         newReport.config.valueFields.push({ field: categoric[0], aggregator: 'countNonEmpty', displayName: `Count of ${categoric[0]}`});
                    }
                    
                    if (newReport.config.valueFields.length === 0) {
                        setPivotSourceData(null);
                        setIsLoading(false);
                        setError("Could not auto-configure pivot. Please configure manually.");
                        return;
                    }
                    
                    // --- Start: Duplicated pivot logic ---
                    const localDataMap = new Map<string, AggregatedValuesMapValue>(); 
                    dataToUse.forEach(row => { 
                        const rowKeyParts = newReport.config.rowFields.map(rf => String(row[rf] ?? 'N/A'));
                        const colKeyParts = newReport.config.colFields.map(cf => String(row[cf] ?? 'N/A'));
                        const valuesForFields = newReport.config.valueFields.map(vfConfig => row[vfConfig.field]);
                        const mapKey = `${rowKeyParts.join('|') || '_TOTAL_'}#${colKeyParts.join('|') || '_TOTAL_'}`;
                        if (!localDataMap.has(mapKey)) {
                            localDataMap.set(mapKey, Array.from({ length: newReport.config.valueFields.length }, () => [] as ValuesForOneField));
                        }
                        const fieldAggregations = localDataMap.get(mapKey)!;
                        valuesForFields.forEach((val, idx) => { fieldAggregations[idx].push(val); });
                    });
                    
                    const buildHeaderStructureRecursive = (fields: string[], isRowDimension: boolean, currentPath: string[] = []): PivotHeaderGroup[] => {
                        if (fields.length === 0) return [];
                        const level = currentPath.length;
                        const field = fields[level];
                        if (!field) return [];
                        const uniqueValuesForField = Array.from(new Set(dataToUse.map(row => String(row[field] ?? 'N/A')))).sort();
                        return uniqueValuesForField.map(value => {
                            const newPath = [...currentPath, value];
                            const group: PivotHeaderGroup = { key: newPath.join('|'), name: value, level: level };
                            if (level < fields.length - 1) {
                                group.subGroups = buildHeaderStructureRecursive(fields, isRowDimension, newPath);
                            } else if (!isRowDimension && newReport.config.valueFields.length > 0) {
                                group.subGroups = newReport.config.valueFields.map(vfConfig => ({ key: `${newPath.join('|')}|${vfConfig.field}`, name: vfConfig.displayName || vfConfig.field, level: level + 1, valueFieldLabel: vfConfig.field }));
                            }
                            return group;
                        });
                    };
                    const rowStructure = newReport.config.rowFields.length > 0 ? buildHeaderStructureRecursive(newReport.config.rowFields, true) : [];
                    let colStructure = newReport.config.colFields.length > 0 ? buildHeaderStructureRecursive(newReport.config.colFields, false) : (newReport.config.valueFields.map(vf => ({ key: vf.field, name: vf.displayName || vf.field, level: 0, valueFieldLabel: vf.field })));
                    
                    const getFlatKeys = (structure: PivotHeaderGroup[], currentPath: string[] = []): string[][] => {
                        let keys: string[][] = [];
                        for (const group of structure) {
                            if (group.valueFieldLabel) continue;
                            const newPath = [...currentPath, group.name];
                            keys.push(newPath);
                            if (group.subGroups && group.subGroups.some(sg => !sg.valueFieldLabel)) {
                                keys = keys.concat(getFlatKeys(group.subGroups, newPath));
                            }
                        }
                        return keys;
                    };
                    const uniqueFlatRowKeys = newReport.config.rowFields.length > 0 ? getFlatKeys(rowStructure) : [['_TOTAL_']];
                    const uniqueFlatColKeys = newReport.config.colFields.length > 0 ? getFlatKeys(colStructure) : [['_TOTAL_']];

                    const dataMatrix = uniqueFlatRowKeys.map(rPath => {
                        return uniqueFlatColKeys.map(cPath => {
                            return (localDataMap.get(`${rPath.join('|')}#${cPath.join('|')}`) || []).map((values, vfIndex) => aggregate(values, newReport.config.valueFields[vfIndex].aggregator, isValueFieldTextual(newReport.config.valueFields[vfIndex].field, dataToUse)));
                        });
                    });
                     // Simplified chart data for direct generation
                    let chartData: ChartDataItem[] | undefined;
                    if (uniqueFlatRowKeys.length > 0 && dataMatrix.length > 0 && newReport.config.valueFields.length > 0) {
                       chartData = uniqueFlatRowKeys.map((rPath, rowIndex) => {
                            const name = rPath.join(' / ') !== '_TOTAL_' ? rPath.join(' / ') : "Total";
                            const chartItem: ChartDataItem = { name };
                            uniqueFlatColKeys.forEach((cPath, cIndex) => {
                                const val = dataMatrix[rowIndex]?.[cIndex]?.[0];
                                if (isNumeric(val)) {
                                    const colName = cPath.join(' / ');
                                    const keyName = uniqueFlatColKeys.length === 1 && colName === '_TOTAL_' ? (newReport.config.valueFields[0].displayName || newReport.config.valueFields[0].field) : `${colName} - ${newReport.config.valueFields[0].displayName || newReport.config.valueFields[0].field}`;
                                    chartItem[keyName] = Number(val);
                                }
                            });
                            return chartItem;
                        }).filter(item => Object.keys(item).length > 1);
                    }
                    
                    const result: PivotResult = {
                      config: newReport.config, rowStructure, colStructure, dataMatrix,
                      uniqueFlatRowKeys, uniqueFlatColKeys, grandTotalRow: [], rowSubTotals: {}, chartData,
                      effectiveColStructureForHeaders: colStructure 
                    };
                    
                    newReport.pivotResult = result;
                    newReport.expandedRows = {};
                    const allKeys = getAllPossibleRowKeys(result.rowStructure);
                    allKeys.forEach(key => newReport.expandedRows[key] = true);
                    // --- End: Duplicated pivot logic ---

                    setPivotReports(prev => [...prev, newReport]);
                    setActivePivotId(newReport.id);
                } catch (e: any) {
                    setError(`Failed to auto-generate pivot: ${e.message}`);
                } finally {
                    setPivotSourceData(null); // Clean up
                    setIsLoading(false);
                }
            }, 100);
        }
    }, [pivotSourceData, setPivotSourceData, aggregate, isValueFieldTextual, getAllPossibleRowKeys, pivotReports.length]);


  useEffect(() => {
    if (fileHeaders.length > 0 && pivotReports.length === 0) {
        const initialReport = createNewReportState("Untitled Report 1");
        setPivotReports([initialReport]);
        setActivePivotId(initialReport.id);
    }
  }, [fileHeaders, pivotReports.length]);
  
  useEffect(() => {
    if (renamingReportId && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [renamingReportId]);

  
  const setConfig = useCallback((newConfig: PivotConfig) => {
      updateActivePivot(prev => ({...prev, config: newConfig, pivotResult: null}));
  }, [updateActivePivot]);

  const setCalculatedFieldDefinitions = useCallback((newDefs: CalculatedFieldDef[]) => {
      updateActivePivot(prev => ({...prev, calculatedFieldDefinitions: newDefs, pivotResult: null}));
  }, [updateActivePivot]);
  
  const setExpandedRows = useCallback((newExpandedRows: {[key: string]: boolean}) => {
      updateActivePivot(prev => ({...prev, expandedRows: newExpandedRows}));
  }, [updateActivePivot]);
  
  const setUiSettings = useCallback((newUiSettings: PivotTableUISettings) => {
      updateActivePivot(prev => ({...prev, uiSettings: newUiSettings}));
  }, [updateActivePivot]);


  const config = useMemo(() => activePivot?.config ?? { rowFields: [], colFields: [], valueFields: [], filters: [] }, [activePivot]);
  const calculatedFieldDefinitions = useMemo(() => activePivot?.calculatedFieldDefinitions ?? [], [activePivot]);
  const pivotResult = useMemo(() => activePivot?.pivotResult ?? null, [activePivot]);
  const expandedRows = useMemo(() => activePivot?.expandedRows ?? {}, [activePivot]);
  const uiSettings = useMemo(() => activePivot?.uiSettings ?? DEFAULT_PIVOT_UI_SETTINGS, [activePivot]);
  const currentTheme = useMemo(() => PIVOT_THEMES[uiSettings.theme] || PIVOT_THEMES.vibrantHologram, [uiSettings.theme]);


  const allHeadersAsOptions = useMemo(() => {
    const baseHeaders = fileHeaders || [];
    const calcFieldNames = calculatedFieldDefinitions.map(cf => cf.name);
    return Array.from(new Set([...baseHeaders, ...calcFieldNames]));
  }, [fileHeaders, calculatedFieldDefinitions]);

  const availableFieldsForConfig = useMemo(() => allHeadersAsOptions.filter(h => 
    !config.rowFields.includes(h) && 
    !config.colFields.includes(h) && 
    !config.valueFields.some(vf => vf.field === h) &&
    !(config.filters || []).some(f => f.field === h)
  ), [allHeadersAsOptions, config]);

  
  const generatePivotData = useCallback(() => {
    if (!activePivot || config.valueFields.length === 0 || tableData.length === 0) {
      setError("Please add at least one Value Field to generate a report.");
      setTimeout(() => setError(null), 3000);
      updateActivePivot(prev => ({...prev, pivotResult: null}));
      return;
    }
    
    setIsLoading(true);
    setError(null);

    setTimeout(() => { 
      try {
        let augmentedData = [...tableData];
        if (calculatedFieldDefinitions.length > 0) {
          augmentedData = tableData.map(originalRow => {
            const rowWithCalcs = { ...originalRow };
            for (const cf of calculatedFieldDefinitions) {
              try {
                let formulaExpression = cf.formula;
                const fieldRegex = /\[(.*?)\]/g;
                
                const referencedFieldsInFormula: string[] = [];
                let match;
                while ((match = fieldRegex.exec(cf.formula)) !== null) {
                    if (!referencedFieldsInFormula.includes(match[1])) {
                        referencedFieldsInFormula.push(match[1]);
                    }
                }
                
                formulaExpression = cf.formula.replace(fieldRegex, (_match, fieldName) => fieldName.replace(/[^a-zA-Z0-9_]/g, '_'));
                
                const argNames = referencedFieldsInFormula.map(f => f.replace(/[^a-zA-Z0-9_]/g, '_'));
                const argValues = referencedFieldsInFormula.map(fieldName => {
                    const val = originalRow[fieldName];
                    return isNumeric(val) ? Number(String(val).replace(/,/g, '')) : (val === undefined || val === null ? 0 : val) ;
                });

                const evaluator = new Function(...argNames, `try { return ${formulaExpression}; } catch(e) { return undefined; }`);
                const calculatedValue = evaluator(...argValues);
                rowWithCalcs[cf.name] = calculatedValue;

              } catch (e: any) {
                rowWithCalcs[cf.name] = undefined; 
              }
            }
            return rowWithCalcs;
          });
        }

        let filteredData = [...augmentedData];
        if (config.filters && config.filters.length > 0) {
            config.filters.forEach(filter => {
                if (filter.selectedValues.length > 0) {
                    filteredData = filteredData.filter(row => {
                        const rowValue = String(row[filter.field] ?? 'N/A'); 
                        return filter.selectedValues.some(selectedValue => String(selectedValue) === rowValue);
                    });
                }
            });
        }
        if (filteredData.length === 0) {
            setError("No data matches the current filter criteria.");
            updateActivePivot(prev => ({...prev, pivotResult: null}));
            setIsLoading(false);
            return;
        }

        const localDataMap = new Map<string, AggregatedValuesMapValue>(); 

        filteredData.forEach(row => { 
          const rowKeyParts = config.rowFields.map(rf => String(row[rf] ?? 'N/A')); 
          const colKeyParts = config.colFields.map(cf => String(row[cf] ?? 'N/A')); 
          const valuesForFields = config.valueFields.map(vfConfig => row[vfConfig.field]);
          const updateMap = (rKey: string, cKey: string) => {
            const mapKey = `${rKey}#${cKey}`;
            if (!localDataMap.has(mapKey)) {
              localDataMap.set(mapKey, Array.from({ length: config.valueFields.length }, () => [] as ValuesForOneField));
            }
            const fieldAggregations = localDataMap.get(mapKey)!;
            valuesForFields.forEach((val, idx) => { fieldAggregations[idx].push(val); });
          };
          const specificRowKey = rowKeyParts.join('|') || '_TOTAL_'; 
          const specificColKey = colKeyParts.join('|') || '_TOTAL_'; 
          updateMap(specificRowKey, specificColKey); 
          for (let r = 0; r < config.rowFields.length; r++) {
              const subRowKey = rowKeyParts.slice(0, r + 1).join('|');
              updateMap(subRowKey, specificColKey); 
              updateMap(subRowKey, '_TOTAL_');     
          }
           for (let c = 0; c < config.colFields.length; c++) {
              const subColKey = colKeyParts.slice(0, c + 1).join('|');
              updateMap(specificRowKey, subColKey); 
              updateMap('_TOTAL_', subColKey);     
          }
          updateMap(specificRowKey, '_TOTAL_'); 
          updateMap('_TOTAL_', specificColKey); 
          updateMap('_TOTAL_', '_TOTAL_');     
        });
        
        setCurrentDataMap(localDataMap); 

        const buildHeaderStructureRecursive = (fields: string[], isRowDimension: boolean, currentPath: string[] = []): PivotHeaderGroup[] => {
            if (fields.length === 0 && !isRowDimension && config.valueFields.length > 0) { 
              return config.valueFields.map(vfConfig => ({ key: vfConfig.field, name: vfConfig.displayName || vfConfig.field, level: currentPath.length, valueFieldLabel: vfConfig.field }));
            }
            if (fields.length === 0) return []; 

            const level = currentPath.length;
            const field = fields[level]; 
            if (!field) return []; 
            
            const uniqueValuesForField = Array.from(new Set(filteredData.map(row => String(row[field] ?? 'N/A')))).sort();

            return uniqueValuesForField.map(value => {
                const newPath = [...currentPath, value];
                const newPathKey = newPath.join('|');
                const group: PivotHeaderGroup = { key: newPathKey, name: value, level: level };
                if (level < fields.length - 1) { 
                    group.subGroups = buildHeaderStructureRecursive(fields, isRowDimension, newPath);
                } else if (!isRowDimension && config.valueFields.length > 0) { 
                    group.subGroups = config.valueFields.map(vfConfig => ({ key: `${newPathKey}|${vfConfig.field}`, name: vfConfig.displayName || vfConfig.field, level: level + 1, valueFieldLabel: vfConfig.field }));
                }
                return group;
            });
        };
        
        const rowStructure = config.rowFields.length > 0 ? buildHeaderStructureRecursive(config.rowFields, true) : []; 
        let colStructure = config.colFields.length > 0 ? buildHeaderStructureRecursive(config.colFields, false) : []; 

        if (config.colFields.length === 0 && config.valueFields.length > 0) {
            colStructure = config.valueFields.map(vfConfig => ({ key: vfConfig.field, name: vfConfig.displayName || vfConfig.field, level: 0, valueFieldLabel: vfConfig.field }));
        }

        const findGroup = (structure: PivotHeaderGroup[], path: string[]): PivotHeaderGroup | undefined => {
            let currentLevelGroups = structure;
            let foundGroup: PivotHeaderGroup | undefined;
            for (let i = 0; i < path.length; i++) {
                foundGroup = currentLevelGroups.find(g => g.name === path[i]);
                if (!foundGroup || !foundGroup.subGroups) break;
                currentLevelGroups = foundGroup.subGroups;
            }
            return foundGroup;
        };
        
        const getFlatKeys = (structure: PivotHeaderGroup[], currentPath: string[] = []): string[][] => {
            let keys: string[][] = [];
            for (const group of structure) {
                if (group.valueFieldLabel) continue;
                const newPath = [...currentPath, group.name];
                keys.push(newPath);
                if (group.subGroups && group.subGroups.length > 0) {
                    const hasNonValueSubGroups = group.subGroups.some(sg => !sg.valueFieldLabel);
                    if (hasNonValueSubGroups) {
                        keys = keys.concat(getFlatKeys(group.subGroups, newPath));
                    }
                }
            }
            return keys;
        };
        
        const uniqueFlatRowKeys = config.rowFields.length > 0 
          ? getFlatKeys(rowStructure) 
          : [['_TOTAL_']]; 

        const uniqueFlatColKeys = config.colFields.length > 0 ? getFlatKeys(colStructure) : [['_TOTAL_']];

        const dataMatrix = uniqueFlatRowKeys.map(rPath => {
            const rKeyForMap = rPath.join('|');
            return uniqueFlatColKeys.map(cPath => {
                const cKeyForMap = cPath.join('|');
                return (localDataMap.get(`${rKeyForMap}#${cKeyForMap}`) || Array.from({ length: config.valueFields.length }, () => [] as ValuesForOneField) )
                    .map((values, vfIndex) => {
                        const vfConfig = config.valueFields[vfIndex];
                        return aggregate(values, vfConfig.aggregator, isValueFieldTextual(vfConfig.field, augmentedData)); 
                    });
            });
        });
        
        const grandTotalRowValues = uniqueFlatColKeys.flatMap(cPath => { 
            const cKeyForMap = cPath.join('|');
             return (localDataMap.get(`_TOTAL_#${cKeyForMap}`) || Array.from({ length: config.valueFields.length }, () => [] as ValuesForOneField))
                .map((values, vfIndex) => {
                    const vfConfig = config.valueFields[vfIndex];
                    return aggregate(values, vfConfig.aggregator, isValueFieldTextual(vfConfig.field, augmentedData));
                });
        });

        if (config.rowFields.length > 0 || config.colFields.length > 0 || (config.colFields.length === 0 && config.valueFields.length > 1)) {
            const overallGrandTotals = (localDataMap.get('_TOTAL_#_TOTAL_') || Array.from({ length: config.valueFields.length }, () => [] as ValuesForOneField))
                .map((values, vfIndex) => {
                    const vfConfig = config.valueFields[vfIndex];
                    return aggregate(values, vfConfig.aggregator, isValueFieldTextual(vfConfig.field, augmentedData));
                });
            grandTotalRowValues.push(...overallGrandTotals);
        }
        
        const rowSubTotalsResult: PivotResult['rowSubTotals'] = {};
        if (config.rowFields.length > 0) {
            const allPossibleFlatRowKeysForSubtotals = getFlatKeys(rowStructure); 
            allPossibleFlatRowKeysForSubtotals.forEach(rPath => {
                const rKeyForMap = rPath.join('|');
                if (rPath.length < config.rowFields.length) { 
                    const subtotalForCols = uniqueFlatColKeys.flatMap(cPath => {
                        const cKeyForMap = cPath.join('|');
                        return (localDataMap.get(`${rKeyForMap}#${cKeyForMap}`) || Array.from({ length: config.valueFields.length }, () => [] as ValuesForOneField))
                            .map((values, vfIndex) => aggregate(values, config.valueFields[vfIndex].aggregator, isValueFieldTextual(config.valueFields[vfIndex].field, augmentedData)));
                    });
                    const subtotalRowTotals = (localDataMap.get(`${rKeyForMap}#_TOTAL_`) || Array.from({ length: config.valueFields.length }, () => [] as ValuesForOneField))
                        .map((values, vfIndex) => aggregate(values, config.valueFields[vfIndex].aggregator, isValueFieldTextual(config.valueFields[vfIndex].field, augmentedData)));
                    rowSubTotalsResult[rKeyForMap] = [...subtotalForCols, ...subtotalRowTotals];
                }
            });
        }
        
        let chartData: ChartDataItem[] | undefined;
        if (uniqueFlatRowKeys.length > 0 && dataMatrix.length > 0 && config.valueFields.length > 0) {
            const firstValueFieldConfig = config.valueFields[0];
            const firstValueFieldDisplayName = firstValueFieldConfig.displayName || firstValueFieldConfig.field;
            const useRowLabel = uniqueFlatRowKeys[0].join('|') !== '_TOTAL_';

            chartData = uniqueFlatRowKeys.map((rPath, rowIndex) => {
                const name = useRowLabel ? rPath.join(' / ') : "Total";
                const chartItem: ChartDataItem = { name };
                uniqueFlatColKeys.forEach((cPath, cIndex) => {
                    const val = dataMatrix[rowIndex]?.[cIndex]?.[0]; 
                    if (isNumeric(val)) { 
                        const colName = cPath.join(' / ');
                        const chartDataKey = (uniqueFlatColKeys.length === 1 && uniqueFlatColKeys[0].join('|') === '_TOTAL_') || uniqueFlatColKeys.length === 0 
                                              ? firstValueFieldDisplayName 
                                              : `${colName} - ${firstValueFieldDisplayName}`;
                        chartItem[chartDataKey] = parseFloat(String(val).replace(/,/g, ''));
                    }
                });
                return chartItem;
            }).filter(item => Object.keys(item).length > 1 && (useRowLabel ? item.name !== '_TOTAL_' : true) ); 
        }

        const result: PivotResult = {
          config, rowStructure, colStructure, dataMatrix,
          uniqueFlatRowKeys, uniqueFlatColKeys,
          grandTotalRow: grandTotalRowValues, 
          rowSubTotals: rowSubTotalsResult,
          chartData,
          effectiveColStructureForHeaders: colStructure 
        };

        const allRowKeys = getAllPossibleRowKeys(rowStructure);
        const newExpandedRows: { [key: string]: boolean } = {};
        allRowKeys.forEach(key => { newExpandedRows[key] = true; });

        updateActivePivot(prev => ({
            ...prev,
            pivotResult: result,
            expandedRows: prev.config.rowFields.length > 0 ? newExpandedRows : {},
        }));

      } catch (e: any) {
        console.error("Error generating pivot data:", e);
        setError(`Failed to generate pivot table: ${e.message || 'Unknown error'}`);
        updateActivePivot(prev => ({ ...prev, pivotResult: null }));
      } finally {
        setIsLoading(false);
      }
    }, 100); 
  }, [activePivot, config, tableData, aggregate, isValueFieldTextual, calculatedFieldDefinitions, updateActivePivot, getAllPossibleRowKeys]); 

  const handleAddFieldToZone = (target: 'rowFields' | 'colFields' | 'valueFields' | 'filters') => {
      if (!selectedAvailableField) return;
  
      const newConfig = { ...config };
      
      // Add to target
      if (target === 'valueFields') {
          const isText = isValueFieldTextual(selectedAvailableField, tableData);
          const defaultAggregator: AggregatorType = isText ? 'countNonEmpty' : 'sum';
          newConfig.valueFields = [...newConfig.valueFields, { field: selectedAvailableField, aggregator: defaultAggregator, displayName: selectedAvailableField }];
      } else if (target === 'filters') {
          newConfig.filters = [...(newConfig.filters || []), { field: selectedAvailableField, selectedValues: [] }];
      } else {
          newConfig[target] = [...newConfig[target], selectedAvailableField];
      }
  
      setConfig(newConfig);
      setSelectedAvailableField(null); // Deselect after adding
  };
  
  const getUniqueValuesForField = useCallback((field: string): (string | number)[] => {
    if (!tableData || tableData.length === 0 || !field) return [];
    const uniqueValues = new Set<string | number>();
    tableData.forEach(row => {
        const val = row[field];
        if (val !== null && val !== undefined && val !== '') {
            if (typeof val === 'string' || typeof val === 'number') {
                uniqueValues.add(val);
            } else if (val instanceof Date) {
                uniqueValues.add(val.toISOString().split('T')[0]);
            }
             else {
                uniqueValues.add(String(val));
            }
        }
    });
    return Array.from(uniqueValues).sort((a,b) => String(a).localeCompare(String(b)));
  }, [tableData]);

  const generatedTheadRows: React.ReactNode[] = useMemo(() => {
    if (!pivotResult || !pivotResult.effectiveColStructureForHeaders) return [];

    const newTheadRows: React.ReactNode[] = [];
    const maxColLevel = pivotResult.effectiveColStructureForHeaders.reduce((max, group) => {
        const countLevels = (g: PivotHeaderGroup, currentDepth = 0): number => {
            let maxDepth = currentDepth;
            if (g.subGroups) {
                g.subGroups.forEach(sg => { maxDepth = Math.max(maxDepth, countLevels(sg, currentDepth + 1)); });
            }
            return maxDepth;
        };
        return Math.max(max, countLevels(group));
    }, 0) + 1; 

    const numColHeaderLevels = maxColLevel > 0 ? maxColLevel : 1; 
    let baseThClasses = `px-3 py-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap`;
    if (uiSettings.compactMode) baseThClasses = `px-1.5 py-1 text-xs font-semibold uppercase tracking-wider whitespace-nowrap`;

    const countLeafValueFields = (group: PivotHeaderGroup): number => {
        if (group.valueFieldLabel) return 1; 
        if (!group.subGroups || group.subGroups.length === 0) return config.valueFields.length || 1; 
        return group.subGroups.reduce((sum, subGroup) => sum + countLeafValueFields(subGroup), 0);
    };

    const topLeftHeaderCell = (
        <th key="top-left-header" rowSpan={numColHeaderLevels} colSpan={1} 
            className={`${baseThClasses} ${currentTheme.tableClasses.headerRowDesc} text-center ${uiSettings.freezeRowHeaders ? 'sticky left-0 z-[15]' : ''}`}>
            {config.rowFields.length > 0 ? config.rowFields.join(' / ').toUpperCase() : (config.valueFields.length > 0 ? 'VALUES' : 'DIMENSIONS')}
        </th>
    );

    const colHeaderRowsJsx: JSX.Element[][] = Array.from({ length: numColHeaderLevels }, () => []);

    const buildColHeadersRecursive = (groups: PivotHeaderGroup[], currentLevel: number) => {
        groups.forEach(group => {
            const colSpan = countLeafValueFields(group);
            const rowSpan = (!group.subGroups || group.subGroups.length === 0 || group.valueFieldLabel) ? (numColHeaderLevels - currentLevel) : 1;
            colHeaderRowsJsx[currentLevel].push(
                <th key={`${group.key}-${currentLevel}`} colSpan={colSpan} rowSpan={rowSpan} className={`${baseThClasses} ${currentTheme.tableClasses.headerDefault} text-center`}>
                    {group.name} 
                </th>
            );
            if (group.subGroups && !group.valueFieldLabel) buildColHeadersRecursive(group.subGroups, currentLevel + 1);
        });
    };
    
    if (pivotResult.effectiveColStructureForHeaders.length > 0) buildColHeadersRecursive(pivotResult.effectiveColStructureForHeaders, 0);

    if (config.rowFields.length > 0 || config.colFields.length > 0 || (config.colFields.length === 0 && config.valueFields.length > 1) ) { 
       colHeaderRowsJsx[0].push( 
            <th key="col-total-header" rowSpan={numColHeaderLevels} colSpan={config.valueFields.length || 1} className={`${baseThClasses} ${currentTheme.tableClasses.headerGrandTotal} text-center`}>
                TOTAL
            </th>
        );
    }

    for (let i = 0; i < numColHeaderLevels; i++) {
        newTheadRows.push(
            <tr key={`thead-col-level-${i}`} role="row">
                {i === 0 && topLeftHeaderCell } 
                {colHeaderRowsJsx[i]}
            </tr>
        );
    }
    return newTheadRows;
  }, [pivotResult, config, uiSettings.compactMode, uiSettings.freezeRowHeaders, currentTheme]);

  const renderRow = (currentGroups: PivotHeaderGroup[], level: number = 0, parentKeyPath: string[] = [], isZebra: boolean = false): React.ReactNode[] => {
    if (!pivotResult) return [];
    let rows: React.ReactNode[] = [];
    let cellBaseClass = `whitespace-nowrap`;
    let headerCellBaseClass = `font-medium whitespace-nowrap`;
    
    if (uiSettings.compactMode) {
        cellBaseClass = `px-1.5 py-1 text-xs ${cellBaseClass}`;
        headerCellBaseClass = `px-1.5 py-1 text-xs ${headerCellBaseClass}`;
    } else {
        cellBaseClass = `px-3 py-2 text-sm ${cellBaseClass}`;
        headerCellBaseClass = `px-3 py-2 text-sm ${headerCellBaseClass}`;
    }

    if (uiSettings.freezeRowHeaders) headerCellBaseClass += ` sticky left-0 z-[5]`; 

    currentGroups.forEach((group) => {
        const currentFullKeyPath = [...parentKeyPath, group.name];
        const currentFullKeyString = currentFullKeyPath.join('|');
        const isExpanded = expandedRows[currentFullKeyString] ?? false; 
        
        let displayCells: React.ReactNode[] = [];
        const flatRowIndex = pivotResult.uniqueFlatRowKeys.findIndex(keys => keys.join('|') === currentFullKeyString);

        if (flatRowIndex !== -1 && (!group.subGroups || group.subGroups.length === 0 || !isExpanded || group.subGroups.every(sg => sg.valueFieldLabel))) {
             const rowCellGroupsData = pivotResult.dataMatrix[flatRowIndex] || []; 
             pivotResult.uniqueFlatColKeys.forEach((_cPath, colGroupIndex) => {
                 const valuesInCell = rowCellGroupsData[colGroupIndex] || []; 
                 config.valueFields.forEach((_vfConfig, vfIndex) => {
                     const value = valuesInCell[vfIndex];
                     const formattedValue = formatCellValue(value, uiSettings);
                     let valueClass = `${currentTheme.tableClasses.cellDefault} text-right`;
                     if (uiSettings.highlightNegativeValues && typeof value === 'number' && value < 0) valueClass += " !text-red-400"; 
                     if (pivotResult.uniqueFlatColKeys[colGroupIndex]?.join('|') === '_TOTAL_') valueClass = `${currentTheme.tableClasses.cellGrandTotal} text-right`;
                     displayCells.push(<td key={`cell-${flatRowIndex}-${colGroupIndex}-${vfIndex}`} className={`${cellBaseClass} ${valueClass}`}>{formattedValue}</td>);
                 });
             });

            if (config.rowFields.length > 0 || config.colFields.length > 0 || (config.colFields.length === 0 && config.valueFields.length > 1)) {
                const rowTotalsPerVf = (currentDataMap.get(`${currentFullKeyString}#_TOTAL_`) || Array.from({ length: config.valueFields.length }, () => [] as ValuesForOneField))
                    .map((values, vfIndex) => aggregate(values, config.valueFields[vfIndex].aggregator, isValueFieldTextual(config.valueFields[vfIndex].field, tableData)));
                rowTotalsPerVf.forEach((totalVal, vfIdx) => {
                    let rowTotalClass = `${currentTheme.tableClasses.cellGrandTotal} text-right`;
                    if (uiSettings.highlightNegativeValues && typeof totalVal === 'number' && totalVal < 0) rowTotalClass += " !text-red-400";
                    displayCells.push(<td key={`row-total-${flatRowIndex}-${vfIdx}`} className={`${cellBaseClass} ${rowTotalClass}`}>{formatCellValue(totalVal, uiSettings)}</td>);
                });
            }
        }

        let trClassName = `transition-colors group`;
        if (uiSettings.zebraStriping && isZebra) trClassName += ` ${currentTheme.tableClasses.zebraStripeClass}`; 

        const canExpand = group.subGroups && group.subGroups.length > 0 && !group.subGroups.every(sg => sg.valueFieldLabel);
        
        rows.push(
            <tr key={currentFullKeyString} className={trClassName} role="row">
                <td
                    style={{ paddingLeft: `${level * (uiSettings.compactMode ? 16 : 24) + (uiSettings.compactMode ? 6 : 12)}px` }}
                    className={`${headerCellBaseClass} ${currentTheme.tableClasses.cellRowHeader} ${canExpand ? 'pivot-row-header-clickable' : ''}`}
                    role="rowheader"
                    onClick={canExpand ? () => setExpandedRows({ ...expandedRows, [currentFullKeyString]: !isExpanded }) : undefined}
                >
                    <div className="flex items-center gap-2">
                        {canExpand ? (
                            <DrilldownIcon className={`w-3.5 h-3.5 text-sky-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        ) : (
                            <span className="w-3.5 h-3.5 flex-shrink-0"></span>
                        )}
                        <span className="truncate" title={group.name}>{group.name}</span>
                    </div>
                </td>
                {displayCells.length > 0 ? displayCells : <td colSpan={(pivotResult.uniqueFlatColKeys.length || 1) * (config.valueFields.length || 1) + (config.valueFields.length || 1)}></td>}
            </tr>
        );

        if (isExpanded && group.subGroups && group.subGroups.length > 0 && !group.subGroups.every(sg => sg.valueFieldLabel)) {
            rows.push(...renderRow(group.subGroups, level + 1, currentFullKeyPath, !isZebra)); 
            if (uiSettings.showRowSubtotals && pivotResult.rowSubTotals && pivotResult.rowSubTotals[currentFullKeyString]) {
                const subtotalData = pivotResult.rowSubTotals[currentFullKeyString]; 
                const subtotalCells = subtotalData.map((val, idx) => {
                    let cellClass = `${currentTheme.tableClasses.cellSubtotalValue} text-right`;
                    if (idx >= (pivotResult.uniqueFlatColKeys.length || 1) * (config.valueFields.length || 1)) cellClass = `${currentTheme.tableClasses.cellGrandTotal} text-right`;
                    if (uiSettings.highlightNegativeValues && typeof val === 'number' && val < 0) cellClass += " !text-red-400";
                    return <td key={`subtotal-cell-${currentFullKeyString}-${idx}`} className={`${cellBaseClass} ${cellClass}`}>{formatCellValue(val, uiSettings)}</td>
                });
                rows.push(
                    <tr key={`${currentFullKeyString}|Subtotal`} className={`font-semibold ${uiSettings.zebraStriping && !isZebra ? currentTheme.tableClasses.zebraStripeClass : ''}`} role="row">
                        <td style={{ paddingLeft: `${level * (uiSettings.compactMode ? 16 : 24) + (uiSettings.compactMode ? 6 : 12)}px` }} className={`${headerCellBaseClass} ${currentTheme.tableClasses.cellSubtotalHeader}`} role="rowheader">{group.name} Total</td>
                        {subtotalCells}
                    </tr>
                );
            }
        }
    });
    return rows;
  };

  const handleRemovePill = (source: 'rowFields' | 'colFields' | 'valueFields' | 'filters', field: string) => {
      let newConfig = { ...config };
      if (source === 'valueFields') newConfig.valueFields = newConfig.valueFields.filter(f => f.field !== field);
      else if (source === 'filters') newConfig.filters = (newConfig.filters || []).filter(f => f.field !== field);
      else newConfig[source] = newConfig[source].filter(f => f !== field);
      setConfig(newConfig);
  };
  
  const handleOpenFilterModal = (field: string) => {
    setFilterModalField(field);
    setIsFilterModalOpen(true);
  };

  const handleSaveFilter = (field: string, selectedValues: (string | number)[]) => {
      const newFilters = (config.filters || []).map(f => 
          f.field === field ? { ...f, selectedValues } : f
      );
      setConfig({ ...config, filters: newFilters });
      setIsFilterModalOpen(false);
      setFilterModalField('');
  };

  const handleValueFieldAggregatorChange = (fieldToUpdate: string, newAggregator: AggregatorType) => {
    setConfig({
        ...config,
        valueFields: config.valueFields.map(vf => 
            vf.field === fieldToUpdate ? { ...vf, aggregator: newAggregator } : vf
        )
    });
  }

  const handleThemeChange = (newThemeName: string) => {
    const newTheme = PIVOT_THEMES[newThemeName];
    setUiSettings({ ...uiSettings, theme: newThemeName });
    
    if (newTheme && config.valueFields) {
      const newConfig = { ...config };
      newConfig.valueFields = newConfig.valueFields.map((vf, index) => ({
          ...vf,
          color: newTheme.chartColors[index % newTheme.chartColors.length]
      }));
      setConfig(newConfig);
    }
  };

  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUiSettings({ ...uiSettings, chartType: e.target.value as PivotChartType });
  };

  const resetCurrentConfiguration = () => {
    if (!activePivot) return;
    updateActivePivot(prev => ({
        ...prev,
        config: { rowFields: [], colFields: [], valueFields: [], filters: [] },
        calculatedFieldDefinitions: [],
        pivotResult: null,
        expandedRows: {}
    }));
  };

  const handleExpandAllRows = useCallback(() => {
    if (!pivotResult || !pivotResult.rowStructure) return;
    const allKeys = getAllPossibleRowKeys(pivotResult.rowStructure);
    const newExpandedRows: { [key: string]: boolean } = {};
    allKeys.forEach(key => newExpandedRows[key] = true);
    setExpandedRows(newExpandedRows);
  }, [pivotResult, getAllPossibleRowKeys, setExpandedRows]);

  const handleCollapseAllRows = useCallback(() => {
    setExpandedRows({});
  }, [setExpandedRows]);

  const handleAddNewReport = () => {
    const newReportName = `Untitled Report ${pivotReports.length + 1}`;
    const newReport = createNewReportState(newReportName);
    setPivotReports(prev => [...prev, newReport]);
    setActivePivotId(newReport.id);
  };
  
  const handleDeleteReport = (reportId: string) => {
    if (pivotReports.length <= 1) {
        alert("Cannot delete the last report.");
        setConfirmDeleteId(null);
        return;
    }
    const reportIndex = pivotReports.findIndex(p => p.id === reportId);
    const newReports = pivotReports.filter(p => p.id !== reportId);
    setPivotReports(newReports);

    if (activePivotId === reportId) {
        const newActiveId = (reportIndex > 0 ? newReports[reportIndex - 1].id : newReports[0].id);
        setActivePivotId(newActiveId);
    }
    setConfirmDeleteId(null);
  };

  const handleRenameReport = (reportId: string, newName: string) => {
    setPivotReports(prev => prev.map(r => r.id === reportId ? { ...r, name: newName } : r));
  };
  
  const renderPivotChart = () => {
    if (!pivotResult) { 
      return <p className="text-purple-300/70 text-center py-10">Chart will appear here after analysis.</p>;
    }
    if (!pivotResult.chartData || pivotResult.chartData.length === 0 || config.valueFields.length === 0) {
      return <p className="text-purple-300/70 text-center py-10">No data available for chart.</p>;
    }
    const chartData = pivotResult.chartData;
    const dataKeys = Object.keys(chartData[0] || {}).filter(key => key !== 'name' && isNumeric(chartData[0][key]));
    if (dataKeys.length === 0 && !['pie', 'donut'].includes(uiSettings.chartType)) { 
        return <p className="text-purple-300/70 text-center py-10">Chart data is missing value series.</p>;
    }
    const chartTooltip = <Tooltip {...chartTooltipProps} />;
    const chartLegend = <Legend wrapperStyle={{fontSize: "12px"}}/>;
    const chartColors = currentTheme.chartColors;
    const chartMargin = { top: 20, right: 30, left: 20, bottom: 60 };
    const tickFormatter = (tick: any) => {
        const limit = 20; // char limit
        if (tick && typeof tick === 'string' && tick.length > limit) {
            return `${tick.substring(0, limit)}...`;
        }
        return tick;
    };

    switch(uiSettings.chartType) {
        case 'bar': 
            return <BarChart data={chartData} margin={chartMargin}><CartesianGrid strokeDasharray="3 3" stroke="#4A044E" strokeOpacity={0.3} /><XAxis dataKey="name" stroke="#a855f7" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" /><YAxis stroke="#a855f7" tick={{ fontSize: 11 }} />{chartTooltip}{chartLegend}{dataKeys.map((key, index) => (<Bar key={key} dataKey={key} fill={chartColors[index % chartColors.length]} name={key.replace(/_/g, ' ')} radius={[4, 4, 0, 0]} />))}</BarChart>;
        case 'line': 
            return <LineChart data={chartData} margin={chartMargin}><CartesianGrid strokeDasharray="3 3" stroke="#4A044E" strokeOpacity={0.3} /><XAxis dataKey="name" stroke="#a855f7" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" /><YAxis stroke="#a855f7" tick={{ fontSize: 11 }} />{chartTooltip}{chartLegend}{dataKeys.map((key, index) => (<Line key={key} type="monotone" dataKey={key} stroke={chartColors[index % chartColors.length]} name={key.replace(/_/g, ' ')} activeDot={{ r: 6, strokeWidth: 2, fill: chartColors[index % chartColors.length] }} dot={{r:3}} strokeWidth={2} />))}</LineChart>;
        case 'area':
            return <AreaChart data={chartData} margin={chartMargin}><CartesianGrid strokeDasharray="3 3" stroke="#4A044E" strokeOpacity={0.3} /><XAxis dataKey="name" stroke="#a855f7" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" /><YAxis stroke="#a855f7" tick={{ fontSize: 11 }} />{chartTooltip}{chartLegend}{dataKeys.map((key, index) => (<Area key={key} type="monotone" dataKey={key} stroke={chartColors[index % chartColors.length]} fill={chartColors[index % chartColors.length]} fillOpacity={0.6} name={key.replace(/_/g, ' ')} />))}</AreaChart>;
        case 'pie':
            if (dataKeys.length === 0) return <p className="text-purple-300/70 text-center py-10">Pie chart requires value series.</p>;
            const pieChartData = chartData.map(item => ({ name: item.name, value: item[dataKeys[0]] as number })).filter(item => isNumeric(item.value)); 
            if (pieChartData.length === 0) return <p className="text-purple-300/70 text-center py-10">No valid data for pie chart.</p>;
            return <PieChart><Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} >{pieChartData.map((_entry, index) => ( <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} stroke={chartColors[index % chartColors.length]} />))}</Pie>{chartTooltip}{chartLegend}</PieChart>;
        case 'donut':
            if (dataKeys.length === 0) return <p className="text-purple-300/70 text-center py-10">Donut chart requires value series.</p>;
            const donutChartData = chartData.map(item => ({ name: item.name, value: item[dataKeys[0]] as number })).filter(item => isNumeric(item.value));
            if (donutChartData.length === 0) return <p className="text-purple-300/70 text-center py-10">No valid data for donut chart.</p>;
            return <PieChart><Pie data={donutChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>{donutChartData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} stroke={chartColors[index % chartColors.length]} />))}</Pie>{chartTooltip}{chartLegend}</PieChart>;
        case 'horizontalBar':
            return <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A044E" strokeOpacity={0.3} /><XAxis type="number" stroke="#a855f7" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" stroke="#a855f7" tick={{ fontSize: 10 }} width={120} interval={0} tickFormatter={tickFormatter} />{chartTooltip}{chartLegend}{dataKeys.map((key, index) => (<Bar key={key} dataKey={key} fill={chartColors[index % chartColors.length]} name={key.replace(/_/g, ' ')} radius={[0, 4, 4, 0]} />))}</BarChart>;
        case 'butterfly':
            if (dataKeys.length < 2) {
                return <p className="text-purple-300/70 text-center py-10">Butterfly chart requires at least two value series to compare.</p>;
            }
            const key1 = dataKeys[0];
            const key2 = dataKeys[1];
            const butterflyData = chartData.map(item => ({
                name: item.name,
                [key1]: -Math.abs(item[key1] as number || 0),
                [key2]: Math.abs(item[key2] as number || 0)
            }));
            const maxVal = Math.ceil(Math.max(...chartData.map(d => Math.max(Math.abs(d[key1] as number || 0), Math.abs(d[key2] as number || 0)))));
            const butterflyTooltip = <Tooltip
                {...chartTooltipProps}
                formatter={(value: number) => [Math.abs(value).toLocaleString()]}
            />;
            return <BarChart data={butterflyData} layout="vertical" barCategoryGap={0} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A044E" strokeOpacity={0.3} />
                <XAxis type="number" domain={[-maxVal, maxVal]} tickFormatter={(value) => `${Math.abs(value)}`} stroke="#a855f7" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#a855f7" tick={{ fontSize: 10 }} width={120} axisLine={false} tickLine={false} interval={0} tickFormatter={tickFormatter} />
                {butterflyTooltip}
                {chartLegend}
                <Bar dataKey={key1} name={key1.replace(/_/g, ' ')} fill={chartColors[0]} radius={[0, 4, 4, 0]} />
                <Bar dataKey={key2} name={key2.replace(/_/g, ' ')} fill={chartColors[1]} radius={[4, 0, 0, 4]} />
            </BarChart>;
        default: return null;
    }
  };

  const getColorForField = (fieldName: string) => {
      const colors = [
          { bg: 'bg-sky-900/70', text: 'text-sky-300', ring: 'hover:ring-sky-500' },
          { bg: 'bg-teal-900/70', text: 'text-teal-300', ring: 'hover:ring-teal-500' },
          { bg: 'bg-indigo-900/70', text: 'text-indigo-300', ring: 'hover:ring-indigo-500' },
          { bg: 'bg-rose-900/70', text: 'text-rose-300', ring: 'hover:ring-rose-500' },
          { bg: 'bg-amber-900/70', text: 'text-amber-300', ring: 'hover:ring-amber-500' },
          { bg: 'bg-lime-900/70', text: 'text-lime-300', ring: 'hover:ring-lime-500' },
      ];
      let hash = 0;
      for (let i = 0; i < fieldName.length; i++) {
          hash = fieldName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash % colors.length);
      return colors[index];
  };

  const buttonColorClasses: Record<string, string> = {
    sky: 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-md hover:from-sky-600 hover:to-cyan-500 hover:shadow-lg transform hover:scale-105',
    teal: 'bg-gradient-to-r from-teal-500 to-emerald-400 text-white shadow-md hover:from-teal-600 hover:to-emerald-500 hover:shadow-lg transform hover:scale-105',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-md hover:from-amber-600 hover:to-orange-500 hover:shadow-lg transform hover:scale-105',
    fuchsia: 'bg-gradient-to-r from-fuchsia-500 to-pink-400 text-white shadow-md hover:from-fuchsia-600 hover:to-pink-500 hover:shadow-lg transform hover:scale-105',
  };

  if (!fileHeaders || fileHeaders.length === 0) {
    return (
        <div className="pb-16 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-gray-800/50 rounded-xl shadow-2xl border border-purple-700/30">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Pivot Matrix Offline</h1>
            <p className="text-xl text-purple-200/80 mb-8">Awaiting data transmission...</p>
            <p className="text-gray-300">Please upload a data file from the <strong className="text-sky-400 font-semibold">'Upload Data'</strong> view to engage the Pivot Matrix.</p>
            <ChartIcon className="w-24 h-24 text-purple-500/30 mt-8 animate-pulse" />
        </div>
    );
  }

  return (
    <div className="panel-holographic rounded-xl p-4 md:p-6 pb-16">
        {confirmDeleteId && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1070]" onClick={() => setConfirmDeleteId(null)}>
                <div className="bg-gray-800 border border-red-700/70 rounded-xl p-6 shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg text-red-300 font-bold mb-4">Confirm Deletion</h3>
                    <p className="text-gray-300 mb-6">Are you sure you want to delete report "{pivotReports.find(p => p.id === confirmDeleteId)?.name}"?</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors">Cancel</button>
                        <button onClick={() => handleDeleteReport(confirmDeleteId)} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        )}

        {isCalcFieldModalOpen && (
            <CalculatedFieldManagerModal
                isOpen={isCalcFieldModalOpen}
                onClose={() => setIsCalcFieldModalOpen(false)}
                definitions={calculatedFieldDefinitions}
                onSave={(newDefs) => {
                    setCalculatedFieldDefinitions(newDefs);
                    setIsCalcFieldModalOpen(false);
                }}
                availableFields={fileHeaders}
            />
        )}


        <FilterValuesModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            onSave={handleSaveFilter}
            field={filterModalField}
            allValues={getUniqueValuesForField(filterModalField)}
            currentSelection={(config.filters || []).find(f => f.field === filterModalField)?.selectedValues || []}
        />

        <div className="mb-6">
            <div className="flex items-center border-b border-gray-700">
                <div className="flex -mb-px space-x-1 overflow-x-auto hide-scrollbar">
                    {pivotReports.map(report => (
                        <div
                            key={report.id}
                            className={`group relative py-2 px-4 border-b-2 font-medium text-sm transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                                activePivotId === report.id
                                    ? 'border-purple-500 text-purple-300'
                                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                            }`}
                            onClick={() => setActivePivotId(report.id)}
                        >
                            {renamingReportId === report.id ? (
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={report.name}
                                    onChange={e => handleRenameReport(report.id, e.target.value)}
                                    onBlur={() => setRenamingReportId(null)}
                                    onKeyDown={e => { if (e.key === 'Enter') setRenamingReportId(null); }}
                                    className="bg-transparent text-purple-300 outline-none ring-1 ring-purple-500 rounded px-1 -m-1 w-32"
                                />
                            ) : (
                                <span onDoubleClick={() => setRenamingReportId(report.id)} title="Double-click to rename">
                                    {report.name}
                                </span>
                            )}
                             {pivotReports.length > 1 && (
                                <button
                                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(report.id); }}
                                    className="absolute top-1 right-1 p-0.5 rounded-full text-gray-500 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete report"
                                >
                                    <CloseIcon className="w-3 h-3" />
                                </button>
                             )}
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleAddNewReport}
                    className="ml-4 flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-md hover:bg-sky-500/10 transition-colors flex-shrink-0"
                    title="Add new report"
                >
                    <PlusIcon className="w-4 h-4" />
                    New
                </button>
            </div>
        </div>


        <div className="bg-black/20 p-4 rounded-xl shadow-inner mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">Pivot Configuration Matrix</h2>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button onClick={() => setIsCalcFieldModalOpen(true)} className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors text-sm flex items-center gap-1"><CalculatorIcon className="w-4 h-4"/> Calculated Fields</button>
                    <button onClick={resetCurrentConfiguration} className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors text-sm flex items-center gap-1"><ResetIcon className="w-4 h-4"/> Reset</button>
                    <button onClick={generatePivotData} disabled={isLoading || config.valueFields.length === 0} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-500 border border-cyan-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 flex items-center gap-2">
                        <AnalyzeIcon className="w-5 h-5" /> {isLoading ? 'Analyzing...' : 'Update Analysis'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <div>
                        <h3 className="text-md font-semibold text-gray-300 mb-2">Available Fields</h3>
                        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 max-h-96 overflow-y-auto space-y-1.5">
                           {availableFieldsForConfig.map(field => {
                                const color = getColorForField(field);
                                const isSelected = selectedAvailableField === field;
                                return (
                                   <div
                                       key={field}
                                       onClick={() => setSelectedAvailableField(isSelected ? null : field)}
                                       className={`flex items-center p-2 rounded-md ${color.bg} ${color.text} cursor-pointer transition-all duration-200 transform hover:scale-105 ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-purple-500' : `hover:ring-1 ${color.ring}`}`}
                                   >
                                      <span className={`text-sm font-medium ${calculatedFieldDefinitions.some(cf => cf.name === field) ? 'italic' : ''}`}>{field}</span>
                                   </div>
                                );
                           })}
                           {availableFieldsForConfig.length === 0 && <p className="text-xs text-gray-500 text-center p-4">All fields are in use.</p>}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries({rowFields: 'sky', colFields: 'teal', valueFields: 'amber', filters: 'fuchsia'}).map(([key, color]) => (
                        <div key={key}>
                            <h3 className={`text-md font-semibold text-${color}-400 mb-2 capitalize`}>{key.replace('Fields', '')}</h3>
                            <div className={`dropzone-holographic p-3 rounded-lg min-h-[120px] flex flex-col ${selectedAvailableField ? 'active' : ''}`}>
                                <div className="flex-grow space-y-2">
                                    {key === 'rowFields' && config.rowFields.map(f => (
                                        <div key={f} className="flex items-center justify-between bg-sky-900/70 p-1.5 rounded text-sm text-white"><span>{f}</span><button onClick={() => handleRemovePill('rowFields', f)} className="text-sky-200 hover:text-white"><CloseIcon /></button></div>
                                    ))}
                                    {key === 'colFields' && config.colFields.map(f => (
                                        <div key={f} className="flex items-center justify-between bg-teal-900/70 p-1.5 rounded text-sm text-white"><span>{f}</span><button onClick={() => handleRemovePill('colFields', f)} className="text-teal-200 hover:text-white"><CloseIcon /></button></div>
                                    ))}
                                    {key === 'valueFields' && config.valueFields.map(vf => (
                                        <div key={vf.field} className="flex items-center justify-between bg-amber-900/70 p-1.5 rounded text-sm text-white">
                                            <span className="truncate max-w-[100px]">{vf.displayName || vf.field}</span>
                                            <div className="flex items-center"><select value={vf.aggregator} onChange={e => handleValueFieldAggregatorChange(vf.field, e.target.value as AggregatorType)} disabled={isValueFieldTextual(vf.field, tableData) && !['count','countNonEmpty'].includes(vf.aggregator)} className="ml-1.5 text-xs bg-black/30 text-amber-100 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 border-none appearance-none p-0.5" onClick={(e) => e.stopPropagation()}>{isValueFieldTextual(vf.field, tableData) && !['count','countNonEmpty'].includes(vf.aggregator) ? <option value="countNonEmpty">Count</option> : <><option value="sum">Sum</option><option value="count">Count</option><option value="countNonEmpty">Count Non-Empty</option><option value="average">Avg</option><option value="min">Min</option><option value="max">Max</option></>}</select><button onClick={() => handleRemovePill('valueFields', vf.field)} className="ml-1 text-amber-200 hover:text-white"><CloseIcon /></button></div>
                                        </div>
                                    ))}
                                    {key === 'filters' && (config.filters || []).map(f => (
                                        <div key={f.field} className="flex items-center justify-between bg-fuchsia-900/70 p-1.5 rounded text-sm text-white">
                                            <button onClick={() => handleOpenFilterModal(f.field)} className="flex items-center gap-1.5 text-left truncate w-full"><FilterIcon className="w-3 h-3 text-fuchsia-300"/>{f.field}<span className="text-fuchsia-300/80 text-xs">({f.selectedValues.length || 'All'})</span></button>
                                            <button onClick={() => handleRemovePill('filters', f.field)} className="text-fuchsia-200 hover:text-white flex-shrink-0 ml-2"><CloseIcon /></button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleAddFieldToZone(key as any)}
                                    disabled={!selectedAvailableField}
                                    className={`mt-2 w-full flex items-center justify-center gap-2 text-xs p-2 rounded-md font-semibold transition-all duration-200 ${
                                        !selectedAvailableField
                                            ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                                            : buttonColorClasses[color] || 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-md hover:from-sky-600 hover:to-cyan-500 hover:shadow-lg transform hover:scale-105'
                                    }`}
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Field
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {error && <p className="text-red-400 mt-3 text-sm text-center bg-red-900/40 p-2 rounded-md border border-red-700/50 shadow-sm">{error}</p>}
        </div>
        
        {isLoading && (
            <div className="mt-8 p-6 rounded-xl shadow-2xl border border-purple-800/40 bg-black/50 backdrop-blur-md">
                <div className="flex flex-col justify-center items-center py-10 min-h-[200px] text-center h-full">
                    <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
                    <p className="mt-3 md:mt-4 text-lg md:text-xl text-purple-300 tracking-wider">Calculating Interdimensional Trajectories...</p>
                </div>
            </div>
        )}
        
        <div className="mt-8 space-y-8">
            {pivotResult && !isLoading && (
              <div className="space-y-8">
                <div className={`pivot-matrix-display-wrapper rounded-xl shadow-inner border border-sky-800/40 bg-black/20 p-1 pivot-table-container`}>
                     <div className="pivot-header p-2 md:p-3 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400">Data Matrix: {activePivot?.name}</h2>
                        <div className="flex items-center gap-2">
                           <button onClick={handleExpandAllRows} disabled={isLoading || !pivotResult} className="flex items-center p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50 text-xs gap-1"><ExpandAllIcon /> Expand</button>
                           <button onClick={handleCollapseAllRows} disabled={isLoading || !pivotResult} className="flex items-center p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50 text-xs gap-1"><CollapseAllIcon /> Collapse</button>
                        </div>
                    </div>
                    <div className={`overflow-auto rounded-b-lg shadow-inner ${uiSettings.compactMode ? 'text-xs' : 'text-sm'}`} style={{maxHeight: '70vh'}}>
                        <table className="min-w-full" role="grid">
                            <thead className={`${uiSettings.freezeColumnHeaders ? 'sticky top-0 z-10' : ''}`} role="rowgroup">{generatedTheadRows}</thead>
                            <tbody role="rowgroup">{pivotResult.rowStructure.length > 0 ? renderRow(pivotResult.rowStructure, 0, [], false) : (pivotResult.grandTotalRow && uiSettings.showGrandTotals && (<tr role="row"><td className={`${uiSettings.compactMode ? 'px-1.5 py-1' : 'px-3 py-2'} ${currentTheme.tableClasses.headerGrandTotal} text-left ${uiSettings.freezeRowHeaders ? 'sticky left-0 z-[5]' : ''}`} role="rowheader">Grand Total</td>{pivotResult.grandTotalRow.map((val, idx) => <td key={idx} className={`${currentTheme.tableClasses.cellGrandTotal} text-right font-bold ${uiSettings.highlightNegativeValues && typeof val === 'number' && val < 0 ? '!text-red-400' : ''}`}>{formatCellValue(val, uiSettings)}</td>)}</tr>))}</tbody>
                            {pivotResult.grandTotalRow && config.rowFields.length > 0 && uiSettings.showGrandTotals && (
                                <tfoot className={`${uiSettings.freezeColumnHeaders ? 'sticky bottom-0 z-10' : ''}`} role="rowgroup">
                                    <tr role="row">
                                        <td className={`${uiSettings.compactMode ? 'px-1.5 py-1' : 'px-3 py-2'} ${currentTheme.tableClasses.headerGrandTotal} text-left ${uiSettings.freezeRowHeaders ? 'sticky left-0 z-[15]' : ''}`} role="rowheader">Grand Total</td>
                                        {pivotResult.grandTotalRow.map((totalValue, idx) => (<td key={`grandtotal-cell-foot-${idx}`} className={`${currentTheme.tableClasses.cellGrandTotal} text-right font-bold ${uiSettings.compactMode ? 'px-1.5 py-1' : 'px-3 py-2'} ${uiSettings.highlightNegativeValues && typeof totalValue === 'number' && totalValue < 0 ? '!text-red-400' : ''}`} role="gridcell">{formatCellValue(totalValue, uiSettings)}</td>))}
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                         {pivotResult && pivotResult.dataMatrix.length === 0 && <p className="text-center py-10 text-purple-300/70">No data to display for configuration.</p>}
                    </div>
                </div>
                <div className="chart-display-wrapper rounded-xl shadow-inner border border-pink-800/40 bg-black/20 p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <h3 className="text-lg md:text-xl font-bold flex-shrink-0 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-red-400 to-orange-400">Pivot Visualization</h3>
                        <div>
                            <label htmlFor="chart-type-select" className="text-sm font-medium text-gray-400 mr-2">Chart Type:</label>
                            <select
                                id="chart-type-select"
                                value={uiSettings.chartType}
                                onChange={handleChartTypeChange}
                                className="p-1.5 bg-gray-700/80 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-600 shadow-sm"
                            >
                                {CHART_TYPES.map(type => {
                                    const label = type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    return <option key={type} value={type}>{label}</option>
                                })}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Theme:</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(PIVOT_THEMES).map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => handleThemeChange(key)}
                                    title={theme.description}
                                    className={`p-2 rounded-lg border-2 transition-all duration-200 w-full sm:w-auto ${uiSettings.theme === key ? 'border-pink-500 bg-pink-500/20' : 'border-transparent bg-gray-700/50 hover:bg-gray-700'}`}
                                >
                                    <div className="text-sm font-semibold text-gray-200 mb-1.5">{theme.name}</div>
                                    <div className="flex justify-center space-x-1.5">
                                        {theme.chartColors.slice(0, 5).map((color, i) => (
                                            <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/40 p-1 md:p-2 rounded-lg border border-pink-700/50 shadow-inner h-[400px] md:h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">{renderPivotChart()}</ResponsiveContainer>
                    </div>
                </div>
              </div>
            )}
        </div>
      </div> 
  );
};