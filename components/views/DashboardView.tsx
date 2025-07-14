

import React, { useState, useMemo, useContext, useCallback, useRef, forwardRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { 
    TableRow, FileHeaders, DashboardWidget, WidgetType, KPIWidgetConfig, ChartWidgetConfig, EmbeddedChartWidgetConfig,
    PivotTableSummaryWidgetConfig, KPIFilter, ImageWidgetConfig, StatsWidgetConfig,
    AggregatorType, IconType, ChartState, PivotReportState, ChartDataItem, PivotTheme, ChartStyle, PivotTableUISettings
} from '../../types';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { exportChartDataToCSV, downloadElementAsHTML } from '../../services/DataProcessingService';
import { PIVOT_THEMES, CHART_STYLES } from '../../constants';

// --- ICONS ---
const EditIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const AddIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const ConfigIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.447.368.592.984.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.32 6.32 0 01-.22.127c-.331.183-.581.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11.94l-.213-1.281c-.063-.374-.313.686-.645.87a6.32 6.32 0 01-.22-.127c-.324-.196-.72-.257-1.075.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.003-.827c.293.24.438.613-.438.995s-.145-.755-.438-.995l-1.003-.827a1.125 1.125 0 01-.26-1.431l1.296 2.247a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.075.124.073-.044.146-.087.22-.127.332-.183.582-.495.645.87l.213-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RemoveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const LinkIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const PivotIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3m4-4h14M7 12H3m4 4h14M7 16H3" /></svg>;
const ImageIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const StatsIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;

const NUMERIC_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'sum', label: 'Sum' }, { value: 'average', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', 'label': 'Max' }, ];
const ALL_FIELD_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'count', label: 'Count All' }, { value: 'countNonEmpty', label: 'Count Non-Empty' }, ];
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f97316', '#eab308'];

// Aggregation logic for charts from VisualizationView
const performAggregation = (values: any[], aggType: AggregatorType): number | undefined => {
    if (!values || values.length === 0) return undefined;
    if (aggType === 'count') return values.length;
    
    const nonEmptyValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (aggType === 'countNonEmpty') return nonEmptyValues.length;
    
    const numericValues = nonEmptyValues.map(v => parseFloat(String(v).replace(/,/g, ''))).filter(v => !isNaN(v) && isFinite(v));
    if (numericValues.length === 0) return undefined;
    
    switch (aggType) {
        case 'sum': return numericValues.reduce((s, a) => s + a, 0);
        case 'average': return numericValues.reduce((s, a) => s + a, 0) / numericValues.length;
        case 'min': return Math.min(...numericValues);
        case 'max': return Math.max(...numericValues);
        default: return undefined;
    }
};

// Helper functions for PivotTableSummaryWidget
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


// --- WIDGET COMPONENTS ---

const KPIWidget: React.FC<{ config: KPIWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    const { tableData } = useContext(DataContext);

    const { value, label } = useMemo(() => {
        if (!config.valueField || tableData.length === 0) {
            return { value: 'N/A', label: config.title };
        }
        
        let dataToProcess = tableData;

        // Apply multiple filters if configured
        if (config.filters && config.filters.length > 0) {
            config.filters.forEach(filter => {
                if (filter.field && filter.value) {
                    dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
                }
            });
        }

        const values = dataToProcess.map(row => row[config.valueField!]);
        
        let result: number | undefined;

        if (config.aggregator === 'count' || config.aggregator === 'countNonEmpty') {
             const nonEmptyValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
             result = config.aggregator === 'count' ? values.length : nonEmptyValues.length;
        } else {
             const numericValues = values.map(v => v === null || v === undefined ? NaN : parseFloat(String(v))).filter(v => !isNaN(v));
             if (numericValues.length === 0) return { value: 'N/A', label: config.title };

             switch (config.aggregator) {
                case 'sum': result = numericValues.reduce((s, a) => s + a, 0); break;
                case 'average': result = numericValues.reduce((s, a) => s + a, 0) / numericValues.length; break;
                case 'min': result = Math.min(...numericValues); break;
                case 'max': result = Math.max(...numericValues); break;
                default: result = 0;
            }
        }
        
        const formattedValue = result.toLocaleString(undefined, { maximumFractionDigits: 2 });
        
        let finalLabel = config.title;
        if (config.filters && config.filters.length > 0) {
            const filterDescriptions = config.filters
                .filter(f => f.field && f.value)
                .map(f => `${f.field} = ${f.value}`)
                .join(' & ');
            if (filterDescriptions) {
                finalLabel += ` (${filterDescriptions})`;
            }
        }

        return { value: formattedValue, label: finalLabel };

    }, [config, tableData]);

    if (!config.valueField) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><ConfigIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Configure KPI</p></div>;
    }

    return (
        <div className="text-center">
            <div className="kpi-value" style={{ color: CHART_COLORS[0] }}>{value}</div>
            <div className="kpi-label" title={label}>{label}</div>
        </div>
    );
};

const ChartWidget: React.FC<{ config: ChartWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    const { tableData } = useContext(DataContext);

    const chartData = useMemo(() => {
        if (!config.xAxisField || !config.yAxisField || tableData.length === 0) return [];
        
        const aggregated: { [key: string]: number[] } = {};
        tableData.forEach(row => {
            const xValue = String(row[config.xAxisField!]);
            const yValue = parseFloat(String(row[config.yAxisField!]));
            if (!isNaN(yValue)) {
                if (!aggregated[xValue]) aggregated[xValue] = [];
                aggregated[xValue].push(yValue);
            }
        });
        
        return Object.entries(aggregated).map(([name, values]) => {
            let yValue: number;
            switch (config.aggregator) {
                case 'sum': yValue = values.reduce((s, a) => s + a, 0); break;
                case 'average': yValue = values.reduce((s, a) => s + a, 0) / values.length; break;
                case 'count': yValue = values.length; break;
                case 'min': yValue = Math.min(...values); break;
                case 'max': yValue = Math.max(...values); break;
                default: yValue = 0;
            }
            return { name, [config.yAxisField!]: yValue };
        });

    }, [config, tableData]);
    
    if (!config.xAxisField || !config.yAxisField) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><ConfigIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Configure Chart</p></div>;
    }
    
    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" /><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend /><Bar dataKey={config.yAxisField!} fill={CHART_COLORS[1]} /></BarChart>;
            case 'line':
                return <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" /><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend /><Line type="monotone" dataKey={config.yAxisField!} stroke={CHART_COLORS[2]} /></LineChart>;
            case 'pie':
                return <PieChart><Pie data={chartData} dataKey={config.yAxisField!} nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{chartData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}</Pie><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend /></PieChart>;
            default: return null;
        }
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
    );
};

const EmbeddedChartWidget: React.FC<{ config: EmbeddedChartWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    const { visualizationState, pivotReports, tableData } = useContext(DataContext);
    
    const chartToRender = useMemo(() => {
        if (!config.sourceView || !config.sourceId) return null;

        if (config.sourceView === 'visualizations') {
            const chartState = visualizationState[config.sourceId as 'chart1' | 'chart2'];
            if (!chartState || !chartState.xAxisField || chartState.yAxisFields.length === 0 || !tableData || tableData.length === 0) return null;

            const staging: { [category: string]: { [field: string]: any[] } } = {};
            tableData.forEach(row => {
                const categoryValue = row[chartState.xAxisField!];
                if (categoryValue === null || categoryValue === undefined) return;
                const category = String(categoryValue);

                if (!staging[category]) staging[category] = {};
                chartState.yAxisFields.forEach(yField => {
                    if (!staging[category][yField.field]) staging[category][yField.field] = [];
                    staging[category][yField.field].push(row[yField.field]);
                });
            });

            const finalData = Object.entries(staging).map(([name, fields]) => {
                const item: ChartDataItem = { name };
                chartState.yAxisFields.forEach(yField => {
                    const result = performAggregation(fields[yField.field], yField.aggregator);
                    item[yField.displayName || yField.field] = result;
                });
                return item;
            });
            
            return { 
                type: chartState.chartType, 
                name: `Chart: ${config.sourceId}`, 
                data: finalData, 
                yFields: chartState.yAxisFields, 
                style: CHART_STYLES[chartState.chartOptions.chartStyleId] || CHART_STYLES.vibrantHolo 
            };
        }
        
        if (config.sourceView === 'pivotTable') {
            const report = pivotReports.find(r => r.id === config.sourceId);
            if (!report?.pivotResult?.chartData || report.pivotResult.chartData.length === 0) {
                return null;
            }

            const chartData = report.pivotResult.chartData;
            const dataKeys = Object.keys(chartData[0] || {}).filter(k => k !== 'name');
            
            const pivotYFields = dataKeys.map((key, index) => {
                 const matchingVf = report.pivotResult.config.valueFields.find(vf => key.includes(vf.displayName || vf.field));
                 const theme = PIVOT_THEMES[report.uiSettings.theme] || PIVOT_THEMES.vibrantHologram;
                 return {
                     field: key,
                     displayName: key,
                     color: matchingVf?.color || theme.chartColors[index % theme.chartColors.length]
                 };
            });

            return { 
                type: report.uiSettings.chartType, 
                name: `Pivot: ${report.name}`, 
                data: chartData, 
                yFields: pivotYFields,
                style: PIVOT_THEMES[report.uiSettings.theme] || PIVOT_THEMES.vibrantHologram
            };
        }
        return null;
    }, [config, visualizationState, pivotReports, tableData]);
    
    if (!chartToRender || !chartToRender.data || chartToRender.data.length === 0) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><LinkIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Link to a Chart</p></div>;
    }
    
    const renderChart = () => {
        const { data, type, yFields, style } = chartToRender;
        const colors = (style && 'chartColors' in style) ? style.chartColors : (style && 'colors' in style) ? style.colors : ['#8884d8'];
        const dataKeys = yFields.map(yf => yf.displayName || yf.field);

        switch(type) {
            case 'bar': case 'horizontalBar':
                 return <BarChart data={data} layout={type === 'horizontalBar' ? 'vertical' : 'horizontal'}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />{type === 'horizontalBar' ? <XAxis type="number" tick={{fontSize: 10}}/> : <XAxis dataKey="name" tick={{ fontSize: 10 }} />}{type === 'horizontalBar' ? <YAxis type="category" dataKey="name" tick={{fontSize: 10}} width={80} /> : <YAxis tick={{ fontSize: 10 }} />}{dataKeys.map((key, i) => <Bar key={key} dataKey={key} name={key} fill={yFields[i]?.color || colors[i % colors.length]} />)}<Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></BarChart>;
            case 'line': return <LineChart data={data}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />{dataKeys.map((key, i) => <Line key={key} type="monotone" name={key} dataKey={key} stroke={yFields[i]?.color || colors[i % colors.length]} />)}<Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></LineChart>;
            case 'area': return <AreaChart data={data}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />{dataKeys.map((key, i) => <Area key={key} type="monotone" name={key} dataKey={key} stroke={yFields[i]?.color || colors[i % colors.length]} fill={yFields[i]?.color || colors[i % colors.length]} fillOpacity={0.6}/>)}<Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></AreaChart>;
            case 'pie': case 'donut': {
                if (dataKeys.length === 0) return <p>No data for Pie chart</p>;
                const pieStyle = 'pie' in style ? style.pie : undefined;
                return <PieChart><Pie data={data} dataKey={dataKeys[0]} nameKey="name" cx="50%" cy="50%" outerRadius={pieStyle && isFinite(Number(pieStyle.outerRadius)) ? Number(pieStyle.outerRadius) : 80} innerRadius={type === 'donut' ? (pieStyle && isFinite(Number(pieStyle.innerRadius)) ? Number(pieStyle.innerRadius) : 40) : 0} label>{data.map((_entry, index) => (<Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke={pieStyle?.stroke} className={pieStyle?.className} />))}</Pie><Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></PieChart>;
            }
            default: return <p>Unsupported Chart Type: {type}</p>
        }
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
    );
};

const PivotTableSummaryWidget: React.FC<{ config: PivotTableSummaryWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    const { pivotReports } = useContext(DataContext);

    const { report, result, uiSettings, themeClasses } = useMemo(() => {
        if (!config.sourceId) return {};
        const report = pivotReports.find(r => r.id === config.sourceId);
        if (!report?.pivotResult) return { report };
        const result = report.pivotResult;
        const uiSettings = report.uiSettings;
        const themeClasses = PIVOT_THEMES[uiSettings.theme] || PIVOT_THEMES.vibrantHologram;
        return { report, result, uiSettings, themeClasses };
    }, [config.sourceId, pivotReports]);
    
    if (!config.sourceId || !report || !result) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><PivotIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Link to a Pivot Table</p></div>;
    }

    const MAX_ROWS = 10;
    const MAX_COLS_GROUPS = 5;

    const rowKeys = result.uniqueFlatRowKeys.slice(0, MAX_ROWS);
    const colKeys = result.uniqueFlatColKeys.slice(0, MAX_COLS_GROUPS);
    const matrix = result.dataMatrix.slice(0, MAX_ROWS).map(row => row.slice(0, MAX_COLS_GROUPS));
    const valueFields = result.config.valueFields;

    return (
        <div className="overflow-auto w-full h-full text-xs p-1">
            <table className="min-w-full">
                <thead className="sticky top-0 z-10">
                    <tr>
                        <th className={`p-1 text-left ${themeClasses.tableClasses.headerRowDesc}`}>
                            {result.config.rowFields.join(' / ')}
                        </th>
                        {colKeys.map((cPath, cIndex) => (
                            <th key={cIndex} colSpan={valueFields.length} className={`p-1 text-center ${themeClasses.tableClasses.headerDefault}`}>
                                {cPath.join(' / ')}
                            </th>
                        ))}
                    </tr>
                    {valueFields.length > 1 && colKeys.length > 0 && (
                        <tr>
                            <th className={`p-1 ${themeClasses.tableClasses.headerRowDesc}`}></th>
                            {colKeys.flatMap((cPath, cIndex) => 
                                valueFields.map((vf, vfIndex) => (
                                    <th key={`${cIndex}-${vfIndex}`} className={`p-1 text-center ${themeClasses.tableClasses.headerDefault}`}>
                                        {vf.displayName || vf.field}
                                    </th>
                                ))
                            )}
                        </tr>
                    )}
                </thead>
                <tbody>
                    {rowKeys.map((rPath, rIndex) => (
                        <tr key={rIndex}>
                            <td className={`p-1 text-left font-medium ${themeClasses.tableClasses.cellRowHeader}`}>
                                {rPath.join(' / ')}
                            </td>
                            {colKeys.flatMap((cPath, cIndex) => {
                                const cellData = matrix[rIndex]?.[cIndex] || [];
                                return valueFields.map((vf, vfIndex) => (
                                    <td key={`${vfIndex}`} className={`p-1 text-right ${themeClasses.tableClasses.cellDefault}`}>
                                        {formatCellValue(cellData[vfIndex], uiSettings!)}
                                    </td>
                                ))
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const ImageWidget: React.FC<{ config: ImageWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    if (!config.src) {
        return (
            <div className="widget-placeholder" onClick={() => onConfigure(config.id)}>
                <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p>Configure Image</p>
            </div>
        );
    }
    return <img src={config.src} alt={config.title} className="w-full h-full" style={{ objectFit: config.fit }} />;
};

const StatsWidget: React.FC<{ config: StatsWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    const { tableData } = useContext(DataContext);

    const stats = useMemo(() => {
        if (config.variables.length === 0 || !tableData || tableData.length === 0) return [];

        const totalRows = tableData.length;

        return config.variables.map(variable => {
            const allValues = tableData.map(row => row[variable]);
            const validValues = allValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
            const missing = totalRows - validValues.length;
            const missingPercentage = (missing / totalRows) * 100;

            const numericValues = validValues.map(v => parseFloat(String(v).replace(/,/g, ''))).filter(v => !isNaN(v) && isFinite(v));

            if (numericValues.length / validValues.length > 0.8) {
                const sum = numericValues.reduce((s, a) => s + a, 0);
                const mean = numericValues.length > 0 ? sum / numericValues.length : 0;
                const stdDev = numericValues.length > 0 ? Math.sqrt(numericValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numericValues.length) : 0;
                const sorted = [...numericValues].sort((a, b) => a - b);
                const min = sorted[0] ?? 0;
                const max = sorted[sorted.length - 1] ?? 0;

                const numBins = 10;
                const binWidth = (max - min) / numBins;
                let histogram = [];
                if (binWidth > 0) {
                    const bins = Array(numBins).fill(0).map((_, i) => ({ name: `${(min + i * binWidth).toFixed(1)}`, count: 0 }));
                    numericValues.forEach(val => {
                        let binIndex = Math.floor((val - min) / binWidth);
                        if (binIndex >= numBins) binIndex = numBins - 1;
                        if (bins[binIndex]) bins[binIndex].count++;
                    });
                    histogram = bins;
                } else if (numericValues.length > 0) {
                    histogram = [{ name: min.toFixed(1), count: numericValues.length }];
                }

                return {
                    name: variable,
                    type: 'numeric',
                    stats: {
                        'Mean': mean.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                        'Std Dev': stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                        'Median': (sorted[Math.floor(sorted.length * 0.5)] ?? 0).toLocaleString(),
                        'Min': min.toLocaleString(),
                        'Max': max.toLocaleString(),
                        'Missing': `${missing} (${missingPercentage.toFixed(1)}%)`
                    },
                    chartData: histogram
                };
            } else {
                const valueCounts = new Map<any, number>();
                validValues.forEach(v => valueCounts.set(v, (valueCounts.get(v) || 0) + 1));
                
                const frequencies = Array.from(valueCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([value, count]) => ({ name: String(value).slice(0, 15) + (String(value).length > 15 ? '...' : ''), count }));

                return {
                    name: variable,
                    type: 'categorical',
                    stats: {
                        'Distinct Values': valueCounts.size.toLocaleString(),
                        'Missing': `${missing} (${missingPercentage.toFixed(1)}%)`,
                    },
                    chartData: frequencies
                };
            }
        });
    }, [config.variables, tableData]);

    if (config.variables.length === 0) {
        return (
            <div className="widget-placeholder" onClick={() => onConfigure(config.id)}>
                <StatsIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p>Configure Statistical Analysis</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto text-xs p-1 space-y-3">
            {stats.map(s => (
                <div key={s.name} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                    <h4 className="font-bold text-teal-300 text-sm truncate mb-2">{s.name}</h4>
                    
                    <div className="h-24 w-full mb-2">
                        <ResponsiveContainer>
                            <BarChart data={s.chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#9ca3af' }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 8, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                <Bar dataKey="count" fill={s.type === 'numeric' ? '#22d3ee' : '#a78bfa'} radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        {Object.entries(s.stats).map(([label, value]) => (
                            <div key={label} className="flex justify-between items-baseline border-b border-gray-700/50 py-0.5">
                                <span className="text-gray-400 truncate" title={label}>{label}:</span>
                                <span className="font-semibold text-gray-200 truncate" title={String(value)}>{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- MODAL COMPONENTS ---

const AddWidgetModal: React.FC<{ isOpen: boolean, onClose: () => void, onAddWidget: (type: WidgetType) => void }> = ({ isOpen, onClose, onAddWidget }) => {
    if (!isOpen) return null;
    const widgetOptions: { type: WidgetType, name: string, description: string }[] = [
        { type: 'kpi', name: 'KPI Card', description: 'Display a single key metric.' },
        { type: 'bar', name: 'Bar Chart', description: 'Compare values across categories.' },
        { type: 'line', name: 'Line Chart', description: 'Show trends over a variable.' },
        { type: 'pie', name: 'Pie Chart', description: 'Show proportional data.' },
        { type: 'embeddedChart', name: 'Embedded Chart', description: 'Display a chart from another view.' },
        { type: 'pivotTableSummary', name: 'Pivot Table Summary', description: 'Display a pivot table summary.' },
        { type: 'image', name: 'Image', description: 'Display an image from a file.' },
        { type: 'stats', name: 'Statistical Analysis', description: 'Show key stats for selected variables.' },
    ];

    return (
        <div className="dashboard-modal-overlay" onClick={onClose}>
            <div className="dashboard-modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-100 mb-4">Add a New Widget</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {widgetOptions.map(opt => (
                        <button key={opt.type} onClick={() => { onAddWidget(opt.type); onClose(); }} className="p-4 bg-gray-700/50 rounded-lg text-left hover:bg-gray-600/50 transition-colors border border-gray-600">
                            <h4 className="font-semibold text-blue-300">{opt.name}</h4>
                            <p className="text-sm text-gray-400">{opt.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ConfigureWidgetModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    widget: DashboardWidget,
    onSave: (config: DashboardWidget) => void,
    headers: FileHeaders
}> = ({ isOpen, onClose, widget, onSave, headers }) => {
    const { tableData, pivotReports, visualizationState } = useContext(DataContext);
    const [localConfig, setLocalConfig] = useState(widget);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setLocalConfig(widget);
    }, [widget]);
    
    const numericalHeaders = useMemo(() => {
        if (!headers || !tableData) return [];
        return headers.filter(h => tableData.every(row => row[h] === null || !isNaN(parseFloat(String(row[h])))));
    }, [headers, tableData]);

    if (!isOpen) return null;

    const renderConfigOptions = () => {
        switch (localConfig.type) {
            case 'image': {
                const imgConfig = localConfig as ImageWidgetConfig;
                const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setLocalConfig(prev => ({ ...prev, src: reader.result as string } as ImageWidgetConfig));
                        };
                        reader.readAsDataURL(file);
                    }
                };
                return (
                    <>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full p-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-center">
                            Upload Image
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                        {imgConfig.src && <img src={imgConfig.src} alt="preview" className="mt-2 max-h-40 w-auto mx-auto rounded"/>}
                        <div>
                            <label className="text-sm text-gray-400">Image Fit</label>
                            <select value={imgConfig.fit} onChange={e => setLocalConfig({...localConfig, fit: e.target.value as any})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="contain">Contain</option>
                                <option value="cover">Cover</option>
                                <option value="fill">Fill</option>
                                <option value="scale-down">Scale Down</option>
                            </select>
                        </div>
                    </>
                )
            }
            case 'stats': {
                const statsConfig = localConfig as StatsWidgetConfig;
                const handleVariableToggle = (variable: string) => {
                    setLocalConfig(prev => {
                        const currentStatsConfig = prev as StatsWidgetConfig;
                        const newVariables = currentStatsConfig.variables.includes(variable)
                            ? currentStatsConfig.variables.filter(v => v !== variable)
                            : [...currentStatsConfig.variables, variable];
                        return { ...currentStatsConfig, variables: newVariables };
                    });
                };
                return (
                    <div>
                        <label className="text-sm text-gray-400">Select Variables</label>
                        <div className="mt-1 p-2 bg-gray-900/50 rounded-md max-h-60 overflow-y-auto space-y-1">
                            {headers.map(h => (
                                <label key={h} className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={statsConfig.variables.includes(h)} onChange={() => handleVariableToggle(h)} className="h-4 w-4 text-teal-400 bg-gray-600 rounded border-gray-500 focus:ring-teal-300"/>
                                    <span>{h}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            }
            case 'kpi': {
                const kpiConfig = localConfig as KPIWidgetConfig;
                const isNumericField = numericalHeaders.includes(kpiConfig.valueField || '');
                const aggregationOptions = isNumericField ? [...NUMERIC_AGGREGATORS, ...ALL_FIELD_AGGREGATORS] : ALL_FIELD_AGGREGATORS;

                const handleAddFilter = () => {
                    const newFilters = [...(kpiConfig.filters || []), { id: `filter-${Date.now()}`, field: '', value: '' }];
                    setLocalConfig({ ...localConfig, filters: newFilters });
                };

                const handleRemoveFilter = (id: string) => {
                    const newFilters = kpiConfig.filters?.filter(f => f.id !== id);
                    setLocalConfig({ ...localConfig, filters: newFilters });
                };

                const handleFilterChange = (id: string, prop: 'field' | 'value', value: string) => {
                    const newFilters = kpiConfig.filters?.map(filter => {
                        if (filter.id === id) {
                            const updatedFilter = { ...filter, [prop]: value };
                            if (prop === 'field') updatedFilter.value = '';
                            return updatedFilter;
                        }
                        return filter;
                    });
                    setLocalConfig({ ...localConfig, filters: newFilters });
                };

                return (
                    <>
                        <div>
                            <label className="text-sm text-gray-400">Metric (Field)</label>
                            <select value={kpiConfig.valueField || ''} onChange={e => setLocalConfig({...localConfig, valueField: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="">Select Field</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Aggregation</label>
                            <select value={kpiConfig.aggregator} onChange={e => setLocalConfig({...localConfig, aggregator: e.target.value as AggregatorType})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                {aggregationOptions.map(agg => <option key={agg.value} value={agg.value}>{agg.label}</option>)}
                            </select>
                        </div>
                        <div className="pt-4 border-t border-gray-600 space-y-2 mt-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-md text-gray-300">Filters (Optional)</h4>
                                <button onClick={handleAddFilter} className="px-2 py-1 text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors">
                                    <AddIcon className="w-4 h-4" /> Add Filter
                                </button>
                            </div>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {(kpiConfig.filters || []).map((filter) => {
                                    const filterValues = filter.field ? Array.from(new Set(tableData.map(row => String(row[filter.field] ?? '')))).sort() : [];
                                    return (
                                        <div key={filter.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-gray-900/50 rounded-md items-center">
                                            <select value={filter.field} onChange={e => handleFilterChange(filter.id, 'field', e.target.value)} className="w-full p-2 bg-gray-700 rounded text-sm" aria-label="Filter field">
                                                <option value="">Select Field</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <div className="flex items-center gap-2">
                                                <select value={filter.value} onChange={e => handleFilterChange(filter.id, 'value', e.target.value)} className="w-full p-2 bg-gray-700 rounded text-sm" disabled={!filter.field} aria-label="Filter value">
                                                    <option value="">Select Value</option>
                                                    {filterValues.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                                <button onClick={() => handleRemoveFilter(filter.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-md transition-colors" aria-label="Remove filter">
                                                    <RemoveIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                );
            }
            case 'bar': case 'line': case 'pie': return (
                <>
                     <div>
                        <label className="text-sm text-gray-400">Category (X-Axis)</label>
                        <select value={(localConfig as ChartWidgetConfig).xAxisField || ''} onChange={e => setLocalConfig({...localConfig, xAxisField: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                             <option value="">Select Field</option>
                             {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Value (Y-Axis)</label>
                        <select value={(localConfig as ChartWidgetConfig).yAxisField || ''} onChange={e => setLocalConfig({...localConfig, yAxisField: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            <option value="">Select Field</option>
                            {numericalHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">Aggregation</label>
                        <select value={(localConfig as ChartWidgetConfig).aggregator} onChange={e => setLocalConfig({...localConfig, aggregator: e.target.value as AggregatorType})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            {[...NUMERIC_AGGREGATORS, ...ALL_FIELD_AGGREGATORS].map(agg => <option key={agg.value} value={agg.value}>{agg.label}</option>)}
                        </select>
                    </div>
                </>
            );
            case 'embeddedChart': {
                 const sourceItems = (localConfig as EmbeddedChartWidgetConfig).sourceView === 'pivotTable' 
                    ? pivotReports.map(r => ({id: r.id, name: r.name})) 
                    : [{id: 'chart1', name: 'Chart 1'}, {id: 'chart2', name: 'Chart 2'}];

                return <>
                    <div>
                        <label className="text-sm text-gray-400">Source View</label>
                        <select value={(localConfig as EmbeddedChartWidgetConfig).sourceView || ''} onChange={e => setLocalConfig({...localConfig, sourceView: e.target.value as any, sourceId: null})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            <option value="">Select View</option>
                            <option value="visualizations">Visualizations</option>
                            <option value="pivotTable">Pivot Tables</option>
                        </select>
                    </div>
                    { (localConfig as EmbeddedChartWidgetConfig).sourceView &&
                        <div>
                            <label className="text-sm text-gray-400">Source Item ID</label>
                            <select value={(localConfig as EmbeddedChartWidgetConfig).sourceId || ''} onChange={e => setLocalConfig({...localConfig, sourceId: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="">Select Item</option>
                                {sourceItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                    }
                </>
            };
            case 'pivotTableSummary': {
                return (
                    <div>
                        <label className="text-sm text-gray-400">Source Pivot Report</label>
                        <select value={(localConfig as PivotTableSummaryWidgetConfig).sourceId || ''} onChange={e => setLocalConfig({...localConfig, sourceId: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            <option value="">Select Pivot Report</option>
                            {pivotReports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                )
            };
            default: return <p>This widget type cannot be configured yet.</p>;
        }
    };
    
    const handleSave = () => { onSave(localConfig); };

    return (
        <div className="dashboard-modal-overlay" onClick={onClose}>
            <div className="dashboard-modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-100 mb-4">Configure Widget: {widget.title}</h3>
                <div className="space-y-4">
                     <div>
                        <label className="text-sm text-gray-400">Widget Title</label>
                        <input type="text" value={localConfig.title} onChange={e => setLocalConfig({...localConfig, title: e.target.value})} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"/>
                    </div>
                    {renderConfigOptions()}
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500">Save</button>
                </div>
            </div>
        </div>
    );
};

export const DashboardView: React.FC = () => {
    const { dashboardWidgets, setDashboardWidgets, fileHeaders, tableData } = useContext(DataContext);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [widgetToConfigure, setWidgetToConfigure] = useState<DashboardWidget | null>(null);
    const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const resizeStart = useRef<{x: number, y: number, w: number, h: number, id: string} | null>(null);
    const dashboardContainerRef = useRef<HTMLDivElement>(null);

    const findNextOpenSpot = (widgets: DashboardWidget[], widgetW: number, widgetH: number): { x: number; y: number } => {
        const grid = Array(100).fill(null).map(() => Array(12).fill(false));
        widgets.forEach(w => {
            for (let y = w.y; y < w.y + w.h; y++) {
                for (let x = w.x; x < w.x + w.w; x++) {
                    if(y < 100 && x < 12) grid[y][x] = true;
                }
            }
        });

        for (let y = 0; y < 100; y++) {
            for (let x = 0; x <= 12 - widgetW; x++) {
                let canPlace = true;
                for (let yi = y; yi < y + widgetH; yi++) {
                    for (let xi = x; xi < x + widgetW; xi++) {
                        if (grid[yi]?.[xi]) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }
                if (canPlace) return { x, y };
            }
        }
        return { x: 0, y: 100 }; // Fallback
    };

    const handleAddWidget = (type: WidgetType) => {
        let w = 4, h = 4;
        if (type === 'pivotTableSummary') w = 6;
        if (type === 'image') { w = 4; h = 3; }
        if (type === 'stats') { w = 4; h = 4; }

        const { x, y } = findNextOpenSpot(dashboardWidgets, w, h);
        const newWidget: DashboardWidget = {
            id: `widget-${Date.now()}`,
            title: `New ${type.replace(/([A-Z])/g, ' $1').trim()}`,
            type: type as any, x, y, w, h,
            ...(type === 'kpi' && { valueField: null, aggregator: 'sum', filters: [] }),
            ...(type === 'bar' && { xAxisField: null, yAxisField: null, aggregator: 'sum' }),
            ...(type === 'line' && { xAxisField: null, yAxisField: null, aggregator: 'sum' }),
            ...(type === 'pie' && { xAxisField: null, yAxisField: null, aggregator: 'sum' }),
            ...(type === 'embeddedChart' && { sourceView: null, sourceId: null }),
            ...(type === 'pivotTableSummary' && { sourceId: null }),
            ...(type === 'table' && { columns: [], rowCount: 10 }),
            ...(type === 'image' && { src: null, fit: 'contain' }),
            ...(type === 'stats' && { variables: [] }),
        };
        setDashboardWidgets(prev => [...prev, newWidget]);
    };
    
    const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => { setDraggedWidgetId(id); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragEnd = () => { setDraggedWidgetId(null); setDragOverId(null); };
    const handleDragOver = (e: DragEvent<HTMLDivElement>, id: string) => { e.preventDefault(); if(id !== draggedWidgetId) setDragOverId(id); };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetId: string) => {
        e.preventDefault();
        if (draggedWidgetId && draggedWidgetId !== targetId) {
            setDashboardWidgets(prev => {
                const newWidgets = [...prev];
                const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
                const targetIndex = newWidgets.findIndex(w => w.id === targetId);
                if(draggedIndex === -1 || targetIndex === -1) return prev;

                const draggedWidget = newWidgets[draggedIndex];
                const targetWidget = newWidgets[targetIndex];

                // Swap grid properties
                [draggedWidget.x, targetWidget.x] = [targetWidget.x, draggedWidget.x];
                [draggedWidget.y, targetWidget.y] = [targetWidget.y, draggedWidget.y];
                [draggedWidget.w, targetWidget.w] = [targetWidget.w, draggedWidget.w];
                [draggedWidget.h, targetWidget.h] = [targetWidget.h, draggedWidget.h];

                return newWidgets;
            });
        }
        handleDragEnd();
    };

    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        e.preventDefault(); e.stopPropagation();
        const widget = dashboardWidgets.find(w => w.id === id);
        if(!widget) return;
        resizeStart.current = { x: e.clientX, y: e.clientY, w: widget.w, h: widget.h, id };
        window.addEventListener('mousemove', handleResizeMouseMove);
        window.addEventListener('mouseup', handleResizeMouseUp);
    };

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if(!resizeStart.current || !gridRef.current) return;

        const { width } = gridRef.current.getBoundingClientRect();
        const colWidth = (width - (11 * 24)) / 12; // 24px is gap from css
        const rowHeight = 100 + 24;

        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        
        const newW = Math.max(2, Math.min(12, resizeStart.current.w + Math.round(dx / colWidth)));
        const newH = Math.max(2, Math.min(12, resizeStart.current.h + Math.round(dy / rowHeight)));
        
        setDashboardWidgets(prev => prev.map(w => w.id === resizeStart.current!.id ? {...w, w: newW, h: newH} : w));
    }, []);

    const handleResizeMouseUp = useCallback(() => {
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);
        resizeStart.current = null;
    }, [handleResizeMouseMove]);

    const handleRemoveWidget = (id: string) => { setDashboardWidgets(prev => prev.filter(w => w.id !== id)); };
    const handleOpenConfigure = (id: string) => { const widget = dashboardWidgets.find(w => w.id === id); if (widget) { setWidgetToConfigure(widget); setIsConfigModalOpen(true); } };
    const handleSaveWidgetConfig = (config: DashboardWidget) => { setDashboardWidgets(prev => prev.map(w => w.id === config.id ? config : w)); setIsConfigModalOpen(false); setWidgetToConfigure(null); };
    
    const handleExportWidgetData = (widget: DashboardWidget) => {
        if(widget.type === 'kpi' || widget.type === 'table' || widget.type === 'image' || widget.type === 'stats') return; 
        
        let dataToExport: ChartDataItem[] = [];
        let fileName = `${widget.title.replace(/\s/g, '_')}_data`;

        if(widget.type === 'embeddedChart') {
            const {visualizationState, pivotReports} = tableData ? (tableData as any) : {visualizationState: {}, pivotReports: []};
            if(widget.sourceView === 'visualizations') {
                const chartState = visualizationState[widget.sourceId as 'chart1'|'chart2'];
                const staging: { [key: string]: any[] } = {};
                 tableData.forEach(row => {
                     const cat = String(row[chartState.xAxisField!]);
                     if(!staging[cat]) staging[cat] = [];
                     staging[cat].push(row[chartState.yAxisFields[0].field]);
                 });
                 dataToExport = Object.keys(staging).map(k => ({name: k, value: staging[k].reduce((a,b)=>a+b,0)}));
            } else if (widget.sourceView === 'pivotTable') {
                const report = pivotReports.find((r: PivotReportState) => r.id === widget.sourceId);
                dataToExport = report?.pivotResult?.chartData || [];
            }
        } else { // Handle bar, line, pie
            const config = widget as ChartWidgetConfig;
            const aggregated: { [key: string]: number[] } = {};
            tableData.forEach(row => {
                const xValue = String(row[config.xAxisField!]);
                const yValue = parseFloat(String(row[config.yAxisField!]));
                if(!isNaN(yValue)) {
                    if(!aggregated[xValue]) aggregated[xValue] = [];
                    aggregated[xValue].push(yValue);
                }
            });
            dataToExport = Object.entries(aggregated).map(([name, values]) => ({ name, [config.yAxisField!]: values.reduce((s, a) => s + a, 0) }));
        }

        if(dataToExport.length > 0) {
            exportChartDataToCSV(dataToExport, fileName);
        } else {
            alert("No data available to export for this widget.");
        }
    }

    const handleDownloadHTML = () => {
        if (dashboardContainerRef.current) {
            downloadElementAsHTML(dashboardContainerRef.current, "dashboard_export.html");
        } else {
            alert("Could not find dashboard element to export.");
        }
    };

    return (
        <div className="space-y-6" ref={dashboardContainerRef}>
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={handleDownloadHTML} className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 bg-gray-700 text-gray-300 hover:bg-gray-600`}>
                        <DownloadIcon className="w-4 h-4"/>
                        Download HTML
                    </button>
                    <button onClick={() => setIsEditMode(p => !p)} className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${isEditMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                        <EditIcon className="w-4 h-4"/>
                        {isEditMode ? 'Finish Editing' : 'Edit Dashboard'}
                    </button>
                    {isEditMode && (
                         <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white">
                            <AddIcon className="w-4 h-4"/>
                            Add Widget
                        </button>
                    )}
                </div>
            </div>

            {dashboardWidgets.length > 0 ? (
                <div ref={gridRef} className="dashboard-grid">
                    {dashboardWidgets.map(widget => (
                        <div 
                            key={widget.id} 
                            draggable={isEditMode}
                            onDragStart={isEditMode ? (e) => handleDragStart(e, widget.id) : undefined}
                            onDragOver={isEditMode ? (e) => handleDragOver(e, widget.id) : undefined}
                            onDrop={isEditMode ? (e) => handleDrop(e, widget.id) : undefined}
                            onDragEnd={isEditMode ? handleDragEnd : undefined}
                            className={`widget-wrapper ${isEditMode ? 'edit-mode' : ''} ${dragOverId === widget.id ? 'drag-over' : ''} ${draggedWidgetId === widget.id ? 'dragging' : ''}`}
                            style={{ gridColumn: `span ${widget.w}`, gridRow: `span ${widget.h}` }}
                        >
                             <Panel className="w-full h-full">
                                <div className={`widget-header ${isEditMode ? 'widget-header-drag-handle' : ''}`}>
                                    <h3 className="text-md font-semibold text-blue-300 truncate">{widget.title}</h3>
                                    <div className="widget-controls">
                                        {isEditMode ? (
                                            <>
                                                <button onClick={() => handleOpenConfigure(widget.id)} className="widget-control-button" title="Configure"><ConfigIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleRemoveWidget(widget.id)} className="widget-control-button" title="Remove"><RemoveIcon className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            (widget.type !== 'kpi' && widget.type !== 'table' && widget.type !== 'image' && widget.type !== 'stats') &&
                                            <button onClick={() => handleExportWidgetData(widget)} className="widget-control-button" title="Export Data"><DownloadIcon className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                                <div className="widget-content">
                                    {widget.type === 'kpi' && <KPIWidget config={widget as KPIWidgetConfig} onConfigure={handleOpenConfigure} />}
                                    {(widget.type === 'bar' || widget.type === 'line' || widget.type === 'pie') && <ChartWidget config={widget as ChartWidgetConfig} onConfigure={handleOpenConfigure} />}
                                    {widget.type === 'embeddedChart' && <EmbeddedChartWidget config={widget as EmbeddedChartWidgetConfig} onConfigure={handleOpenConfigure} />}
                                    {widget.type === 'pivotTableSummary' && <PivotTableSummaryWidget config={widget as PivotTableSummaryWidgetConfig} onConfigure={handleOpenConfigure} />}
                                    {widget.type === 'image' && <ImageWidget config={widget as ImageWidgetConfig} onConfigure={handleOpenConfigure} />}
                                    {widget.type === 'stats' && <StatsWidget config={widget as StatsWidgetConfig} onConfigure={handleOpenConfigure} />}
                                </div>
                                {isEditMode && <div className="widget-resize-handle" onMouseDown={(e) => handleResizeStart(e, widget.id)} title="Resize Widget" />}
                             </Panel>
                        </div>
                    ))}
                </div>
            ) : (
                <Panel>
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-gray-300">Your Dashboard is Empty</h3>
                        <p className="text-gray-400 mt-2 mb-4">Click "Edit Dashboard" and then "Add Widget" to get started.</p>
                        <button onClick={() => setIsEditMode(true)} className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-500 mx-auto text-white">
                            <EditIcon className="w-4 h-4"/>
                            Start Editing
                        </button>
                    </div>
                </Panel>
            )}
            
             <AddWidgetModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onAddWidget={handleAddWidget}
            />
            {isConfigModalOpen && widgetToConfigure && (
                <ConfigureWidgetModal
                    isOpen={isConfigModalOpen}
                    onClose={() => setIsConfigModalOpen(false)}
                    widget={widgetToConfigure}
                    onSave={handleSaveWidgetConfig}
                    headers={fileHeaders}
                />
            )}
        </div>
    );
};