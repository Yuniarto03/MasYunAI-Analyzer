
import React, { useState } from 'react';
import { Panel } from '../Panel';

export const SettingsView: React.FC = () => {
  const [theme, setTheme] = useState('dark_matter');
  const [notifications, setNotifications] = useState(true);
  const [dataRetention, setDataRetention] = useState(30);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Application Settings</h1>
      
      <Panel title="Appearance">
        <div className="space-y-4">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
            <select 
              id="theme" 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dark_matter">Dark Matter (Default)</option>
              <option value="nebula_blue">Nebula Blue</option>
              <option value="supernova_red">Supernova Red</option>
              <option value="light_speed">Light Speed (Light Theme)</option>
            </select>
          </div>
          <div className="flex items-center">
            <input 
              id="notifications" 
              type="checkbox" 
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="h-4 w-4 text-blue-500 border-gray-600 rounded focus:ring-blue-400" 
            />
            <label htmlFor="notifications" className="ml-2 block text-sm text-gray-300">Enable In-App Notifications</label>
          </div>
        </div>
      </Panel>

      <Panel title="Data Management">
        <div className="space-y-4">
          <div>
            <label htmlFor="dataRetention" className="block text-sm font-medium text-gray-300 mb-1">
              Data Retention Policy (days)
            </label>
            <input 
              type="number"
              id="dataRetention"
              value={dataRetention}
              onChange={(e) => setDataRetention(parseInt(e.target.value,10))}
              className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             <p className="text-xs text-gray-400 mt-1">Set how long to keep unsaved project data. 0 for indefinite.</p>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition">
            Clear Local Cache
          </button>
        </div>
      </Panel>

      <Panel title="API Configuration">
         <div className="space-y-4">
            <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">Gemini API Key</label>
                <input 
                    type="password" 
                    id="apiKey" 
                    value={process.env.API_KEY ? "**********" : "Not Set (Using Environment Variable)"} 
                    readOnly 
                    className="w-full p-2 bg-gray-700 text-gray-400 rounded-md cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                    API Key is configured via an environment variable (<code>API_KEY</code>) and cannot be changed here.
                </p>
            </div>
         </div>
      </Panel>
      <div className="flex justify-end mt-8">
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition">
            Save Settings
        </button>
      </div>
    </div>
  );
};
