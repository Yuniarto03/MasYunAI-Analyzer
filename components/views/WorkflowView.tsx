import React from 'react';
import { Panel } from '../Panel';
import { IconType } from '../../types';

// Icons
const UploadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const TableIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ChartIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const PivotIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3m4-4h14M7 12H3m4 4h14M7 16H3" /></svg>;
const StatsIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const ChatBotIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.55 19.05 A8 8 0 0110 21 8 8 0 012 13 8 8 0 0110 5 8 8 0 0117.55 10.95 M19 13 A7 7 0 1112 6 V 3 M16 16 S 19 13 21 13 M12 17H12.01 M12 13H12.01 M7 13H7.01" /></svg>;
const ExportIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

const WorkflowNode: React.FC<{
    icon: IconType;
    title: string;
    description: string;
    color: string;
    className?: string;
    children?: React.ReactNode;
}> = ({ icon: Icon, title, description, color, className = '', children }) => (
    <div className={`workflow-node bg-gray-800/80 p-4 rounded-lg border-2 ${color} ${className}`}>
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-md ${color.replace('border-', 'bg-').replace('text-', 'bg-')}/20`}><Icon className={`w-8 h-8 ${color.replace('border-', 'text-')}`} /></div>
            <div>
                <h3 className={`text-lg font-bold ${color.replace('border-', 'text-')}`}>{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
    </div>
);

export const WorkflowView = () => {
    return (
        <div className="space-y-6">
            <style>{`
            .workflow-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2rem;
            }
            .workflow-node {
                width: 100%;
                max-width: 600px;
                backdrop-filter: blur(5px);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .workflow-node:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            }
            .connector {
                width: 4px;
                height: 2rem;
                background: linear-gradient(to bottom, #4f46e5, #3b82f6, #22d3ee);
                border-radius: 2px;
                opacity: 0.5;
            }
            .hub-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            .hub-node {
                background-color: rgba(31, 41, 55, 0.7);
                border: 1px solid #4b5563;
                padding: 0.75rem;
                border-radius: 0.5rem;
                text-align: center;
                transition: background-color 0.3s;
            }
            .hub-node:hover {
                background-color: rgba(55, 65, 81, 0.9);
            }
            .hub-node .icon {
                margin: 0 auto 0.5rem;
            }
            .hub-node h4 {
                font-weight: 600;
                color: #d1d5db;
                font-size: 0.875rem;
            }
            .ai-node {
                position: relative;
                overflow: hidden;
            }
            .ai-node::before {
                content: '';
                position: absolute;
                top: 0; right: 0; bottom: 0; left: 0;
                background: radial-gradient(circle at 100% 100%, #a855f733, transparent 40%),
                            radial-gradient(circle at 0% 0%, #3b82f633, transparent 40%);
                animation: ai-pulse 5s infinite alternate;
            }
            @keyframes ai-pulse {
                from { opacity: 0.7; }
                to { opacity: 1; }
            }
            `}</style>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Application Workflow</h1>
            
            <Panel title="Navigating the Data Universe">
                <p className="text-lg text-gray-300 mb-8 max-w-4xl">
                    MasYun Data Analyzer is designed around a flexible, cyclical workflow. You can seamlessly move between different analysis modules to explore your data from every angle. This diagram illustrates the primary pathways for turning raw data into actionable insights.
                </p>
                
                <div className="workflow-container">
                    <WorkflowNode icon={UploadIcon} title="1. Data Ingestion" description="Start by providing your data." color="border-sky-500 text-sky-400" />
                    
                    <div className="connector"></div>

                    <WorkflowNode icon={TableIcon} title="2. Core Analysis Hub" description="The central nexus for data interaction." color="border-teal-500 text-teal-400">
                        <div className="hub-grid">
                            <div className="hub-node">
                                <TableIcon className="w-8 h-8 text-sky-400 icon" />
                                <h4>Data Explorer</h4>
                            </div>
                            <div className="hub-node">
                                <ChartIcon className="w-8 h-8 text-fuchsia-400 icon" />
                                <h4>Visualizations</h4>
                            </div>
                            <div className="hub-node">
                                <PivotIcon className="w-8 h-8 text-amber-400 icon" />
                                <h4>Pivot Matrix</h4>
                            </div>
                            <div className="hub-node">
                                <StatsIcon className="w-8 h-8 text-purple-400 icon" />
                                <h4>Statistics</h4>
                            </div>
                        </div>
                    </WorkflowNode>
                    
                    <div className="connector"></div>
                    
                    <div className="ai-node">
                        <WorkflowNode icon={ChatBotIcon} title="3. AI Augmentation" description="Enhance your analysis at any stage." color="border-purple-500 text-purple-400" />
                    </div>

                    <div className="connector"></div>

                    <WorkflowNode icon={ExportIcon} title="4. Insight & Export" description="Finalize and share your findings." color="border-green-500 text-green-400" />
                </div>
            </Panel>

            <Panel title="The Workflow Narrative">
                <div className="space-y-6 text-gray-300">
                    <div>
                        <h3 className="text-xl font-semibold text-sky-300 mb-2">1. Data Ingestion: Your Starting Point</h3>
                        <p>The journey begins in the <strong className="font-semibold text-white">Data Upload</strong> view. Here, you can load your dataset from local CSV, JSON, or Excel files. The application intelligently parses your file, automatically detects headers and data types, and prepares it for analysis. For multi-sheet Excel files, you'll be prompted to select the specific sheet you wish to analyze.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-teal-300 mb-2">2. The Core Analysis Hub: Explore and Transform</h3>
                        <p>Once your data is loaded, you enter a powerful, interconnected hub where you can cycle between different analysis tools to gain a comprehensive understanding:</p>
                        <ul className="list-disc list-inside mt-2 pl-4 space-y-1">
                            <li><strong className="font-semibold text-white">Data Explorer:</strong> This is your home base for viewing raw data. You can search, sort, apply advanced filters, and even use conditional formatting to highlight key information.</li>
                            <li><strong className="font-semibold text-white">Visualizations:</strong> Move to the Visualization Hub to create a wide array of charts. Drag and drop fields to build custom bar, line, pie charts, and more to see your data's story visually.</li>
                            <li><strong className="font-semibold text-white">Pivot Matrix:</strong> For complex summarization, use the Pivot Matrix. Drag fields to rows, columns, and values to aggregate and cross-tabulate your data, revealing high-level trends.</li>
                            <li><strong className="font-semibold text-white">Statistical Analysis:</strong> Get a deep statistical profile of your dataset. This view provides automated summaries for each variable, including metrics like mean, median, standard deviation, and frequency distributions.</li>
                        </ul>
                         <p className="mt-2">The key is flexibility; you can create a chart, notice something interesting, and jump back to the Data Explorer to filter down to that specific subset for a closer look.</p>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold text-purple-300 mb-2">3. AI Augmentation: Your Intelligent Partner</h3>
                        <p>Artificial Intelligence is woven throughout the platform to accelerate your workflow. The <strong className="font-semibold text-white">AI Assistant</strong> is always available for general questions, performing web searches, or even analyzing images you upload. More pointedly, you can select specific rows in the Data Explorer for a targeted AI summary, or use the "AI-Powered Insights" panel in the Statistical Analysis view to get an automated narrative of your data's key characteristics and potential next steps.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-300 mb-2">4. Insight & Export: The Final Frontier</h3>
                        <p>After your analysis is complete, the final step is to consolidate your findings. Currently, you can export the data from your charts and pivot tables. Future updates will expand this into a full <strong className="font-semibold text-white">Reporting and Dashboarding</strong> module, allowing you to save and share your collections of charts and tables as a cohesive story.</p>
                    </div>
                </div>
            </Panel>
        </div>
    );
};

export default WorkflowView;
