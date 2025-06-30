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
            'From Location (Resolved)',
            'To Location (Resolved)',
            'Travel Mode',
            'From Coordinates',
            'To Coordinates',
            'Straight Line Distance',
            'Straight Line Duration',
            'Estimated Travel Duration',
            'Status',
            'Error Message',
            'Calculation Type',
            'Additional Notes',
            'Calculated At'
        ];

        const data = routes.map(route => {
            const result = type === 'manual' ? (route as RouteCalculation).result : (route as BulkRouteResultItem);
            
            return [
                result?.originalInputA || (type === 'manual' ? (route as RouteCalculation).locationAInput : ''),
                result?.originalInputB || (type === 'manual' ? (route as RouteCalculation).locationBInput : ''),
                result?.originalInputA || '',
                result?.originalInputB || '',
                type === 'manual' ? (route as RouteCalculation).travelMode : (route as BulkRouteResultItem).travelMode,
                result?.fromLocation || '',
                result?.toLocation || '',
                result?.straightLineDistanceKm || '',
                result?.straightLineDurationHours || '',
                result?.estimatedTravelDurationHours || '',
                result?.status || 'pending',
                result?.error || '',
                result?.calculationType || '',
                result?.message || '',
                result?.calculatedAt || ''
            ];
        });

        // Add summary statistics
        const successfulRoutes = routes.filter(route => {
            const result = type === 'manual' ? (route as RouteCalculation).result : (route as BulkRouteResultItem);
            return result?.status === 'success';
        });

        const summaryData = [
            [],
            ['SUMMARY STATISTICS'],
            ['Total Routes', routes.length],
            ['Successful Routes', successfulRoutes.length],
            ['Success Rate', `${((successfulRoutes.length / routes.length) * 100).toFixed(1)}%`],
            ['Export Date', new Date().toLocaleString()],
            ['Export Type', type === 'manual' ? 'Manual Routes' : 'Bulk Routes']
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data, ...summaryData]);
        
        // Set column widths for better readability
        const colWidths = [
            { wch: 25 }, // From Location (Input)
            { wch: 25 }, // To Location (Input)
            { wch: 30 }, // From Location (Resolved)
            { wch: 30 }, // To Location (Resolved)
            { wch: 12 }, // Travel Mode
            { wch: 20 }, // From Coordinates
            { wch: 20 }, // To Coordinates
            { wch: 15 }, // Straight Line Distance
            { wch: 15 }, // Straight Line Duration
            { wch: 18 }, // Estimated Travel Duration
            { wch: 12 }, // Status
            { wch: 30 }, // Error Message
            { wch: 20 }, // Calculation Type
            { wch: 40 }, // Additional Notes
            { wch: 18 }  // Calculated At
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Route Results');
        XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
        console.error('Error exporting route results:', error);
        alert('Failed to export route results to Excel file.');
    }
};