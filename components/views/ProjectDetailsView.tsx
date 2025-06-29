import React from 'react';
import { Panel } from '../Panel';

export const ProjectDetailsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Project Details</h1>
      <Panel title="Recent Project Information">
        <p className="text-gray-300">
          This area will display detailed information about your selected recent project. 
          Currently, the "Recent Projects" list in the sidebar links here as a placeholder.
        </p>
        <p className="text-gray-300 mt-2">
          Future enhancements will include dynamic loading of project-specific data, visualizations, and analysis states.
        </p>
      </Panel>
      <Panel title="Example: Sales Analysis Q3">
         <p className="text-gray-400">Imagine details for 'Sales Analysis Q3' here, such as:</p>
         <ul className="list-disc list-inside text-gray-300 mt-2 pl-4">
            <li>Date Created: 2023-07-01</li>
            <li>Last Modified: 2023-09-28</li>
            <li>Data Source: 'quarterly_sales_final.xlsx'</li>
            <li>Key Metrics Tracked: Revenue, Profit Margin, Units Sold</li>
            <li>Associated Visualizations: Sales Trend (Bar Chart), Regional Performance (Map)</li>
         </ul>
      </Panel>
    </div>
  );
};