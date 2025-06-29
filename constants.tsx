import React from 'react';
import { 
    IconType, 
    ViewKey, 
    Theme, 
    NavMenuItemConfig, 
    DockItemConfig, 
    SidebarItemConfig, 
    SidebarSectionConfig, 
    PivotTheme 
} from './types';


// Example Icons (replace with actual SVGs or a library like Heroicons)
const WelcomeIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
);
const HomeIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const UploadIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const TableIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const ChartIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);
const SettingsIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const CloudIcon: IconType = ({ className }) => ( // Example for online storage
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
);
const ProjectIcon: IconType = ({ className }) => ( // Example for projects
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);
const WandIcon: IconType = ({ className }) => ( // Example for AI tools
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const PivotIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3m4-4h14M7 12H3m4 4h14M7 16H3" />
  </svg>
);

const StatsIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

const AIAssistantIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5M19.5 8.25H21M19.5 12H21M19.5 15.75H21M15.75 21v-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6M9 12h6m-6 4.5h6M9 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0115 21H9a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 019 3z" />
    </svg>
);

const DiagramIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 8.25v.01M10.5 18v.01M5.25 8.25h-1.5V15.75h1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 8.25h1.5v7.5h-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5h4.5M8.25 15.75h4.5" />
    </svg>
);


export const CheckCircleIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);


export const DOCK_ITEMS: DockItemConfig[] = [
  { id: 'welcome', label: 'Welcome', icon: WelcomeIcon },
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'dataUpload', label: 'Upload Data', icon: UploadIcon },
  { id: 'dataTable', label: 'Data Table', icon: TableIcon },
  { id: 'visualizations', label: 'Charts', icon: ChartIcon },
  { id: 'pivotTable', label: 'Pivot Table', icon: PivotIcon },
  { id: 'aiAssistant', label: 'AI Assistant', icon: AIAssistantIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
export const MODEL_IMAGE = 'imagen-3.0-generate-002';

export const SIDEBAR_SECTIONS: SidebarSectionConfig[] = [
  {
    title: "Data Sources",
    items: [
      { name: "Local Files", icon: UploadIcon, viewId: 'dataUpload' },
      { name: "Online Storage", icon: CloudIcon, viewId: 'onlineConnectors' }, 
    ]
  },
  {
    title: "Analysis Tools", // Renamed for clarity
    items: [
        { name: "Data Explorer", icon: TableIcon, viewId: 'dataTable'},
        { name: "Visualizations", icon: ChartIcon, viewId: 'visualizations'},
        { name: "Pivot Tables", icon: PivotIcon, viewId: 'pivotTable'},
        { name: "Diagramming Matrix", icon: DiagramIcon, viewId: 'diagrammingMatrix' },
        { name: "Statistical Analysis", icon: StatsIcon, viewId: 'statisticalAnalysis' },
    ]
  },
  {
    title: "Recent Projects", 
    items: [
      { name: "Sales Analysis Q3", icon: ProjectIcon, viewId: 'projectDetails' },
      { name: "Marketing Campaign", icon: ProjectIcon, viewId: 'projectDetails' },
      { name: "Customer Behavior", icon: ProjectIcon, viewId: 'projectDetails' },
    ]
  },
  {
    title: "AI Tools",
    items: [
      { name: "AI Assistant", icon: AIAssistantIcon, viewId: 'aiAssistant' },
      { name: "AI Insight Analyzer", icon: WandIcon, viewId: 'advancedAITools' },
    ]
  }
];

export const NAV_MENU_ITEMS: NavMenuItemConfig[] = [
    {
        name: "File",
        subItems: [
            { name: "New Project", viewId: 'genericPlaceholder' },
            { name: "Open...", viewId: 'genericPlaceholder' },
            { name: "Save", viewId: 'genericPlaceholder' },
            { name: "Import Data", viewId: 'dataUpload' },
            { name: "Export", viewId: 'genericPlaceholder' }
        ]
    },
    {
        name: "Edit",
        subItems: [
            { name: "Undo", viewId: 'genericPlaceholder' }, 
            { name: "Redo", viewId: 'genericPlaceholder' }, 
            { name: "Cut", viewId: 'genericPlaceholder' }, 
            { name: "Copy", viewId: 'genericPlaceholder' }, 
            { name: "Paste", viewId: 'genericPlaceholder' }
        ]
    },
    {
        name: "View",
        subItems: [
            { name: "Welcome", viewId: 'welcome' },
            { name: "Dashboard", viewId: 'dashboard' },
            { name: "Data Explorer", viewId: 'dataTable' },
            { name: "Pivot Tables", viewId: 'pivotTable' }, // Updated viewId
            { name: "Visualizations", viewId: 'visualizations' },
            { name: "AI Assistant", viewId: 'aiAssistant' } 
        ]
    },
    {
        name: "Tools",
        subItems: [
            { name: "Data Cleaning", viewId: 'genericPlaceholder' }, 
            { name: "Statistical Analysis", viewId: 'statisticalAnalysis' }, 
            { name: "Machine Learning", viewId: 'genericPlaceholder' },
            { name: "Report Generator", viewId: 'genericPlaceholder' }
        ]
    },
    {
        name: "Help",
        subItems: [
            { name: "Tutorials", viewId: 'genericPlaceholder' }, 
            { name: "Workflow", viewId: 'workflow' }, 
            { name: "About", viewId: 'about' }
        ]
    }
];


// --- NEW PIVOT THEMES ---

export const PIVOT_THEMES: Record<string, PivotTheme> = {
  professionalBlue: {
    name: "Professional Blue",
    description: "A clean, elegant theme with a subtle 3D embossed effect.",
    tableClasses: {
      headerDefault: "theme-pro-header-default",
      headerRowDesc: "theme-pro-header-row-desc",
      headerGrandTotal: "theme-pro-header-grand-total",
      cellDefault: "theme-pro-cell-default",
      cellRowHeader: "theme-pro-cell-row-header",
      cellGrandTotal: "theme-pro-cell-grand-total",
      cellSubtotalHeader: "theme-pro-cell-subtotal-header",
      cellSubtotalValue: "theme-pro-cell-subtotal-value",
      zebraStripeClass: "zebra-stripe-pro"
    },
    chartColors: ['#2980b9', '#3498db', '#5dade2', '#85c1e9', '#34495e', '#7f8c8d'],
  },
  vibrantHologram: {
    name: "Vibrant Hologram",
    description: "A futuristic, high-contrast theme.",
    tableClasses: {
      headerDefault: "pivot-header-default",
      headerRowDesc: "pivot-header-row-desc",
      headerGrandTotal: "pivot-header-grand-total",
      cellDefault: "pivot-cell-default",
      cellRowHeader: "pivot-cell-row-header",
      cellGrandTotal: "pivot-cell-grand-total",
      cellSubtotalHeader: "pivot-cell-subtotal-header",
      cellSubtotalValue: "pivot-cell-subtotal-value",
      zebraStripeClass: "zebra-stripe"
    },
    chartColors: ['#8884d8', '#82ca9d', '#ffc658', '#d946ef', '#3b82f6', '#fb7185', '#34d399'],
  },
  cyberpunkNeon: {
    name: "Cyberpunk Neon",
    description: "A high-contrast dark theme with glowing neon colors.",
    tableClasses: {
      headerDefault: "theme-cyber-header-default",
      headerRowDesc: "theme-cyber-header-row-desc",
      headerGrandTotal: "theme-cyber-header-grand-total",
      cellDefault: "theme-cyber-cell-default",
      cellRowHeader: "theme-cyber-cell-row-header",
      cellGrandTotal: "theme-cyber-cell-grand-total",
      cellSubtotalHeader: "theme-cyber-cell-subtotal-header",
      cellSubtotalValue: "theme-cyber-cell-subtotal-value",
      zebraStripeClass: "zebra-stripe-cyber"
    },
    chartColors: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff5e00', '#7605e2', '#ff005d'],
  },
  arcticDawn: {
    name: "Arctic Dawn",
    description: "A clean, professional light theme with cool colors.",
    tableClasses: {
      headerDefault: "theme-arctic-header-default",
      headerRowDesc: "theme-arctic-header-row-desc",
      headerGrandTotal: "theme-arctic-header-grand-total",
      cellDefault: "theme-arctic-cell-default",
      cellRowHeader: "theme-arctic-cell-row-header",
      cellGrandTotal: "theme-arctic-cell-grand-total",
      cellSubtotalHeader: "theme-arctic-cell-subtotal-header",
      cellSubtotalValue: "theme-arctic-cell-subtotal-value",
      zebraStripeClass: "zebra-stripe-arctic"
    },
    chartColors: ['#0a5f9e', '#1e8bc3', '#62bce8', '#7f8c8d', '#34495e', '#2980b9', '#95a5a6'],
  }
};

// --- NEW: For FuturisticBackground ---
export const RAW_COLOR_VALUES: Record<string, string> = {
  'blue-400': '#00D4FF',
  'purple-500': '#8B5CF6',
  'green-400': '#00FF88',
  'yellow-400': '#FF6B35',
  'gray-900': '#0A0F1E',
  'pink-500': '#ec4899',
  'cyan-400': '#22d3ee',
  'amber-500': '#f59e0b',
  'lime-500': '#84cc16',
  'violet-500': '#8b5cf6',
};