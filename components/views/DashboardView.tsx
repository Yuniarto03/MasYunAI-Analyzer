import React, { useContext, useMemo } from 'react';
import { Panel } from '../Panel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChartDataItem, FileHeaders, TableRow } from '../../types';
import { DataContext } from '../../contexts/DataContext';

const sampleBarData: ChartDataItem[] = [
  { name: 'Jan', uv: 4000, pv: 2400 }, { name: 'Feb', uv: 3000, pv: 1398 },
  { name: 'Mar', uv: 2000, pv: 9800 }, { name: 'Apr', uv: 2780, pv: 3908 },
  { name: 'May', uv: 1890, pv: 4800 }, { name: 'Jun', uv: 2390, pv: 3800 },
];

const sampleLineData: ChartDataItem[] = [
  { name: 'Page A', uv: 400, pv: 240, amt: 240 }, { name: 'Page B', uv: 300, pv: 139, amt: 221 },
  { name: 'Page C', uv: 200, pv: 980, amt: 229 }, { name: 'Page D', uv: 278, pv: 390, amt: 200 },
];

const ChartPlaceholder: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-gray-400">
        <p>{message}</p>
    </div>
);

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

export const DashboardView: React.FC = () => {
  const { tableData, fileHeaders } = useContext(DataContext);

  const numericHeaders = useMemo(() => {
    if (!tableData || tableData.length === 0 || !fileHeaders) return [];
    return fileHeaders.filter(header => 
        tableData.every(row => typeof row[header] === 'number' || (typeof row[header] === 'string' && !isNaN(Number(row[header]))))
    );
  }, [tableData, fileHeaders]);

  const categoricalHeaders = useMemo(() => {
     if (!fileHeaders) return [];
     return fileHeaders.filter(h => !numericHeaders.includes(h) && tableData.some(row => typeof row[h] === 'string' && row[h] !== null && row[h] !== undefined && String(row[h]).trim() !== ''));
  }, [fileHeaders, numericHeaders, tableData]);

  const dashboardBarData = useMemo(() => {
    if (tableData.length > 0 && categoricalHeaders.length > 0 && numericHeaders.length > 0) {
      const xKey = categoricalHeaders[0]; // Use first categorical for X-axis
      const yKey = numericHeaders[0];     // Use first numerical for Y-axis
      
      // Aggregate data if X-axis has duplicate values (simple sum aggregation)
      const aggregated: { [key: string]: number } = {};
      tableData.forEach(row => {
        const xValue = String(row[xKey]);
        const yValue = parseFloat(String(row[yKey]));
        if (!isNaN(yValue)) {
            aggregated[xValue] = (aggregated[xValue] || 0) + yValue;
        }
      });
      return Object.entries(aggregated)
        .map(([name, value]) => ({ name, [yKey]: value } as ChartDataItem))
        .slice(0, 10); // Limit to first 10 for dashboard preview
    }
    return sampleBarData;
  }, [tableData, categoricalHeaders, numericHeaders]);
  
  const dashboardLineData = useMemo(() => {
    if (tableData.length > 0 && categoricalHeaders.length > 0 && numericHeaders.length > 1) {
      const xKey = categoricalHeaders[0]; // Use first categorical for X-axis
      const yKey1 = numericHeaders[0];    // First numerical for Y1
      const yKey2 = numericHeaders[1];    // Second numerical for Y2
      return tableData.map(row => ({
        name: String(row[xKey]),
        [yKey1]: parseFloat(String(row[yKey1])),
        [yKey2]: parseFloat(String(row[yKey2])),
      } as ChartDataItem)).filter(
          item => !isNaN(item[yKey1] as number) && !isNaN(item[yKey2] as number)
      ).slice(0, 15); // Limit to first 15 for dashboard preview
    }
    return sampleLineData;
  }, [tableData, categoricalHeaders, numericHeaders]);

  const barChartYKey = (dashboardBarData === sampleBarData) ? 'pv' : (numericHeaders.length > 0 ? numericHeaders[0] : 'pv');
  const barChartYKey2 = (dashboardBarData === sampleBarData) ? 'uv' : (numericHeaders.length > 1 ? numericHeaders[1] : undefined);
  
  const lineChartYKey1 = (dashboardLineData === sampleLineData) ? 'pv' : (numericHeaders.length > 0 ? numericHeaders[0] : 'pv');
  const lineChartYKey2 = (dashboardLineData === sampleLineData) ? 'uv' : (numericHeaders.length > 1 ? numericHeaders[1] : 'uv');


  const noDataForCharts = tableData.length === 0 || numericHeaders.length === 0 || categoricalHeaders.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Welcome to MasYun Data Analyzer</h1>
      <Panel title="Overview">
        <p className="text-gray-300">
            {noDataForCharts ? "Upload data to populate the dashboard with live metrics. Showing sample data for now." : "Key metrics and visualizations from your uploaded data."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-200 mb-2">Data Summary Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                    {noDataForCharts && dashboardBarData === sampleBarData ? (
                        <ChartPlaceholder message="Upload data for a dynamic bar chart." />
                    ) : (
                        <BarChart data={dashboardBarData} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 11}} angle={-30} textAnchor="end" interval={0} />
                            <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                            <Tooltip {...chartTooltipProps} />
                            <Legend />
                            <Bar dataKey={barChartYKey} fill="#8884d8" name={barChartYKey} />
                            {barChartYKey2 && <Bar dataKey={barChartYKey2} fill="#82ca9d" name={barChartYKey2} />}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-200 mb-2">Trend Analysis Chart</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    {noDataForCharts && dashboardLineData === sampleLineData ? (
                         <ChartPlaceholder message="Upload data with at least two numeric columns for a trend chart." />
                    ) : (
                        <LineChart data={dashboardLineData} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 11}} angle={-30} textAnchor="end" interval={0} />
                            <YAxis yAxisId="left" stroke="#8884d8" tick={{fontSize: 12}} />
                            {numericHeaders.length > 1 && <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{fontSize: 12}} />}
                            <Tooltip {...chartTooltipProps} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey={lineChartYKey1} stroke="#8884d8" activeDot={{ r: 8 }} name={lineChartYKey1} />
                            {numericHeaders.length > 1 && <Line yAxisId="right" type="monotone" dataKey={lineChartYKey2} stroke="#82ca9d" name={lineChartYKey2} />}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
      </Panel>
      <Panel title="Quick Actions">
        <div className="flex space-x-4">
            <button 
                onClick={() => { /* Consider navigating to dataUpload view */ }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40"
            >
                Upload New Data
            </button>
            <button className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40 opacity-50 cursor-not-allowed" disabled>
                Generate Report (Soon)
            </button>
        </div>
      </Panel>
    </div>
  );
};