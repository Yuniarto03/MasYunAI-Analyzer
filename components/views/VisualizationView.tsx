import React, { useState, useContext, useMemo, useRef, useCallback, useEffect } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { ChartState, PivotValueFieldConfig, PivotFilterConfig, AggregatorType, TableRow, IconType, ChartDataItem } from '../../types';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CHART_STYLES } from '../../constants';
import { exportChartDataToCSV } from '../../services/DataProcessingService';

// Icons
const ChartBarIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const ExpandIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const PlusIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TrashIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;

const CHART_TYPES = [
    { id: 'bar', name: 'Bar Chart', icon: ChartBarIcon },
    { id: 'horizontalBar', name: 'Horizontal Bar', icon: ChartBarIcon },
    { id: 'line', name: 'Line Chart', icon: ChartBarIcon },
    { id: 'area', name: 'Area Chart', icon: ChartBarIcon },
    { id: 'pie', name: 'Pie Chart', icon: ChartBarIcon },
    { id: 'scatter', name: 'Scatter Plot', icon: ChartBarIcon },
    { id: 'radar', name: 'Radar Chart', icon: ChartBarIcon },
];

const AGGREGATORS: { value: AggregatorType; label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'countNonEmpty', label: 'Count Non-Empty' },
];

const VisualizationView: React.FC = () => {
    const { tableData, fileHeaders, visualizationState, setVisualizationState } = useContext(DataContext);
    const [activeChart, setActiveChart] = useState<'chart1' | 'chart2'>('chart1');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenChart, setFullscreenChart] = useState<'chart1' | 'chart2' | null>(null);

    const currentState = visualizationState[activeChart];

    const updateChartState = useCallback((updates: Partial<ChartState>) => {
        setVisualizationState(prev => ({
            ...prev,
            [activeChart]: { ...prev[activeChart], ...updates }
        }));
    }, [activeChart, setVisualizationState]);

    const addYAxisField = () => {
        const newField: PivotValueFieldConfig = {
            field: fileHeaders[0] || '',
            aggregator: 'sum',
            displayName: '',
            color: CHART_STYLES[currentState.chartOptions.chartStyleId]?.colors[currentState.yAxisFields.length % 6] || '#8884d8'
        };
        updateChartState({
            yAxisFields: [...currentState.yAxisFields, newField]
        });
    };

    const updateYAxisField = (index: number, updates: Partial<PivotValueFieldConfig>) => {
        const newFields = [...currentState.yAxisFields];
        newFields[index] = { ...newFields[index], ...updates };
        updateChartState({ yAxisFields: newFields });
    };

    const removeYAxisField = (index: number) => {
        updateChartState({
            yAxisFields: currentState.yAxisFields.filter((_, i) => i !== index)
        });
    };

    const addFilter = () => {
        const newFilter: PivotFilterConfig = {
            field: fileHeaders[0] || '',
            selectedValues: []
        };
        updateChartState({
            filterConfigs: [...currentState.filterConfigs, newFilter]
        });
    };

    const updateFilter = (index: number, updates: Partial<PivotFilterConfig>) => {
        const newFilters = [...currentState.filterConfigs];
        newFilters[index] = { ...newFilters[index], ...updates };
        updateChartState({ filterConfigs: newFilters });
    };

    const removeFilter = (index: number) => {
        updateChartState({
            filterConfigs: currentState.filterConfigs.filter((_, i) => i !== index)
        });
    };

    const processedData = useMemo(() => {
        if (!tableData || tableData.length === 0 || !currentState.xAxisField) return [];

        let filteredData = tableData;
        currentState.filterConfigs.forEach(filter => {
            if (filter.selectedValues.length > 0) {
                filteredData = filteredData.filter(row => 
                    filter.selectedValues.includes(row[filter.field] as string | number)
                );
            }
        });

        const grouped = filteredData.reduce((acc, row) => {
            const key = String(row[currentState.xAxisField!] || 'Unknown');
            if (!acc[key]) acc[key] = [];
            acc[key].push(row);
            return acc;
        }, {} as Record<string, TableRow[]>);

        return Object.entries(grouped).map(([key, rows]) => {
            const dataPoint: ChartDataItem = { name: key };
            
            currentState.yAxisFields.forEach((yField, index) => {
                const values = rows.map(row => row[yField.field]).filter(val => val !== null && val !== undefined);
                const numericValues = values.map(val => parseFloat(String(val))).filter(val => !isNaN(val));
                
                let result = 0;
                switch (yField.aggregator) {
                    case 'sum':
                        result = numericValues.reduce((sum, val) => sum + val, 0);
                        break;
                    case 'average':
                        result = numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
                        break;
                    case 'count':
                        result = rows.length;
                        break;
                    case 'countNonEmpty':
                        result = values.length;
                        break;
                    case 'min':
                        result = numericValues.length > 0 ? Math.min(...numericValues) : 0;
                        break;
                    case 'max':
                        result = numericValues.length > 0 ? Math.max(...numericValues) : 0;
                        break;
                }
                
                const fieldKey = yField.displayName || `${yField.aggregator}_${yField.field}`;
                dataPoint[fieldKey] = result;
            });
            
            return dataPoint;
        }).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }, [tableData, currentState]);

    const renderChart = (chartKey: 'chart1' | 'chart2', isFullscreenView = false) => {
        const state = visualizationState[chartKey];
        const data = processedData;
        
        if (data.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Configure chart settings to display data</p>
                    </div>
                </div>
            );
        }

        const chartStyle = CHART_STYLES[state.chartOptions.chartStyleId] || CHART_STYLES.vibrantHolo;
        const colors = chartStyle.colors;

        const commonProps = {
            data,
            margin: { top: 20, right: 30, left: 20, bottom: 60 }
        };

        const renderBars = () => state.yAxisFields.map((field, index) => (
            <Bar 
                key={`${field.field}_${index}`}
                dataKey={field.displayName || `${field.aggregator}_${field.field}`}
                fill={field.color || colors[index % colors.length]}
                name={field.displayName || `${field.aggregator} of ${field.field}`}
                radius={chartStyle.bar?.radius || [0, 0, 0, 0]}
                className={chartStyle.bar?.className}
            />
        ));

        const renderLines = () => state.yAxisFields.map((field, index) => (
            <Line 
                key={`${field.field}_${index}`}
                type="monotone"
                dataKey={field.displayName || `${field.aggregator}_${field.field}`}
                stroke={field.color || colors[index % colors.length]}
                name={field.displayName || `${field.aggregator} of ${field.field}`}
                strokeWidth={chartStyle.line?.strokeWidth || 2}
                dot={chartStyle.line?.dot !== false}
                className={chartStyle.line?.className}
            />
        ));

        const renderAreas = () => state.yAxisFields.map((field, index) => (
            <Area 
                key={`${field.field}_${index}`}
                type="monotone"
                dataKey={field.displayName || `${field.aggregator}_${field.field}`}
                stroke={field.color || colors[index % colors.length]}
                fill={field.color || colors[index % colors.length]}
                name={field.displayName || `${field.aggregator} of ${field.field}`}
                fillOpacity={chartStyle.area?.fillOpacity || 0.6}
                strokeWidth={chartStyle.area?.strokeWidth || 2}
                className={chartStyle.area?.className}
            />
        ));

        switch (state.chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid.stroke} strokeOpacity={chartStyle.grid.strokeOpacity} />
                        <XAxis dataKey="name" stroke={chartStyle.axis.color} fontSize={12} angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke={chartStyle.axis.color} fontSize={12} />
                        <Tooltip contentStyle={chartStyle.tooltip} />
                        {state.chartOptions.legendPosition !== 'none' && <Legend wrapperStyle={{ color: chartStyle.legend.color }} />}
                        {renderBars()}
                        {state.referenceLineConfig.enabled && (
                            <ReferenceLine 
                                y={state.referenceLineConfig.value} 
                                stroke={state.referenceLineConfig.color}
                                strokeDasharray="5 5"
                                label="Reference"
                            />
                        )}
                    </BarChart>
                );

            case 'horizontalBar':
                return (
                    <BarChart {...commonProps} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid.stroke} strokeOpacity={chartStyle.grid.strokeOpacity} />
                        <XAxis type="number" stroke={chartStyle.axis.color} fontSize={12} />
                        <YAxis type="category" dataKey="name" stroke={chartStyle.axis.color} fontSize={12} width={100} />
                        <Tooltip contentStyle={chartStyle.tooltip} />
                        {state.chartOptions.legendPosition !== 'none' && <Legend wrapperStyle={{ color: chartStyle.legend.color }} />}
                        {renderBars()}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid.stroke} strokeOpacity={chartStyle.grid.strokeOpacity} />
                        <XAxis dataKey="name" stroke={chartStyle.axis.color} fontSize={12} angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke={chartStyle.axis.color} fontSize={12} />
                        <Tooltip contentStyle={chartStyle.tooltip} />
                        {state.chartOptions.legendPosition !== 'none' && <Legend wrapperStyle={{ color: chartStyle.legend.color }} />}
                        {renderLines()}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid.stroke} strokeOpacity={chartStyle.grid.strokeOpacity} />
                        <XAxis dataKey="name" stroke={chartStyle.axis.color} fontSize={12} angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke={chartStyle.axis.color} fontSize={12} />
                        <Tooltip contentStyle={chartStyle.tooltip} />
                        {state.chartOptions.legendPosition !== 'none' && <Legend wrapperStyle={{ color: chartStyle.legend.color }} />}
                        {renderAreas()}
                    </AreaChart>
                );

            case 'pie':
                const pieData = data.map(item => ({
                    name: item.name,
                    value: state.yAxisFields.length > 0 ? 
                        item[state.yAxisFields[0].displayName || `${state.yAxisFields[0].aggregator}_${state.yAxisFields[0].field}`] as number : 0
                }));
                
                return (
                    <PieChart>
                        <Pie 
                            data={pieData}
                            cx="50%" 
                            cy="50%" 
                            outerRadius={isFullscreenView ? 200 : 80}
                            dataKey="value"
                            label={state.chartOptions.showDataLabels}
                            stroke={chartStyle.pie?.stroke}
                            className={chartStyle.pie?.className}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={chartStyle.tooltip} />
                        {state.chartOptions.legendPosition !== 'none' && <Legend wrapperStyle={{ color: chartStyle.legend.color }} />}
                    </PieChart>
                );

            case 'scatter':
                return (
                    <ScatterChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid.stroke} strokeOpacity={chartStyle.grid.strokeOpacity} />
                        <XAxis dataKey="name" stroke={chartStyle.axis.color} fontSize={12} />
                        <YAxis stroke={chartStyle.axis.color} fontSize={12} />
                        <Tooltip contentStyle={chartStyle.tooltip} />
                        {state.yAxisFields.map((field, index) => (
                            <Scatter 
                                key={`${field.field}_${index}`}
                                dataKey={field.displayName || `${field.aggregator}_${field.field}`}
                                fill={field.color || colors[index % colors.length]}
                                name={field.displayName || `${field.aggregator} of ${field.field}`}
                            />
                        ))}
                    </ScatterChart>
                );

            case 'radar':
                return (
                    <RadarChart {...commonProps}>
                        <PolarGrid stroke={chartStyle.grid.stroke} />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: chartStyle.axis.color }} />
                        <PolarRadiusAxis tick={{ fontSize: 10, fill: chartStyle.axis.color }} />
                        <Tooltip contentStyle={chartStyle.tooltip} />
                        {state.yAxisFields.map((field, index) => (
                            <Radar 
                                key={`${field.field}_${index}`}
                                dataKey={field.displayName || `${field.aggregator}_${field.field}`}
                                stroke={field.color || colors[index % colors.length]}
                                fill={field.color || colors[index % colors.length]}
                                fillOpacity={0.3}
                                name={field.displayName || `${field.aggregator} of ${field.field}`}
                            />
                        ))}
                    </RadarChart>
                );

            default:
                return <div>Unsupported chart type</div>;
        }
    };

    const handleExportData = () => {
        if (processedData.length === 0) {
            alert('No data to export');
            return;
        }
        exportChartDataToCSV(processedData, `${activeChart}_data`);
    };

    const openFullscreen = (chartKey: 'chart1' | 'chart2') => {
        setFullscreenChart(chartKey);
        setIsFullscreen(true);
    };

    const closeFullscreen = () => {
        setIsFullscreen(false);
        setFullscreenChart(null);
    };

    if (!tableData || tableData.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                    Advanced Visualization Hub
                </h1>
                <Panel title="No Data Available">
                    <div className="text-center py-20">
                        <ChartBarIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                        <p className="text-xl text-gray-400 mb-2">No data loaded</p>
                        <p className="text-gray-500">Upload data to start creating visualizations</p>
                    </div>
                </Panel>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                    Advanced Visualization Hub
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveChart('chart1')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeChart === 'chart1' 
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Chart 1
                    </button>
                    <button
                        onClick={() => setActiveChart('chart2')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeChart === 'chart2' 
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Chart 2
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <Panel title="Chart Configuration" className="h-fit">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Chart Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CHART_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => updateChartState({ chartType: type.id })}
                                            className={`p-2 text-xs rounded-md transition-all ${
                                                currentState.chartType === type.id 
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                            }`}
                                        >
                                            {type.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">X-Axis Field</label>
                                <select 
                                    value={currentState.xAxisField || ''} 
                                    onChange={e => updateChartState({ xAxisField: e.target.value })}
                                    className="w-full p-2 bg-gray-700 text-gray-200 rounded-md border border-gray-600 focus:border-cyan-500"
                                >
                                    <option value="">Select field...</option>
                                    {fileHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-300">Y-Axis Fields</label>
                                    <button 
                                        onClick={addYAxisField}
                                        className="p-1 bg-green-600 hover:bg-green-500 rounded-md text-white"
                                        title="Add Y-Axis Field"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {currentState.yAxisFields.map((field, index) => (
                                        <div key={index} className="p-2 bg-gray-800/50 rounded-md border border-gray-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-medium text-gray-400">Field {index + 1}</span>
                                                <button 
                                                    onClick={() => removeYAxisField(index)}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <TrashIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <select 
                                                    value={field.field} 
                                                    onChange={e => updateYAxisField(index, { field: e.target.value })}
                                                    className="w-full p-1.5 bg-gray-700 text-gray-200 rounded text-xs"
                                                >
                                                    {fileHeaders.map(header => (
                                                        <option key={header} value={header}>{header}</option>
                                                    ))}
                                                </select>
                                                <select 
                                                    value={field.aggregator} 
                                                    onChange={e => updateYAxisField(index, { aggregator: e.target.value as AggregatorType })}
                                                    className="w-full p-1.5 bg-gray-700 text-gray-200 rounded text-xs"
                                                >
                                                    {AGGREGATORS.map(agg => (
                                                        <option key={agg.value} value={agg.value}>{agg.label}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={field.displayName || ''} 
                                                        onChange={e => updateYAxisField(index, { displayName: e.target.value })}
                                                        placeholder="Custom name..."
                                                        className="flex-1 p-1.5 bg-gray-700 text-gray-200 rounded text-xs"
                                                    />
                                                    <input 
                                                        type="color" 
                                                        value={field.color || '#8884d8'} 
                                                        onChange={e => updateYAxisField(index, { color: e.target.value })}
                                                        className="w-8 h-8 rounded cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Chart Style</label>
                                <select 
                                    value={currentState.chartOptions.chartStyleId} 
                                    onChange={e => updateChartState({ 
                                        chartOptions: { ...currentState.chartOptions, chartStyleId: e.target.value }
                                    })}
                                    className="w-full p-2 bg-gray-700 text-gray-200 rounded-md border border-gray-600 focus:border-cyan-500"
                                >
                                    {Object.values(CHART_STYLES).map(style => (
                                        <option key={style.id} value={style.id}>{style.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Chart Display */}
                <div className="lg:col-span-2">
                    <Panel title={`${activeChart === 'chart1' ? 'Primary' : 'Secondary'} Visualization`} className="h-[600px]">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">
                                    {processedData.length} data points
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleExportData}
                                    className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition-colors"
                                    title="Export Data"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => openFullscreen(activeChart)}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                                    title="Fullscreen"
                                >
                                    <ExpandIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart(activeChart)}
                            </ResponsiveContainer>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && fullscreenChart && (
                <div className="modal-overlay" onClick={closeFullscreen}>
                    <div className="modal-content-maximized" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                {fullscreenChart === 'chart1' ? 'Primary' : 'Secondary'} Visualization - Fullscreen
                            </h2>
                            <button 
                                onClick={closeFullscreen}
                                className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart(fullscreenChart, true)}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualizationView;