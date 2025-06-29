

import React from 'react';
import { ViewKey, IconType } from '../../types';

interface WelcomeViewProps {
  onNavigate: (viewKey: ViewKey) => void;
}

// Re-using existing icons from the app for consistency
const UploadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const TableIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ChartIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const PivotIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3m4-4h14M7 12H3m4 4h14M7 16H3" /></svg>;


const welcomeWidgets: { viewId: ViewKey; title: string; description: string; icon: IconType; color: string; }[] = [
    { viewId: 'dataUpload', title: 'DATA INGESTION', description: 'Upload local files (CSV, JSON, Excel)', icon: UploadIcon, color: 'text-sky-400' },
    { viewId: 'dataTable', title: 'DATA EXPLORER', description: 'Search, filter, and inspect your data', icon: TableIcon, color: 'text-teal-400' },
    { viewId: 'visualizations', title: 'VISUALIZATION HUB', description: 'Create dynamic charts and graphs', icon: ChartIcon, color: 'text-fuchsia-400' },
    { viewId: 'pivotTable', title: 'PIVOT MATRIX', description: 'Aggregate and summarize datasets', icon: PivotIcon, color: 'text-amber-400' },
];

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onNavigate }) => {
  return (
    <div 
      className="relative h-full w-full flex flex-col items-center justify-center text-center overflow-auto p-4 md:p-8"
    >
      <div className="relative z-10 w-full">
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-400 to-cyan-300 mb-4 animate-fade-in-down">
          Welcome to MasYun Data Analyzer
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-4xl mx-auto animate-fade-in-up">
          Your command center for navigating the vast universe of data. Select a module below to begin your journey.
        </p>

        <div className="welcome-widget-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto animate-fade-in">
          {welcomeWidgets.map((widget, index) => (
            <button
              key={widget.viewId}
              onClick={() => onNavigate(widget.viewId)}
              className="welcome-widget group p-6 text-left flex flex-col"
              style={{ animationDelay: `${0.5 + index * 0.15}s`}}
            >
              <div className={`widget-icon mb-4 ${widget.color}`}>
                <widget.icon className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">{widget.title}</h2>
              <p className="text-gray-400 text-sm flex-grow">{widget.description}</p>
              <div className="mt-4 text-right font-semibold text-purple-400 group-hover:text-white transition-colors duration-300">
                Engage →
              </div>
            </button>
          ))}
        </div>

      </div>
      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s 0.2s ease-out forwards; opacity: 0; }
        .animate-fade-in { animation: fade-in 1s 0.5s ease-out forwards; opacity: 0; }
        .welcome-widget {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};