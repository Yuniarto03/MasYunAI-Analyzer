import React from 'react';
import { Panel } from '../Panel';

export const OnlineConnectorsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Connect to Online Data Sources</h1>
      <Panel title="Online Storage Integration">
        <p className="text-gray-300">
          Functionality to connect to cloud storage providers like Google Drive, Dropbox, BigQuery, and Snowflake is currently under development.
        </p>
        <p className="text-gray-300 mt-2">
          This section will allow you to authorize MasYun Data Analyzer to access your data stored in these services directly.
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {['Google Drive', 'Dropbox', 'BigQuery', 'Snowflake', 'Amazon S3', 'OneDrive'].map(service => (
            <div key={service} className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-lg font-semibold text-blue-300">{service}</p>
              <p className="text-sm text-gray-400 mt-1">(Coming Soon)</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};