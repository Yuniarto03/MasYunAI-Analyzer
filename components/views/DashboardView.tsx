import React, { useState, useMemo, useContext, useCallback } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { TableRow, FileHeaders, DashboardWidget, WidgetType, KPIWidgetConfig, ChartWidgetConfig, AggregatorType, IconType } from '../../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// --- ICONS ---
const EditIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const AddIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SaveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ConfigIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.447.368.592.984.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.32 6.32 0 01-.22.127c-.331.183-.581.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.32 6.32 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.003-.827c.293-.24.438-.613.438-.995s-.145-.755-.438-.995l-1.003-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RemoveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const NUMERIC_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'sum', label: 'Sum' }, { value: 'average', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', label: 'Max' }, { value: 'count', label: 'Count' }, ];
const TEXT_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'countNonEmpty', label: 'Count Unique' }, { value: 'count', label: 'Count All' } ];
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f97316', '#eab308'];

// --- WIDGET COMPONENTS ---

const WidgetWrapper: React.FC<{
  widget: DashboardWidget,
  children: React.ReactNode,
  isEditMode: boolean,
  onRemove: (id: string) => void,
  onConfigure: (id: string) => void
}> = ({ widget, children, isEditMode, onRemove, onConfigure }) => {
  const style = {
    '--w': widget.w,
    '--h': widget.h,
    gridColumn: `span ${widget.w}`,
    gridRow: `span ${widget.h}`,
  } as React.CSSProperties;

  return (
    <div className="widget-wrapper" style={style}>
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
};

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
    const [localConfig, setLocalConfig] = useState(widget);
    const { tableData } = useContext(DataContext);
    
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

// --- MAIN DASHBOARD VIEW ---

export const DashboardView: React.FC = () => {
  const { tableData, fileHeaders } = useContext(DataContext);
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
      { id: 'kpi1', type: 'kpi', title: 'Total Rows', x: 0, y: 0, w: 3, h: 2, valueField: fileHeaders[0] || null, aggregator: 'count'},
      { id: 'bar1', type: 'bar', title: 'Data Breakdown', x: 3, y: 0, w: 9, h: 4, xAxisField: null, yAxisField: null, aggregator: 'sum' },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [configuringWidget, setConfiguringWidget] = useState<DashboardWidget | null>(null);
  
  const hasData = tableData.length > 0;

  const addWidget = (type: WidgetType) => {
      const newWidget: DashboardWidget = {
          id: `widget-${Date.now()}`,
          title: `New ${type} widget`,
          x: 0,
          y: (widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0)),
          w: type === 'kpi' ? 3 : 6,
          h: type === 'kpi' ? 2 : 4,
          type: type as any, // Temp cast
          ...(type === 'kpi' && { valueField: null, aggregator: 'sum'}),
          ...(type.includes('bar') || type.includes('line') || type.includes('pie')) && { xAxisField: null, yAxisField: null, aggregator: 'sum' }
      };
      setWidgets(prev => [...prev, newWidget]);
  };
  
  const removeWidget = (id: string) => {
      setWidgets(prev => prev.filter(w => w.id !== id));
  };
  
  const updateWidget = (config: DashboardWidget) => {
      setWidgets(prev => prev.map(w => w.id === config.id ? config : w));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Dynamic Dashboard</h1>
        <div className="flex items-center gap-4">
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
            {widgets.map(widget => (
                <WidgetWrapper key={widget.id} widget={widget} isEditMode={isEditMode} onRemove={removeWidget} onConfigure={() => setConfiguringWidget(widget)}>
                   {widget.type === 'kpi' && <KPIWidget config={widget as KPIWidgetConfig} />}
                   {(widget.type === 'bar' || widget.type === 'line' || widget.type === 'pie') && <ChartWidget config={widget as ChartWidgetConfig} />}
                </WidgetWrapper>
            ))}
        </div>
      )}

      <AddWidgetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddWidget={addWidget} />
      {configuringWidget && (
          <ConfigureWidgetModal
              isOpen={!!configuringWidget}
              onClose={() => setConfiguringWidget(null)}
              widget={configuringWidget}
              onSave={updateWidget}
              headers={fileHeaders}
          />
      )}
    </div>
  );
};
