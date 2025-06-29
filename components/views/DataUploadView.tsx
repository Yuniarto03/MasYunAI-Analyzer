import React, { useCallback, useState, useContext, useEffect } from 'react';
import { Panel } from '../Panel';
import { useDropzone } from 'react-dropzone';
import { DataContext } from '../../contexts/DataContext';
import { TableRow, FileHeaders } from '../../types';
import * as XLSX from 'xlsx';

// Basic CSV Parser
const parseCSV = (csvText: string): { headers: FileHeaders; rows: TableRow[] } => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    const firstLine = lines[0].charCodeAt(0) === 0xFEFF ? lines[0].substring(1) : lines[0];
    
    // Improved CSV parsing to handle commas within quoted fields
    const headers: FileHeaders = [];
    let currentHeader = '';
    let inQuotes = false;
    for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            headers.push(currentHeader.trim().replace(/^"|"$/g, ''));
            currentHeader = '';
        } else {
            currentHeader += char;
        }
    }
    headers.push(currentHeader.trim().replace(/^"|"$/g, '')); // Add last header

    const rows: TableRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let currentValue = '';
        inQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, '')); // Add last value

        if (values.length === headers.length) {
            const row: TableRow = {};
            headers.forEach((header, index) => {
                const value = values[index];
                row[header] = isNaN(Number(value)) || value === '' ? value : Number(value);
            });
            rows.push(row);
        } else if (values.join('').trim() !== '') {
            console.warn(`Skipping malformed CSV line ${i + 1}: Expected ${headers.length} values, got ${values.length}`);
        }
    }
    return { headers, rows };
};

// Excel Parser for a specific sheet
const parseExcelSheet = (workbook: XLSX.WorkBook, sheetName: string): { headers: FileHeaders; rows: TableRow[] } => {
    if (!workbook.Sheets[sheetName]) {
        console.error(`Sheet "${sheetName}" not found in workbook.`);
        return { headers: [], rows: [] };
    }
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', rawNumbers: false });
    
    if (!rawData || rawData.length === 0) return { headers: [], rows: [] };

    const headers: FileHeaders = rawData[0] ? rawData[0].map(String) : [];
    const rows: TableRow[] = [];

    for (let i = 1; i < rawData.length; i++) {
        const rowValues = rawData[i];
        const row: TableRow = {};
        headers.forEach((header, index) => {
            const value = rowValues[index];
             // Attempt to convert to number if possible, otherwise keep as string/date
            if (value instanceof Date) {
                 row[header] = value;
            } else if (typeof value === 'number') {
                 row[header] = value;
            } else if (typeof value === 'string') {
                 row[header] = isNaN(Number(value)) || value.trim() === '' ? value : Number(value);
            } else if (typeof value === 'boolean') {
                row[header] = value;
            } else {
                 row[header] = String(value); // Fallback to string
            }
        });
        rows.push(row);
    }
    return { headers, rows };
};

// JSON Parser
const parseJSON = (jsonText: string): { headers: FileHeaders; rows: TableRow[] } => {
    const data = JSON.parse(jsonText);
    let jsonData: any[];

    if (Array.isArray(data)) {
        jsonData = data;
    } else if (typeof data === 'object' && data !== null) {
        // Attempt to find an array within the object if the root is not an array
        const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
        if (arrayKey) {
            jsonData = data[arrayKey];
        } else {
            throw new Error("JSON data is not an array and no array found in the first level of the object.");
        }
    } else {
        throw new Error("Unsupported JSON structure. Expected an array of objects or an object containing an array of objects.");
    }
    
    if (jsonData.length === 0) return { headers: [], rows: [] };
    
    const headers = Object.keys(jsonData[0]);
    const rows = jsonData.map(item => {
        const row: TableRow = {};
        headers.forEach(header => {
            const value = item[header];
            // Basic type preservation
            if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value instanceof Date) {
                row[header] = value;
            } else {
                row[header] = String(value); // Fallback for other types
            }
        });
        return row;
    });
    return { headers, rows };
};


export const DataUploadView: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { setTableData, setFileHeaders } = useContext(DataContext);
  const [isLoading, setIsLoading] = useState(false);

  const [excelWorkbook, setExcelWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');

  const resetState = (keepFeedback: boolean = false) => {
    setUploadedFile(null);
    setTableData([]);
    setFileHeaders([]);
    setExcelWorkbook(null);
    setAvailableSheets([]);
    setSelectedSheetName('');
    if (!keepFeedback) {
        setFeedback(null);
    }
  };

  const processAndLoadSheetData = (workbook: XLSX.WorkBook, sheetName: string, fileName: string) => {
    setIsLoading(true);
    setFeedback(`Processing sheet '${sheetName}' from '${fileName}'...`);
    // Simulate async processing for UI update
    setTimeout(() => {
        try {
          const { headers, rows } = parseExcelSheet(workbook, sheetName);
          if (headers.length === 0 || rows.length === 0) {
            setFeedback(`Warning: Parsed data is empty for sheet '${sheetName}' in '${fileName}'. The sheet might be empty or incorrectly formatted.`);
            setTableData([]);
            setFileHeaders([]);
          } else {
            setFileHeaders(headers);
            setTableData(rows);
            setFeedback(`Successfully loaded sheet '${sheetName}' from '${fileName}': ${rows.length} rows, ${headers.length} columns.`);
          }
        } catch (error) {
          console.error(`Error parsing sheet ${sheetName} from ${fileName}:`, error);
          setFeedback(`Error parsing sheet '${sheetName}': ${error instanceof Error ? error.message : "Unknown error"}.`);
          setTableData([]);
          setFileHeaders([]);
        } finally {
          setIsLoading(false);
        }
    }, 50);
  };
  
  useEffect(() => {
    if (excelWorkbook && selectedSheetName && uploadedFile) {
      processAndLoadSheetData(excelWorkbook, selectedSheetName, uploadedFile.name);
    }
  }, [selectedSheetName, excelWorkbook, uploadedFile]); // Keep dependencies as they were, processing logic handles it.

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      resetState(); 
      setUploadedFile(file);
      setIsLoading(true);
      setFeedback(`Processing '${file.name}'...`);

      const reader = new FileReader();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      reader.onload = (event) => {
        if (!event.target?.result) {
          setFeedback(`Error: File content is empty or unreadable for ${file.name}.`);
          setIsLoading(false);
          return;
        }
        const content = event.target.result;
        // Short delay for UI to update with "Processing..."
        setTimeout(() => {
            try {
              if (typeof content === 'string' && (file.type === 'text/csv' || fileExtension === 'csv')) {
                const { headers, rows } = parseCSV(content);
                if (headers.length === 0 || rows.length === 0) {
                  setFeedback(`Warning: Parsed CSV data is empty for '${file.name}'. File might be empty or incorrectly formatted.`);
                } else {
                  setFileHeaders(headers);
                  setTableData(rows);
                  setFeedback(`Successfully loaded CSV '${file.name}': ${rows.length} rows, ${headers.length} columns.`);
                }
              } else if (typeof content === 'string' && (file.type === 'application/json' || fileExtension === 'json')) {
                const { headers, rows } = parseJSON(content);
                if (headers.length === 0 || rows.length === 0) {
                  setFeedback(`Warning: Parsed JSON data is empty for '${file.name}'. File might be empty or incorrectly formatted.`);
                } else {
                  setFileHeaders(headers);
                  setTableData(rows);
                  setFeedback(`Successfully loaded JSON '${file.name}': ${rows.length} rows, ${headers.length} columns.`);
                }
              } else if (content instanceof ArrayBuffer && (fileExtension === 'xls' || fileExtension === 'xlsx' || fileExtension === 'xlsb')) {
                const data = new Uint8Array(content);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                setExcelWorkbook(workbook);
                const sheetNames = workbook.SheetNames;
                setAvailableSheets(sheetNames);
                if (sheetNames.length === 0) {
                  setFeedback(`Error: No sheets found in Excel file '${file.name}'.`);
                } else {
                  setSelectedSheetName('');
                  setFeedback(`Excel file '${file.name}' loaded. Please select a sheet to import.`);
                }
              } else {
                throw new Error("Unsupported file type or content format.");
              }
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                setFeedback(`Error processing ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}.`);
                resetState(true); // Keep the error feedback
            } finally {
              if (!(content instanceof ArrayBuffer && availableSheets.length > 0)) { 
                setIsLoading(false);
              }
            }
        }, 50); 
      };
      reader.onerror = () => {
          setFeedback(`Error reading file: ${file.name}.`);
          setIsLoading(false);
          resetState(true);
      };

      if (fileExtension === 'csv' || fileExtension === 'json') {
        reader.readAsText(file);
      } else if (fileExtension === 'xls' || fileExtension === 'xlsx' || fileExtension === 'xlsb') {
        reader.readAsArrayBuffer(file);
      } else {
        setFeedback("Invalid file type. Please upload a CSV, JSON, or Excel (xls, xlsx, xlsb) file.");
        setIsLoading(false);
        setUploadedFile(null); 
      }
    }
  }, [setTableData, setFileHeaders, availableSheets.length]); 

  const { getRootProps, getInputProps, isDragActive, isFileDialogActive } = useDropzone({ 
    onDrop, 
    accept: { 
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12': ['.xlsb']
    }, 
    multiple: false 
  });

  const removeFileAndData = () => {
    resetState();
    setFeedback("File removed and data cleared. Upload a new file.");
    setIsLoading(false);
  };
  
  const handleSheetSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSheetName(event.target.value);
    // Processing is handled by useEffect that watches selectedSheetName
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Upload Your Data</h1>
      <Panel title="Local File Upload (CSV, JSON, XLS, XLSX, XLSB)">
        <div 
          {...getRootProps()} 
          className={`dropzone-holographic p-10 rounded-lg text-center transition-all duration-300 ${
            isLoading ? 'cursor-wait' : 'cursor-pointer'
          } ${
            isDragActive || isFileDialogActive || isLoading ? 'active' : ''
          }`}
        >
          <input {...getInputProps()} disabled={isLoading} />
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3 shadow-lg shadow-fuchsia-500/50"></div>
              <p className="text-fuchsia-300">Processing file...</p>
            </div>
          ) : isDragActive ? (
            <p className="text-green-300 text-lg font-semibold animate-pulse">Drop the file here to engage...</p>
          ) : (
            <p className="text-gray-400">Drag 'n' drop a CSV, JSON, or Excel file here, or click to select</p>
          )}
        </div>
        
        {feedback && !isLoading && ( // Show feedback only when not loading, or if it's an error during load
          <p className={`mt-3 text-sm ${feedback.startsWith('Error') ? 'text-red-400' : (feedback.startsWith('Warning') ? 'text-yellow-400' : 'text-green-400')}`}>
            {feedback}
          </p>
        )}

        {uploadedFile && (
          <div className="mt-6">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-md mb-3">
                <span className="text-gray-300 font-semibold truncate max-w-xs sm:max-w-md md:max-w-lg" title={uploadedFile.name}>
                  Current File: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
                </span>
                <button 
                    onClick={removeFileAndData}
                    disabled={isLoading}
                    className="text-red-400 hover:text-red-300 text-sm font-medium py-1 px-2 rounded hover:bg-red-800 hover:bg-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Remove & Clear Data
                </button>
            </div>

            {availableSheets.length > 0 && (
              <div className="mt-4 p-3 bg-gray-700 bg-opacity-50 rounded-md">
                <label htmlFor="sheet-select" className="block text-sm font-medium text-gray-300 mb-1">Select Sheet:</label>
                <select 
                  id="sheet-select"
                  value={selectedSheetName} 
                  onChange={handleSheetSelection}
                  disabled={isLoading}
                  className="w-full p-2 bg-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="" disabled>-- Choose a sheet --</option>
                  {availableSheets.map(sheet => (
                    <option key={sheet} value={sheet}>{sheet}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </Panel>
      <Panel title="Connect Online Storage (Coming Soon)">
        <p className="text-gray-300 mb-4">Connect to your cloud storage providers to import data directly.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Google Drive', 'Dropbox', 'OneDrive', 'Amazon S3', 'BigQuery', 'Snowflake'].map(provider => (
                 <button 
                    key={provider} 
                    onClick={() => alert("Connecting to online storage is coming soon!")} 
                    title={`${provider} (Coming Soon)`}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-400 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2 cursor-not-allowed opacity-70"
                    disabled
                 >
                    <span className="w-5 h-5 bg-gray-600 rounded-sm inline-block"></span> 
                    <span>Connect to {provider}</span>
                 </button>
            ))}
        </div>
      </Panel>
    </div>
  );
};