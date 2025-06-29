


import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { TableRow, IconType, FilterRule, FormattingRule, ConditionOperator, CellStyle, ColumnFilterState, ViewKey } from '../../types';
import { analyzeSelectedData } from '../../services/geminiService';


const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

// --- Icons for the view ---
const ColumnIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" /></svg>;
const ExportIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>;
const AnalyzeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-3.75v3.75m3-6v6m3-8.25v8.25M3 16.5h18M3 12h18M3 7.5h18" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const FilterIcon: IconType = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>;
const FormatIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
const PlusIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TrashIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const ClearFilterIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const StatsIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;


const isNumeric = (val: any): val is number => typeof val === 'number' && isFinite(val);

const evaluateCondition = (itemValue: any, operator: ConditionOperator, ruleValue: any): boolean => {
    const operatorsThatNeedValue = ['is_empty', 'is_not_empty'];
    if (operatorsThatNeedValue.includes(operator)) {
        if (operator === 'is_empty') return itemValue === null || itemValue === undefined || String(itemValue).trim() === '';
        if (operator === 'is_not_empty') return itemValue !== null && itemValue !== undefined && String(itemValue).trim() !== '';
        return false;
    }

    const valueA = itemValue;
    let valueB = ruleValue;

    if (isNumeric(valueA) || (typeof valueA === 'string' && !isNaN(parseFloat(valueA)))) {
        const numA = parseFloat(String(valueA));
        const numB = parseFloat(String(valueB));
        if (isNaN(numB)) return false; // Cannot compare number with non-number

        switch (operator) {
            case 'equals': return numA === numB;
            case 'does_not_equal': return numA !== numB;
            case 'greater_than': return numA > numB;
            case 'less_than': return numA < numB;
            case 'greater_than_or_equal': return numA >= numB;
            case 'less_than_or_equal': return numA <= numB;
            default: return false; // Contains doesn't apply to numerics this way
        }
    }

    const stringA = String(valueA ?? '').toLowerCase();
    const stringB = String(valueB ?? '').toLowerCase();

    switch (operator) {
        case 'equals': return stringA === stringB;
        case 'does_not_equal': return stringA !== stringB;
        case 'contains': return stringA.includes(stringB);
        case 'does_not_contain': return !stringA.includes(stringB);
        default: return false;
    }
};

const OPERATORS: { value: ConditionOperator; label: string; appliesTo: ('string' | 'number' | 'all')[] }[] = [
    { value: 'equals', label: 'Equals', appliesTo: ['all'] },
    { value: 'does_not_equal', label: 'Does Not Equal', appliesTo: ['all'] },
    { value: 'contains', label: 'Contains', appliesTo: ['string'] },
    { value: 'does_not_contain', label: 'Does Not Contain', appliesTo: ['string'] },
    { value: 'greater_than', label: 'Greater Than', appliesTo: ['number'] },
    { value: 'less_than', label: 'Less Than', appliesTo: ['number'] },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal', appliesTo: ['number'] },
    { value: 'less_than_or_equal', label: 'Less Than or Equal', appliesTo: ['number'] },
    { value: 'is_empty', label: 'Is Empty', appliesTo: ['all'] },
    { value: 'is_not_empty', label: 'Is Not Empty', appliesTo: ['all'] },
];

const PREDEFINED_STYLES: { name: string, style: CellStyle }[] = [
    { name: 'Red Glow', style: { className: 'format-bg-red-glow' } },
    { name: 'Green Glow', style: { className: 'format-bg-green-glow' } },
    { name: 'Blue Glow', style: { className: 'format-bg-blue-glow' } },
    { name: 'Yellow Glow', style: { className: 'format-bg-yellow-glow' } },
    { name: 'Purple Glow', style: { className: 'format-bg-purple-glow' } },
    { name: 'Bold Text', style: { className: 'format-text-bold' } },
];

const ColumnFilterPopover: React.FC<{
    field: string;
    onClose: () => void;
    onApply: (field: string, selection: Set<string>) => void;
    onClear: (field: string) => void;
    currentSelection: Set<string>;
    valueCounts: Map<string, number>;
    popoverRef: React.RefObject<HTMLDivElement>;
    anchorEl: HTMLElement | null;
}> = ({ field, onClose, onApply, onClear, currentSelection, valueCounts, popoverRef, anchorEl }) => {
    const [localSelection, setLocalSelection] = useState(new Set(currentSelection));
    const [searchTerm, setSearchTerm] = useState('');

    const sortedUniqueValues = useMemo(() => {
        return Array.from(valueCounts.keys()).sort((a, b) => String(a).localeCompare(String(b)));
    }, [valueCounts]);

    const filteredValues = useMemo(() => {
        if (!searchTerm) return sortedUniqueValues;
        return sortedUniqueValues.filter(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sortedUniqueValues, searchTerm]);

    const handleToggle = (value: string) => {
        setLocalSelection(prev => {
            const newSet = new Set(prev);
            if (newSet.has(value)) newSet.delete(value);
            else newSet.add(value);
            return newSet;
        });
    };

    const handleSelectAll = () => setLocalSelection(new Set(filteredValues));
    const handleDeselectAll = () => setLocalSelection(new Set());

    const popoverStyle: React.CSSProperties = useMemo(() => {
        if (!anchorEl) return { display: 'none' };
        const rect = anchorEl.getBoundingClientRect();
        return {
            position: 'absolute',
            top: `${rect.bottom + 4}px`,
            left: `${rect.right - 320}px`,
            width: '320px',
        };
    }, [anchorEl]);

    return (
        <div ref={popoverRef} style={popoverStyle} className="bg-gray-800 border border-sky-700/70 rounded-xl shadow-2xl p-4 w-full max-w-xs max-h-[50vh] flex flex-col z-30" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-gray-400 mb-2 truncate">Filter by {field}</p>
            <input type="text" placeholder="Search values..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 mb-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500" />
            <div className="flex space-x-2 mb-2">
                <button onClick={handleSelectAll} className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">Select All</button>
                <button onClick={handleDeselectAll} className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">Deselect All</button>
            </div>
            <ul className="flex-1 overflow-y-auto space-y-1 pr-2 text-sm">
                {filteredValues.map(val => (
                    <li key={String(val)}><label className="flex items-center space-x-3 p-1 rounded hover:bg-gray-700/50 cursor-pointer"><input type="checkbox" checked={localSelection.has(val)} onChange={() => handleToggle(val)} className="h-4 w-4 text-sky-500 bg-gray-700 border-gray-600 rounded focus:ring-sky-400" /><span className="text-gray-300 truncate" title={String(val)}>{String(val)}</span><span className="flex-grow text-right text-gray-500">{valueCounts.get(val)}</span></label></li>
                ))}
            </ul>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                <button onClick={() => onClear(field)} className="px-3 py-1.5 text-sm text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md">Clear</button>
                <div className="space-x-2"><button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-300 rounded-md">Cancel</button><button onClick={() => onApply(field, localSelection)} className="px-3 py-1.5 text-sm text-white bg-sky-600 hover:bg-sky-500 rounded-md">Apply</button></div>
            </div>
        </div>
    );
};

interface DataTableViewProps {
  onNavigate: (viewKey: ViewKey) => void;
}

// --- Main Data Table View Component ---
export const DataTableView: React.FC<DataTableViewProps> = ({ onNavigate }) => {
    const { tableData, fileHeaders, setStatisticalAnalysisData, setStatisticalAnalysisVisibleColumns } = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
    const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const columnManagerRef = useRef<HTMLDivElement>(null);
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    const [formattingRules, setFormattingRules] = useState<FormattingRule[]>([]);
    const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
    const [isFormattingModalOpen, setIsFormattingModalOpen] = useState(false);

    // --- NEW STATE for header filters ---
    const [columnFilters, setColumnFilters] = useState<ColumnFilterState>({});
    const [activeFilterPopover, setActiveFilterPopover] = useState<string | null>(null);
    const filterPopoverRef = useRef<HTMLDivElement>(null);
    const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const handleSelectAllColumns = () => setVisibleColumns(new Set(fileHeaders));
    const handleDeselectAllColumns = () => setVisibleColumns(new Set());

    useEffect(() => {
        if (fileHeaders) {
            setVisibleColumns(new Set(fileHeaders));
            setColumnFilters({}); // Reset column filters when headers change
        }
    }, [fileHeaders]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnManagerRef.current && !columnManagerRef.current.contains(event.target as Node)) {
                setIsColumnManagerOpen(false);
            }
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                const targetIsButton = Object.values(filterButtonRefs.current).some(ref => ref?.contains(event.target as Node));
                if (!targetIsButton) {
                    setActiveFilterPopover(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const uniqueColumnValues = useMemo(() => {
        const valueMap: Record<string, Map<string, number>> = {};
        if (!tableData || !fileHeaders) return valueMap;

        for (const header of fileHeaders) {
            valueMap[header] = new Map();
        }
        for (const row of tableData) {
            for (const header of fileHeaders) {
                const value = row[header];
                if (value !== null && value !== undefined && String(value).trim() !== '') {
                    const map = valueMap[header];
                    const stringValue = String(value);
                    map.set(stringValue, (map.get(stringValue) || 0) + 1);
                }
            }
        }
        return valueMap;
    }, [tableData, fileHeaders]);


    const filteredAndSortedData = useMemo(() => {
        if (!tableData) return [];
        let items = [...tableData];

        if (searchTerm) {
            items = items.filter(item => fileHeaders.some(header => String(item[header]).toLowerCase().includes(searchTerm.toLowerCase())));
        }

        if (filterRules.length > 0) {
            items = items.filter(item => filterRules.every(rule => !rule.field || !rule.operator || evaluateCondition(item[rule.field], rule.operator, rule.value)));
        }

        if (Object.keys(columnFilters).length > 0) {
            items = items.filter(item => {
                return Object.entries(columnFilters).every(([field, selectedValues]) => {
                    if (!selectedValues || selectedValues.size === 0) return true;
                    const value = item[field];
                    if (value === null || value === undefined) return false;
                    return selectedValues.has(String(value));
                });
            });
        }
        
        if (sortConfig !== null) {
            items.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (isNumeric(valA) && isNumeric(valB)) return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
                const stringA = String(valA ?? '').toLowerCase();
                const stringB = String(valB ?? '').toLowerCase();
                if (stringA < stringB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (stringA > stringB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [tableData, searchTerm, sortConfig, fileHeaders, filterRules, columnFilters]);

    const columnCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!filteredAndSortedData || !fileHeaders) return counts;

        for (const header of fileHeaders) {
            counts[header] = 0;
        }

        for (const row of filteredAndSortedData) {
            for (const header of fileHeaders) {
                const value = row[header];
                if (value !== null && value !== undefined && String(value).trim() !== '') {
                    counts[header]++;
                }
            }
        }
        return counts;
    }, [filteredAndSortedData, fileHeaders]);

    const getConditionalStyling = useMemo(() => (header: string, value: any): string => {
        if (formattingRules.length === 0) return '';
        let appliedClasses = '';
        for (const rule of formattingRules) {
            if (rule.field === header && rule.style.className && evaluateCondition(value, rule.operator, rule.value)) {
                appliedClasses += ` ${rule.style.className}`;
            }
        }
        return appliedClasses.trim();
    }, [formattingRules]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedRows(new Set());
    }, [searchTerm, sortConfig, tableData, rowsPerPage, filterRules, columnFilters]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredAndSortedData.slice(start, start + rowsPerPage);
    }, [filteredAndSortedData, currentPage, rowsPerPage]);

    const currentlyVisibleHeaders = useMemo(() => {
        if (!fileHeaders) return [];
        return fileHeaders.filter(header => visibleColumns.has(header));
    }, [fileHeaders, visibleColumns]);

     const handleRowSelect = (rowIndex: number) => {
        const newSelection = new Set(selectedRows);
        const globalIndex = (currentPage - 1) * rowsPerPage + rowIndex;
        if (newSelection.has(globalIndex)) newSelection.delete(globalIndex);
        else newSelection.add(globalIndex);
        setSelectedRows(newSelection);
      };
      
      const handleSelectAllOnPage = () => {
        const newSelection = new Set(selectedRows);
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + paginatedData.length;
        const allOnPageSelected = paginatedData.every((_, i) => newSelection.has(start + i));
        for (let i = start; i < end; i++) {
            if (allOnPageSelected) newSelection.delete(i);
            else newSelection.add(i);
        }
        setSelectedRows(newSelection);
      };

      const handleAnalyzeSelected = async () => {
        setIsAnalysisModalOpen(true);
        setIsAnalyzing(true);
        setAnalysisError('');
        setAnalysisResult('');
        const selectedData = Array.from(selectedRows).map(index => filteredAndSortedData[index]);
        try {
            const result = await analyzeSelectedData(JSON.stringify(selectedData, null, 2));
            setAnalysisResult(result);
        } catch (e: any) { setAnalysisError(e.message || "An unexpected error occurred."); } 
        finally { setIsAnalyzing(false); }
      };
      
      const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
      };
      
      const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return ' ';
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
      };
      
      const toggleColumnVisibility = (header: string) => {
        const newVisible = new Set(visibleColumns);
        if (newVisible.has(header)) { if (newVisible.size > 1) newVisible.delete(header); } 
        else { newVisible.add(header); }
        setVisibleColumns(newVisible);
      };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterRules([]);
        setColumnFilters({});
    };

    const handleGenerateStatisticalAnalysis = () => {
        setStatisticalAnalysisData(filteredAndSortedData);
        setStatisticalAnalysisVisibleColumns(visibleColumns);
        onNavigate('statisticalAnalysis');
    };

    const isAnyFilterActive = searchTerm || filterRules.length > 0 || Object.keys(columnFilters).length > 0;


    if (!fileHeaders || fileHeaders.length === 0) {
        return <div className="space-y-6"><h1 className="text-3xl font-bold text-gray-100">Data Explorer</h1><Panel title="No Data Loaded"><p className="text-gray-300 text-center py-10">Please upload a file from the <strong className="text-blue-300">'Upload Data'</strong> view.</p></Panel></div>;
    }

    const isAllOnPageSelected = paginatedData.length > 0 && paginatedData.every((_, i) => selectedRows.has((currentPage - 1) * rowsPerPage + i));
    const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

    return (
        <div className="space-y-6">
             {isAnalysisModalOpen && <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1050]" onClick={() => setIsAnalysisModalOpen(false)}><div className="bg-gray-800 border border-purple-700/70 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-purple-300">AI Analysis of Selected Data</h3><button onClick={() => setIsAnalysisModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button></div><div className="flex-1 overflow-y-auto pr-2">{isAnalyzing && <div className="flex justify-center items-center h-full"><div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div></div>}{analysisError && <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{analysisError}</div>}{analysisResult && <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }} />}</div></div></div>}
            
            {isFilterBuilderOpen && <FilterBuilderModal onClose={() => setIsFilterBuilderOpen(false)} rules={filterRules} onSave={setFilterRules} headers={fileHeaders} />}
            {isFormattingModalOpen && <ConditionalFormattingModal onClose={() => setIsFormattingModalOpen(false)} rules={formattingRules} onSave={setFormattingRules} headers={fileHeaders} />}
            {activeFilterPopover && <ColumnFilterPopover key={activeFilterPopover} field={activeFilterPopover} onClose={() => setActiveFilterPopover(null)} onApply={(field, selection) => { setColumnFilters(p => ({...p, [field]: selection})); setActiveFilterPopover(null); }} onClear={field => { setColumnFilters(p => { const n = {...p}; delete n[field]; return n; }); setActiveFilterPopover(null); }} currentSelection={columnFilters[activeFilterPopover] || new Set()} valueCounts={uniqueColumnValues[activeFilterPopover] || new Map()} popoverRef={filterPopoverRef} anchorEl={filterButtonRefs.current[activeFilterPopover]} />}

            <h1 className="text-3xl font-bold text-gray-100">Data Explorer</h1>
            <Panel>
                <div className="mb-4">
                    <div className={`transition-all duration-300 ease-in-out ${selectedRows.size > 0 ? 'h-12 opacity-100' : 'h-0 opacity-0'} overflow-hidden`}>
                        <div className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                            <span className="font-semibold text-blue-300 text-sm">{selectedRows.size} row(s) selected</span>
                            <div className="flex items-center space-x-2"><button onClick={handleAnalyzeSelected} className="px-2 py-1 text-xs flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"><AnalyzeIcon className="w-4 h-4"/> Analyze</button><button className="px-2 py-1 text-xs flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-all duration-200 transform hover:scale-105 opacity-50 cursor-not-allowed" disabled><ExportIcon className="w-4 h-4"/> Export</button></div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-4">
                        <input type="text" placeholder="Search table..." value={searchTerm} className="p-2 w-full sm:w-1/3 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" onChange={(e) => setSearchTerm(e.target.value)} />
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                            <button onClick={() => setIsFilterBuilderOpen(true)} className="relative px-2.5 py-1.5 text-xs flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"><FilterIcon className="w-4 h-4"/> Filter{filterRules.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-xs text-white">{filterRules.length}</span>}</button>
                            <button onClick={handleClearFilters} disabled={!isAnyFilterActive} className="px-2.5 py-1.5 text-xs flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ClearFilterIcon className="w-4 h-4"/> Clear Filters</button>
                            <button onClick={() => setIsFormattingModalOpen(true)} className="relative px-2.5 py-1.5 text-xs flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"><FormatIcon className="w-4 h-4"/> Format{formattingRules.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-xs text-white">{formattingRules.length}</span>}</button>
                            <button onClick={handleGenerateStatisticalAnalysis} className="px-2.5 py-1.5 text-xs flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors"><StatsIcon className="w-4 h-4"/> Generate Statistical Analysis</button>
                            <div ref={columnManagerRef} className="relative">
                                <button onClick={() => setIsColumnManagerOpen(p => !p)} className="px-2.5 py-1.5 text-xs flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"><ColumnIcon className="w-4 h-4"/> Columns</button>
                                {isColumnManagerOpen && 
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 p-2 max-h-80 overflow-y-auto flex flex-col">
                                        <p className="text-xs text-gray-400 px-2 pb-1 border-b border-gray-700">Show/Hide Columns</p>
                                        <div className="flex justify-between items-center p-2 text-xs border-b border-gray-700 mb-1">
                                            <button onClick={handleSelectAllColumns} className="text-sky-400 hover:text-sky-300 font-medium">Select All</button>
                                            <button onClick={handleDeselectAllColumns} className="text-sky-400 hover:text-sky-300 font-medium">Deselect All</button>
                                        </div>
                                        <ul className="flex-grow overflow-y-auto">{fileHeaders.map(h => <li key={h}><label className="flex items-center w-full p-2 text-xs text-gray-300 rounded hover:bg-gray-700 cursor-pointer"><input type="checkbox" checked={visibleColumns.has(h)} onChange={() => toggleColumnVisibility(h)} className="h-4 w-4 text-sky-500 bg-gray-600 border-gray-500 rounded focus:ring-sky-400 mr-2"/><span className="truncate" title={h}>{h}</span></label></li>)}</ul>
                                    </div>
                                }
                            </div>
                            <select value={rowsPerPage} onChange={(e) => setRowsPerPage(parseInt(e.target.value))} className="p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs">{ROWS_PER_PAGE_OPTIONS.map(o => <option key={o} value={o}>{o} rows</option>)}</select>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-750 bg-opacity-50 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="p-2 w-12 text-center"><input type="checkbox" onChange={handleSelectAllOnPage} checked={isAllOnPageSelected} className="h-4 w-4 text-sky-500 bg-gray-600 border-gray-500 rounded focus:ring-sky-400"/></th>
                                {currentlyVisibleHeaders.map(header => (
                                    <th scope="col" key={header} className="px-4 py-2 text-left text-xs font-medium text-blue-300 uppercase tracking-wider hover:bg-gray-700 whitespace-nowrap">
                                        <div className="flex items-center justify-between group">
                                            <span onClick={() => requestSort(header)} className="flex items-center cursor-pointer truncate pr-2" title={`Sort by ${header}`}>
                                                {header.replace(/_/g, ' ')}
                                                <span className="text-cyan-400 font-normal ml-1.5">({columnCounts[header] ?? 0})</span>
                                                <span className="text-gray-500 ml-1">{getSortIndicator(header)}</span>
                                            </span>
                                            <button ref={el => { filterButtonRefs.current[header] = el; }} onClick={(e) => { e.stopPropagation(); setActiveFilterPopover(header === activeFilterPopover ? null : header); }} className={`ml-2 p-1 rounded transition-all duration-200 ${columnFilters[header] && columnFilters[header]!.size > 0 ? 'text-sky-400 bg-sky-900/60 opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 hover:bg-gray-700/50'}`} title={`Filter by ${header}`}>
                                                <FilterIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 bg-opacity-70 divide-y divide-gray-700">
                            {paginatedData.map((row: TableRow, rowIndex: number) => {
                                const globalIndex = (currentPage - 1) * rowsPerPage + rowIndex;
                                const isSearchHighlight = searchTerm.trim() !== '';
                                return (
                                    <tr key={globalIndex} className={`transition-colors ${selectedRows.has(globalIndex) ? 'bg-sky-900/50' : 'hover:bg-sky-500/30'} ${isSearchHighlight ? 'search-highlight-row' : ''}`}>
                                        <td className="p-2 text-center"><input type="checkbox" onChange={() => handleRowSelect(rowIndex)} checked={selectedRows.has(globalIndex)} className="h-4 w-4 text-sky-500 bg-gray-600 border-gray-500 rounded focus:ring-sky-400"/></td>
                                        {currentlyVisibleHeaders.map(header => {
                                            const cellValue = row[header];
                                            const conditionalClasses = getConditionalStyling(header, cellValue);
                                            return (<td key={header} className={`px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis text-xs text-gray-300 max-w-xs transition-colors duration-200 ${conditionalClasses}`} title={String(cellValue)}>{cellValue instanceof Date ? cellValue.toLocaleDateString() : String(cellValue ?? '')}</td>);
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredAndSortedData.length > 0 && totalPages > 1 && <div className="flex justify-between items-center mt-4 text-xs text-gray-400"><span>Page {currentPage} of {totalPages} ({filteredAndSortedData.length} total rows)</span><div className="space-x-2"><button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1 border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50">Previous</button><button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50">Next</button></div></div>}
            </Panel>
        </div>
    );
};


// --- Filter Builder Modal Component ---
const FilterBuilderModal: React.FC<{onClose: () => void, rules: FilterRule[], onSave: (rules: FilterRule[]) => void, headers: string[]}> = ({ onClose, rules, onSave, headers }) => {
    const [localRules, setLocalRules] = useState<FilterRule[]>(rules);
    const updateRule = (id: string, newRule: Partial<FilterRule>) => setLocalRules(current => current.map(r => r.id === id ? { ...r, ...newRule } : r));
    const addRule = () => setLocalRules(current => [...current, { id: Date.now().toString(), field: '', operator: 'equals', value: '' }]);
    const removeRule = (id: string) => setLocalRules(current => current.filter(r => r.id !== id));

    return <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1050]" onClick={onClose}><div className="bg-gray-800 border border-sky-700/70 rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-sky-300">Advanced Filter Builder</h3><button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button></div><div className="flex-1 overflow-y-auto pr-2 space-y-3">{localRules.map(rule => <div key={rule.id} className="flex items-center gap-2 p-3 bg-gray-900/50 rounded-lg"><select value={rule.field} onChange={e => updateRule(rule.id, { field: e.target.value })} className="flex-grow p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"><option value="">Select Field...</option>{headers.map(h => <option key={h} value={h}>{h}</option>)}</select><select value={rule.operator} onChange={e => updateRule(rule.id, { operator: e.target.value as ConditionOperator })} className="p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">{OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select><input type="text" value={rule.value} onChange={e => updateRule(rule.id, { value: e.target.value })} placeholder="Value..." className="flex-grow p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"/><button onClick={() => removeRule(rule.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-md"><TrashIcon className="w-5 h-5"/></button></div>)}<button onClick={addRule} className="w-full mt-2 p-2 text-sm flex items-center justify-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 rounded-md transition-colors"><PlusIcon className="w-5 h-5"/> Add Filter Rule</button></div><div className="flex justify-end space-x-3 mt-6"><button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button><button onClick={() => { onSave(localRules); onClose(); }} className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-500 rounded-md">Apply Filters</button></div></div></div>;
};

// --- Conditional Formatting Modal Component ---
const ConditionalFormattingModal: React.FC<{onClose: () => void, rules: FormattingRule[], onSave: (rules: FormattingRule[]) => void, headers: string[]}> = ({ onClose, rules, onSave, headers }) => {
    const [localRules, setLocalRules] = useState<FormattingRule[]>(rules);
    const updateRule = (id: string, newRule: Partial<FormattingRule>) => setLocalRules(current => current.map(r => r.id === id ? { ...r, ...newRule } : r));
    const addRule = () => setLocalRules(current => [...current, { id: Date.now().toString(), name: 'New Rule', field: '', operator: 'equals', value: '', style: PREDEFINED_STYLES[0].style }]);
    const removeRule = (id: string) => setLocalRules(current => current.filter(r => r.id !== id));

    return <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1050]" onClick={onClose}><div className="bg-gray-800 border border-purple-700/70 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-purple-300">Conditional Formatting Rules</h3><button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button></div><div className="flex-1 overflow-y-auto pr-2 space-y-3">{localRules.map(rule => <div key={rule.id} className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 p-3 bg-gray-900/50 rounded-lg"><select value={rule.field} onChange={e => updateRule(rule.id, { field: e.target.value })} className="md:col-span-1 p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"><option value="">Select Field...</option>{headers.map(h => <option key={h} value={h}>{h}</option>)}</select><select value={rule.operator} onChange={e => updateRule(rule.id, { operator: e.target.value as ConditionOperator })} className="md:col-span-1 p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">{OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select><input type="text" value={rule.value} onChange={e => updateRule(rule.id, { value: e.target.value })} placeholder="Value..." className="md:col-span-1 p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"/><select value={rule.style.className} onChange={e => { const newStyle = PREDEFINED_STYLES.find(s => s.style.className === e.target.value); if (newStyle) updateRule(rule.id, { style: newStyle.style }); }} className="md:col-span-1 p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">{PREDEFINED_STYLES.map(s => <option key={s.name} value={s.style.className}>{s.name}</option>)}</select><button onClick={() => removeRule(rule.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-md flex justify-center"><TrashIcon className="w-5 h-5"/></button></div>)}<button onClick={addRule} className="w-full mt-2 p-2 text-sm flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-md transition-colors"><PlusIcon className="w-5 h-5"/> Add Rule</button></div><div className="flex justify-end space-x-3 mt-6"><button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button><button onClick={() => { onSave(localRules); onClose(); }} className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-500 rounded-md">Save Rules</button></div></div></div>;
};
