
import React, { useState, useMemo, useContext, useCallback, useRef, forwardRef, useEffect } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { 
    TableRow, FileHeaders, DashboardWidget, WidgetType, KPIWidgetConfig, ChartWidgetConfig, EmbeddedChartWidgetConfig,
    AggregatorType, IconType, ChartState, PivotReportState, ChartDataItem
} from '../../types';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

// --- ICONS ---
const EditIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const AddIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SaveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ConfigIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.447.368.592.984.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.32 6.32 0 01-.22.127c-.331.183-.581.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645.87a6.32 6.32 0 01-.22-.127c-.324-.196-.72-.257-1.075.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.003-.827c.293.24.438.613-.438.995s-.145-.755-.438-.995l-1.003-.827a1.125 1.125 0 01-.26-1.431l1.296 2.247a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.075.124.073-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RemoveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const LinkIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;


const NUMERIC_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'sum', label: 'Sum' }, { value: 'average', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', label: 'Max' }, { value: 'count', label: 'Count' }, ];
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f97316', '#eab308'];

// --- WIDGET COMPONENTS ---

const WidgetWrapper = forwardRef<HTMLDivElement, {
  widget: DashboardWidget,
  children: React.ReactNode,
  isEditMode: boolean,
  onRemove: (id: string) => void,
  onConfigure: (id: string) => void
}>(({ widget, children, isEditMode, onRemove, onConfigure }, ref) => {
  const style = {
    '--w': widget.w,
    '--h': widget.h,
    gridColumn: `span ${widget.w}`,
    gridRow: `span ${widget.h}`,
  } as React.CSSProperties;

  return (
    <div ref={ref} className="widget-wrapper" style={style}>
      <Panel className="w-full h-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-semibold text-blue-300 truncate">{widget.title}</h3>
          {isEditMode && (
            <div className="edit-mode-controls">
              <button onClick={() => onConfigure(widget.id)} className="widget-control-button" title="Configure"><ConfigIcon className="w-4 h-4" /></button>
              <button onClick={() => onRemove(widget.id)} className="widget-control-button" title="Remove"><RemoveIcon className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div className="widget-content">
          {children}
        </div>
      </Panel>
    </div>
  );
});
WidgetWrapper.displayName = 'WidgetWrapper';


const KPIWidget: React.FC<{ config: KPIWidgetConfig }> = ({ config }) => {
    const { tableData } = useContext(DataContext);

    const { value, label } = useMemo(() => {
        if (!config.valueField || tableData.length === 0) {
            return { value: 'N/A', label: config.title };
        }
        const values = tableData.map(row => row[config.valueField]).filter(v => v !== null && v !== undefined);

        let result: number | undefined;
        if (config.aggregator === 'count') {
            result = values.length;
        } else if (config.aggregator === 'countNonEmpty') {
             result = new Set(values).size;
        } else {
            const numericValues = values.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
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
        return { value: formattedValue, label: config.title };

    }, [config, tableData]);

    if (!config.valueField) {
        return <div className="widget-placeholder"><ConfigIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Configure KPI</p></div>;
    }

    return (
        <div className="text-center">
            <div className="kpi-value" style={{ color: CHART_COLORS[0] }}>{value}</div>
            <div className="kpi-label">{label}</div>
        </div>
    );
};

const ChartWidget: React.FC<{ config: ChartWidgetConfig }> = ({ config }) => {
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
        return <div className="widget-placeholder"><ConfigIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Configure Chart</p></div>;
    }
    
    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" /><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend /><Bar dataKey={config.yAxisField!} fill={CHART_COLORS[1]} /></BarChart>;
            case 'line':
                return <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" /><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend /><Line type="monotone" dataKey={config.yAxisField!} stroke={CHART_COLORS[2]} /></LineChart>;
            case 'pie':
                return <PieChart><Pie data={chartData} dataKey={config.yAxisField!} nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}</Pie><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend /></PieChart>;
            default: return null;
        }
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
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
    const { tableData } = useContext(DataContext);
    const { pivotReports } = useContext(DataContext);
    const [localConfig, setLocalConfig] = useState(widget);
    
    const numericHeaders = useMemo(() => {
        return headers.filter(h => tableData.every(row => row[h] === null || !isNaN(parseFloat(String(row[h])))));
    }, [headers, tableData]);

    if (!isOpen) return null;

    const renderConfigOptions = () => {
        switch (localConfig.type) {
            case 'kpi': return (
                <>
                    <div>
                        <label className="text-sm text-gray-400">Metric (Field)</label>
                        <select value={(localConfig as KPIWidgetConfig).valueField || ''} onChange={e => setLocalConfig({...localConfig, valueField: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            <option value="">Select Field</option>
                            {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Aggregation</label>
                        <select value={(localConfig as KPIWidgetConfig).aggregator} onChange={e => setLocalConfig({...localConfig, aggregator: e.target.value as AggregatorType})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            {NUMERIC_AGGREGATORS.map(agg => <option key={agg.value} value={agg.value}>{agg.label}</option>)}
                        </select>
                    </div>
                </>
            );
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
                            {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">Aggregation</label>
                        <select value={(localConfig as ChartWidgetConfig).aggregator} onChange={e => setLocalConfig({...localConfig, aggregator: e.target.value as AggregatorType})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            {NUMERIC_AGGREGATORS.map(agg => <option key={agg.value} value={agg.value}>{agg.label}</option>)}
                        </select>
                    </div>
                </>
            );
            case 'embeddedChart':
                const config = localConfig as EmbeddedChartWidgetConfig;
                return (
                    <>
                        <div>
                            <label className="text-sm text-gray-400">Source View</label>
                            <select value={config.sourceView || ''} onChange={e => setLocalConfig({...config, sourceView: e.target.value as any, sourceId: null})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="">Select Source</option>
                                <option value="visualizations">Visualizations</option>
                                <option value="pivotTable">Pivot Table</option>
                            </select>
                        </div>
                        {config.sourceView && (
                            <div>
                                <label className="text-sm text-gray-400">Source Chart/Report</label>
                                <select value={config.sourceId || ''} onChange={e => setLocalConfig({...config, sourceId: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                    <option value="">Select Item</option>
                                    {config.sourceView === 'visualizations' && <>
                                        <option value="chart1">Chart 1</option>
                                        <option value="chart2">Chart 2</option>
                                    </>}
                                    {config.sourceView === 'pivotTable' && pivotReports.map(report => (
                                        <option key={report.id} value={report.id}>{report.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </>
                );
            default: return null;
        }
    };
    
    return (
        <div className="dashboard-modal-overlay" onClick={onClose}>
            <div className="dashboard-modal-content" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-100">Configure Widget</h3>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Widget Title</label>
                        <input type="text" value={localConfig.title} onChange={e => setLocalConfig({...localConfig, title: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1"/>
                    </div>
                    {renderConfigOptions()}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={() => { onSave(localConfig); onClose(); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- Embedded Chart Widget ---
const EmbeddedChartWidget: React.FC<{ config: EmbeddedChartWidgetConfig }> = ({ config }) => {
    const { visualizationState, pivotReports } = useContext(DataContext);

    const chartDetails = useMemo(() => {
        if (!config.sourceView || !config.sourceId) return null;
        if (config.sourceView === 'visualizations') {
            const chartState = config.sourceId === 'chart1' ? visualizationState.chart1 : visualizationState.chart2;
            return {
                type: chartState.chartType,
                data: chartState.yAxisFields.length > 0 ? [{name:'sample'}] : [], // Simplified data check for rendering
                config: chartState
            };
        }
        if (config.sourceView === 'pivotTable') {
            const report = pivotReports.find(r => r.id === config.sourceId);
            if (!report || !report.pivotResult || !report.pivotResult.chartData) return null;
            return {
                type: report.uiSettings.chartType,
                data: report.pivotResult.chartData,
                config: report
            }
        }
        return null;
    }, [config, visualizationState, pivotReports]);

    if (!chartDetails) {
        return (
            <div className="widget-placeholder">
                <LinkIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p>Configure Embedded Chart</p>
            </div>
        );
    }
    
    // This is a simplified renderer. In a real app, this would be a shared, more complex component.
    const renderChart = () => {
        if (chartDetails.data.length === 0) return <p className="text-gray-400">No data in source chart.</p>;

        const dataKeys = Object.keys(chartDetails.data[0] || {}).filter(key => key !== 'name');

        switch (chartDetails.type) {
            case 'bar': return <BarChart data={chartDetails.data}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey={dataKeys[0]} fill={CHART_COLORS[0]} /></BarChart>;
            case 'line': return <LineChart data={chartDetails.data}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey={dataKeys[0]} stroke={CHART_COLORS[1]} /></LineChart>;
            case 'pie': return <PieChart><Pie data={chartDetails.data} dataKey={dataKeys[0]} nameKey="name" cx="50%" cy="50%" outerRadius={60} fill={CHART_COLORS[2]} /><Tooltip /></PieChart>;
            default: return <p>Chart type '{chartDetails.type}' not supported for embedding.</p>
        }
    };
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
    );
};

// --- MAIN DASHBOARD VIEW ---

export const DashboardView: React.FC = () => {
  const { tableData, fileHeaders, dashboardWidgets, setDashboardWidgets } = useContext(DataContext);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [configuringWidgetId, setConfiguringWidgetId] = useState<string | null>(null);
  
  const hasData = tableData.length > 0;
  const widgetRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (dashboardWidgets.length === 0 && fileHeaders.length > 0) {
        setDashboardWidgets([
            { id: 'kpi1', type: 'kpi', title: 'Total Rows', x: 0, y: 0, w: 3, h: 2, valueField: fileHeaders[0] || null, aggregator: 'count'},
            { id: 'bar1', type: 'bar', title: 'Data Breakdown', x: 3, y: 0, w: 9, h: 4, xAxisField: null, yAxisField: null, aggregator: 'sum' },
        ]);
    } else if (fileHeaders.length === 0) {
        setDashboardWidgets([]);
    }
  }, [fileHeaders, setDashboardWidgets]);


  const addWidget = (type: WidgetType) => {
      const newWidget: DashboardWidget = {
          id: `widget-${Date.now()}`,
          title: `New ${type} widget`,
          x: 0,
          y: (dashboardWidgets.reduce((max, w) => Math.max(max, w.y + w.h), 0)),
          w: type === 'kpi' ? 3 : (type === 'embeddedChart' ? 6 : 6),
          h: type === 'kpi' ? 2 : (type === 'embeddedChart' ? 4 : 4),
          type: type as any,
          ...(type === 'kpi' && { valueField: null, aggregator: 'sum'}),
          ...(type === 'bar' || type === 'line' || type === 'pie') && { xAxisField: null, yAxisField: null, aggregator: 'sum' },
          ...(type === 'embeddedChart' && { sourceView: null, sourceId: null })
      };
      setDashboardWidgets(prev => [...prev, newWidget]);
  };
  
  const removeWidget = (id: string) => {
      setDashboardWidgets(prev => prev.filter(w => w.id !== id));
  };
  
  const updateWidget = (config: DashboardWidget) => {
      setDashboardWidgets(prev => prev.map(w => w.id === config.id ? config : w));
  };

  const handleDownloadHTML = () => {
    let content = '<html><head><title>Dashboard Export</title>';
    
    // Attempt to grab all styles from the document
    const styles = Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('');
            } catch (e) {
                // Ignore cross-origin stylesheets
                return '';
            }
        })
        .join('\\n');
    content += `<style>${styles}</style>`;
    
    // Add some basic body styling for the exported file
    content += '<style>body { background-color: #0e182d; padding: 2rem; } .recharts-surface { overflow: visible; }</style>';
    content += '</head><body>';
    content += '<h1 style="color: white; font-family: sans-serif;">Dashboard Export</h1>';
    
    let gridContent = '';
    dashboardWidgets.forEach(widget => {
        const widgetEl = widgetRefs.current[widget.id];
        if (widgetEl) {
            const clone = widgetEl.cloneNode(true) as HTMLElement;
            // For recharts, we need to explicitly serialize the SVG
            const svgElement = widgetEl.querySelector('svg.recharts-surface');
            if (svgElement) {
                const serializer = new XMLSerializer();
                const svgString = serializer.serializeToString(svgElement);
                const chartContainer = clone.querySelector('.recharts-responsive-container');
                if (chartContainer) {
                    chartContainer.innerHTML = svgString;
                }
            }
            gridContent += clone.outerHTML;
        }
    });

    content += `<div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 100px; gap: 1.5rem;">${gridContent}</div>`;
    content += '</body></html>';
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-export.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const configuringWidget = useMemo(() => dashboardWidgets.find(w => w.id === configuringWidgetId), [configuringWidgetId, dashboardWidgets]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Dynamic Dashboard</h1>
        <div className="flex items-center gap-4">
            {hasData && (
              <button onClick={handleDownloadHTML} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-transform hover:scale-105">
                <DownloadIcon className="w-5 h-5"/> Download as HTML
              </button>
            )}
            {isEditMode && <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-transform hover:scale-105"><AddIcon className="w-5 h-5" /> Add Widget</button>}
            <button onClick={() => setIsEditMode(!isEditMode)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-transform hover:scale-105">
                {isEditMode ? <SaveIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                {isEditMode ? 'Save Layout' : 'Edit Dashboard'}
            </button>
        </div>
      </div>
      
       {!hasData && (
          <Panel>
              <div className="text-center py-20">
                  <h2 className="text-2xl font-semibold text-gray-300">Welcome to your Dashboard</h2>
                  <p className="text-gray-400 mt-2">Upload data to begin populating your dashboard with dynamic widgets.</p>
              </div>
          </Panel>
      )}

      {hasData && (
        <div className="dashboard-grid">
            {dashboardWidgets.map(widget => (
                <WidgetWrapper 
                   ref={el => { widgetRefs.current[widget.id] = el; }}
                   key={widget.id} 
                   widget={widget} 
                   isEditMode={isEditMode} 
                   onRemove={removeWidget} 
                   onConfigure={() => setConfiguringWidgetId(widget.id)}
                >
                   {widget.type === 'kpi' && <KPIWidget config={widget as KPIWidgetConfig} />}
                   {(widget.type === 'bar' || widget.type === 'line' || widget.type === 'pie') && <ChartWidget config={widget as ChartWidgetConfig} />}
                   {widget.type === 'embeddedChart' && <EmbeddedChartWidget config={widget as EmbeddedChartWidgetConfig} />}
                </WidgetWrapper>
            ))}
        </div>
      )}

      <AddWidgetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddWidget={addWidget} />
      {configuringWidget && (
          <ConfigureWidgetModal
              isOpen={!!configuringWidget}
              onClose={() => setConfiguringWidgetId(null)}
              widget={configuringWidget}
              onSave={updateWidget}
              headers={fileHeaders}
          />
      )}
    </div>
  );
};
