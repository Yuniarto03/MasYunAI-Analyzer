import * as XLSX from 'xlsx';
import { RouteCalculation, BulkRouteResultItem } from '../types';

export const exportRouteResultsToXLSX = (
    routes: RouteCalculation[] | BulkRouteResultItem[],
    filename: string,
    type: 'manual' | 'bulk'
): void => {
    try {
        const headers = [
            'From Location (Input)',
            'To Location (Input)', 
            'Travel Mode',
            'From Coordinates',
            'To Coordinates',
            'Straight Line Distance',
            'Straight Line Duration',
            'Estimated Travel Duration',
            'Status',
            'Error Message',
            'Calculated At'
        ];

        const data = routes.map(route => {
            const result = type === 'manual' ? (route as RouteCalculation).result : (route as BulkRouteResultItem);
            
            return [
                result?.originalInputA || (type === 'manual' ? (route as RouteCalculation).locationAInput : ''),
                result?.originalInputB || (type === 'manual' ? (route as RouteCalculation).locationBInput : ''),
                type === 'manual' ? (route as RouteCalculation).travelMode : (route as BulkRouteResultItem).travelMode,
                result?.fromLocation || '',
                result?.toLocation || '',
                result?.straightLineDistanceKm || '',
                result?.straightLineDurationHours || '',
                result?.estimatedTravelDurationHours || '',
                result?.status || 'pending',
                result?.error || '',
                result?.calculatedAt || ''
            ];
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Route Results');
        XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
        console.error('Error exporting route results:', error);
        alert('Failed to export route results to Excel file.');
    }
};