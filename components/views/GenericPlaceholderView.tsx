
import React from 'react';
import { Panel } from '../Panel';

interface GenericPlaceholderViewProps {
  featureName?: string;
}

export const GenericPlaceholderView: React.FC<GenericPlaceholderViewProps> = ({ featureName }) => {
  const name = featureName || "This feature";
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">{name.charAt(0).toUpperCase() + name.slice(1)}</h1>
      <Panel title="Under Development">
        <p className="text-gray-300">
          The '{name}' functionality is currently under active development and will be available in a future update.
        </p>
        <p className="text-gray-300 mt-2">
          We appreciate your patience as we work to bring you more advanced capabilities within MasYun Data Analyzer. Stay tuned for exciting new features!
        </p>
        <div className="mt-8 flex justify-center">
            <svg className="w-24 h-24 text-blue-500 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.4 8.6 A9 9 0 1 1 4.6 8.6" /> {/* simple atom-like or construction lines */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </div>
      </Panel>
    </div>
  );
};
