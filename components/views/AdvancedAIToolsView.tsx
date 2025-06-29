import React, { useState, useContext } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { generateAICommand } from '../../services/geminiService';
import { IconType } from '../../types';

// Icons for AI tools
const InsightIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 3.75a24.455 24.455 0 01-6 0m6 0a24.455 24.455 0 006 0m-16.5-13.5a12.05 12.05 0 0116.5 0M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm-7.5 6a.75.75 0 110-1.5.75.75 0 010 1.5zm15 0a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>;
const PredictiveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l-1-3m1 3l-1-3m-16.5-15h16.5v1.5h-16.5V3z" /></svg>;
const AnomalyIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const AutoMLIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5" /></svg>;
const DataCleaningIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const ReportIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  color: string;
  prompt: string;
  category: 'analysis' | 'modeling' | 'automation' | 'reporting';
}

const AI_TOOLS: AITool[] = [
  {
    id: 'insight-generator',
    name: 'Insight Generator',
    description: 'Automatically discover key insights and trends in your data using advanced AI analysis.',
    icon: InsightIcon,
    color: 'from-purple-500 to-pink-600',
    prompt: 'Analyze the current dataset and generate comprehensive insights including trends, patterns, correlations, and actionable recommendations.',
    category: 'analysis'
  },
  {
    id: 'predictive-modeler',
    name: 'Predictive Modeler',
    description: 'Build and evaluate predictive models based on your datasets using machine learning.',
    icon: PredictiveIcon,
    color: 'from-blue-500 to-cyan-600',
    prompt: 'Create a predictive modeling strategy for the current dataset. Suggest appropriate algorithms, feature engineering steps, and evaluation metrics.',
    category: 'modeling'
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection',
    description: 'Identify unusual patterns or outliers that may require attention using AI algorithms.',
    icon: AnomalyIcon,
    color: 'from-red-500 to-orange-600',
    prompt: 'Perform anomaly detection on the current dataset. Identify outliers, unusual patterns, and potential data quality issues.',
    category: 'analysis'
  },
  {
    id: 'automl-assistant',
    name: 'AutoML Assistant',
    description: 'Automated machine learning pipeline creation and optimization for your specific use case.',
    icon: AutoMLIcon,
    color: 'from-green-500 to-teal-600',
    prompt: 'Design an automated machine learning pipeline for the current dataset. Include data preprocessing, model selection, hyperparameter tuning, and evaluation.',
    category: 'modeling'
  },
  {
    id: 'data-cleaning',
    name: 'Smart Data Cleaning',
    description: 'AI-powered data cleaning and preprocessing recommendations for better data quality.',
    icon: DataCleaningIcon,
    color: 'from-indigo-500 to-purple-600',
    prompt: 'Analyze the current dataset for data quality issues and provide comprehensive data cleaning recommendations including handling missing values, outliers, and inconsistencies.',
    category: 'automation'
  },
  {
    id: 'report-generator',
    name: 'Intelligent Report Generator',
    description: 'Generate comprehensive analytical reports with visualizations and insights automatically.',
    icon: ReportIcon,
    color: 'from-yellow-500 to-orange-600',
    prompt: 'Generate a comprehensive analytical report for the current dataset including executive summary, key findings, visualizations, and recommendations.',
    category: 'reporting'
  }
];

export const AdvancedAIToolsView: React.FC = () => {
  const { tableData, fileHeaders } = useContext(DataContext);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Tools' },
    { id: 'analysis', name: 'Analysis' },
    { id: 'modeling', name: 'Modeling' },
    { id: 'automation', name: 'Automation' },
    { id: 'reporting', name: 'Reporting' }
  ];

  const filteredTools = selectedCategory === 'all' 
    ? AI_TOOLS 
    : AI_TOOLS.filter(tool => tool.category === selectedCategory);

  const hasData = tableData && tableData.length > 0 && fileHeaders && fileHeaders.length > 0;

  const handleRunTool = async (tool: AITool) => {
    if (!hasData) {
      alert('Please upload data first to use AI tools.');
      return;
    }

    setSelectedTool(tool);
    setIsLoading(true);
    setResult(null);

    try {
      // Prepare data context
      const dataContext = `
Current Dataset Context:
- Rows: ${tableData.length}
- Columns: ${fileHeaders.join(', ')}
- Sample Data: ${JSON.stringify(tableData.slice(0, 5), null, 2)}

Data Types Analysis:
${fileHeaders.map(header => {
  const sampleValues = tableData.slice(0, 10).map(row => row[header]).filter(v => v !== null && v !== undefined);
  const isNumeric = sampleValues.every(v => typeof v === 'number' || !isNaN(Number(v)));
  return `- ${header}: ${isNumeric ? 'Numeric' : 'Categorical/Text'}`;
}).join('\n')}
      `;

      const fullPrompt = `${tool.prompt}\n\n${dataContext}`;
      const response = await generateAICommand(fullPrompt);
      setResult(response);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result || !selectedTool) return;
    
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTool.name.replace(/\s+/g, '_')}_Analysis.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Advanced AI Tools</h1>
      
      {!hasData && (
        <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-lg">
          <p className="text-yellow-200">
            <strong>Note:</strong> Upload data first to unlock the full potential of these AI tools. 
            They work best when they have your actual dataset to analyze.
          </p>
        </div>
      )}

      <Panel title="AI-Powered Data Analysis Suite">
        <p className="text-gray-300 mb-6">
          Leverage cutting-edge AI to unlock deeper insights from your data. These tools use advanced machine learning 
          algorithms to automate complex analytical tasks and provide intelligent recommendations.
        </p>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* AI Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="panel-holographic p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color}`}>
                  <tool.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    {tool.category}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">{tool.description}</p>
              
              <button
                onClick={() => handleRunTool(tool)}
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                  isLoading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : `bg-gradient-to-r ${tool.color} text-white hover:opacity-90 transform hover:scale-105`
                }`}
              >
                {isLoading && selectedTool?.id === tool.id ? 'Processing...' : 'Run Analysis'}
              </button>
            </div>
          ))}
        </div>

        {/* Results Panel */}
        {(result || isLoading) && (
          <Panel title={selectedTool ? `${selectedTool.name} Results` : 'AI Analysis Results'}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-t-transparent border-purple-500 rounded-full animate-spin mb-4"></div>
                <p className="text-xl text-purple-300">AI is analyzing your data...</p>
                <p className="text-gray-400 mt-2">This may take a moment. Please wait.</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-blue-300">Analysis Complete</h3>
                  <button
                    onClick={downloadResult}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Download Report
                  </button>
                </div>
                <div 
                  className="prose prose-invert max-w-none bg-gray-900/50 p-6 rounded-lg border border-gray-700"
                  dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}
                />
              </div>
            ) : null}
          </Panel>
        )}

        {/* Data Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-blue-400">
              {hasData ? tableData.length.toLocaleString() : '0'}
            </h4>
            <p className="text-gray-400 text-sm">Data Rows</p>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-green-400">
              {hasData ? fileHeaders.length : '0'}
            </h4>
            <p className="text-gray-400 text-sm">Variables</p>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-purple-400">
              {AI_TOOLS.length}
            </h4>
            <p className="text-gray-400 text-sm">AI Tools Available</p>
          </div>
        </div>
      </Panel>
    </div>
  );
};