
import React, { useState, useRef } from 'react';
import { Panel } from '../Panel';
import { IconType, WorkflowStep, AIActionPlan, TableRow, FileHeaders, PivotReportState, ViewKey } from '../../types';
import { generateActionPlan } from '../../services/aiActionService';
import { executeAction, AppActionContext } from '../../services/appActionService';

// --- Icons ---
const PlayIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>;
const BrainIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.473-1.473L12 18.75l1.938-.648a2.25 2.25 0 011.473-1.473L17.75 15l.648 1.938a2.25 2.25 0 011.473 1.473L22.5 18.75l-1.938.648a2.25 2.25 0 01-1.473 1.473z" /></svg>;
const ListIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;
const PendingIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>;
const RunningIcon: IconType = ({ className }) => <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const SuccessIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;

interface WorkflowAutomationViewProps {
  context: {
    tableData: TableRow[];
    fileHeaders: FileHeaders;
  } & AppActionContext;
}

const templates = [
  { name: "Sales Analysis", prompt: "Create a pivot table named 'Sales by Region' showing total Sales per Region and Category. Then navigate to the pivot view." },
  { name: "Product Performance", prompt: "Generate a pivot report called 'Product Performance'. Use Product as rows and show the sum of Revenue and count of Units Sold as values." },
  { name: "Customer Segmentation", prompt: "Make a pivot table with Customer Segment in rows and Purchase Frequency in columns, showing the average Spend." },
];

const LoadingSpinner: React.FC<{ text?: string; size?: 'sm' | 'md' | 'lg' }> = ({ text, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };
  
  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-t-transparent border-purple-500 rounded-full animate-spin`}></div>
      {text && <span className="text-purple-300 animate-pulse">{text}</span>}
    </div>
  );
};

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  className?: string;
  title?: string;
  ['aria-label']?: string;
}> = ({ children, onClick, variant = 'primary', size = 'md', disabled, isLoading, leftIcon, className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white focus:ring-blue-400',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${className}`}
      {...props}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : leftIcon}
      {children}
    </button>
  );
};


export const WorkflowAutomationView: React.FC<WorkflowAutomationViewProps> = ({ context }) => {
  const [prompt, setPrompt] = useState('');
  const [actionPlan, setActionPlan] = useState<WorkflowStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    setActionPlan([]);
    try {
      const plan = await generateActionPlan(prompt, { fileHeaders: context.fileHeaders });
      const workflowSteps: WorkflowStep[] = plan.map(p => ({
        id: p.step,
        action: p.action,
        explanation: p.explanation,
        status: 'pending',
      }));
      setActionPlan(workflowSteps);
    } catch (e: any) {
      setError(e.message || "Failed to generate plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecutePlan = async () => {
    if (actionPlan.length === 0) return;
    setIsExecuting(true);
    setError(null);

    for (let i = 0; i < actionPlan.length; i++) {
      const step = actionPlan[i];
      // Update status to 'running'
      setActionPlan(prev => prev.map(s => s.id === step.id ? { ...s, status: 'running' } : s));

      try {
        await executeAction(step.action, context);
        // Update status to 'success'
        setActionPlan(prev => prev.map(s => s.id === step.id ? { ...s, status: 'success' } : s));
      } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred.';
        // Update status to 'failed' and stop execution
        setActionPlan(prev => prev.map(s => s.id === step.id ? { ...s, status: 'failed', error: errorMessage } : s));
        setError(`Execution failed at step ${step.id}: ${errorMessage}`);
        setIsExecuting(false);
        return;
      }
    }
    setIsExecuting(false);
  };

  const renderStatusIcon = (status: WorkflowStep['status']) => {
    switch(status) {
      case 'pending': return <PendingIcon className="w-5 h-5 text-gray-500" />;
      case 'running': return <RunningIcon className="w-5 h-5 text-blue-400" />;
      case 'success': return <SuccessIcon className="w-5 h-5 text-green-400" />;
      case 'failed': return <PendingIcon className="w-5 h-5 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">
        AI Workflow Automator
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
        {/* Left Panel: Configuration */}
        <div className="flex flex-col gap-6">
          <Panel className="flex-shrink-0">
            <h2 className="text-xl font-semibold text-blue-300 mb-3">1. Describe Your Goal</h2>
            <p className="text-sm text-gray-400 mb-4">
              Describe a multi-step task in plain language. The AI will generate an executable plan to accomplish it.
            </p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., 'Create a pivot table showing sales by region, then navigate to it.'"
              className="w-full h-24 p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating || isExecuting}
            />
            <div className="mt-2 text-xs text-gray-500">Available fields: {context.fileHeaders.slice(0, 5).join(', ')}{context.fileHeaders.length > 5 ? '...' : ''}</div>
            
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Or, start with a template:</h3>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button 
                    key={t.name} 
                    onClick={() => setPrompt(t.prompt)}
                    className="px-3 py-1.5 text-xs bg-gray-600/50 hover:bg-gray-600 rounded-md transition-colors"
                    disabled={isGenerating || isExecuting}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGeneratePlan}
              isLoading={isGenerating}
              disabled={isGenerating || isExecuting || !prompt.trim()}
              className="w-full mt-6"
              leftIcon={<BrainIcon className="w-5 h-5" />}
            >
              {isGenerating ? "Generating Plan..." : "Generate AI Action Plan"}
            </Button>
            {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
          </Panel>
        </div>

        {/* Right Panel: Plan & Execution */}
        <div className="flex flex-col gap-6">
          <Panel className="flex-grow flex flex-col">
            <h2 className="text-xl font-semibold text-teal-300 mb-3">2. Review & Execute Plan</h2>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
              {actionPlan.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <ListIcon className="w-16 h-16 opacity-20" />
                  <p className="mt-4">The action plan will appear here.</p>
                </div>
              ) : (
                actionPlan.map(step => (
                  <div key={step.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-teal-400 font-bold flex-shrink-0">
                        {step.id}
                      </div>
                      <div className="mt-2">{renderStatusIcon(step.status)}</div>
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-200">{step.action.command}</p>
                      <p className="text-sm text-gray-400">{step.explanation}</p>
                      {step.status === 'failed' && <p className="text-xs text-red-400 mt-1">Error: {step.error}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={handleExecutePlan}
              isLoading={isExecuting}
              disabled={isExecuting || isGenerating || actionPlan.length === 0 || actionPlan.some(s => s.status !== 'pending')}
              className="w-full mt-6"
              leftIcon={<PlayIcon className="w-5 h-5" />}
              variant="secondary"
            >
              {isExecuting ? "Executing..." : "Execute Plan"}
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
};
