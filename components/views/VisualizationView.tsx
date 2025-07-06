import React, { useState, useMemo, useContext, useCallback, useRef, useEffect } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { 
    TableRow, FileHeaders, ChartDataItem, PivotValueFieldConfig, PivotFilterConfig, 
    AggregatorType, IconType, ChartState 
} from '../../types';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter 
} from 'recharts';

// --- Icons ---
const DragIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg>;
const FilterIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const FullscreenIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const SettingsIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.447.368.592.984.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.32 6.32 0 01-.22.127c-.331.183-.581.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.32 6.32 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.003-.827c.293-.24.438-.613.438-.995s-.145-.755-.438-.995l-1.003-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MapIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>;

// Chart type configurations with map charts
const CHART_TYPES = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'horizontalBar', label: 'Horizontal Bar', icon: '📈' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'area', label: 'Area Chart', icon: '🏔️' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'scatter', label: 'Scatter Plot', icon: '🔵' },
    { value: 'radar', label: 'Radar Chart', icon: '🕸️' },
    { value: 'choroplethMap', label: 'Choropleth Map', icon: '🗺️' },
    { value: 'bubbleMap', label: 'Bubble Map', icon: '🫧' },
    { value: 'heatMap', label: 'Heat Map', icon: '🔥' },
    { value: 'connectionMap', label: 'Connection Map', icon: '🌐' },
    { value: 'flowMap', label: 'Flow Map', icon: '🌊' }
];

// Color themes with enhanced palettes
const COLOR_THEMES = {
    cyberpunkNight: {
        name: 'Cyberpunk Night',
        colors: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff5e00', '#7605e2', '#ff005d']
    },
    cosmicFunk: {
        name: 'Cosmic Funk',
        colors: ['#8884d8', '#82ca9d', '#ffc658', '#d946ef', '#3b82f6', '#fb7185', '#34d399']
    },
    oceanDepth: {
        name: 'Ocean Depth',
        colors: ['#0ea5e9', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#1e293b']
    },
    sunsetVibes: {
        name: 'Sunset Vibes',
        colors: ['#f97316', '#ea580c', '#dc2626', '#be123c', '#a21caf', '#7c3aed', '#4338ca']
    },
    forestMystic: {
        name: 'Forest Mystic',
        colors: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#365314', '#3f6212']
    },
    galaxyGradient: {
        name: 'Galaxy Gradient',
        colors: ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3730a3']
    }
};

// Map-specific configurations
const MAP_PROJECTIONS = [
    { value: 'mercator', label: 'Mercator' },
    { value: 'naturalEarth', label: 'Natural Earth' },
    { value: 'robinson', label: 'Robinson' },
    { value: 'orthographic', label: 'Orthographic' }
];

const MAP_COLOR_SCALES = [
    { value: 'viridis', label: 'Viridis', colors: ['#440154', '#31688e', '#35b779', '#fde725'] },
    { value: 'plasma', label: 'Plasma', colors: ['#0d0887', '#7e03a8', '#cc4778', '#f0f921'] },
    { value: 'inferno', label: 'Inferno', colors: ['#000004', '#781c6d', '#ed6925', '#fcffa4'] },
    { value: 'cool', label: 'Cool', colors: ['#6e40aa', '#4c72b0', '#3ebc9a', '#6fda44'] },
    { value: 'warm', label: 'Warm', colors: ['#d73027', '#f46d43', '#fdae61', '#fee08b'] },
    { value: 'rainbow', label: 'Rainbow', colors: ['#e40a2b', '#ff6a00', '#ffcd00', '#00d4aa', '#0099ff', '#9933ff'] }
];

// Aggregator options
const AGGREGATOR_OPTIONS: { value: AggregatorType, label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
    { value: 'countNonEmpty', label: 'Count Non-Empty' }
];

// Map chart components
const ChoroplethMapChart: React.FC<{ data: ChartDataItem[], colorScale: string, projection: string }> = ({ data, colorScale, projection }) => {
    const scale = MAP_COLOR_SCALES.find(s => s.value === colorScale) || MAP_COLOR_SCALES[0];
    
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
            <div className="text-center">
                <MapIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Choropleth Map</h3>
                <p className="text-sm text-gray-400 mb-4">Geographic data visualization with color-coded regions</p>
                <div className="flex justify-center space-x-2 mb-4">
                    {scale.colors.map((color, i) => (
                        <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                    ))}
                </div>
                <div className="text-xs text-gray-500">
                    <p>Projection: {projection}</p>
                    <p>Data Points: {data.length}</p>
                </div>
            </div>
        </div>
    );
};

const BubbleMapChart: React.FC<{ data: ChartDataItem[], colorTheme: string }> = ({ data, colorTheme }) => {
    const theme = COLOR_THEMES[colorTheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.cyberpunkNight;
    
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900/20 to-teal-900/20 rounded-lg border border-green-500/30">
            <div className="text-center">
                <div className="relative mb-4">
                    <MapIcon className="w-16 h-16 text-green-400 mx-auto" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-teal-400 rounded-full animate-pulse delay-300" />
                </div>
                <h3 className="text-lg font-semibold text-green-300 mb-2">Bubble Map</h3>
                <p className="text-sm text-gray-400 mb-4">Geographic points with size-based data representation</p>
                <div className="flex justify-center space-x-1 mb-4">
                    {theme.colors.slice(0, 5).map((color, i) => (
                        <div 
                            key={i} 
                            className="rounded-full animate-pulse" 
                            style={{ 
                                backgroundColor: color, 
                                width: `${8 + i * 2}px`, 
                                height: `${8 + i * 2}px`,
                                animationDelay: `${i * 200}ms`
                            }} 
                        />
                    ))}
                </div>
                <div className="text-xs text-gray-500">
                    <p>Theme: {theme.name}</p>
                    <p>Bubbles: {data.length}</p>
                </div>
            </div>
        </div>
    );
};

const HeatMapChart: React.FC<{ data: ChartDataItem[], intensity: string }> = ({ data, intensity }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-lg border border-red-500/30">
            <div className="text-center">
                <div className="relative mb-4">
                    <MapIcon className="w-16 h-16 text-red-400 mx-auto" />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-lg blur-sm" />
                </div>
                <h3 className="text-lg font-semibold text-red-300 mb-2">Heat Map</h3>
                <p className="text-sm text-gray-400 mb-4">Intensity-based geographic data visualization</p>
                <div className="flex justify-center mb-4">
                    <div className="w-32 h-4 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded-full" />
                </div>
                <div className="text-xs text-gray-500">
                    <p>Intensity: {intensity}</p>
                    <p>Heat Points: {data.length}</p>
                </div>
            </div>
        </div>
    );
};

const ConnectionMapChart: React.FC<{ data: ChartDataItem[], connectionType: string }> = ({ data, connectionType }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
            <div className="text-center">
                <div className="relative mb-4">
                    <MapIcon className="w-16 h-16 text-purple-400 mx-auto" />
                    <svg className="absolute inset-0 w-16 h-16" viewBox="0 0 64 64">
                        <path d="M16 16 L48 48 M48 16 L16 48 M32 8 L32 56 M8 32 L56 32" 
                              stroke="currentColor" 
                              strokeWidth="1" 
                              className="text-purple-400 opacity-60 animate-pulse" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Connection Map</h3>
                <p className="text-sm text-gray-400 mb-4">Network connections and relationships visualization</p>
                <div className="flex justify-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping delay-150" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping delay-300" />
                </div>
                <div className="text-xs text-gray-500">
                    <p>Type: {connectionType}</p>
                    <p>Connections: {data.length}</p>
                </div>
            </div>
        </div>
    );
};

const FlowMapChart: React.FC<{ data: ChartDataItem[], flowDirection: string }> = ({ data, flowDirection }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-lg border border-cyan-500/30">
            <div className="text-center">
                <div className="relative mb-4">
                    <MapIcon className="w-16 h-16 text-cyan-400 mx-auto" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-2">Flow Map</h3>
                <p className="text-sm text-gray-400 mb-4">Directional flow and movement patterns</p>
                <div className="flex justify-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <div 
                            key={i}
                            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 100}ms` }}
                        />
                    ))}
                </div>
                <div className="text-xs text-gray-500">
                    <p>Direction: {flowDirection}</p>
                    <p>Flow Lines: {data.length}</p>
                </div>
            </div>
        </div>
    );
};

// Drag and drop components
const DraggableField: React.FC<{ field: string, onDragStart: (field: string) => void }> = ({ field, onDragStart }) => (
    <div
        draggable
        onDragStart={() => onDragStart(field)}
        className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md cursor-move hover:bg-gray-600/50 transition-colors border border-gray-600 hover:border-purple-500"
    >
        <DragIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-200 truncate">{field}</span>
    </div>
);

const DropZone: React.FC<{
    title: string;
    fields: PivotValueFieldConfig[];
    onDrop: (field: string) => void;
    onRemove: (index: number) => void;
    allowMultiple?: boolean;
    singleField?: string | null;
    onSingleFieldDrop?: (field: string) => void;
    onSingleFieldRemove?: () => void;
}> = ({ title, fields, onDrop, onRemove, allowMultiple = true, singleField, onSingleFieldDrop, onSingleFieldRemove }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const field = e.dataTransfer.getData('text/plain');
        if (field) {
            if (allowMultiple) {
                onDrop(field);
            } else if (onSingleFieldDrop) {
                onSingleFieldDrop(field);
            }
        }
    };

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`min-h-[60px] p-3 border-2 border-dashed rounded-lg transition-all ${
                    isDragOver 
                        ? 'border-purple-400 bg-purple-500/10' 
                        : 'border-gray-600 bg-gray-800/50'
                }`}
            >
                {allowMultiple ? (
                    fields.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center">Drop fields here</p>
                    ) : (
                        <div className="space-y-1">
                            {fields.map((field, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-purple-600/20 rounded border border-purple-500/30">
                                    <span className="text-sm text-purple-200">{field.field} ({field.aggregator})</span>
                                    <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-300">
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    singleField ? (
                        <div className="flex items-center justify-between p-2 bg-blue-600/20 rounded border border-blue-500/30">
                            <span className="text-sm text-blue-200">{singleField}</span>
                            <button onClick={onSingleFieldRemove} className="text-red-400 hover:text-red-300">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center">Drop field here</p>
                    )
                )}
            </div>
        </div>
    );
};

// Main component
export const VisualizationView: React.FC = () => {
    const { tableData, fileHeaders, visualizationState, setVisualizationState } = useContext(DataContext);
    const [activeChart, setActiveChart] = useState<'chart1' | 'chart2'>('chart1');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenChart, setFullscreenChart] = useState<'chart1' | 'chart2' | null>(null);
    const [draggedField, setDraggedField] = useState<string | null>(null);

    const currentChart = visualizationState[activeChart];

    // Get numeric and categorical fields
    const { numericFields, categoricalFields } = useMemo(() => {
        if (!tableData || tableData.length === 0) return { numericFields: [], categoricalFields: [] };
        
        const numeric: string[] = [];
        const categorical: string[] = [];
        
        fileHeaders.forEach(header => {
            const sampleValues = tableData.slice(0, 100).map(row => row[header]).filter(v => v !== null && v !== undefined);
            const numericValues = sampleValues.filter(v => typeof v === 'number' || !isNaN(Number(v)));
            
            if (numericValues.length / sampleValues.length > 0.7) {
                numeric.push(header);
            } else {
                categorical.push(header);
            }
        });
        
        return { numericFields: numeric, categoricalFields: categorical };
    }, [tableData, fileHeaders]);

    // Generate chart data
    const chartData = useMemo(() => {
        if (!tableData || !currentChart.xAxisField || currentChart.yAxisFields.length === 0) return [];
        
        // Apply filters first
        let filteredData = tableData;
        currentChart.filterConfigs.forEach(filter => {
            if (filter.selectedValues.length > 0) {
                filteredData = filteredData.filter(row => 
                    filter.selectedValues.includes(row[filter.field] as string | number)
                );
            }
        });

        // Group by X-axis field
        const grouped = new Map<string, any[]>();
        filteredData.forEach(row => {
            const xValue = String(row[currentChart.xAxisField!] || 'Unknown');
            if (!grouped.has(xValue)) grouped.set(xValue, []);
            grouped.get(xValue)!.push(row);
        });

        // Calculate aggregated values for each Y-axis field
        return Array.from(grouped.entries()).map(([name, rows]) => {
            const dataPoint: ChartDataItem = { name };
            
            currentChart.yAxisFields.forEach(yField => {
                const values = rows.map(row => row[yField.field]).filter(v => v !== null && v !== undefined);
                let aggregatedValue: number;
                
                if (yField.aggregator === 'count') {
                    aggregatedValue = values.length;
                } else if (yField.aggregator === 'countNonEmpty') {
                    aggregatedValue = new Set(values).size;
                } else {
                    const numericValues = values.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
                    if (numericValues.length === 0) {
                        aggregatedValue = 0;
                    } else {
                        switch (yField.aggregator) {
                            case 'sum': aggregatedValue = numericValues.reduce((a, b) => a + b, 0); break;
                            case 'average': aggregatedValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length; break;
                            case 'min': aggregatedValue = Math.min(...numericValues); break;
                            case 'max': aggregatedValue = Math.max(...numericValues); break;
                            default: aggregatedValue = 0;
                        }
                    }
                }
                
                dataPoint[yField.field] = aggregatedValue;
            });
            
            return dataPoint;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [tableData, currentChart]);

    // Update chart state
    const updateChart = useCallback((updates: Partial<ChartState>) => {
        setVisualizationState(prev => ({
            ...prev,
            [activeChart]: { ...prev[activeChart], ...updates }
        }));
    }, [activeChart, setVisualizationState]);

    // Drag and drop handlers
    const handleDragStart = (field: string) => {
        setDraggedField(field);
    };

    const handleXAxisDrop = (field: string) => {
        updateChart({ xAxisField: field });
    };

    const handleXAxisRemove = () => {
        updateChart({ xAxisField: null });
    };

    const handleYAxisDrop = (field: string) => {
        const newYField: PivotValueFieldConfig = {
            field,
            aggregator: numericFields.includes(field) ? 'sum' : 'count',
            displayName: field
        };
        updateChart({ 
            yAxisFields: [...currentChart.yAxisFields, newYField] 
        });
    };

    const handleYAxisRemove = (index: number) => {
        updateChart({ 
            yAxisFields: currentChart.yAxisFields.filter((_, i) => i !== index) 
        });
    };

    // Chart rendering
    const renderChart = () => {
        if (!currentChart.xAxisField || currentChart.yAxisFields.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <p>Drag fields to X-Axis and Y-Axis to create a chart</p>
                    </div>
                </div>
            );
        }

        const theme = COLOR_THEMES[currentChart.chartOptions.colorTheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.cyberpunkNight;
        const colors = theme.colors;

        // Map chart rendering
        if (currentChart.chartType.includes('Map')) {
            switch (currentChart.chartType) {
                case 'choroplethMap':
                    return <ChoroplethMapChart data={chartData} colorScale="viridis" projection="mercator" />;
                case 'bubbleMap':
                    return <BubbleMapChart data={chartData} colorTheme={currentChart.chartOptions.colorTheme} />;
                case 'heatMap':
                    return <HeatMapChart data={chartData} intensity="high" />;
                case 'connectionMap':
                    return <ConnectionMapChart data={chartData} connectionType="network" />;
                case 'flowMap':
                    return <FlowMapChart data={chartData} flowDirection="bidirectional" />;
            }
        }

        // Regular chart rendering
        const commonProps = {
            data: chartData,
            margin: { top: 20, right: 30, left: 20, bottom: 60 }
        };

        switch (currentChart.chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#9ca3af' }} 
                            stroke="#9ca3af"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                            }} 
                        />
                        {currentChart.chartOptions.legendPosition !== 'none' && <Legend />}
                        {currentChart.yAxisFields.map((yField, index) => (
                            <Bar 
                                key={yField.field} 
                                dataKey={yField.field} 
                                fill={colors[index % colors.length]}
                                name={yField.displayName || yField.field}
                            />
                        ))}
                    </BarChart>
                );

            case 'horizontalBar':
                return (
                    <BarChart {...commonProps} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#9ca3af' }} 
                            stroke="#9ca3af"
                            width={100}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                            }} 
                        />
                        {currentChart.chartOptions.legendPosition !== 'none' && <Legend />}
                        {currentChart.yAxisFields.map((yField, index) => (
                            <Bar 
                                key={yField.field} 
                                dataKey={yField.field} 
                                fill={colors[index % colors.length]}
                                name={yField.displayName || yField.field}
                            />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#9ca3af' }} 
                            stroke="#9ca3af"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                            }} 
                        />
                        {currentChart.chartOptions.legendPosition !== 'none' && <Legend />}
                        {currentChart.yAxisFields.map((yField, index) => (
                            <Line 
                                key={yField.field}
                                type="monotone" 
                                dataKey={yField.field} 
                                stroke={colors[index % colors.length]}
                                strokeWidth={3}
                                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                                name={yField.displayName || yField.field}
                            />
                        ))}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#9ca3af' }} 
                            stroke="#9ca3af"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                            }} 
                        />
                        {currentChart.chartOptions.legendPosition !== 'none' && <Legend />}
                        {currentChart.yAxisFields.map((yField, index) => (
                            <Area 
                                key={yField.field}
                                type="monotone" 
                                dataKey={yField.field} 
                                stroke={colors[index % colors.length]}
                                fill={`url(#gradient${index})`}
                                strokeWidth={2}
                                name={yField.displayName || yField.field}
                            />
                        ))}
                        <defs>
                            {currentChart.yAxisFields.map((_, index) => (
                                <linearGradient key={index} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1}/>
                                </linearGradient>
                            ))}
                        </defs>
                    </AreaChart>
                );

            case 'pie':
                const pieData = chartData.map(item => ({
                    name: item.name,
                    value: currentChart.yAxisFields.length > 0 ? Number(item[currentChart.yAxisFields[0].field]) || 0 : 0
                }));

                return (
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                            }} 
                        />
                        {currentChart.chartOptions.legendPosition !== 'none' && <Legend />}
                    </PieChart>
                );

            case 'scatter':
                return (
                    <ScatterChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#9ca3af' }} 
                            stroke="#9ca3af"
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                            }} 
                        />
                        {currentChart.chartOptions.legendPosition !== 'none' && <Legend />}
                        {currentChart.yAxisFields.map((yField, index) => (
                            <Scatter 
                                key={yField.field}
                                dataKey={yField.field} 
                                fill={colors[index % colors.length]}
                                name={yField.displayName || yField.field}
                            />
                        ))}
                    </ScatterChart>
                );

            case 'radar':
                const radarData = chartData.map(item => {
                    const result: any = { subject: item.name };
                    currentChart.yAxisFields.forEach(yField => {
                        result[yField.field] = item[yField.field];
                    });
                    return result;
                });

                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        {currentChart.yAxisFields.map((yField, index) => (
                            <Radar
                                key={yField.field}
                                name={yField.displayName || yField.field}
                                dataKey={yField.field}
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                        ))}
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                            }} 
                        />
                        {currentChart.chartOptions.legendPosition !== 'none' && <Legend />}
                    </RadarChart>
                );

            default:
                return <div className="flex items-center justify-center h-full text-gray-400">Unsupported chart type</div>;
        }
    };

    if (!fileHeaders || fileHeaders.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-100">Data Visualization</h1>
                <Panel title="No Data Available">
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Data to Visualize</h2>
                        <p className="text-gray-400">Please upload data from the 'Upload Data' view to start creating visualizations.</p>
                    </div>
                </Panel>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Advanced Data Visualization</h1>
            
            {/* Chart Tabs */}
            <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
                <button
                    onClick={() => setActiveChart('chart1')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeChart === 'chart1' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                >
                    Chart 1
                </button>
                <button
                    onClick={() => setActiveChart('chart2')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeChart === 'chart2' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                >
                    Chart 2
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Available Fields */}
                    <Panel title="Available Fields">
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Categorical Fields</h4>
                                <div className="space-y-1">
                                    {categoricalFields.map(field => (
                                        <DraggableField 
                                            key={field} 
                                            field={field} 
                                            onDragStart={handleDragStart} 
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Numeric Fields</h4>
                                <div className="space-y-1">
                                    {numericFields.map(field => (
                                        <DraggableField 
                                            key={field} 
                                            field={field} 
                                            onDragStart={handleDragStart} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Panel>

                    {/* Chart Configuration */}
                    <Panel title="Chart Configuration">
                        <div className="space-y-4">
                            {/* Chart Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Chart Type</label>
                                <select
                                    value={currentChart.chartType}
                                    onChange={(e) => updateChart({ chartType: e.target.value })}
                                    className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {CHART_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* X-Axis */}
                            <DropZone
                                title="X-Axis (Categories)"
                                fields={[]}
                                onDrop={() => {}}
                                onRemove={() => {}}
                                allowMultiple={false}
                                singleField={currentChart.xAxisField}
                                onSingleFieldDrop={handleXAxisDrop}
                                onSingleFieldRemove={handleXAxisRemove}
                            />

                            {/* Y-Axis */}
                            <DropZone
                                title="Y-Axis (Values)"
                                fields={currentChart.yAxisFields}
                                onDrop={handleYAxisDrop}
                                onRemove={handleYAxisRemove}
                                allowMultiple={true}
                            />

                            {/* Color Theme */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Color Theme</label>
                                <select
                                    value={currentChart.chartOptions.colorTheme}
                                    onChange={(e) => updateChart({ 
                                        chartOptions: { ...currentChart.chartOptions, colorTheme: e.target.value }
                                    })}
                                    className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                                        <option key={key} value={key}>{theme.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Map-specific options */}
                            {currentChart.chartType.includes('Map') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Map Projection</label>
                                        <select className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                            {MAP_PROJECTIONS.map(proj => (
                                                <option key={proj.value} value={proj.value}>{proj.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Color Scale</label>
                                        <select className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                            {MAP_COLOR_SCALES.map(scale => (
                                                <option key={scale.value} value={scale.value}>{scale.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Chart Options */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-300">Chart Options</h4>
                                
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={currentChart.chartOptions.showDataLabels}
                                        onChange={(e) => updateChart({
                                            chartOptions: { ...currentChart.chartOptions, showDataLabels: e.target.checked }
                                        })}
                                        className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-300">Show Data Labels</span>
                                </label>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={currentChart.chartOptions.showGrid}
                                        onChange={(e) => updateChart({
                                            chartOptions: { ...currentChart.chartOptions, showGrid: e.target.checked }
                                        })}
                                        className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-300">Show Grid</span>
                                </label>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Legend Position</label>
                                    <select
                                        value={currentChart.chartOptions.legendPosition}
                                        onChange={(e) => updateChart({
                                            chartOptions: { ...currentChart.chartOptions, legendPosition: e.target.value }
                                        })}
                                        className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="bottom">Bottom</option>
                                        <option value="top">Top</option>
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Chart Display */}
                <div className="lg:col-span-3">
                    <Panel className="h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-blue-300">
                                {CHART_TYPES.find(t => t.value === currentChart.chartType)?.label || 'Chart'}
                            </h2>
                            <button
                                onClick={() => {
                                    setFullscreenChart(activeChart);
                                    setIsFullscreen(true);
                                }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                                title="Fullscreen"
                            >
                                <FullscreenIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && fullscreenChart && (
                <div className="modal-overlay" onClick={() => setIsFullscreen(false)}>
                    <div className="modal-content-maximized" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-blue-300">
                                {CHART_TYPES.find(t => t.value === visualizationState[fullscreenChart].chartType)?.label || 'Chart'} - Fullscreen
                            </h2>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};