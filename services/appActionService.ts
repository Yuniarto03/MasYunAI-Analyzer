import React from 'react';
import { ViewKey, PivotReportState, PivotConfig, AICommand, DEFAULT_PIVOT_UI_SETTINGS } from '../types';

export interface AppActionContext {
    setActiveView: (view: ViewKey) => void;
    setPivotReports: React.Dispatch<React.SetStateAction<PivotReportState[]>>;
    setActivePivotId: React.Dispatch<React.SetStateAction<string | null>>;
}

const createNewReportState = (name: string): PivotReportState => ({
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    name,
    config: { rowFields: [], colFields: [], valueFields: [], filters: [] },
    calculatedFieldDefinitions: [],
    pivotResult: null,
    expandedRows: {},
    uiSettings: { ...DEFAULT_PIVOT_UI_SETTINGS },
});

export const executeAction = async (command: AICommand, context: AppActionContext): Promise<void> => {
    // A small delay to make the execution visible to the user
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    switch(command.command) {
        case 'NAVIGATE':
            context.setActiveView(command.view);
            break;
            
        case 'CREATE_PIVOT':
            const newReport = createNewReportState(command.name);
            const newConfig: PivotConfig = {
                rowFields: command.rows || [],
                colFields: command.columns || [],
                valueFields: command.values || [],
                filters: [],
            };
            newReport.config = newConfig;

            context.setPivotReports(prev => [...prev, newReport]);
            context.setActivePivotId(newReport.id);
            break;

        case 'LOG_MESSAGE':
            // Using a simple alert for now. A more robust implementation might use a toast notification system.
            alert(`[AI Workflow] ${command.type.toUpperCase()}: ${command.message}`);
            break;
            
        default:
            // @ts-ignore
            throw new Error(`Unknown command received from AI: ${command.command}`);
    }
};
