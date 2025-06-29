
import React, { useEffect } from 'react';
import { CheckCircleIcon } from '../constants'; 

interface FeaturesStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const featuresList = [
  "Interactive 3D Solar System Background",
  "CSV, JSON, & Excel File Upload with Drag & Drop",
  "Sheet Selection for Multi-Sheet Excel Files",
  "Visual File Processing Indicators",
  "Dynamic Data Table with Search, Sort & Pagination",
  "Configurable Line & Bar Charts (Multiple Y-Axes for Line)",
  "AI Chatbot with Gemini API & Search Grounding",
  "Dashboard with Dynamic Charts from Uploaded Data",
  "macOS-style Dock Navigation",
  "Responsive UI & Theming Structure",
  "Modular Component Architecture",
  "Placeholder Views for Pivot Tables & Advanced AI Tools"
];

export const FeaturesStatusModal: React.FC<FeaturesStatusModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 7000); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[2000] p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg transform transition-all duration-300 ease-out scale-100 opacity-100">
        <div className="flex flex-col items-center text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4" />
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-3">
            MasYun Data Analyzer Initialized!
          </h2>
          <p className="text-gray-300 mb-6">
            All core systems are online and ready for your command.
          </p>
          
          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg w-full mb-6 text-left max-h-60 overflow-y-auto hide-scrollbar">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Activated Features:</h3>
            <ul className="space-y-2">
              {featuresList.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-200">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
          >
            Explore the Galaxy
          </button>
        </div>
      </div>
    </div>
  );
};