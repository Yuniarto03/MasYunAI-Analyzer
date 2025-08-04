import React, { useState, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { DashboardWidget, KPIWidgetConfig, ChartWidgetConfig, TableWidgetConfig, AggregatorType, TableRow, IconType, PivotReportState } from '../../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Icons
const PlusIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></path></svg>;
const EditIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const TrashIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const ExpandIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;
const TrendingUpIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
const DatabaseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>;
const ChartBarIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const RefreshIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const FilterIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>;

const WIDGET_TYPES = [
  { id: 'kpi', name: 'KPI Card', icon: TrendingUpIcon },
  { id: 'bar', name: 'Bar Chart', icon: ChartBarIcon },
  { id: 'line', name: 'Line Chart', icon: ChartBarIcon },
  { id: 'pie', name: 'Pie Chart', icon: ChartBarIcon },
  { id: 'table', name: 'Data Table', icon: DatabaseIcon },
];

const AGGREGATORS: { value: AggregatorType; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'countNonEmpty', label: 'Count Non-Empty' },
];

const CHART_COLORS = ['#00D4FF', '#8B5CF6', '#00FF88', '#FF6B35', '#22d3ee', '#f59e0b'];

const generateId = () => `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const aggregateData = (data: TableRow[], field: string, aggregator: AggregatorType): number => {
  const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined);
  const numericValues = values.map(val => parseFloat(String(val))).filter(val => !isNaN(val));
  
  switch (aggregator) {
    case 'sum': return numericValues.reduce((sum, val) => sum + val, 0);
    case 'average': return numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
    case 'count': return data.length;
    case 'countNonEmpty': return values.length;
    case 'min': return numericValues.length > 0 ? Math.min(...numericValues) : 0;
    case 'max': return numericValues.length > 0 ? Math.max(...numericValues) : 0;
    default: return 0;
  }
};

const prepareChartData = (data: TableRow[], xField: string, yField: string, aggregator: AggregatorType) => {
  const grouped = data.reduce((acc, row) => {
    const key = String(row[xField] || 'Unknown');
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {} as Record<string, TableRow[]>);

  return Object.entries(grouped).map(([key, rows]) => ({
    name: key,
    value: aggregateData(rows, yField, aggregator),
  }));
};

const KPIWidget: React.FC<{ config: KPIWidgetConfig; data: TableRow[]; onEdit: () => void; onDelete: () => void; isEditMode: boolean }> = ({ config, data, onEdit, onDelete, isEditMode }) => {
  const value = useMemo(() => {
    if (!config.valueField || data.length === 0) return 0;
    let filteredData = data;
    if (config.filters) {
      filteredData = data.filter(row => 
        config.filters!.every(filter => String(row[filter.field]) === filter.value)
      );
    }
    return aggregateData(filteredData, config.valueField, config.aggregator);
  }, [config, data]);

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col">
      {isEditMode && (
        <div className="flex justify-end gap-2 mb-2">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <div className="kpi-value text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          {formatValue(value)}
        </div>
        <div className="kpi-label text-gray-300">
          {config.aggregator} of {config.valueField}
        </div>
        {config.filters && config.filters.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Filtered: {config.filters.map(f => `${f.field}=${f.value}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

const ChartWidget: React.FC<{ config: ChartWidgetConfig; data: TableRow[]; onEdit: () => void; onDelete: () => void; isEditMode: boolean }> = ({ config, data, onEdit, onDelete, isEditMode }) => {
  const chartData = useMemo(() => {
    if (!config.xAxisField || !config.yAxisField || data.length === 0) return [];
    return prepareChartData(data, config.xAxisField, config.yAxisField, config.aggregator);
  }, [config, data]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-500">No data to display</div>;
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (config.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Bar dataKey="value" fill="#00D4FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
          </PieChart>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {isEditMode && (
        <div className="flex justify-end gap-2 mb-2">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TableWidget: React.FC<{ config: TableWidgetConfig; data: TableRow[]; onEdit: () => void; onDelete: () => void; isEditMode: boolean }> = ({ config, data, onEdit, onDelete, isEditMode }) => {
  const displayData = useMemo(() => data.slice(0, config.rowCount), [data, config.rowCount]);

  return (
    <div className="h-full flex flex-col">
      {isEditMode && (
        <div className="flex justify-end gap-2 mb-2">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex-grow overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-700 sticky top-0">
            <tr>
              {config.columns.map(col => (
                <th key={col} className="px-2 py-1 text-left font-medium text-cyan-300">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {displayData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-700/50">
                {config.columns.map(col => (
                  <td key={col} className="px-2 py-1 text-gray-300">{String(row[col] || '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WidgetConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: DashboardWidget) => void;
  widget: DashboardWidget | null;
  availableFields: string[];
}> = ({ isOpen, onClose, onSave, widget, availableFields }) => {
  const [config, setConfig] = useState<Partial<DashboardWidget>>({});

  useEffect(() => {
    if (widget) {
      setConfig(widget);
    } else {
      setConfig({
        type: 'kpi',
        title: 'New Widget',
        x: 0, y: 0, w: 3, h: 2,
      });
    }
  }, [widget, isOpen]);

  const handleSave = () => {
    if (!config.type || !config.title) return;
    
    const baseConfig = {
      id: widget?.id || generateId(),
      title: config.title,
      x: config.x || 0,
      y: config.y || 0,
      w: config.w || 3,
      h: config.h || 2,
    };

    let finalWidget: DashboardWidget;

    switch (config.type) {
      case 'kpi':
        finalWidget = {
          ...baseConfig,
          type: 'kpi',
          valueField: (config as KPIWidgetConfig).valueField || null,
          aggregator: (config as KPIWidgetConfig).aggregator || 'sum',
          filters: (config as KPIWidgetConfig).filters || [],
        };
        break;
      case 'bar':
      case 'line':
      case 'pie':
        finalWidget = {
          ...baseConfig,
          type: config.type,
          xAxisField: (config as ChartWidgetConfig).xAxisField || null,
          yAxisField: (config as ChartWidgetConfig).yAxisField || null,
          aggregator: (config as ChartWidgetConfig).aggregator || 'sum',
        };
        break;
      case 'table':
        finalWidget = {
          ...baseConfig,
          type: 'table',
          columns: (config as TableWidgetConfig).columns || availableFields.slice(0, 3),
          rowCount: (config as TableWidgetConfig).rowCount || 10,
        };
        break;
      default:
        return;
    }

    onSave(finalWidget);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1100]" onClick={onClose}>
      <div className="bg-gray-800 border border-cyan-500/50 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-cyan-300 mb-4">Configure Widget</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Widget Type</label>
            <select 
              value={config.type || 'kpi'} 
              onChange={e => setConfig({...config, type: e.target.value as any})}
              className="w-full p-2 bg-gray-700 text-gray-200 rounded-md"
            >
              {WIDGET_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input 
              type="text" 
              value={config.title || ''} 
              onChange={e => setConfig({...config, title: e.target.value})}
              className="w-full p-2 bg-gray-700 text-gray-200 rounded-md"
            />
          </div>

          {(config.type === 'kpi' || config.type === 'bar' || config.type === 'line' || config.type === 'pie') && (
            <>
              {config.type !== 'kpi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">X-Axis Field</label>
                  <select 
                    value={(config as ChartWidgetConfig).xAxisField || ''} 
                    onChange={e => setConfig({...config, xAxisField: e.target.value})}
                    className="w-full p-2 bg-gray-700 text-gray-200 rounded-md"
                  >
                    <option value="">Select field...</option>
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {config.type === 'kpi' ? 'Value Field' : 'Y-Axis Field'}
                </label>
                <select 
                  value={config.type === 'kpi' ? (config as KPIWidgetConfig).valueField || '' : (config as ChartWidgetConfig).yAxisField || ''} 
                  onChange={e => setConfig({...config, [config.type === 'kpi' ? 'valueField' : 'yAxisField']: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-gray-200 rounded-md"
                >
                  <option value="">Select field...</option>
                  {availableFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Aggregation</label>
                <select 
                  value={(config as KPIWidgetConfig | ChartWidgetConfig).aggregator || 'sum'} 
                  onChange={e => setConfig({...config, aggregator: e.target.value as AggregatorType})}
                  className="w-full p-2 bg-gray-700 text-gray-200 rounded-md"
                >
                  {AGGREGATORS.map(agg => (
                    <option key={agg.value} value={agg.value}>{agg.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {config.type === 'table' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Columns</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableFields.map(field => (
                    <label key={field} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={(config as TableWidgetConfig).columns?.includes(field) || false}
                        onChange={e => {
                          const columns = (config as TableWidgetConfig).columns || [];
                          if (e.target.checked) {
                            setConfig({...config, columns: [...columns, field]});
                          } else {
                            setConfig({...config, columns: columns.filter(c => c !== field)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">{field}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Row Count</label>
                <input 
                  type="number" 
                  value={(config as TableWidgetConfig).rowCount || 10} 
                  onChange={e => setConfig({...config, rowCount: parseInt(e.target.value)})}
                  className="w-full p-2 bg-gray-700 text-gray-200 rounded-md"
                  min="1"
                  max="100"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-md">Save</button>
        </div>
      </div>
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const { tableData, fileHeaders, dashboardWidgets, setDashboardWidgets, pivotReports } = useContext(DataContext);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        setLastRefresh(new Date());
      }, refreshInterval * 1000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const handleAddWidget = () => {
    setEditingWidget(null);
    setIsConfigModalOpen(true);
  };

  const handleEditWidget = (widget: DashboardWidget) => {
    setEditingWidget(widget);
    setIsConfigModalOpen(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    setDashboardWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const handleSaveWidget = (widget: DashboardWidget) => {
    if (editingWidget) {
      setDashboardWidgets(prev => prev.map(w => w.id === widget.id ? widget : w));
    } else {
      setDashboardWidgets(prev => [...prev, widget]);
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    const commonProps = {
      onEdit: () => handleEditWidget(widget),
      onDelete: () => handleDeleteWidget(widget.id),
      isEditMode,
    };

    switch (widget.type) {
      case 'kpi':
        return <KPIWidget config={widget} data={tableData} {...commonProps} />;
      case 'bar':
      case 'line':
      case 'pie':
        return <ChartWidget config={widget} data={tableData} {...commonProps} />;
      case 'table':
        return <TableWidget config={widget} data={tableData} {...commonProps} />;
      default:
        return <div className="flex items-center justify-center h-full text-gray-500">Unknown widget type</div>;
    }
  };

  const dataStats = useMemo(() => {
    if (tableData.length === 0) return { rows: 0, columns: 0, lastUpdated: null };
    return {
      rows: tableData.length,
      columns: fileHeaders.length,
      lastUpdated: lastRefresh,
    };
  }, [tableData, fileHeaders, lastRefresh]);

  const hasData = tableData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
          Dynamic Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-refresh every</span>
            <select 
              value={refreshInterval} 
              onChange={e => setRefreshInterval(parseInt(e.target.value))}
              className="bg-gray-700 text-gray-200 rounded px-2 py-1"
              disabled={!autoRefresh}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          <button 
            onClick={() => setLastRefresh(new Date())}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
            title="Refresh Now"
          >
            <RefreshIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${isEditMode ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'}`}
          >
            {isEditMode ? 'Exit Edit' : 'Edit Mode'}
          </button>
        </div>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Panel className="text-center">
          <div className="text-3xl font-bold text-cyan-400">{dataStats.rows.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Rows</div>
        </Panel>
        <Panel className="text-center">
          <div className="text-3xl font-bold text-blue-400">{dataStats.columns}</div>
          <div className="text-sm text-gray-400">Columns</div>
        </Panel>
        <Panel className="text-center">
          <div className="text-3xl font-bold text-purple-400">{pivotReports.length}</div>
          <div className="text-sm text-gray-400">Pivot Reports</div>
        </Panel>
        <Panel className="text-center">
          <div className="text-3xl font-bold text-green-400">{dashboardWidgets.length}</div>
          <div className="text-sm text-gray-400">Widgets</div>
        </Panel>
      </div>

      {!hasData ? (
        <Panel title="No Data Available">
          <div className="text-center py-20">
            <DatabaseIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <p className="text-xl text-gray-400 mb-2">No data loaded</p>
            <p className="text-gray-500">Upload data to start creating dynamic dashboards</p>
          </div>
        </Panel>
      ) : (
        <Panel title="Dashboard Widgets" className="min-h-[600px]">
          {dashboardWidgets.length === 0 ? (
            <div className="text-center py-20">
              <ChartBarIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <p className="text-xl text-gray-400 mb-4">No widgets configured</p>
              <button 
                onClick={handleAddWidget}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
              >
                Create Your First Widget
              </button>
            </div>
          ) : (
            <>
              <div className="dashboard-grid">
                {dashboardWidgets.map(widget => (
                  <div 
                    key={widget.id} 
                    className="widget-wrapper"
                    style={{
                      gridColumn: `span ${widget.w}`,
                      gridRow: `span ${widget.h}`,
                    }}
                  >
                    <Panel title={widget.title} className="h-full">
                      {renderWidget(widget)}
                    </Panel>
                  </div>
                ))}
              </div>
              
              {isEditMode && (
                <div className="mt-6 text-center">
                  <button 
                    onClick={handleAddWidget}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add New Widget
                  </button>
                </div>
              )}
            </>
          )}
        </Panel>
      )}

      <WidgetConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveWidget}
        widget={editingWidget}
        availableFields={fileHeaders}
      />

      {/* Real-time Status */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {lastRefresh.toLocaleTimeString()} 
        {autoRefresh && <span className="ml-2 text-green-400">● Auto-refresh active</span>}
      </div>
    </div>
  );
};