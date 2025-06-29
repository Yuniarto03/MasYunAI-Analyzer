


import React, { useState, useMemo, useContext, useCallback, useEffect, useRef } from 'react';
import { DataContext } from '../../contexts/DataContext';
import { Panel } from '../Panel';
import { TableRow, IconType } from '../../types';
import { getStatisticalAnalysis } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Helper Functions ---
const isNumeric = (val: any): boolean => typeof val === 'number' && isFinite(val);
const formatNumber = (num: number, digits = 2) => num.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

// --- Icons ---
const InfoIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const TypeNumberIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TypeTextIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;
const AutoAnalyzeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.5a.75.75 0 01.75.75v.51a4.493 4.493 0 014.243 4.243h.51a.75.75 0 010 1.5h-.51a4.493 4.493 0 01-4.243 4.243v.51a.75.75 0 01-1.5 0v-.51a4.493 4.493 0 01-4.243-4.243h-.51a.75.75 0 010-1.5h.51A4.493 4.493 0 019.25 3.75v-.51a.75.75 0 01.75-.75zM10 5a5 5 0 100 10 5 5 0 000-10zM6.655 6.41a.75.75 0 10-1.06 1.06l1.242 1.243a.75.75 0 001.061-1.06l-1.242-1.243zM13.345 6.41a.75.75 0 10-1.06-1.06l-1.243 1.242a.75.75 0 101.06 1.06l1.243-1.242z" /></svg>;
const AskQueryIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.505 2.365A.75.75 0 002 3.25v13.5A.75.75 0 003.505 17.635L6.25 15.75h6.5A.75.75 0 0013.5 15v-1.125a.75.75 0 00-1.5 0V15h-5.694l-1.555 1H3.5v-11h11V6.5a.75.75 0 001.5 0V3.25a.75.75 0 00-.75-.75h-10.495L3.505 2.365z" /><path d="M15.25 5.5a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V5.5zM15.25 8a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V8zM15.25 10.5a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75v-.01z" /></svg>;
const ColumnIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" /></svg>;

// --- Component for a single stat ---
const StatCard: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-gray-700/50 p-2 rounded-lg text-center ${className}`}>
        <p className="text-xs text-gray-400 truncate" title={label}>{label}</p>
        <p className="text-md font-bold text-blue-300 truncate" title={String(value)}>{value}</p>
    </div>
);

// --- Main View Component ---
export const StatisticalAnalysisView: React.FC = () => {
    const { tableData, fileHeaders, statisticalAnalysisData, setStatisticalAnalysisData, statisticalAnalysisVisibleColumns, setStatisticalAnalysisVisibleColumns } = useContext(DataContext);
    
    const isFilteredRowView = statisticalAnalysisData !== null;
    const isFilteredColumnView = statisticalAnalysisVisibleColumns !== null;
    const dataToAnalyze = isFilteredRowView ? statisticalAnalysisData : tableData;

    const [localVisibleColumns, setLocalVisibleColumns] = useState<Set<string>>(new Set());
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const managerRef = useRef<HTMLDivElement>(null);

    const initialHeaders = useMemo(() => {
        if (!fileHeaders) return [];
        return isFilteredColumnView 
            ? fileHeaders.filter(h => statisticalAnalysisVisibleColumns!.has(h)) 
            : fileHeaders;
    }, [fileHeaders, isFilteredColumnView, statisticalAnalysisVisibleColumns]);

    useEffect(() => {
        setLocalVisibleColumns(new Set(initialHeaders));
    }, [initialHeaders]);

    const headersForAnalysis = useMemo(() => {
        return initialHeaders.filter(h => localVisibleColumns.has(h));
    }, [initialHeaders, localVisibleColumns]);
    
    const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const aiPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (managerRef.current && !managerRef.current.contains(event.target as Node)) {
                setIsManagerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClearFilteredView = () => {
        setStatisticalAnalysisData(null);
        setStatisticalAnalysisVisibleColumns(null);
    };

    const toggleColumnVisibility = (header: string) => {
        setLocalVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(header)) {
                if (newSet.size > 1) newSet.delete(header);
            } else {
                newSet.add(header);
            }
            return newSet;
        });
    };
    
    const handleSelectAllColumns = () => setLocalVisibleColumns(new Set(initialHeaders));
    const handleDeselectAllColumns = () => {
        if (initialHeaders.length > 1) setLocalVisibleColumns(new Set([initialHeaders[0]]));
    };

    useEffect(() => {
        if (headersForAnalysis.length > 0 && !headersForAnalysis.includes(selectedVariable!)) {
            setSelectedVariable(headersForAnalysis[0]);
        } else if (headersForAnalysis.length > 0 && !selectedVariable) {
            setSelectedVariable(headersForAnalysis[0]);
        } else if (headersForAnalysis.length === 0) {
            setSelectedVariable(null);
        }
    }, [headersForAnalysis, selectedVariable]);

    const profilingResults = useMemo(() => {
        if (!dataToAnalyze || dataToAnalyze.length === 0 || headersForAnalysis.length === 0) return null;
        const totalRows = dataToAnalyze.length;
        const totalCols = headersForAnalysis.length;
        let missingCells = 0;
        const rowStrings = new Set<string>();
        let duplicateRows = 0;

        const dataForProfiling = dataToAnalyze.map(row => {
            const newRow: TableRow = {};
            headersForAnalysis.forEach(h => newRow[h] = row[h]);
            return newRow;
        });

        dataForProfiling.forEach(row => {
            const rowString = JSON.stringify(row);
            if(rowStrings.has(rowString)) duplicateRows++;
            else rowStrings.add(rowString);

            headersForAnalysis.forEach(header => {
                const value = row[header];
                if (value === null || value === undefined || String(value).trim() === '') {
                    missingCells++;
                }
            });
        });

        const variableStats: Record<string, any> = {};
        headersForAnalysis.forEach(header => {
            const values = dataToAnalyze.map(row => row[header]).filter(v => v !== null && v !== undefined);
            const stats: any = { type: 'Categorical', missing: totalRows - values.length };

            const numericValues = values.map(v => parseFloat(String(v))).filter(isNumeric);
            
            if (numericValues.length > 0 && numericValues.length / values.length > 0.8) { 
                stats.type = 'Numeric';
                const sum = numericValues.reduce((a, b) => a + b, 0);
                stats.mean = sum / numericValues.length;
                const variance = numericValues.reduce((a, b) => a + Math.pow(b - stats.mean, 2), 0) / numericValues.length;
                stats.stdDev = Math.sqrt(variance);
                stats.min = Math.min(...numericValues);
                stats.max = Math.max(...numericValues);
                const sorted = [...numericValues].sort((a,b) => a - b);
                stats.p25 = sorted[Math.floor(sorted.length * 0.25)];
                stats.median = sorted[Math.floor(sorted.length * 0.5)];
                stats.p75 = sorted[Math.floor(sorted.length * 0.75)];
                
                const numBins = 10;
                const binWidth = (stats.max - stats.min) / numBins;

                if (binWidth > 0) {
                    const bins = Array(numBins).fill(0).map((_, i) => ({ name: `${formatNumber(stats.min + i * binWidth, 1)}`, count: 0 }));
                    numericValues.forEach(val => {
                        let binIndex = Math.floor((val - stats.min) / binWidth);
                        if (binIndex >= numBins) binIndex = numBins - 1;
                        if (bins[binIndex]) {
                            bins[binIndex].count++;
                        }
                    });
                    stats.histogram = bins;
                } else { 
                    stats.histogram = [{ name: formatNumber(stats.min, 1), count: numericValues.length }];
                }

            } else { 
                stats.type = 'Categorical';
                const valueCounts = new Map<any, number>();
                values.forEach(v => valueCounts.set(v, (valueCounts.get(v) || 0) + 1));
                stats.distinct = valueCounts.size;
                stats.frequencies = Array.from(valueCounts.entries())
                    .sort((a,b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([value, count]) => ({ name: String(value).slice(0, 20) + (String(value).length > 20 ? '...' : ''), count }));
            }
            variableStats[header] = stats;
        });

        return {
            overall: { totalRows, totalCols, missingCells, duplicateRows },
            variables: variableStats
        };
    }, [dataToAnalyze, headersForAnalysis]);

    const handleAiRequest = useCallback(async (isAuto = false) => {
        if (!profilingResults) return;
        setIsLoadingAi(true);
        setAiResult(null);

        let summaryText = `Overall Metrics:\n- Rows: ${profilingResults.overall.totalRows}\n- Columns: ${profilingResults.overall.totalCols}\n- Missing Cells: ${profilingResults.overall.missingCells}\n- Duplicate Rows: ${profilingResults.overall.duplicateRows}\n\nPer-Variable Statistics:\n`;
        for (const [name, stats] of Object.entries(profilingResults.variables)) {
            summaryText += `- **${name}** (${stats.type}):\n`;
            if (stats.type === 'Numeric') {
                summaryText += `  - Mean: ${formatNumber(stats.mean)}, StdDev: ${formatNumber(stats.stdDev)}, Min: ${formatNumber(stats.min)}, Max: ${formatNumber(stats.max)}\n`;
            } else {
                summaryText += `  - Distinct Values: ${stats.distinct}, Top Value: ${stats.frequencies[0]?.name || 'N/A'}\n`;
            }
        }
        
        const isSubsetAnalysis = isFilteredRowView || isFilteredColumnView;

        try {
            const result = await getStatisticalAnalysis(summaryText, isAuto ? undefined : aiQuery, isAuto ? isSubsetAnalysis : false);
            setAiResult(result);
        } catch (error: any) {
            setAiResult(`<p class="text-red-400">Error: ${error.message}</p>`);
        }
        setIsLoadingAi(false);
    }, [profilingResults, aiQuery, isFilteredRowView, isFilteredColumnView]);
    
    const handleAutoAnalyzeSubset = () => {
        aiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => handleAiRequest(true), 100);
    };

    if (!profilingResults) {
        return <div className="space-y-6"><h1 className="text-3xl font-bold text-gray-100">Statistical Analysis</h1><Panel title="Awaiting Data"><p className="text-gray-300 text-center py-10">Please upload a file from the <strong className="text-blue-300">'Upload Data'</strong> view to begin analysis.</p></Panel></div>;
    }
    
    const selectedStats = selectedVariable ? profilingResults.variables[selectedVariable] : null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Statistical Analysis</h1>
            
            {(isFilteredRowView || isFilteredColumnView) && (
                <div className="bg-purple-900/50 border border-purple-700 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <InfoIcon className="w-6 h-6 text-purple-300 flex-shrink-0" />
                        <p className="text-sm text-purple-200">
                            You are viewing an analysis of a <strong>filtered subset</strong> of your data.
                            {isFilteredRowView && ` (${dataToAnalyze.length} rows)`}
                            {isFilteredColumnView && ` (${initialHeaders.length} of ${fileHeaders.length} columns)`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                            onClick={handleAutoAnalyzeSubset}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors flex items-center gap-2"
                        >
                           <AutoAnalyzeIcon className="w-4 h-4" />
                           Auto-Analyze Subset
                        </button>
                        <button 
                            onClick={handleClearFilteredView}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
                        >
                            Analyze Full Dataset
                        </button>
                    </div>
                </div>
            )}

            <Panel title="Overall Dataset Summary">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Rows" value={profilingResults.overall.totalRows.toLocaleString()} />
                    <StatCard label="Columns" value={profilingResults.overall.totalCols.toLocaleString()} />
                    <StatCard label="Missing Cells" value={`${profilingResults.overall.missingCells.toLocaleString()} (${formatNumber(profilingResults.overall.missingCells / (profilingResults.overall.totalRows * profilingResults.overall.totalCols) * 100)}%)`} />
                    <StatCard label="Duplicate Rows" value={`${profilingResults.overall.duplicateRows.toLocaleString()} (${formatNumber(profilingResults.overall.duplicateRows / profilingResults.overall.totalRows * 100)}%)`} />
                </div>
            </Panel>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Panel className="max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                           <h2 className="text-xl font-semibold text-blue-300">Variables</h2>
                           <div ref={managerRef} className="relative">
                               <button 
                                   onClick={() => setIsManagerOpen(p => !p)} 
                                   className="px-3 py-1.5 text-xs font-semibold flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-md shadow-md hover:from-fuchsia-500 hover:to-pink-500 transition-all duration-200 transform hover:scale-105"
                               >
                                   <ColumnIcon className="w-4 h-4"/> Manage Variables
                               </button>
                               {isManagerOpen && 
                                   <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 p-2 max-h-80 overflow-y-auto flex flex-col">
                                       <p className="text-xs text-gray-400 px-2 pb-1 border-b border-gray-700">Show/Hide Variables</p>
                                       <div className="flex justify-between items-center p-2 text-xs border-b border-gray-700 mb-1">
                                           <button onClick={handleSelectAllColumns} className="text-sky-400 hover:text-sky-300 font-medium">Select All</button>
                                           <button onClick={handleDeselectAllColumns} className="text-sky-400 hover:text-sky-300 font-medium">Deselect All</button>
                                       </div>
                                       <ul className="flex-grow overflow-y-auto">{initialHeaders.map(h => <li key={h}><label className="flex items-center w-full p-2 text-xs text-gray-300 rounded hover:bg-gray-700 cursor-pointer"><input type="checkbox" checked={localVisibleColumns.has(h)} onChange={() => toggleColumnVisibility(h)} className="h-4 w-4 text-sky-500 bg-gray-600 border-gray-500 rounded focus:ring-sky-400 mr-2"/><span className="truncate" title={h}>{h}</span></label></li>)}</ul>
                                   </div>
                               }
                           </div>
                        </div>
                        <div className="space-y-2 overflow-y-auto">
                        {Object.entries(profilingResults.variables).map(([name, stats]) => (
                            <div key={name} onClick={() => setSelectedVariable(name)} className={`p-3 rounded-lg cursor-pointer border-2 transition-all duration-200 ${selectedVariable === name ? 'bg-purple-900/50 border-purple-500' : 'bg-gray-700/50 border-transparent hover:border-purple-700/50'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold text-purple-300 truncate">{name}</p>
                                    <div className="flex items-center gap-1.5 text-xs bg-gray-600/70 px-2 py-0.5 rounded-full">
                                        {stats.type === 'Numeric' ? <TypeNumberIcon className="w-3 h-3 text-sky-400" /> : <TypeTextIcon className="w-3 h-3 text-amber-400" />}
                                        <span className="text-gray-300">{stats.type}</span>
                                    </div>
                                </div>
                                <div className="h-10 w-full opacity-70">
                                    <ResponsiveContainer>
                                        <BarChart data={stats.histogram || stats.frequencies} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                            <Bar dataKey="count" fill={stats.type === 'Numeric' ? "#38bdf8" : "#f59e0b"}/>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                        </div>
                    </Panel>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <Panel title={selectedVariable ? `Details for: ${selectedVariable}` : 'Select a Variable'}>
                        {!selectedStats ? <p className="text-center text-gray-400 py-20">Select a variable from the left panel to see its detailed statistics.</p> : (
                            <div className="space-y-4">
                                {selectedStats.type === 'Numeric' ? (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <StatCard label="Mean" value={formatNumber(selectedStats.mean)} />
                                            <StatCard label="Std. Dev" value={formatNumber(selectedStats.stdDev)} />
                                            <StatCard label="Min" value={formatNumber(selectedStats.min)} />
                                            <StatCard label="Max" value={formatNumber(selectedStats.max)} />
                                            <StatCard label="25th Pctl" value={formatNumber(selectedStats.p25)} />
                                            <StatCard label="Median" value={formatNumber(selectedStats.median)} />
                                            <StatCard label="75th Pctl" value={formatNumber(selectedStats.p75)} />
                                            <StatCard label="Missing" value={`${selectedStats.missing} (${formatNumber(selectedStats.missing/profilingResults.overall.totalRows*100)}%)`} />
                                        </div>
                                        <div className="h-60 w-full mt-4">
                                            <ResponsiveContainer>
                                                <BarChart data={selectedStats.histogram} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                                                    <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 9}} angle={-45} textAnchor="end" interval={0} />
                                                    <YAxis stroke="#9ca3af" tick={{fontSize: 10}} />
                                                    <Tooltip wrapperClassName="!bg-gray-800 !border-gray-700" cursor={{fill: 'rgba(168, 85, 247, 0.1)'}} />
                                                    <Bar dataKey="count" name="Frequency" fill="#38bdf8" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <StatCard label="Distinct Values" value={selectedStats.distinct} />
                                            <StatCard label="Missing" value={`${selectedStats.missing} (${formatNumber(selectedStats.missing/profilingResults.overall.totalRows*100)}%)`} />
                                        </div>
                                        <p className="text-sm text-gray-400 mt-4">Top 10 Frequent Values:</p>
                                        <div className="h-60 w-full">
                                            <ResponsiveContainer>
                                                <BarChart data={selectedStats.frequencies} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                                     <XAxis type="number" stroke="#9ca3af" tick={{fontSize: 10}} />
                                                     <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} width={80} />
                                                     <Tooltip wrapperClassName="!bg-gray-800 !border-gray-700" cursor={{fill: 'rgba(168, 85, 247, 0.1)'}} />
                                                     <Bar dataKey="count" name="Frequency" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </Panel>

                    <Panel title="AI-Powered Insights" ref={aiPanelRef}>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button onClick={() => handleAiRequest(true)} disabled={isLoadingAi} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
                                    <AutoAnalyzeIcon className="w-5 h-5"/>
                                    {isLoadingAi && !aiQuery ? 'Analyzing...' : `Auto Analyze ${(isFilteredRowView || isFilteredColumnView) ? 'Current Subset' : 'Full Dataset'}`}
                                </button>
                                <button onClick={() => handleAiRequest(false)} disabled={isLoadingAi || !aiQuery} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
                                    <AskQueryIcon className="w-5 h-5"/>
                                    {isLoadingAi && aiQuery ? 'Querying...' : 'Submit Manual Query'}
                                </button>
                            </div>
                            <input type="text" value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Or ask a specific question about the data..." className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg min-h-[15rem] prose prose-sm prose-invert max-w-none text-gray-300">
                            {isLoadingAi && (
                                <div className="flex justify-center items-center h-full">
                                    <div className="w-8 h-8 border-2 border-t-transparent border-purple-400 rounded-full animate-spin"></div>
                                </div>
                            )}
                            {aiResult ? (
                                <div className="prose-styles" dangerouslySetInnerHTML={{ __html: aiResult }}/>
                            ) : (
                                !isLoadingAi && <p className="text-gray-500">AI analysis will appear here.</p>
                            )}
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
};