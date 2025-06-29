import React, { useState, useContext } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { IconType } from '../../types';

// Icons for different cloud providers
const GoogleDriveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 2L3 8.5L6.5 15H17.5L21 8.5L17.5 2H6.5ZM8.5 4H15.5L18 8.5L15.5 13H8.5L6 8.5L8.5 4Z"/></svg>;
const DropboxIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 2L12 6L16.5 2L21 6L16.5 10L12 6L7.5 10L3 6L7.5 2ZM7.5 14L12 18L16.5 14L21 18L16.5 22L12 18L7.5 22L3 18L7.5 14Z"/></svg>;
const OneDriveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 17H19C20.1 17 21 16.1 21 15C21 13.9 20.1 13 19 13H18.5C18.5 10.8 16.7 9 14.5 9C13.4 9 12.4 9.5 11.8 10.3C11.3 9.5 10.4 9 9.5 9C8.1 9 7 10.1 7 11.5V12H5C3.9 12 3 12.9 3 14S3.9 17 5 17Z"/></svg>;
const BigQueryIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17L12 12L2 17Z"/></svg>;
const SnowflakeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14 6H18L15 9L16 13L12 11L8 13L9 9L6 6H10L12 2ZM12 22L10 18H6L9 15L8 11L12 13L16 11L15 15L18 18H14L12 22Z"/></svg>;
const AmazonS3Icon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6L12 2L21 6V18L12 22L3 18V6ZM5 7.5V16.5L12 20L19 16.5V7.5L12 4L5 7.5Z"/></svg>;
const ConnectIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const CheckIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const LoadingIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

interface CloudProvider {
  id: string;
  name: string;
  icon: IconType;
  description: string;
  color: string;
  authUrl?: string;
  isConnected: boolean;
  supportedFormats: string[];
}

const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: 'googledrive',
    name: 'Google Drive',
    icon: GoogleDriveIcon,
    description: 'Access spreadsheets, documents, and data files from Google Drive',
    color: 'from-blue-500 to-green-500',
    authUrl: 'https://accounts.google.com/oauth/authorize',
    isConnected: false,
    supportedFormats: ['CSV', 'XLSX', 'Google Sheets', 'JSON']
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: DropboxIcon,
    description: 'Import files directly from your Dropbox storage',
    color: 'from-blue-600 to-blue-800',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    isConnected: false,
    supportedFormats: ['CSV', 'XLSX', 'JSON', 'TXT']
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: OneDriveIcon,
    description: 'Connect to Microsoft OneDrive for business and personal files',
    color: 'from-blue-500 to-purple-600',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    isConnected: false,
    supportedFormats: ['CSV', 'XLSX', 'JSON', 'TXT']
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    icon: BigQueryIcon,
    description: 'Query and analyze large datasets from Google BigQuery',
    color: 'from-orange-500 to-red-600',
    authUrl: 'https://accounts.google.com/oauth/authorize',
    isConnected: false,
    supportedFormats: ['SQL Results', 'JSON', 'CSV Export']
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    icon: SnowflakeIcon,
    description: 'Connect to Snowflake data warehouse for enterprise analytics',
    color: 'from-cyan-400 to-blue-600',
    isConnected: false,
    supportedFormats: ['SQL Results', 'JSON', 'CSV Export']
  },
  {
    id: 'amazons3',
    name: 'Amazon S3',
    icon: AmazonS3Icon,
    description: 'Access data files stored in Amazon S3 buckets',
    color: 'from-orange-600 to-yellow-500',
    authUrl: 'https://signin.aws.amazon.com/oauth',
    isConnected: false,
    supportedFormats: ['CSV', 'JSON', 'Parquet', 'TXT']
  }
];

export const OnlineConnectorsView: React.FC = () => {
  const { setTableData, setFileHeaders } = useContext(DataContext);
  const [providers, setProviders] = useState<CloudProvider[]>(CLOUD_PROVIDERS);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: any[]}>({});

  const handleConnect = async (providerId: string) => {
    setConnectingProvider(providerId);
    
    // Simulate OAuth flow and connection process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, isConnected: true } : p
      ));
      
      // Simulate fetching available files
      const mockFiles = generateMockFiles(providerId);
      setSelectedFiles(prev => ({ ...prev, [providerId]: mockFiles }));
      
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, isConnected: false } : p
    ));
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[providerId];
      return newFiles;
    });
  };

  const handleImportFile = async (providerId: string, file: any) => {
    try {
      // Simulate file import
      const mockData = generateMockData(file.name);
      setTableData(mockData.rows);
      setFileHeaders(mockData.headers);
      
      alert(`Successfully imported ${file.name} from ${providers.find(p => p.id === providerId)?.name}`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import file');
    }
  };

  const generateMockFiles = (providerId: string) => {
    const fileTypes = ['sales_data.csv', 'customer_analytics.xlsx', 'marketing_metrics.json', 'financial_report.csv'];
    return fileTypes.map((name, index) => ({
      id: `${providerId}_file_${index}`,
      name,
      size: Math.floor(Math.random() * 1000000) + 10000,
      modified: new Date(Date.now() - Math.random() * 10000000000),
      type: name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
    }));
  };

  const generateMockData = (fileName: string) => {
    const headers = ['ID', 'Name', 'Value', 'Category', 'Date'];
    const rows = Array.from({ length: 50 }, (_, i) => ({
      ID: i + 1,
      Name: `Item ${i + 1}`,
      Value: Math.floor(Math.random() * 1000),
      Category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      Date: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0]
    }));
    return { headers, rows };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Online Storage Integration</h1>
      
      <Panel title="Cloud Storage Providers">
        <p className="text-gray-300 mb-6">
          Connect to your favorite cloud storage providers to import data directly into MasYun Data Analyzer.
          Securely authenticate and access your files without downloading them locally first.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map(provider => (
            <div key={provider.id} className="panel-holographic p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${provider.color}`}>
                    <provider.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                    <div className="flex items-center gap-2">
                      {provider.isConnected ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckIcon className="w-4 h-4" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not connected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">{provider.description}</p>
              
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Supported formats:</p>
                <div className="flex flex-wrap gap-1">
                  {provider.supportedFormats.map(format => (
                    <span key={format} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                {!provider.isConnected ? (
                  <button
                    onClick={() => handleConnect(provider.id)}
                    disabled={connectingProvider === provider.id}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      connectingProvider === provider.id
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${provider.color} text-white hover:opacity-90`
                    }`}
                  >
                    {connectingProvider === provider.id ? (
                      <>
                        <LoadingIcon className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ConnectIcon className="w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDisconnect(provider.id)}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Connected Providers Files */}
      {Object.keys(selectedFiles).length > 0 && (
        <Panel title="Available Files">
          <div className="space-y-6">
            {Object.entries(selectedFiles).map(([providerId, files]) => {
              const provider = providers.find(p => p.id === providerId);
              if (!provider) return null;
              
              return (
                <div key={providerId} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <provider.icon className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-blue-300">{provider.name} Files</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:border-blue-500/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-white font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Modified: {file.modified.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleImportFile(providerId, file)}
                          className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                        >
                          Import File
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Integration Status */}
      <Panel title="Integration Status">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-green-400">
              {providers.filter(p => p.isConnected).length}
            </h4>
            <p className="text-gray-400 text-sm">Connected Providers</p>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-blue-400">
              {Object.values(selectedFiles).flat().length}
            </h4>
            <p className="text-gray-400 text-sm">Available Files</p>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-purple-400">
              {providers.reduce((acc, p) => acc + p.supportedFormats.length, 0)}
            </h4>
            <p className="text-gray-400 text-sm">Supported Formats</p>
          </div>
        </div>
      </Panel>
    </div>
  );
};