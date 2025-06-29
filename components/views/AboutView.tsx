
import React, { useState, useCallback } from 'react';
import { Panel } from '../Panel';
import { generateDocumentation } from '../../services/geminiService';

// Icons
const GenerateIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.473-1.473L12 18.75l1.938-.648a2.25 2.25 0 011.473-1.473L17.75 15l.648 1.938a2.25 2.25 0 011.473 1.473L22.5 18.75l-1.938.648a2.25 2.25 0 01-1.473 1.473z" /></svg>;
const DownloadIcon: React.FC<{className?: string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

const APP_FEATURES_PROMPT = `
- **Overall Platform**: "MasYun Data Analyzer", a sophisticated AI-powered data analysis tool with a futuristic, holographic space-themed UI.
- **Core UI**:
    - A dynamic 3D space background featuring an animated solar system.
    - A macOS-style Dock for quick access to main features.
    - A collapsible Sidebar for detailed navigation.
    - Holographic-style panels for all content areas.
    - A consistent, modern dark theme throughout.
- **Data Input**:
    - **Data Upload View**: Users can upload local files (CSV, JSON, XLS, XLSX) via drag-and-drop or a file selector. The system automatically parses the data.
    - **Excel Sheet Selection**: If an Excel file has multiple sheets, the user is prompted to select which one to load.
- **Data Exploration**:
    - **Data Explorer View**: A powerful table view for the loaded data.
    - Features include: global search, column-specific sorting, pagination.
    - **Column Filtering**: Users can filter by values in each column using a popover with search and multi-select.
    - **Advanced Filter Builder**: A modal to create complex filter rules (e.g., 'Sales > 1000' AND 'Region contains "North"').
    - **Conditional Formatting**: Users can apply styles (e.g., color glows, bold text) to cells based on rules.
    - **Row Selection & AI Analysis**: Users can select specific rows and click "Analyze" to get an AI-generated summary of that data subset from Gemini.
- **AI Assistant**:
    - An always-accessible chat window.
    - Powered by the Gemini API.
    - **Multimodal**: Can answer text-based questions and analyze user-uploaded images.
    - **Search Grounding**: Can perform Google searches for up-to-date information and provides source links.
- **Data Visualization**:
    - A fully interactive, drag-and-drop chart builder.
    - Users drag fields from an "Available Fields" list to 'X-Axis', 'Y-Axis (Values)', and 'Filters' drop zones.
    - **Multiple Chart Types**: Supports Bar, Horizontal Bar, Line, Area, Pie, Scatter, and Radar charts.
    - **Aggregation**: Numeric fields can be aggregated (Sum, Average, Count, etc.). Text fields are automatically aggregated by 'Count Non-Empty'.
    - **Advanced Styling**: A "Chart Styles & Options" panel allows for deep customization:
        - Per-series custom color picker.
        - Pre-defined color themes (e.g., Cosmic Funk, Cyberpunk Night).
        - Toggles for stacked charts, data labels, and gridlines.
        - Legend positioning control.
        - Area charts have multi-color gradient fills.
- **Pivot Tables**:
    - A powerful pivot table generator, also with a drag-and-drop interface (Rows, Columns, Values, Filters).
    - Supports multiple value fields with different aggregators.
    - Generates a fully interactive pivot table with expandable/collapsible rows.
    - Includes options for subtotals and grand totals.
    - **Integrated Charting**: Generates a chart based on the pivot table data, which can be configured (Bar, Line, Pie, etc.).
    - **Multiple Reports**: Users can create and switch between multiple pivot report configurations in tabs.
- **Statistical Analysis**:
    - An automated statistical profiling tool.
    - Provides overall dataset metrics (row counts, missing cells, etc.).
    - Generates per-variable analysis, distinguishing between numeric and categorical data.
    - Includes mini-charts (histograms/bar charts) for each variable.
    - Features an AI analysis section for automated insights or manual queries about the data's statistical properties.
`;


export const AboutView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [documentationHtml, setDocumentationHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateDocumentation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setDocumentationHtml(null);
        try {
            const htmlContent = await generateDocumentation(APP_FEATURES_PROMPT);
            if (htmlContent.toLowerCase().includes('<h1>error')) {
                setError('The AI failed to generate the documentation. Please try again.');
                setDocumentationHtml(htmlContent); // Show error HTML from service
            } else {
                setDocumentationHtml(htmlContent);
            }
        } catch (e: any) {
            setError(`An error occurred: ${e.message || 'Unknown error'}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleDownload = () => {
        if (!documentationHtml) return;
        const blob = new Blob([documentationHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'About_MasYun_Data_Analyzer.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">About MasYun Data Analyzer</h1>
            <Panel>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <p className="text-gray-300 flex-grow">
                        Generate a comprehensive, AI-powered user manual that explains the entire platform, its menus, and all features in detail.
                    </p>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <button
                            onClick={handleGenerateDocumentation}
                            disabled={isLoading}
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                        >
                            <GenerateIcon className="w-5 h-5"/>
                            {isLoading ? 'Generating...' : 'Generate Manual'}
                        </button>
                        {documentationHtml && !error && (
                            <button
                                onClick={handleDownload}
                                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                            >
                                <DownloadIcon className="w-5 h-5"/>
                                Download
                            </button>
                        )}
                    </div>
                </div>

                {isLoading && (
                    <div className="flex flex-col justify-center items-center py-20 min-h-[50vh] text-center">
                        <div className="w-16 h-16 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-xl text-purple-300 tracking-wider">The AI is analyzing the platform...</p>
                        <p className="mt-2 text-gray-400">This may take a moment. Please wait.</p>
                    </div>
                )}
                
                {error && (
                     <div className="text-center py-10 bg-red-900/30 border border-red-700 rounded-lg">
                        <p className="text-xl text-red-300 font-semibold">Generation Failed</p>
                        <p className="mt-2 text-red-400">{error}</p>
                    </div>
                )}

                {documentationHtml && (
                    <div className="mt-4 border-2 border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                       <iframe
                         srcDoc={documentationHtml}
                         title="About MasYun Data Analyzer"
                         className="w-full h-[70vh] border-none"
                         sandbox="allow-scripts" // Allow scripts for potential interactivity in doc, but no same-origin
                       />
                    </div>
                )}
                
                {!isLoading && !documentationHtml && (
                    <div className="text-center py-20 text-gray-500">
                        <p>Click "Generate Manual" to create a detailed guide about this application.</p>
                    </div>
                )}

            </Panel>
        </div>
    );
};