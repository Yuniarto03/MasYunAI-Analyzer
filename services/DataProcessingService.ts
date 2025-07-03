import * as XLSX from 'xlsx';
import { RouteCalculation, BulkRouteResultItem } from '../types';

type ExportableRoute = RouteCalculation | BulkRouteResultItem;

const isBulkItem = (item: ExportableRoute): item is BulkRouteResultItem => {
    return 'originalInputA' in item;
};

export const exportRouteResultsToXLSX = (
    routes: ExportableRoute[],
    fileName: string,
    exportType: 'manual' | 'bulk'
): void => {
    const dataToExport = routes.map(item => {
        let originalInputA = '';
        let originalInputB = '';

        if (isBulkItem(item)) {
            originalInputA = item.originalInputA;
            originalInputB = item.originalInputB;
        } else {
            // It's a RouteCalculation object
            originalInputA = item.result?.originalInputA || item.locationAInput;
            originalInputB = item.result?.originalInputB || item.locationBInput;
        }

        const result = isBulkItem(item) ? item : item.result;

        return {
            'From (Input)': originalInputA,
            'To (Input)': originalInputB,
            'Travel Mode': result?.travelMode || 'N/A',
            'From (Resolved)': result?.fromLocation || 'N/A',
            'To (Resolved)': result?.toLocation || 'N/A',
            'Status': result?.status || 'N/A',
            'Error': result?.error || '',
            'Straight Line Distance (km)': result?.straightLineDistanceKm || 'N/A',
            'Straight Line Duration': result?.straightLineDurationHours || 'N/A',
            'Estimated Travel Duration': result?.estimatedTravelDurationHours || 'N/A',
            'Calculation Type': result?.calculationType || 'N/A',
        };
    });

    if (dataToExport.length === 0) {
        alert("No data available to export.");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Route Results');

    // Auto-size columns
    const columnWidths = Object.keys(dataToExport[0]).map(key => {
        const maxLength = Math.max(
            key.length,
            ...dataToExport.map(row => String((row as any)[key] || '').length)
        );
        return { wch: maxLength + 2 }; // +2 for padding
    });
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
