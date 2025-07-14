import React, { useState, useCallback, useContext, useRef } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import * as XLSX from 'xlsx'; 
import { DataContext } from '../../contexts/DataContext';
import { TableRow, Theme, AiOutputTypeHint, CombinedAiOutput, AiDocumentResponse, IconType } from '../../types';
import { analyzeDocument } from '../../services/geminiService';
import { 
  downloadTextFile, exportTableToExcel, exportTableToCSV, exportTableToJson, downloadImage, downloadDocx, downloadPdf, downloadPptx 
} from '../../services/DataProcessingService';
import { UploadCloud, FileText, Brain, AlertTriangle, Image as ImageIcon, Table2, ChevronDown, ChevronUp, Download as DownloadIcon, FileSpreadsheet, Type, PictureInPicture, FileJson, FileArchive } from 'lucide-react';
import { RAW_COLOR_VALUES } from '../../constants';
import { marked } from 'marked';

// --- Local Helper Components ---

const LoadingSpinner: React.FC<{ text?: string; size?: 'sm' | 'md' | 'lg' }> = ({ text, size = 'md' }) => {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-t-transparent border-purple-500 rounded-full animate-spin`}></div>
      {text && <span className="text-purple-300 animate-pulse">{text}</span>}
    </div>
  );
};

const Button: React.FC<{
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean; isLoading?: boolean; leftIcon?: React.ReactNode; className?: string;
  ['aria-label']?: string;
}> = ({ children, onClick, variant = 'primary', size = 'md', disabled, isLoading, leftIcon, className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white focus:ring-blue-400',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500',
  };
   const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${className}`} {...props}>
      {isLoading ? <LoadingSpinner size="sm" /> : leftIcon}
      {children}
    </button>
  );
};

const DataTableComponent: React.FC<{ data: TableRow[], headers: string[] }> = ({ data, headers }) => (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750 bg-opacity-50 sticky top-0 z-10">
                <tr>{headers.map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="bg-gray-800 bg-opacity-70 divide-y divide-gray-700">
                {data.map((row, i) => (<tr key={i} className="hover:bg-sky-500/10"><td colSpan={headers.length} className="px-4 py-2 text-xs text-gray-300">Row {i+1} data...</td></tr>))}
            </tbody>
        </table>
    </div>
);


const AiDocument: React.FC = () => {
  const { tableData, setTableData, fileHeaders, setFileHeaders } = useContext(DataContext);
  const [instruction, setInstruction] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<AiDocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputTypeHint, setOutputTypeHint] = useState<AiOutputTypeHint>('text');
  const [isInputConfigMinimized, setIsInputConfigMinimized] = useState<boolean>(false);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.heif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
  });

    const setProcessedData = (data: { fileName: string; data: TableRow[]; headers: string[] } | null, options: { isUserAction: boolean }) => {
        if (data) {
            setTableData(data.data);
            setFileHeaders(data.headers);
        } else {
            setTableData([]);
            setFileHeaders([]);
        }
    };


  const handleSubmit = async () => {
    if (!instruction.trim()) {
      setError("Please provide an instruction for the AI.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    let finalInstruction = instruction;
    let fileToSendToService: File | undefined = selectedFile || undefined;

    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      try {
        const reader = new FileReader();
        const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onload = (event) => resolve(event.target?.result as ArrayBuffer);
          reader.onerror = (error) => reject(error);
          reader.readAsArrayBuffer(selectedFile);
        });
        
        const workbook = XLSX.read(fileData, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error("The Excel file contains no sheets.");
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        const excelContentString = JSON.stringify(jsonData, null, 2);
        const MAX_EXCEL_CONTENT_LENGTH = 15000; 
        let truncatedNotice = "";
        let contentToSend = excelContentString;

        if (excelContentString.length > MAX_EXCEL_CONTENT_LENGTH) {
          contentToSend = excelContentString.substring(0, MAX_EXCEL_CONTENT_LENGTH) + "\n... (content truncated due to length)";
          truncatedNotice = " (Note: Excel content was truncated due to its length. Analysis will be based on the initial part of the data.)";
        }
        
        finalInstruction = `The user uploaded an Excel file named '${selectedFile.name}'. Its content (from the first sheet, '${firstSheetName}'${truncatedNotice}) is provided below in JSON format. Please use this data to respond to the user's instruction.

Excel Content (JSON from first sheet):
\`\`\`json
${contentToSend}
\`\`\`

User's original instruction:
${instruction}`;
        
        fileToSendToService = undefined; 

      } catch (excelError: any) {
        console.error("Error processing Excel file:", excelError);
        setError(`Failed to process Excel file: ${excelError.message}. Please ensure it's a valid Excel file.`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await analyzeDocument(finalInstruction, fileToSendToService, outputTypeHint);
      setAiResponse({...response, originalUserHint: outputTypeHint}); 
      if (response.type === 'error') {
        setError(response.content as string);
      } else if ((response.type === 'table' || (response.type === 'combined' && (response.content as CombinedAiOutput).tablePart)) && response.content) {
          const tableData = response.type === 'table' ? response.content as TableRow[] : (response.content as CombinedAiOutput).tablePart!;
          if (tableData && tableData.length > 0) {
              const headers = Object.keys(tableData[0]).filter(h => h !== '__ROW_ID__' && h !== 'calculatedColumnFormula');
              setProcessedData({
                  fileName: response.fileName || `ai_generated_data_${Date.now()}.json`,
                  data: tableData,
                  headers: headers,
              }, { isUserAction: false });
          } else if (response.type === 'table') { 
              setProcessedData(null, { isUserAction: false }); 
          }
      }
    } catch (e: any) {
      console.error("Error in AI Document Analysis:", e);
      setError(e.message || "An unexpected error occurred.");
      setAiResponse({ type: 'error', content: e.message, originalUserHint: outputTypeHint });
    } finally {
      setIsLoading(false);
    }
  };
  
  const outputTypeOptions: {value: AiOutputTypeHint, label: string, icon?: React.ElementType}[] = [
    { value: 'text', label: "Text (.txt)", icon: Type },
    { value: 'msword', label: "MS Word (.docx)", icon: FileText },
    { value: 'pdf', label: "PDF (.pdf)", icon: FileText },
    { value: 'pptx', label: "PPT (.pptx)", icon: FileArchive },
    { value: 'json', label: "JSON (for table data)", icon: FileJson },
    { value: 'xlsx', label: "Excel (.xlsx, for table data)", icon: FileSpreadsheet },
    { value: 'png', label: "Image (.png)", icon: ImageIcon },
    { value: 'combined_text_table_image', label: "Combined (Text, Table, Image)", icon: FileArchive },
  ];

  const theme: Theme = {
    accent1: 'blue-400', accent2: 'purple-500', accent3: 'green-400', accent4: 'yellow-400',
    darkBg: 'gray-900', textColor: 'text-gray-200', cardBg: 'bg-gray-800/80 backdrop-blur-sm',
    borderColor: 'border-gray-700', darkGray: 'darkGray', mediumGray: 'mediumGray',
  };

  const getSharedSelectBaseStyles = (currentTheme: Theme) => ({
        baseClassName: 'p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border transition-colors',
        style: {
            backgroundColor: RAW_COLOR_VALUES[currentTheme.darkGray] || '#1f2937',
            color: RAW_COLOR_VALUES[(currentTheme.textColor || 'text-gray-200').replace('text-','')] || '#e5e7eb',
            borderColor: RAW_COLOR_VALUES[currentTheme.mediumGray] || '#4b5563'
        },
        optionStyle: {
            backgroundColor: RAW_COLOR_VALUES[currentTheme.darkGray] || '#1f2937',
            color: RAW_COLOR_VALUES[(currentTheme.textColor || 'text-gray-200').replace('text-','')] || '#e5e7eb'
        }
    });

  const selectStyles = getSharedSelectBaseStyles(theme); 
  const animationClass = 'animate-fade-in';
  const baseDownloadFileName = aiResponse?.fileName?.replace(/\.[^/.]+$/, "") || 'ai_output';

  return (
    <div className={`p-8 ${theme.textColor} futuristic-scrollbar overflow-auto h-full`}>
      <h1 className={`text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-${theme.accent1} to-${theme.accent2}`}>AI Document Analysis</h1>

      <div className={`grid grid-cols-1 gap-8`}>
        <div className={`${theme.cardBg} rounded-xl shadow-xl border ${theme.borderColor}`}>
          <div className={`flex justify-between items-center p-4 border-b ${theme.borderColor}`}>
            <h2 className={`text-2xl font-semibold text-${theme.accent3}`}>Input Configuration</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInputConfigMinimized(!isInputConfigMinimized)}
              className={`!p-1.5 hover:bg-gray-600/30`}
              aria-label={isInputConfigMinimized ? "Expand Input Configuration" : "Minimize Input Configuration"}
            >
              {isInputConfigMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </Button>
          </div>
          
          {!isInputConfigMinimized && (
            <div className={`p-6 ${animationClass}`}>
              <div className="mb-4">
                <label htmlFor="instruction" className="block text-sm font-medium mb-1">AI Instruction:</label>
                <textarea
                  id="instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g., Summarize this document, extract key entities, or generate a futuristic city image based on this description."
                  rows={4}
                  className={`w-full p-2 rounded-md border focus:ring-2 focus:ring-${theme.accent1} focus:border-${theme.accent1} transition-colors futuristic-scrollbar`}
                   style={{
                    backgroundColor: RAW_COLOR_VALUES[theme.darkGray],
                    color: RAW_COLOR_VALUES[theme.textColor.replace('text-','')],
                    borderColor: RAW_COLOR_VALUES[theme.mediumGray],
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Upload Document (Optional):</label>
                <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center ${theme.borderColor} hover:border-${theme.accent1} ${isDragActive ? `border-${theme.accent1} bg-${theme.accent1}/10` : ''}`}>
                  <input {...getInputProps()} />
                  <UploadCloud size={36} className={`mx-auto mb-2 ${isDragActive ? `text-${theme.accent1}` : `${theme.textColor.replace('text-','')}`} opacity-70`} />
                  {isDragActive ? (
                    <p className={`text-md font-semibold text-${theme.accent1}`}>Drop file here...</p>
                  ) : (
                    <p className="text-md">Drag & drop a file, or click to select</p>
                  )}
                </div>
                {selectedFile && (
                  <div className={`mt-3 flex items-center space-x-2 p-2 bg-gray-700/50 rounded-md`}>
                    <FileText size={20} className={`text-${theme.accent1}`} />
                    <span className="text-sm">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className={`ml-auto text-xs text-red-400 hover:text-red-300`}>Remove</button>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="outputType" className="block text-sm font-medium mb-1">Desired AI Output Hint:</label>
                <select id="outputType" value={outputTypeHint} onChange={(e) => setOutputTypeHint(e.target.value as AiOutputTypeHint)} className={`${selectStyles.baseClassName} w-full p-2`} style={selectStyles.style}>
                  {outputTypeOptions.map(opt => (<option key={opt.value} value={opt.value} style={selectStyles.optionStyle}>{opt.label}</option>))}
                </select>
                <p className="text-xs opacity-60 mt-1">This guides the AI on what to generate. Download options may vary.</p>
              </div>

              <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading || !instruction.trim()} variant="primary" className="w-full" leftIcon={<Brain size={18}/>}>
                {isLoading ? 'Analyzing...' : 'Process with AI'}
              </Button>
            </div>
          )}
        </div>

        <div className={`${theme.cardBg} rounded-xl shadow-xl border ${theme.borderColor} flex flex-col`}>
          <div className={`flex justify-between items-center p-4 border-b ${theme.borderColor}`}>
            <h2 className={`text-2xl font-semibold text-${theme.accent4}`}>AI Output</h2>
          </div>
          <div className={`p-6 flex-grow ${animationClass}`}>
            {isLoading && <div className="flex-grow flex items-center justify-center min-h-[200px]"><LoadingSpinner text="AI is thinking..." /></div>}
            {error && !isLoading && <div className={`my-4 p-4 rounded-lg bg-red-600/20 border border-red-500 text-red-300 flex items-center gap-3`}><AlertTriangle size={24} /><span>{error}</span></div>}
            {aiResponse && !isLoading && !error && (
              <div className="space-y-4">
                {aiResponse.type === 'text' && typeof aiResponse.content === 'string' && (<div><pre className={`whitespace-pre-wrap text-sm leading-relaxed p-3 rounded-md border max-h-[40vh] overflow-y-auto futuristic-scrollbar`} style={{backgroundColor: RAW_COLOR_VALUES[theme.darkGray] + 'BF', borderColor: RAW_COLOR_VALUES[theme.mediumGray], color: RAW_COLOR_VALUES[theme.textColor.replace('text-','')]}}>{aiResponse.content}</pre></div>)}
                {aiResponse.type === 'image' && typeof aiResponse.content === 'string' && (<div><img src={`data:image/png;base64,${aiResponse.content}`} alt={aiResponse.fileName || "Generated Image"} className={`max-w-full h-auto rounded-lg shadow-lg border ${theme.borderColor}`}/></div>)}
                {aiResponse.type === 'table' && Array.isArray(aiResponse.content) && (<div>{aiResponse.content.length > 0 ? (<div className="h-96 overflow-auto"><DataTableComponent data={tableData} headers={fileHeaders} /></div>) : (<p>AI generated an empty table or non-tabular data.</p>)}</div>)}
                {aiResponse.type === 'combined' && typeof aiResponse.content === 'object' && aiResponse.content !== null && (() => {
                    const combined = aiResponse.content as CombinedAiOutput;
                    return ( <>
                        {combined.textPart && <div dangerouslySetInnerHTML={{ __html: marked(combined.textPart) }} className="prose prose-invert max-w-none text-sm leading-relaxed p-3 rounded-md border" style={{backgroundColor: RAW_COLOR_VALUES[theme.darkGray] + 'BF', borderColor: RAW_COLOR_VALUES[theme.mediumGray]}}></div>}
                        {combined.tablePart && combined.tablePart.length > 0 && <div className="mt-4"><div className="h-96 overflow-auto"><DataTableComponent data={tableData} headers={fileHeaders} /></div></div>}
                        {combined.imagePart && <div className="mt-4"><img src={`data:image/png;base64,${combined.imagePart}`} alt={combined.imageDescription || "Generated image"} className={`max-w-md h-auto rounded-lg shadow-lg border ${theme.borderColor}`}/></div>}
                    </> );
                })()}

                <div className={`mt-6 pt-4 border-t ${theme.borderColor}`}>
                  <h4 className={`text-md font-semibold mb-3 text-${theme.accent4}`}>Download Options:</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiResponse.type === 'text' && typeof aiResponse.content === 'string' && (<><Button onClick={() => downloadTextFile(aiResponse.content as string, baseDownloadFileName, 'txt')} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>Text (.txt)</Button>{aiResponse.originalUserHint === 'msword' && <Button onClick={() => downloadDocx(aiResponse.content as string, baseDownloadFileName)} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>MS Word</Button>}{aiResponse.originalUserHint === 'pdf' && <Button onClick={() => downloadPdf(aiResponse.content as string, baseDownloadFileName)} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>PDF</Button>}{aiResponse.originalUserHint === 'pptx' && <Button onClick={() => downloadPptx(aiResponse.content as string, baseDownloadFileName, instruction)} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>PPT</Button>}</>)}
                    {aiResponse.type === 'table' && Array.isArray(aiResponse.content) && aiResponse.content.length > 0 && (<><Button onClick={() => exportTableToExcel(aiResponse.content as TableRow[], baseDownloadFileName, Object.keys((aiResponse.content as TableRow[])[0] || {}))} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>Excel</Button><Button onClick={() => exportTableToJson(aiResponse.content as TableRow[], baseDownloadFileName)} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>JSON</Button><Button onClick={() => exportTableToCSV(aiResponse.content as TableRow[], baseDownloadFileName, Object.keys((aiResponse.content as TableRow[])[0] || {}))} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>CSV</Button></>)}
                    {aiResponse.type === 'image' && typeof aiResponse.content === 'string' && (<Button onClick={() => downloadImage(aiResponse.content as string, baseDownloadFileName)} variant="secondary" size="sm" leftIcon={<DownloadIcon size={16}/>}>Image (.png)</Button>)}
                    {aiResponse.type === 'combined' && typeof aiResponse.content === 'object' && aiResponse.content !== null && ((aiResponse.content as CombinedAiOutput).textPart || ((aiResponse.content as CombinedAiOutput).tablePart && (aiResponse.content as CombinedAiOutput).tablePart!.length > 0) || (aiResponse.content as CombinedAiOutput).imagePart) && (<p className="text-sm opacity-70">Download individual parts from the sections above.</p>)}
                  </div>
                </div>
              </div>
            )}
            {!aiResponse && !isLoading && !error && (<div className="flex-grow flex items-center justify-center text-center opacity-50 min-h-[200px]"><p>AI Output will appear here after processing.</p></div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDocument;
