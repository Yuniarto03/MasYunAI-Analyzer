import React from 'react';
import { Panel } from '../Panel';

export const RoutePlannerView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Route Planner</h1>
      <Panel title="Route Planning & Analysis">
        <p className="text-gray-300">
          Plan and analyze routes between different locations. This feature will help you calculate distances, 
          travel times, and provide insights for optimal route planning.
        </p>
        <p className="text-gray-300 mt-2">
          Features coming soon:
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2 pl-4">
          <li>Distance and duration calculations</li>
          <li>Multiple transportation modes</li>
          <li>Route optimization</li>
          <li>Traffic analysis</li>
          <li>Bulk route processing</li>
          <li>Export capabilities</li>
        </ul>
      </Panel>
    </div>
  );
};