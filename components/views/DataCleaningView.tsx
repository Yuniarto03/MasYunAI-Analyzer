import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { TableRow, IconType } from '../../types';
import { getAICleaningSuggestions } from '../../services/geminiService';
import { marked } from 'marked';

// --- Icons ---
const CheckCircleIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const AlertTriangleIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const BrainIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;

const OperationButton: React.FC<{ onClick: () => void, children: React.ReactNode, disabled?: boolean }> = ({ onClick, children, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50 disabled:bg-gray-600">
        {children}
    </button>
);

export const DataCleaningView: React.FC = () => {
    const { tableData, fileHeaders, setTableData: setGlobalTableData } = useContext(DataContext);
    const [originalData, setOriginalData] = useState<TableRow[]>([]);
    const [workingData, setWorkingData] = useState<TableRow[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [fillValue, setFillValue] = useState<string>('');
    
    const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    
    useEffect(() => {
        const dataCopy = JSON.parse(JSON.stringify(tableData));
        setOriginalData(dataCopy);
        setWorkingData(dataCopy);
        if (fileHeaders.length > 0) {
            setSelectedColumn(fileHeaders[0]);
        }
    }, [tableData, fileHeaders]);

    const dataSummary = useMemo(() => {
        if (workingData.length === 0) return { totalRows: 0, missingCells: 0, duplicateRows: 0 };
        let missing = 0;
        const seenRows = new Set<string>();
        let duplicates = 0;
        workingData.forEach(row => {
            const rowString = JSON.stringify(row);
            if (seenRows.has(rowString)) {
                duplicates++;
            } else {
                seenRows.add(rowString);
            }
            Object.values(row).forEach(val => {
                if (val === null || val === undefined || String(val).trim() === '') {
                    missing++;
                }
            });
        });
        return { totalRows: workingData.length, missingCells: missing, duplicateRows: duplicates };
    }, [workingData]);
    
    const showFeedback = (text: string, type: 'success' | 'error') => {
        setFeedbackMessage({ text, type });
        setTimeout(() => setFeedbackMessage(null), 4000);
    };

    const handleRemoveDuplicates = () => {
        const seen = new Set<string>();
        const uniqueData = workingData.filter(row => {
            const rowString = JSON.stringify(row);
            if (seen.has(rowString)) return false;
            seen.add(rowString);
            return true;
        });
        const removedCount = workingData.length - uniqueData.length;
        setWorkingData(uniqueData);
        showFeedback(`${removedCount} duplicate rows removed.`, 'success');
    };

    const handleMissingValues = (method: 'remove' | 'fill') => {
        if (!selectedColumn) return;
        let newData: TableRow[];
        let count = 0;
        if (method === 'remove') {
            newData = workingData.filter(row => row[selectedColumn] !== null && row[selectedColumn] !== undefined && String(row[selectedColumn]).trim() !== '');
            count = workingData.length - newData.length;
        } else {
            newData = workingData.map(row => {
                if (row[selectedColumn] === null || row[selectedColumn] === undefined || String(row[selectedColumn]).trim() === '') {
                    count++;
                    return { ...row, [selectedColumn]: fillValue };
                }
                return row;
            });
        }
        setWorkingData(newData);
        showFeedback(`${count} missing values in '${selectedColumn}' handled.`, 'success');
    };
    
    const handleTextCase = (caseType: 'upper' | 'lower' | 'title') => {
        if (!selectedColumn) return;
        const newData = workingData.map(row => ({
            ...row,
            [selectedColumn]: typeof row[selectedColumn] === 'string' 
                ? (caseType === 'upper' ? (row[selectedColumn] as string).toUpperCase() : caseType === 'lower' ? (row[selectedColumn] as string).toLowerCase() : (row[selectedColumn] as string).replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())) 
                : row[selectedColumn]
        }));
        setWorkingData(newData);
        showFeedback(`Case converted for '${selectedColumn}'.`, 'success');
    };

    const handleTrimWhitespace = () => {
        if (!selectedColumn) return;
        const newData = workingData.map(row => ({
            ...row,
            [selectedColumn]: typeof row[selectedColumn] === 'string' ? (row[selectedColumn] as string).trim() : row[selectedColumn]
        }));
        setWorkingData(newData);
        showFeedback(`Whitespace trimmed for '${selectedColumn}'.`, 'success');
    };

    const handleChangeType = (newType: 'string' | 'number') => {
        if (!selectedColumn) return;
        let errors = 0;
        const newData = workingData.map(row => {
            const val = row[selectedColumn];
            let newVal = val;
            if (newType === 'number') {
                const num = parseFloat(String(val));
                if (isNaN(num)) {
                    errors++;
                    newVal = null;
                } else {
                    newVal = num;
                }
            } else {
                newVal = String(val ?? '');
            }
            return { ...row, [selectedColumn]: newVal };
        });
        setWorkingData(newData);
        showFeedback(`Converted '${selectedColumn}' to ${newType}.` + (errors > 0 ? ` ${errors} values failed to convert.` : ''), errors > 0 ? 'error' : 'success');
    };

    const handleGetAISuggestions = async () => {
        setIsAiLoading(true);
        setAiSuggestions(null);
        try {
            const result = await getAICleaningSuggestions(fileHeaders, workingData.slice(0, 5));
            setAiSuggestions(result);
        } catch (e: any) {
            showFeedback('Failed to get AI suggestions.', 'error');
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const applyChanges = () => {
        setGlobalTableData(workingData);
        setOriginalData(JSON.parse(JSON.stringify(workingData))); // The new baseline is now the working data
        showFeedback('Changes applied to the main dataset!', 'success');
    };
    
    const resetChanges = () => {
        setWorkingData(JSON.parse(JSON.stringify(originalData)));
        showFeedback('All cleaning operations have been reset to the original data.', 'success');
    };
    
    const hasData = tableData.length > 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">Data Cleaning Workbench</h1>

            {!hasData ? (
                <Panel title="No Data Loaded">
                    <p className="text-gray-300 text-center py-10">Please upload a file from the <strong className="text-blue-300">'Upload Data'</strong> view to use the cleaning tools.</p>
                </Panel>
            ) : (
                <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Panel title="Cleaning Toolkit">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* First column of operations */}
                             <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-md font-semibold text-gray-300 border-b border-gray-700 pb-2">Handle Missing Values</h3>
                                <select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm"><option value="" disabled>Select Column...</option>{fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                <div className="flex gap-2"><OperationButton onClick={() => handleMissingValues('remove')}>Remove Rows</OperationButton></div>
                                <div className="flex gap-2 items-center"><input type="text" value={fillValue} onChange={e => setFillValue(e.target.value)} placeholder="Fill value" className="flex-grow p-1.5 bg-gray-600 text-gray-200 rounded-md text-xs"/><OperationButton onClick={() => handleMissingValues('fill')}>Fill</OperationButton></div>

                                <h3 className="text-md font-semibold text-gray-300 border-b border-gray-700 pb-2 pt-4">Duplicates</h3>
                                <OperationButton onClick={handleRemoveDuplicates}>Remove Duplicate Rows</OperationButton>
                             </div>

                             {/* Second column of operations */}
                             <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg">
                                 <h3 className="text-md font-semibold text-gray-300 border-b border-gray-700 pb-2">Text & Type Operations</h3>
                                 <select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm"><option value="" disabled>Select Column...</option>{fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                 <div className="flex flex-wrap gap-2"><OperationButton onClick={() => handleTextCase('upper')}>UPPERCASE</OperationButton><OperationButton onClick={() => handleTextCase('lower')}>lowercase</OperationButton><OperationButton onClick={() => handleTextCase('title')}>Title Case</OperationButton></div>
                                 <OperationButton onClick={handleTrimWhitespace}>Trim Whitespace</OperationButton>
                                 <div className="flex items-center gap-2 pt-4 border-t border-gray-700/50"><span className="text-sm text-gray-400">Convert to:</span><OperationButton onClick={() => handleChangeType('number')}>Number</OperationButton><OperationButton onClick={() => handleChangeType('string')}>String</OperationButton></div>
                             </div>
                         </div>
                    </Panel>
                    <div className="space-y-6">
                        <Panel title="Data Quality Overview">
                             <div className="grid grid-cols-3 gap-4 text-center">
                                 <div><p className="text-2xl font-bold text-sky-400">{dataSummary.totalRows.toLocaleString()}</p><p className="text-xs text-gray-400">Total Rows</p></div>
                                 <div><p className="text-2xl font-bold text-amber-400">{dataSummary.missingCells.toLocaleString()}</p><p className="text-xs text-gray-400">Missing Cells</p></div>
                                 <div><p className="text-2xl font-bold text-red-400">{dataSummary.duplicateRows.toLocaleString()}</p><p className="text-xs text-gray-400">Duplicate Rows</p></div>
                             </div>
                        </Panel>
                         <Panel title="AI Cleaning Suggestions">
                            <button onClick={handleGetAISuggestions} disabled={isAiLoading} className="w-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity rounded-lg">
                                <BrainIcon className="w-5 h-5"/>{isAiLoading ? 'Analyzing...' : 'Get AI Suggestions'}
                            </button>
                            {aiSuggestions && !isAiLoading && (
                                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg max-h-48 overflow-y-auto text-xs prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: aiSuggestions }}></div>
                            )}
                         </Panel>
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex-grow">
                        {feedbackMessage && (
                            <div className={`flex items-center gap-2 text-sm ${feedbackMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                                {feedbackMessage.type === 'success' ? <CheckCircleIcon className="w-5 h-5"/> : <AlertTriangleIcon className="w-5 h-5"/>}
                                {feedbackMessage.text}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button onClick={resetChanges} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg">Reset to Original</button>
                        <button onClick={applyChanges} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded-lg">Apply Changes to Main Dataset</button>
                    </div>
                </div>
                
                <Panel title="Live Data Preview (First 50 Rows)">
                    <div className="overflow-auto max-h-[50vh] rounded-lg border border-gray-700">
                         <table className="min-w-full divide-y divide-gray-700 text-xs">
                             <thead className="bg-gray-700 sticky top-0"><tr>{fileHeaders.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-sky-300 uppercase tracking-wider">{h}</th>)}</tr></thead>
                             <tbody className="bg-gray-800 divide-y divide-gray-700">
                                 {workingData.slice(0, 50).map((row, i) => (
                                     <tr key={i} className="hover:bg-gray-700/50">
                                         {fileHeaders.map(h => <td key={h} className="px-3 py-1.5 whitespace-nowrap text-gray-300">{String(row[h] ?? '')}</td>)}
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                    </div>
                </Panel>
                </>
            )}
        </div>
    );
};
