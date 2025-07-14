


import React, { useContext, useState, useMemo, useCallback, DragEvent, useEffect, useRef } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Brush, LabelList, ReferenceLine
} from 'recharts';
import { ChartDataItem, AggregatorType, PivotValueFieldConfig, PivotFilterConfig, ChartState, initialChartState, ChartStyle } from '../../types';
import { CHART_STYLES } from '../../constants';

// --- ICONS ---
const CloseIcon: React.FC<{className?: string}> = ({className = "w-3 h-3"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const FilterIcon: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>;
const UpArrowIcon: React.FC<{className?: string}> = ({className="w-3 h-3"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.28 9.78a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg>;
const DownArrowIcon: React.FC<{className?: string}> = ({className="w-3 h-3"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.97-3.968a.75.75 0 111.06 1.06l-5.25 5.25a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 111.06-1.06l3.97 3.968V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg>;
const ExpandIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75L16.5 16.5m0 0V8.25m0 8.25H8.25" /></svg>;
const RestoreIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>;
const ExportIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const ReferenceIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" /></svg>;
const DuplicateIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;
const ClearIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12L12 14.25m-2.25 2.25L12 12m0 0l2.25-2.25M12 12l-2.25 2.25M12 12L9.75 9.75M14.25 12l2.25-2.25M9.75 14.25l2.25-2.25M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>;
const PlusIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

// --- CONFIGURATION ---
const GRADIENT_ID_PREFIX = "colorGradient";

const NUMERIC_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'sum', label: 'Sum' }, { value: 'average', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', label: 'Max' }, { value: 'count', label: 'Count' }, { value: 'countNonEmpty', label: 'Count Non-Empty' }, ];
const TEXT_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'countNonEmpty', label: 'Count Non-Empty' }, { value: 'count', label: 'Count All' }, ];
const REFERENCE_LINE_COLORS: Record<string, string> = {
    yellow: '#facc15',
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    white: '#e5e7eb'
};

// --- UTILITY FUNCTIONS ---
const performAggregation = (values: any[], aggType: AggregatorType): number | undefined => {
    if (!values) return 0;
    const numericValues = values.map(v => (v === null || v === undefined) ? NaN : parseFloat(String(v).replace(/,/g, ''))).filter(v => !isNaN(v) && isFinite(v));
    const nonEmptyValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    switch (aggType) {
        case 'sum': return numericValues.length > 0 ? numericValues.reduce((s, a) => s + a, 0) : 0;
        case 'count': return values.length;
        case 'countNonEmpty': return nonEmptyValues.length;
        case 'average': return numericValues.length > 0 ? numericValues.reduce((s, a) => s + a, 0) / numericValues.length : undefined;
        case 'min': return numericValues.length > 0 ? Math.min(...numericValues) : undefined;
        case 'max': return numericValues.length > 0 ? Math.max(...numericValues) : undefined;
        default: return undefined;
    }
}
const getLegendProps = (position: string) => {
    switch (position) {
        case 'top': return { verticalAlign: 'top' as const, align: 'center' as const, wrapperStyle: { top: -10, left: 20 } };
        case 'right': return { verticalAlign: 'middle' as const, align: 'right' as const, layout: 'vertical' as const, wrapperStyle: { top: 0, right: 0 } };
        case 'left': return { verticalAlign: 'middle' as const, align: 'left' as const, layout: 'vertical' as const, wrapperStyle: { top: 0, left: -10 } };
        case 'bottom': default: return { verticalAlign: 'bottom' as const, align: 'center' as const, wrapperStyle: { bottom: 0, left: 20 } };
    }
}

// --- HELPER COMPONENTS ---
const GradientDefs: React.FC<{ colors: string[], theme: string[] }> = ({ colors, theme }) => (
    <defs>
        {colors.map((color, index) => (
            <linearGradient key={index} id={`${GRADIENT_ID_PREFIX}${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme[(index + 1) % theme.length]} stopOpacity={0.2}/>
            </linearGradient>
        ))}
    </defs>
);
const CustomTooltip: React.FC<any> = ({ active, payload, label, style, data, seriesTotals }) => {
    if (active && payload && payload.length) {
        const currentIndex = data.findIndex((item: any) => item.name === label);
        const prevItem = currentIndex > 0 ? data[currentIndex - 1] : null;

        return (
            <div className="p-3 rounded-lg shadow-xl border" style={{...style, borderStyle: 'solid', borderWidth: '1px'}}>
                <p className="font-bold text-purple-300 mb-2 truncate">{`${label}`}</p>
                {payload.map((pld: any, index: number) => {
                    const value = pld.value as number;
                    if (typeof value !== 'number') return null;

                    const prevValue = prevItem ? (prevItem[pld.dataKey] as number) : null;
                    const gap = prevValue !== null && typeof prevValue === 'number' ? value - prevValue : null;
                    
                    const total = seriesTotals[pld.dataKey];
                    const percentage = total ? (value / total) * 100 : null;
                    
                    return (
                      <div key={index} className="text-sm border-t border-gray-700 pt-2 mt-2 first:mt-0 first:border-t-0 first:pt-0">
                          <div className="flex justify-between items-center">
                              <span className="font-semibold truncate" style={{ color: pld.color || pld.stroke || pld.fill }}>{pld.name}</span>
                              <span className="font-bold" style={{ color: pld.color || pld.stroke || pld.fill }}>{value.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                              <span>Gap:</span>
                              {gap !== null ? (
                                  <span className={`flex items-center font-medium ${gap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {gap > 0 ? <UpArrowIcon/> : <DownArrowIcon/>}
                                      {Math.abs(gap).toLocaleString(undefined, {maximumFractionDigits: 2})}
                                  </span>
                              ) : <span>-</span>}
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-400">
                              <span>% of Total:</span>
                              {percentage !== null ? (
                                  <span className="font-medium text-gray-300">{percentage.toFixed(1)}%</span>
                              ) : <span>-</span>}
                          </div>
                      </div>
                    )
                })}
            </div>
        );
    }
    return null;
};
const FilterValuesModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (field: string, selectedValues: (string | number)[]) => void; field: string; allValues: (string | number)[]; currentSelection: (string | number)[]; }> = ({ isOpen, onClose, onSave, field, allValues, currentSelection }) => {
    const [selection, setSelection] = useState<(string | number)[]>(currentSelection);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => { setSelection(currentSelection); }, [currentSelection, isOpen]);
    if (!isOpen) return null;
    const filteredValues = allValues.filter(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
    const handleToggle = (value: string | number) => setSelection(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    const handleSelectAll = () => setSelection(filteredValues);
    const handleDeselectAll = () => setSelection([]);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1060] p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-fuchsia-700/70 rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-fuchsia-300 mb-4">Filter: <span className="text-white">{field}</span></h3>
                <input type="text" placeholder="Search values..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 mb-3" />
                <div className="flex space-x-2 mb-3"><button onClick={handleSelectAll} className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">Select All Visible</button><button onClick={handleDeselectAll} className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded">Deselect All</button></div>
                <ul className="flex-1 overflow-y-auto space-y-1 pr-2">{filteredValues.map(val => (<li key={String(val)}><label className="flex items-center space-x-3 p-1 rounded hover:bg-gray-700/50 cursor-pointer"><input type="checkbox" checked={selection.includes(val)} onChange={() => handleToggle(val)} className="h-4 w-4 text-fuchsia-500 bg-gray-700 border-gray-600 rounded focus:ring-fuchsia-400" /><span className="text-gray-300 text-sm">{String(val)}</span></label></li>))}</ul>
                <div className="flex justify-end space-x-3 mt-4"><button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button><button onClick={() => onSave(field, selection)} className="px-4 py-2 text-sm text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-md">Apply Filter</button></div>
            </div>
        </div>
    );
};
const ColorPickerPopover: React.FC<{ anchorEl: HTMLElement | null; onClose: () => void; onColorSelect: (color: string) => void; }> = ({ anchorEl, onClose, onColorSelect }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const availableColors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff5e00', '#7605e2', '#2dd4bf', '#a78bfa', '#f87171', '#fbbf24', '#34d399', '#818cf8', '#f43f5e', '#67e8f9', '#eab308', '#ef4444'];
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) onClose(); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    if (!anchorEl) return null;
    const rect = anchorEl.getBoundingClientRect();
    const style: React.CSSProperties = { position: 'absolute', top: `${rect.bottom + 5}px`, left: `${rect.left}px`, zIndex: 1070 };
    return (
        <div ref={popoverRef} style={style} className="bg-gray-800 p-2 rounded-lg shadow-2xl border border-gray-600">
            <div className="grid grid-cols-4 gap-2">{availableColors.map(color => (<button key={color} onClick={() => { onColorSelect(color); onClose(); }} className="w-6 h-6 rounded-full transition-transform hover:scale-110" style={{ backgroundColor: color }} />))}</div>
        </div>
    );
};

interface ActiveFilterConfig {
    field: string;
    selectedValues: (string | number)[];
    chartId: 1 | 2;
}

interface ActiveColorPickerConfig {
    field: string;
    anchorEl: HTMLElement;
    chartId: 1 | 2;
}

// --- Local ChartInstance Component ---
const ChartInstance: React.FC<{
    chartId: 1 | 2,
    state: ChartState,
    setState: (updater: (prevState: ChartState) => ChartState) => void,
    isActive: boolean,
    onSetActive: () => void,
    onDuplicate: () => void,
    onClear: () => void,
    onMaximize: () => void,
    isMaximized?: boolean;
    tableData: any[],
    numericalHeaders: string[],
    handleDragStart: (e: DragEvent<HTMLDivElement>, field: string, source: 'xAxis' | 'yAxis' | 'filters', sourceChartId: 1 | 2) => void,
    handleRemoveField: (chartId: 1 | 2, source: 'xAxis' | 'yAxis' | 'filters', field: string) => void,
    onOpenFilterModal: (config: PivotFilterConfig, chartId: 1 | 2) => void,
    onOpenColorPicker: (field: string, anchorEl: HTMLElement, chartId: 1 | 2) => void,
}> = ({
    chartId, state, setState, isActive, onSetActive, onDuplicate, onClear, onMaximize, isMaximized = false,
    tableData, numericalHeaders, handleDragStart, handleRemoveField, onOpenFilterModal, onOpenColorPicker
}) => {
    
    const { chartType, xAxisField, yAxisFields, filterConfigs, chartOptions, referenceLineConfig } = state;
    const currentStyle = CHART_STYLES[chartOptions.chartStyleId] || CHART_STYLES.vibrantHolo;
    const currentColors = currentStyle.colors;

    const { transformedData, seriesTotals } = useMemo(() => {
        if (!tableData || tableData.length === 0 || !xAxisField || yAxisFields.length === 0) return { transformedData: [], seriesTotals: {} };
        let data = [...tableData];
        filterConfigs.forEach(filter => {
            if (filter.selectedValues.length > 0) {
                data = data.filter(row => {
                    const value = row[filter.field];
                    if (value === null || value === undefined) return false;
                    let comparableValue: string | number;
                    if (value instanceof Date) comparableValue = value.toISOString().split('T')[0];
                    else if (typeof value === 'boolean') comparableValue = String(value);
                    else comparableValue = value as (string | number);
                    return filter.selectedValues.includes(comparableValue);
                });
            }
        });
        const staging: { [category: string]: { [field: string]: any[] } } = {};
        data.forEach(row => {
            const category = String(row[xAxisField!]);
            if (!staging[category]) staging[category] = {};
            yAxisFields.forEach(yField => {
                if (!staging[category][yField.field]) staging[category][yField.field] = [];
                staging[category][yField.field].push(row[yField.field]);
            });
        });
        const finalData = Object.entries(staging).map(([name, fields]) => {
            const item: ChartDataItem = { name };
            yAxisFields.forEach(yField => {
                const result = performAggregation(fields[yField.field], yField.aggregator);
                item[`${yField.displayName || yField.field}`] = result;
            });
            return item;
        });

        const totals: {[key: string]: number} = {};
        yAxisFields.forEach(yField => {
            const key = yField.displayName || yField.field;
            totals[key] = finalData.reduce((sum, item) => sum + (typeof item[key] === 'number' ? (item[key] as number) : 0), 0);
        });

        return { transformedData: finalData, seriesTotals: totals };
    }, [tableData, xAxisField, yAxisFields, filterConfigs]);

    const handleOptionChange = (option: keyof typeof chartOptions, value: any) => setState(prev => ({ ...prev, chartOptions: { ...prev.chartOptions, [option]: value } }));
    
    const handleChartStyleChange = (styleId: string) => {
        const themeColors = CHART_STYLES[styleId]?.colors || [];
        setState(prev => ({
            ...prev,
            chartOptions: { ...prev.chartOptions, chartStyleId: styleId },
            yAxisFields: prev.yAxisFields.map((field, index) => ({ ...field, color: themeColors[index % themeColors.length] }))
        }));
    };

    const CustomTooltipWrapper = (props: any) => {
      if (!props.active || !props.payload || props.payload.length === 0) return null;
      return <CustomTooltip {...props} style={currentStyle.tooltip} data={transformedData} seriesTotals={seriesTotals} />;
    };
    
    const renderChart = (isMaximized = false) => {
        if (!xAxisField) return <div className="flex items-center justify-center h-full text-gray-400"><p>Please add a field to the <strong className='text-purple-300'>X-Axis</strong>.</p></div>;
        if (yAxisFields.length === 0) return <div className="flex items-center justify-center h-full text-gray-400"><p>Please add at least one field to the <strong className='text-purple-300'>Y-Axis (Values)</strong>.</p></div>;
        if (transformedData.length === 0) return <div className="flex items-center justify-center h-full text-gray-400"><p>No data to display for the current configuration.</p></div>;
        
        const yAxisColor = yAxisFields[0]?.color || currentColors[0];
        const commonProps = { margin: { top: 5, right: 20, left: 10, bottom: isMaximized ? 60 : 50 } };
        const commonCartesianProps = { cartesianGrid: chartOptions.showGrid ? <CartesianGrid {...currentStyle.grid} /> : null, tooltip: <Tooltip content={<CustomTooltipWrapper />} isAnimationActive={false}/>, legend: <Legend {...getLegendProps(chartOptions.legendPosition)} wrapperStyle={currentStyle.legend} /> };
        const brush = <Brush dataKey="name" height={30} stroke={currentColors[0]} fill="rgba(167, 139, 250, 0.1)" y={isMaximized ? undefined : 450}/>;

        let refLine = null;
        if (referenceLineConfig.enabled && transformedData.length > 0) {
            let yVal: number | undefined;
            let labelText = referenceLineConfig.type;
        
            if (referenceLineConfig.type === 'manual') {
                yVal = referenceLineConfig.value;
                labelText = `Manual: ${yVal}`;
            } else if (referenceLineConfig.field) {
                const seriesData = transformedData.map(d => (d as any)[referenceLineConfig.field] as number).filter(v => typeof v === 'number');
                if (seriesData.length > 0) {
                    switch (referenceLineConfig.type) {
                        case 'average': yVal = seriesData.reduce((a, b) => a + b, 0) / seriesData.length; break;
                        case 'median': const sorted = [...seriesData].sort((a,b) => a-b); yVal = sorted.length % 2 === 0 ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2 : sorted[Math.floor(sorted.length/2)]; break;
                        case 'max': yVal = Math.max(...seriesData); break;
                        case 'min': yVal = Math.min(...seriesData); break;
                    }
                    if (yVal !== undefined) labelText = `${referenceLineConfig.type}: ${yVal.toFixed(2)}`;
                }
            }
            if (yVal !== undefined) refLine = <ReferenceLine y={yVal} label={{value: labelText, fill: referenceLineConfig.color, fontSize: 12, position: 'insideTopLeft' }} stroke={referenceLineConfig.color} strokeDasharray="4 4" />;
        }
        
        const tickStyle = { fontSize: 10, fill: currentStyle.axis.color };

        switch (chartType) {
            case 'bar': case 'horizontalBar': {
                const tickFormatter = (tick: any) => {
                    const limit = 15;
                    if (typeof tick === 'string' && tick.length > limit) return `${tick.substring(0, limit)}...`;
                    return tick;
                };
                const xAxisEl = chartType === 'horizontalBar' ? <XAxis type="number" stroke={yAxisColor} tick={tickStyle} /> : <XAxis dataKey="name" stroke={currentStyle.axis.color} tick={tickStyle} angle={-45} textAnchor="end" interval={0} />;
                const yAxisEl = chartType === 'horizontalBar' ? <YAxis type="category" dataKey="name" stroke={currentStyle.axis.color} tick={{ ...tickStyle, width: 120 }} tickFormatter={tickFormatter} interval={0} /> : <YAxis stroke={yAxisColor} tick={tickStyle} />;
                return <BarChart data={transformedData} layout={chartType === 'horizontalBar' ? 'vertical' : 'horizontal'} {...commonProps}> {commonCartesianProps.cartesianGrid} {xAxisEl} {yAxisEl} {commonCartesianProps.tooltip} {commonCartesianProps.legend} {refLine} {yAxisFields.map((field, i) => (<Bar key={field.field} dataKey={field.displayName || field.field} name={field.displayName || field.field} fill={field.color || currentColors[i % currentColors.length]} radius={currentStyle.bar?.radius} className={currentStyle.bar?.className} stackId={chartOptions.stackData ? 'a' : undefined}> {chartOptions.showDataLabels && <LabelList dataKey={field.displayName || field.field} position="top" style={{fontSize: 10, fill: '#fff'}} />} </Bar>))} {chartType !== 'horizontalBar' && brush} </BarChart>;
            }
            case 'line': case 'area': {
                const ChartComponent = chartType === 'line' ? LineChart : AreaChart;
                return <ChartComponent data={transformedData} stackOffset={chartOptions.stackData ? "expand" : undefined} {...commonProps}><defs>{chartType === 'area' && currentStyle.area?.gradient && <GradientDefs colors={yAxisFields.map((f, i) => f.color || currentColors[i % currentColors.length])} theme={currentColors} />}</defs>{commonCartesianProps.cartesianGrid}<XAxis dataKey="name" stroke={currentStyle.axis.color} tick={tickStyle} angle={-45} textAnchor="end" interval={0} /><YAxis stroke={yAxisColor} tick={tickStyle} />{commonCartesianProps.tooltip}{commonCartesianProps.legend}{refLine}{yAxisFields.map((field, i) => { const key = field.displayName || field.field; const color = field.color || currentColors[i % currentColors.length]; const baseProps = { key: field.field, type: "monotone" as const, dataKey: key, name: key, stackId: chartOptions.stackData ? 'a' : undefined, isAnimationActive: false }; if (chartType === 'line') return <Line {...baseProps} {...currentStyle.line} stroke={color}>{chartOptions.showDataLabels && <LabelList dataKey={key} position="top" style={{ fontSize: 10, fill: '#fff' }} />}</Line>; return <Area {...baseProps} {...currentStyle.area} stroke={color} fill={currentStyle.area?.gradient ? `url(#${GRADIENT_ID_PREFIX}${i})` : color} >{chartOptions.showDataLabels && <LabelList dataKey={key} position="top" style={{ fontSize: 10, fill: '#fff' }} />}</Area>;})}{brush}</ChartComponent>;
            }
            case 'pie': {
                if (yAxisFields.length === 0) return null; const yField = yAxisFields[0]; const key = yField.displayName || yField.field; const pieData = transformedData.map(item => ({name: item.name, value: (item as any)[key] as number })); return <PieChart {...commonProps}><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={currentStyle.pie?.outerRadius || 120} innerRadius={currentStyle.pie?.innerRadius || 0} labelLine={false} label={currentStyle.pie?.label !== false ? (({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`) : undefined}>{pieData.map((_entry, index) => ( <Cell key={`cell-${index}`} fill={currentColors[index % currentColors.length]} stroke={currentStyle.pie?.stroke} className={currentStyle.pie?.className} />))}</Pie>{commonCartesianProps.tooltip} {commonCartesianProps.legend}</PieChart>;
            }
            case 'scatter': {
                if (yAxisFields.length < 2) return <div className="flex items-center justify-center h-full text-gray-400"><p>Scatter plots require at least two <strong className='text-purple-300'>Y-Axis</strong> fields.</p></div>; const xDataKey = yAxisFields[0].displayName || yAxisFields[0].field; const yDataKey = yAxisFields[1].displayName || yAxisFields[1].field; return (<ScatterChart {...commonProps}>{commonCartesianProps.cartesianGrid}<XAxis type="number" dataKey={xDataKey} name={xDataKey} stroke={currentStyle.axis.color} tick={tickStyle} /><YAxis type="number" dataKey={yDataKey} name={yDataKey} stroke={currentStyle.axis.color} tick={tickStyle} />{commonCartesianProps.tooltip}{commonCartesianProps.legend}<Scatter name={yAxisFields.length > 2 ? yAxisFields[2].displayName : "Data Points"} data={transformedData} fill={yAxisFields[0]?.color || currentColors[0]}>{chartOptions.showDataLabels && <LabelList dataKey="name" position="top" style={{fontSize: 10, fill: '#fff'}} />}</Scatter>{brush}</ScatterChart>);
            }
            case 'radar': {
                return (<RadarChart cx="50%" cy="50%" outerRadius={isMaximized ? "85%" : "80%"} data={transformedData} {...commonProps}><PolarGrid gridType="circle" stroke={currentStyle.grid.stroke} strokeOpacity={currentStyle.grid.strokeOpacity} /><PolarAngleAxis dataKey="name" stroke={currentStyle.axis.color} tick={tickStyle} /><PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={tickStyle} strokeOpacity={0.5} />{commonCartesianProps.tooltip}{commonCartesianProps.legend}{yAxisFields.map((field, i) => (<Radar key={field.field} name={field.displayName || field.field} dataKey={field.displayName || field.field} stroke={field.color || currentColors[i % currentColors.length]} fill={field.color || currentColors[i % currentColors.length]} fillOpacity={0.6} isAnimationActive={false}/>))}</RadarChart>);
            }
            default: return null;
        }
    };

    return (
        <Panel className={isMaximized ? 'w-full h-full' : ''}>
            <div className={`grid grid-cols-12 gap-6 ${isMaximized ? 'h-full' : ''}`} onClick={onSetActive}>
                <div className={`col-span-12 ${!isMaximized ? 'xl:col-span-9' : ''} bg-gray-800/50 p-4 rounded-lg min-h-[500px] flex flex-col`}>
                    <div className="flex justify-between items-start mb-4">
                        <h2 className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 text-xl`}>Chart {chartId}</h2>
                         <div className="flex items-center gap-2">
                            {!isMaximized && <button onClick={onDuplicate} title="Duplicate to other chart" className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"><DuplicateIcon className="w-4 h-4" /></button>}
                            <button onClick={onClear} title="Clear Chart Configuration" className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"><ClearIcon className="w-4 h-4" /></button>
                            <button onClick={onMaximize} title={isMaximized ? "Restore Down" : "Maximize Chart"} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full">
                                {isMaximized ? <RestoreIcon className="w-4 h-4" /> : <ExpandIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">{renderChart(isMaximized)}</ResponsiveContainer>
                    </div>
                </div>
                {!isMaximized && (
                    <div className="col-span-12 xl:col-span-3">
                        <details className="space-y-4 bg-gray-900/50 p-4 rounded-lg" open>
                            <summary className="text-md font-semibold text-gray-300 cursor-pointer">Chart Styles & Options</summary>
                            <div className="space-y-4 pt-4 border-t border-gray-700">
                                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Chart Type</label> <select value={chartType} onChange={e => setState(p => ({...p, chartType: e.target.value}))} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-600 shadow-sm"> <option value="bar">Bar Chart</option><option value="horizontalBar">Horizontal Bar</option><option value="line">Line Chart</option><option value="area">Area Chart</option><option value="pie">Pie Chart</option><option value="scatter">Scatter Plot</option><option value="radar">Radar Chart</option> </select> </div>
                                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Chart Style</label> <select value={chartOptions.chartStyleId} onChange={e => handleChartStyleChange(e.target.value)} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-600 shadow-sm"> {Object.values(CHART_STYLES).map(style => <option key={style.id} value={style.id}>{style.name}</option>)} </select> </div>
                                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300"><input type="checkbox" checked={chartOptions.stackData} onChange={e => handleOptionChange('stackData', e.target.checked)} className="h-4 w-4 text-purple-500 bg-gray-600 rounded border-gray-500 focus:ring-purple-400"/><span>Stack Data</span></label>
                                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300"><input type="checkbox" checked={chartOptions.showDataLabels} onChange={e => handleOptionChange('showDataLabels', e.target.checked)} className="h-4 w-4 text-purple-500 bg-gray-600 rounded border-gray-500 focus:ring-purple-400"/><span>Show Data Labels</span></label>
                                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300"><input type="checkbox" checked={chartOptions.showGrid} onChange={e => handleOptionChange('showGrid', e.target.checked)} className="h-4 w-4 text-purple-500 bg-gray-600 rounded border-gray-500 focus:ring-purple-400"/><span>Show Gridlines</span></label>
                                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Legend Position</label> <select value={chartOptions.legendPosition} onChange={e => handleOptionChange('legendPosition', e.target.value)} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-600 shadow-sm"> <option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option> </select> </div>
                            </div>
                        </details>
                        <details className="space-y-4 bg-gray-900/50 p-4 rounded-lg mt-4" open>
                            <summary className="text-md font-semibold text-gray-300 cursor-pointer flex items-center gap-2"><ReferenceIcon /> Reference Line</summary>
                            <div className="space-y-3 pt-4 border-t border-gray-700">
                                <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300"><input type="checkbox" checked={referenceLineConfig.enabled} onChange={e => setState(p => ({...p, referenceLineConfig: {...p.referenceLineConfig, enabled: e.target.checked}}))} className="h-4 w-4 text-amber-500 bg-gray-600 rounded border-gray-500 focus:ring-amber-400"/><span>Enable Reference Line</span></label>
                                <div className={`space-y-3 ${!referenceLineConfig.enabled ? 'opacity-50' : ''}`}>
                                    <div><label className="block text-sm font-medium text-gray-400 mb-1">Type</label><select value={referenceLineConfig.type} onChange={e => setState(p => ({...p, referenceLineConfig: {...p.referenceLineConfig, type: e.target.value}}))} disabled={!referenceLineConfig.enabled} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 border border-gray-600 shadow-sm"><option value="average">Average</option><option value="median">Median</option><option value="max">Maximum</option><option value="min">Minimum</option><option value="manual">Manual Value</option></select></div>
                                    {referenceLineConfig.type === 'manual' ? (<div><label className="block text-sm font-medium text-gray-400 mb-1">Value</label><input type="number" value={referenceLineConfig.value} onChange={e => setState(p => ({...p, referenceLineConfig: {...p.referenceLineConfig, value: parseFloat(e.target.value) || 0}}))} disabled={!referenceLineConfig.enabled} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 border border-gray-600 shadow-sm"/></div>) : (<div><label className="block text-sm font-medium text-gray-400 mb-1">Series</label><select value={referenceLineConfig.field} onChange={e => setState(p => ({...p, referenceLineConfig: {...p.referenceLineConfig, field: e.target.value}}))} disabled={!referenceLineConfig.enabled} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 border border-gray-600 shadow-sm"><option value="">Select a series...</option>{yAxisFields.map(f => <option key={f.field} value={f.displayName || f.field}>{f.displayName || f.field}</option>)}</select></div>)}
                                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Line Color</label><div className="flex space-x-2">{Object.entries(REFERENCE_LINE_COLORS).map(([name, color]) => (<button key={name} onClick={() => setState(p => ({...p, referenceLineConfig: {...p.referenceLineConfig, color: color}}))} disabled={!referenceLineConfig.enabled} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${referenceLineConfig.color === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''}`} style={{ backgroundColor: color }} title={name}/>))}</div></div>
                                </div>
                            </div>
                        </details>
                    </div>
                )}
            </div>
        </Panel>
    )
}

// --- MAIN VIEW ---
const VisualizationView: React.FC = () => {
    const { tableData, fileHeaders, visualizationState, setVisualizationState } = useContext(DataContext);
    const { chart1: chartState1, chart2: chartState2 } = visualizationState;

    const setChartState1 = (updater: (prevState: ChartState) => ChartState) => {
        setVisualizationState(prev => ({ ...prev, chart1: updater(prev.chart1) }));
    };

    const setChartState2 = (updater: (prevState: ChartState) => ChartState) => {
        setVisualizationState(prev => ({ ...prev, chart2: updater(prev.chart2) }));
    };
    
    const [activeEditor, setActiveEditor] = useState<1 | 2>(1);
    
    const [draggedItem, setDraggedItem] = useState<{ field: string; source: 'xAxis' | 'yAxis' | 'filters', sourceChartId?: 1 | 2 } | null>(null);
    const [dropZoneActive, setDropZoneActive] = useState<string | null>(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilterConfig, setActiveFilterConfig] = useState<ActiveFilterConfig | null>(null);
    const [activeColorPicker, setActiveColorPicker] = useState<ActiveColorPickerConfig | null>(null);
    const [maximizedChart, setMaximizedChart] = useState<1 | 2 | null>(null);
    const [selectedAvailableField, setSelectedAvailableField] = useState<string | null>(null);


    const { numericalHeaders } = useMemo(() => {
      if (!tableData || tableData.length === 0 || !fileHeaders) return { numericalHeaders: [], categoricalHeaders: [] };
      const numerical = fileHeaders.filter(h => tableData.every(row => { const v = row[h]; return v === null || v === undefined || String(v).trim() === '' || !isNaN(Number(v)); }));
      const categorical = fileHeaders.filter(h => !numerical.includes(h));
      return { numericalHeaders: numerical, categoricalHeaders: categorical };
    }, [tableData, fileHeaders]);

    const activeChartState = useMemo(() => activeEditor === 1 ? chartState1 : chartState2, [activeEditor, chartState1, chartState2]);

    const availableFields = useMemo(() => {
        const usedFields = new Set([
            activeChartState.xAxisField,
            ...activeChartState.yAxisFields.map(f => f.field),
            ...activeChartState.filterConfigs.map(f => f.field)
        ].filter(Boolean));
        return fileHeaders.filter(h => !usedFields.has(h));
    }, [fileHeaders, activeChartState]);

    const handleDragStart = (e: DragEvent<HTMLDivElement>, field: string, source: 'xAxis' | 'yAxis' | 'filters', sourceChartId?: 1 | 2) => {
        setDraggedItem({ field, source, sourceChartId });
        e.dataTransfer.setData("text/plain", field);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleRemoveField = (chartId: 1 | 2, source: 'xAxis' | 'yAxis' | 'filters', field: string) => {
        const setState = chartId === 1 ? setChartState1 : setChartState2;
        setState(prev => {
            let newState = { ...prev };
            if (source === 'xAxis' && prev.xAxisField === field) newState.xAxisField = null;
            if (source === 'yAxis') newState.yAxisFields = prev.yAxisFields.filter(f => f.field !== field);
            if (source === 'filters') newState.filterConfigs = prev.filterConfigs.filter(f => f.field !== field);
            return newState;
        });
    };

    const handleAddFieldToZone = (targetZone: 'xAxis' | 'yAxis' | 'filters') => {
        if (!selectedAvailableField) return;

        const field = selectedAvailableField;
        const setState = activeEditor === 1 ? setChartState1 : setChartState2;

        setState(prev => {
            const isNumeric = numericalHeaders.includes(field);
            let newState = { ...prev };
            
            newState.xAxisField = newState.xAxisField === field ? null : newState.xAxisField;
            newState.yAxisFields = newState.yAxisFields.filter(f => f.field !== field);
            newState.filterConfigs = newState.filterConfigs.filter(f => f.field !== field);

            if (targetZone === 'xAxis') {
                newState.xAxisField = field;
            } else if (targetZone === 'yAxis') {
                const newFieldIndex = prev.yAxisFields.length;
                const newField: PivotValueFieldConfig = {
                    field,
                    aggregator: isNumeric ? 'sum' : 'countNonEmpty',
                    displayName: field,
                    color: CHART_STYLES[prev.chartOptions.chartStyleId].colors[newFieldIndex % CHART_STYLES[prev.chartOptions.chartStyleId].colors.length]
                };
                newState.yAxisFields = [...prev.yAxisFields, newField];
            } else if (targetZone === 'filters') {
                newState.filterConfigs = [...prev.filterConfigs, { field, selectedValues: [] }];
            }
            return newState;
        });

        setSelectedAvailableField(null);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetZone: 'xAxis' | 'yAxis' | 'filters') => {
        e.preventDefault();
        setDropZoneActive(null);
        if (!draggedItem) return;
        
        const { field, source, sourceChartId } = draggedItem;
        
        if (sourceChartId) {
            handleRemoveField(sourceChartId, source, field);
        }
        
        const setState = activeEditor === 1 ? setChartState1 : setChartState2;
        
        setState(prev => {
            const isNumeric = numericalHeaders.includes(field);
            let newState = { ...prev };
            
            if (targetZone === 'xAxis') {
                newState.xAxisField = field;
            } else if (targetZone === 'yAxis') {
                const newFieldIndex = prev.yAxisFields.length;
                const newField: PivotValueFieldConfig = {
                    field,
                    aggregator: isNumeric ? 'sum' : 'countNonEmpty',
                    displayName: field,
                    color: CHART_STYLES[prev.chartOptions.chartStyleId].colors[newFieldIndex % CHART_STYLES[prev.chartOptions.chartStyleId].colors.length]
                };
                newState.yAxisFields = [...prev.yAxisFields, newField];
            } else if (targetZone === 'filters') {
                newState.filterConfigs = [...prev.filterConfigs, { field, selectedValues: [] }];
            }
            return newState;
        });
        
        setDraggedItem(null);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDragEnter = (zoneId: string) => setDropZoneActive(zoneId);
    const handleDragLeave = () => setDropZoneActive(null);

    const handleOpenFilterModal = (config: PivotFilterConfig, chartId: 1 | 2) => { setActiveFilterConfig({ ...config, chartId }); setIsFilterModalOpen(true); };
    const handleSaveFilter = (field: string, selectedValues: (string | number)[]) => {
        if (!activeFilterConfig) return;
        const { chartId } = activeFilterConfig;
        const setState = chartId === 1 ? setChartState1 : setChartState2;
        setState(prev => ({ ...prev, filterConfigs: prev.filterConfigs.map(f => f.field === field ? { ...f, selectedValues } : f) }));
        setIsFilterModalOpen(false);
    };
    const handleOpenColorPicker = (field: string, anchorEl: HTMLElement, chartId: 1 | 2) => { setActiveColorPicker({ field, anchorEl, chartId }); };
    const handleYAxisColorChange = (field: string, color: string) => {
        if (!activeColorPicker) return;
        const { chartId } = activeColorPicker;
        const setState = chartId === 1 ? setChartState1 : setChartState2;
        setState(prev => ({ ...prev, yAxisFields: prev.yAxisFields.map(f => f.field === field ? { ...f, color } : f) }));
    };
    
    const getUniqueValuesForField = useCallback((field: string): (string | number)[] => {
        if (!tableData || !field) return [];
        const uniqueValues = new Set<string | number>();
        tableData.forEach(row => {
            const val = row[field];
            if (val !== null && val !== undefined && val !== '') {
                if (val instanceof Date) uniqueValues.add(val.toISOString().split('T')[0]);
                else if (typeof val === 'boolean') uniqueValues.add(String(val));
                else uniqueValues.add(val as string | number);
            }
        });
        return Array.from(uniqueValues).sort((a,b) => String(a).localeCompare(String(b)));
    }, [tableData]);
    
    function DropZone({ title, zoneId, children }: { title: string; zoneId: 'xAxis' | 'yAxis' | 'filters'; children: React.ReactNode; }) {
      return (
          <div>
              <h3 className={`text-md font-semibold text-gray-300 mb-2`}>{title}</h3>
              <div onDrop={e => handleDrop(e, zoneId)} onDragOver={handleDragOver} onDragEnter={() => handleDragEnter(zoneId)} onDragLeave={handleDragLeave}
                  className={`dropzone-holographic p-3 rounded-lg min-h-[8rem] flex flex-col gap-2 content-start ${dropZoneActive === zoneId || selectedAvailableField ? 'active' : ''}`}
              >
                  <div className="flex-grow space-y-2">{children}</div>
                  <button
                      onClick={() => handleAddFieldToZone(zoneId)}
                      disabled={!selectedAvailableField}
                      className={`mt-2 w-full flex items-center justify-center gap-2 text-xs p-2 rounded-md font-semibold transition-all duration-200 ${
                          !selectedAvailableField
                              ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-500/80 to-fuchsia-500/80 text-white shadow-md hover:from-purple-600 hover:to-fuchsia-600 hover:shadow-lg transform hover:scale-105'
                      }`}
                  >
                      <PlusIcon className="w-4 h-4" />
                      Add Field
                  </button>
              </div>
          </div>
      );
    }

    if (!fileHeaders || fileHeaders.length === 0) return <div className="space-y-6"><h1 className="text-3xl font-bold text-gray-100">Data Visualizations</h1><Panel title="No Data Loaded"><p className="text-gray-300 text-center py-10">Please upload a data file from the <strong className="text-blue-300">'Upload Data'</strong> view to create visualizations.</p></Panel></div>;

    const maximizedState = maximizedChart === 1 ? chartState1 : (maximizedChart === 2 ? chartState2 : null);

    return (
        <div className="space-y-6">
            {isFilterModalOpen && activeFilterConfig && <FilterValuesModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} onSave={handleSaveFilter} field={activeFilterConfig.field} allValues={getUniqueValuesForField(activeFilterConfig.field)} currentSelection={activeFilterConfig.selectedValues} />}
            {activeColorPicker && <ColorPickerPopover anchorEl={activeColorPicker.anchorEl} onClose={() => setActiveColorPicker(null)} onColorSelect={color => handleYAxisColorChange(activeColorPicker.field, color)} />}
            {maximizedChart && maximizedState && (
                <div className="modal-overlay" onClick={() => setMaximizedChart(null)}>
                    <div className="modal-content-maximized" onClick={e => e.stopPropagation()}>
                       <ChartInstance
                            chartId={maximizedChart}
                            state={maximizedState}
                            setState={maximizedChart === 1 ? setChartState1 : setChartState2}
                            isActive={true}
                            onSetActive={() => {}}
                            onDuplicate={() => {
                                if (maximizedChart === 1) setChartState2(() => chartState1);
                                else setChartState1(() => chartState2);
                                setMaximizedChart(null);
                            }}
                            onClear={() => {
                                const updater = (maximizedChart === 1) ? setChartState1 : setChartState2;
                                updater(() => initialChartState);
                                setMaximizedChart(null);
                            }}
                            onMaximize={() => setMaximizedChart(null)}
                            isMaximized={true}
                            tableData={tableData}
                            numericalHeaders={numericalHeaders}
                            handleDragStart={handleDragStart}
                            handleRemoveField={handleRemoveField}
                            onOpenFilterModal={handleOpenFilterModal}
                            onOpenColorPicker={handleOpenColorPicker}
                        />
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold text-gray-100">Data Visualizations</h1>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <Panel title="Chart Builder">
                        <div className="space-y-4">
                            <p className="text-xs text-gray-400">Builder controls active chart: <span className="font-bold text-purple-400">Chart {activeEditor}</span></p>
                            <div>
                                <h3 className="text-md font-semibold text-gray-300 mb-2">Available Fields</h3>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 min-h-[10rem] max-h-60 overflow-y-auto space-y-1.5">
                                   {availableFields.map(field => {
                                       const isSelected = selectedAvailableField === field;
                                       return (
                                          <div
                                              key={field}
                                              onClick={() => setSelectedAvailableField(isSelected ? null : field)}
                                              className={`flex items-center p-2 rounded-md bg-gray-700 text-gray-200 cursor-pointer transition-all duration-200 transform hover:scale-105 ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-purple-500' : 'hover:bg-gray-600'}`}
                                          >
                                             <span className="text-sm font-medium">{field}</span>
                                          </div>
                                       );
                                   })}
                                   {availableFields.length === 0 && <p className="text-xs text-gray-500 text-center p-4">All fields are in use.</p>}
                                </div>
                            </div>
                            <DropZone title="X-Axis (Category)" zoneId="xAxis"> {activeChartState.xAxisField && <div draggable onDragStart={(e) => handleDragStart(e, activeChartState.xAxisField!, 'xAxis', activeEditor)} className="flex items-center justify-between bg-purple-900/70 p-2 rounded text-sm text-white w-full"><span className='truncate'>{activeChartState.xAxisField}</span><button onClick={() => handleRemoveField(activeEditor, 'xAxis', activeChartState.xAxisField!)} className="text-purple-200 hover:text-white"><CloseIcon/></button></div>} </DropZone>
                            <DropZone title="Y-Axis (Values)" zoneId="yAxis">
                                {activeChartState.yAxisFields.map((f, i) => (
                                    <div key={f.field} draggable onDragStart={(e) => handleDragStart(e, f.field, 'yAxis', activeEditor)} className="bg-green-900/70 p-2 rounded text-sm text-white w-full flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <button onClick={(e) => handleOpenColorPicker(f.field, e.currentTarget, activeEditor)} className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-gray-500" style={{ backgroundColor: f.color || CHART_STYLES[activeChartState.chartOptions.chartStyleId].colors[i % CHART_STYLES[activeChartState.chartOptions.chartStyleId].colors.length] }} />
                                            <span className="truncate">{f.displayName || f.field}</span>
                                        </div>
                                        <button onClick={() => handleRemoveField(activeEditor, 'yAxis', f.field)} className="ml-1 text-green-200 hover:text-white"><CloseIcon /></button>
                                    </div>
                                ))}
                            </DropZone>
                            <DropZone title="Filters" zoneId="filters">
                                {activeChartState.filterConfigs.map(f => (
                                     <div key={f.field} draggable onDragStart={(e) => handleDragStart(e, f.field, 'filters', activeEditor)} className="flex items-center justify-between bg-fuchsia-900/70 p-2 rounded text-sm text-white w-full">
                                        <button onClick={() => handleOpenFilterModal(f, activeEditor)} className="flex items-center gap-1.5 text-left truncate w-full"><FilterIcon className="w-3 h-3 text-fuchsia-300"/>{f.field}<span className="text-fuchsia-300/80 text-xs">({f.selectedValues.length || 'All'})</span></button>
                                        <button onClick={() => handleRemoveField(activeEditor, 'filters', f.field)} className="text-fuchsia-200 hover:text-white flex-shrink-0 ml-2"><CloseIcon /></button>
                                    </div>
                                ))}
                            </DropZone>
                        </div>
                    </Panel>
                </div>

                <div className="lg:col-span-9 space-y-6">
                    <div className={`p-1 rounded-xl transition-all duration-300 ${activeEditor === 1 ? 'bg-purple-600/20' : 'bg-transparent'}`}>
                        <ChartInstance 
                            chartId={1} 
                            state={chartState1} 
                            setState={setChartState1} 
                            isActive={activeEditor === 1} 
                            onSetActive={() => setActiveEditor(1)} 
                            onDuplicate={() => setChartState2(() => chartState1)}
                            onClear={() => setChartState1(() => initialChartState)}
                            onMaximize={() => setMaximizedChart(1)}
                            tableData={tableData} numericalHeaders={numericalHeaders}
                            handleDragStart={handleDragStart} handleRemoveField={handleRemoveField}
                            onOpenFilterModal={handleOpenFilterModal} onOpenColorPicker={handleOpenColorPicker}
                        />
                    </div>
                     <div className={`p-1 rounded-xl transition-all duration-300 ${activeEditor === 2 ? 'bg-purple-600/20' : 'bg-transparent'}`}>
                        <ChartInstance 
                            chartId={2} 
                            state={chartState2} 
                            setState={setChartState2} 
                            isActive={activeEditor === 2} 
                            onSetActive={() => setActiveEditor(2)} 
                            onDuplicate={() => setChartState1(() => chartState2)}
                            onClear={() => setChartState2(() => initialChartState)}
                            onMaximize={() => setMaximizedChart(2)}
                            tableData={tableData} numericalHeaders={numericalHeaders}
                            handleDragStart={handleDragStart} handleRemoveField={handleRemoveField}
                            onOpenFilterModal={handleOpenFilterModal} onOpenColorPicker={handleOpenColorPicker}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualizationView;
