import * as XLSX from 'xlsx';
import { TableRow, RouteCalculation, BulkRouteResultItem } from '../types';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';

// Generic Helper
const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportChartDataToCSV = (data: TableRow[], fileName: string) => {
    if (!data || data.length === 0) {
        alert("No data to export.");
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput: string = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${fileName}.csv`);
};

export const downloadTextFile = (content: string, fileName: string, extension: 'txt' | 'md' = 'txt') => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, `${fileName}.${extension}`);
};

export const exportTableToExcel = (data: TableRow[], fileName: string, headers: string[]) => {
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportTableToCSV = (data: TableRow[], fileName: string, headers: string[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const csvOutput: string = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${fileName}.csv`);
};

export const exportTableToJson = (data: TableRow[], fileName: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    triggerDownload(blob, `${fileName}.json`);
};

export const downloadImage = (base64Image: string, fileName: string) => {
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    triggerDownload(blob, `${fileName}.jpg`);
};

export const downloadDocx = async (content: string, fileName: string) => {
    const paragraphs = content.split('\n').filter(p => p.trim() !== '').map(p => new Paragraph({ children: [new TextRun(p)] }));
    const doc = new Document({
        sections: [{ children: paragraphs }]
    });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, `${fileName}.docx`);
};

export const downloadPdf = (content: string, fileName: string) => {
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    doc.save(`${fileName}.pdf`);
};

export const downloadPptx = (content: string, fileName: string, instruction: string) => {
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    
    let titleSlide = pres.addSlide();
    titleSlide.background = { color: '1f2937' };
    titleSlide.addText(instruction, { x: 0.5, y: 1.5, w: '90%', h: 1, fontSize: 32, bold: true, color: 'FFFFFF', align: 'center' });
    titleSlide.addText(`AI-Generated Presentation by MasYunDataAI`, { x: 0.5, y: 4.5, w: '90%', h: 0.5, fontSize: 14, color: 'A0A0A0', align: 'center' });

    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    if (paragraphs.length > 0) {
        let slide = pres.addSlide();
        slide.background = { color: '1f2937' };
        let yPos = 0.5;
        for (const p of paragraphs) {
            if (yPos > 5.0) {
                slide = pres.addSlide();
                slide.background = { color: '1f2937' };
                yPos = 0.5;
            }
            slide.addText(p, { x: 0.5, y: yPos, w: '90%', h: 0.5, fontSize: 16, color: 'FFFFFF' });
            yPos += 0.5;
        }
    }
    pres.writeFile({ fileName: `${fileName}.pptx` });
};

export const downloadElementAsHTML = (element: HTMLElement, fileName: string) => {
    const styles = Array.from(document.querySelectorAll('style'))
        .map(style => style.innerHTML)
        .join('\n');

    const elementHtml = element.outerHTML;

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title} - Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background-color: #0A0F1E; /* Dark background similar to the app */
            padding: 2rem;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            overflow: auto !important; /* Force scrolling for exported content */
        }
        ${styles}
    </style>
</head>
<body>
    ${elementHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    triggerDownload(blob, fileName);
};


export const exportRouteResultsToXLSX = (results: (RouteCalculation | BulkRouteResultItem)[], fileName: string, type: 'manual' | 'bulk') => {
    const dataToExport = results.map(res => {
        if (type === 'manual') {
            const rc = res as RouteCalculation;
            return {
                "From (Input)": rc.locationAInput,
                "To (Input)": rc.locationBInput,
                "Travel Mode": rc.travelMode,
                "Status": rc.result?.status || 'N/A',
                "From (Resolved)": rc.result?.fromLocation || 'N/A',
                "To (Resolved)": rc.result?.toLocation || 'N/A',
                "Straight-Line Distance (km)": rc.result?.straightLineDistanceKm || 'N/A',
                "Estimated Travel Duration": rc.result?.estimatedTravelDurationHours || 'N/A',
                "Error": rc.result?.error || '',
            };
        } else { // bulk
             const br = res as BulkRouteResultItem;
            return {
                "From (Input)": br.originalInputA,
                "To (Input)": br.originalInputB,
                "Travel Mode": br.travelMode,
                "Status": br.status || 'N/A',
                "From (Resolved)": br.fromLocation || 'N/A',
                "To (Resolved)": br.toLocation || 'N/A',
                "Straight-Line Distance (km)": br.straightLineDistanceKm || 'N/A',
                "Estimated Travel Duration": br.estimatedTravelDurationHours || 'N/A',
                "Error": br.error || '',
            };
        }
    });

    if (dataToExport.length === 0) {
        alert("No data to export.");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Route Results");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};
