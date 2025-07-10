import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Panel } from '../Panel';
import { IconType, ChatMessage } from '../../types';
import { generateMultiFunctionalResponse, generateQuantumAIResponse, extractTextFromPDF } from '../../services/geminiService';
import { marked } from 'marked';
import * as XLSX from 'xlsx';

// --- Helper Functions & Types ---
type UploadedFile = {
    file: File;
    type: 'image' | 'text' | 'pdf' | 'other';
    preview: string | null; // dataURL for images, null for others
    extractedText?: string; // For PDFs and other text files
};

const readFileAsB64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') return reject(new Error('Failed to read file as base64 string.'));
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- Icons ---
const SendIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const FileIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-3.343-3.343A1 1 0 0011.657 4H4zm7 2.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0111 4.75z" clipRule="evenodd" /></svg>;
const ImageIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 00-1.06 0l-3.22 3.22zM4.5 6a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" /></svg>;
const TextFileIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-3.343-3.343A1 1 0 0011.657 4H4zm3.75 3.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM7 9.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 017 9.5zm0 2.5a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;
const PDFIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-3.343-3.343A1 1 0 0011.657 4H4zm3 6a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const ClearChatIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const QuantumIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.473-1.473L12 18.75l1.938-.648a2.25 2.25 0 011.473-1.473L17.75 15l.648 1.938a2.25 2.25 0 011.473 1.473L22.5 18.75l-1.938.648a2.25 2.25 0 01-1.473 1.473z" /></svg>;
const BrainIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5" /></svg>;

const initialMessage: ChatMessage = { 
    id: 'init', 
    sender: 'ai', 
    text: "Welcome to the Enhanced AI Assistant with Quantum-Level Capabilities! 🚀\n\nI can now:\n- 📄 **Process PDF documents** with advanced text extraction\n- 🧠 **Quantum AI Analysis** for complex problem solving\n- 🔬 **Multi-dimensional reasoning** across various domains\n- 🌐 **Real-time web search** for current information\n- 🖼️ **Advanced image analysis** and generation\n\nUpload files (PDF, images, text) and ask me anything!", 
    timestamp: new Date() 
};

// Quantum AI Modes
const QUANTUM_MODES = [
    { id: 'creative', name: 'Creative Synthesis', icon: '🎨', description: 'Generate innovative solutions and creative content' },
    { id: 'analytical', name: 'Deep Analysis', icon: '🔬', description: 'Perform comprehensive data analysis and insights' },
    { id: 'strategic', name: 'Strategic Planning', icon: '🎯', description: 'Strategic thinking and long-term planning' },
    { id: 'research', name: 'Research Mode', icon: '📚', description: 'Academic research and fact-finding' },
    { id: 'problem-solving', name: 'Problem Solver', icon: '🧩', description: 'Complex problem decomposition and solutions' },
    { id: 'predictive', name: 'Predictive Analysis', icon: '🔮', description: 'Trend analysis and future predictions' }
];

export const AIAssistantView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [aiCommand, setAiCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [selectedFileIndices, setSelectedFileIndices] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [isQuantumMode, setIsQuantumMode] = useState(false);
    const [selectedQuantumMode, setSelectedQuantumMode] = useState(QUANTUM_MODES[0]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (!process.env.API_KEY) {
            setError("API Key not configured. AI Assistant is disabled.");
        }
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null);
        setIsProcessingFile(true);

        for (const file of acceptedFiles) {
            let type: UploadedFile['type'] = 'other';
            let extractedText: string | undefined;
            
            if (file.type.startsWith('image/')) {
                type = 'image';
            } else if (file.type.startsWith('text/')) {
                type = 'text';
            } else if (file.type === 'application/pdf') {
                type = 'pdf';
                try {
                    extractedText = await extractTextFromPDF(file);
                } catch (error) {
                    console.error('Error extracting PDF text:', error);
                    setError(`Failed to extract text from PDF: ${file.name}`);
                    continue;
                }
            }
            
            if (type === 'image') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setUploadedFiles(prev => [...prev, { file, type, preview: e.target?.result as string }]);
                };
                reader.readAsDataURL(file);
            } else {
                setUploadedFiles(prev => [...prev, { file, type, preview: null, extractedText }]);
            }
        }
        
        setIsProcessingFile(false);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 50 * 1024 * 1024, // 50 MB
        accept: {
            'image/*': ['.jpeg', '.png', '.gif', '.webp', '.bmp'],
            'text/*': ['.txt', '.csv', '.json', '.md', '.py', '.js', '.html', '.css'],
            'application/pdf': ['.pdf'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        }
    });

    const handleRemoveFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setSelectedFileIndices(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    };
    
    const handleToggleFileSelection = (index: number) => {
        setSelectedFileIndices(prev => {
            const newSet = new Set(prev);
            if(newSet.has(index)) newSet.delete(index);
            else newSet.add(index);
            return newSet;
        });
    };

    const handleSend = useCallback(async (promptToSend: string) => {
        if ((!promptToSend.trim() && selectedFileIndices.size === 0) || isLoading) return;

        // Find first selected image for UI preview in user's message
        let previewUrl: string | undefined = undefined;
        for (const index of selectedFileIndices) {
            const uf = uploadedFiles[index];
            if (uf.type === 'image' && uf.preview) {
                previewUrl = uf.preview;
                break;
            }
        }
        
        const newUserMessage: ChatMessage = { 
            id: Date.now().toString(), 
            text: promptToSend, 
            sender: 'user', 
            timestamp: new Date(),
            imageUrl: previewUrl 
        };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setError(null);

        const readFileAsText = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
                reader.readAsText(file);
            });
        };
        
        try {
            const imageFilesToSend: { name: string; mimeType: string; data: string; }[] = [];
            let promptWithFileContext = promptToSend;

            for (const index of selectedFileIndices) {
                const uploadedFile = uploadedFiles[index];
                const file = uploadedFile.file;
                const fileExtension = file.name.split('.').pop()?.toLowerCase();

                if (uploadedFile.type === 'image') {
                    const b64Data = await readFileAsB64(file);
                    imageFilesToSend.push({ name: file.name, mimeType: file.type, data: b64Data });
                } else if (uploadedFile.type === 'text') {
                    const textContent = await readFileAsText(file);
                    promptWithFileContext = `[Content of file: ${file.name}]\n${textContent}\n\n` + promptWithFileContext;
                } else if (uploadedFile.type === 'pdf' && uploadedFile.extractedText) {
                    promptWithFileContext = `[Content of PDF file: ${file.name}]\n${uploadedFile.extractedText}\n\n` + promptWithFileContext;
                } else if (['xlsx', 'xls', 'xlsb'].includes(fileExtension || '')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    if (firstSheetName) {
                        const worksheet = workbook.Sheets[firstSheetName];
                        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
                        promptWithFileContext = `[Content of file: ${file.name} (first sheet, converted to CSV)]\n${csvContent}\n\n` + promptWithFileContext;
                    } else {
                        promptWithFileContext = `[File attached: ${file.name} (This Excel file seems to be empty)]\n\n` + promptWithFileContext;
                    }
                } else {
                    promptWithFileContext = `[File attached: ${file.name}]\n\n` + promptWithFileContext;
                }
            }

            let result;
            if (isQuantumMode) {
                result = await generateQuantumAIResponse(promptWithFileContext, selectedQuantumMode.id, imageFilesToSend);
            } else {
                result = await generateMultiFunctionalResponse(promptWithFileContext, imageFilesToSend);
            }
            
            const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: result.content, sender: 'ai', timestamp: new Date() };
            if(result.isDownloadable) {
                aiMessage.outputFile = { filename: result.filename, content: result.content, mimeType: result.mimeType };
                aiMessage.text = `I have generated the file \`${result.filename}\`. You can download it now.`;
            }

            setMessages(prev => [...prev, aiMessage]);

        } catch (e: any) {
            setError(`An error occurred while communicating with the AI: ${e.message}`);
        } finally {
            setIsLoading(false);
            setSelectedFileIndices(new Set()); // Clear selection after sending
        }
    }, [input, isLoading, uploadedFiles, selectedFileIndices, isQuantumMode, selectedQuantumMode]);
    
    const handleDownload = (file: ChatMessage['outputFile']) => {
        if (!file) return;
        const blob = new Blob([file.content], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearChat = () => {
        setMessages([initialMessage]);
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-fuchsia-400" />;
        if (file.type.startsWith('text/')) return <TextFileIcon className="w-8 h-8 text-sky-400" />;
        if (file.type === 'application/pdf') return <PDFIcon className="w-8 h-8 text-red-400" />;
        return <FileIcon className="w-8 h-8 text-gray-400" />;
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            {/* Left Panel: File Management & Quantum Controls */}
            <div className="w-full md:w-1/3 xl:w-1/4 flex-shrink-0">
                <Panel className="h-full flex flex-col">
                    <h2 className="text-xl font-semibold text-blue-300 mb-4 pb-2 border-b border-blue-400/20">AI Control Center</h2>
                    
                    {/* Quantum Mode Toggle */}
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-purple-300">
                                <QuantumIcon className="w-5 h-5" />
                                Quantum AI Mode
                            </label>
                            <button
                                onClick={() => setIsQuantumMode(!isQuantumMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    isQuantumMode ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isQuantumMode ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                        {isQuantumMode && (
                            <select
                                value={selectedQuantumMode.id}
                                onChange={(e) => setSelectedQuantumMode(QUANTUM_MODES.find(m => m.id === e.target.value) || QUANTUM_MODES[0])}
                                className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                                {QUANTUM_MODES.map(mode => (
                                    <option key={mode.id} value={mode.id}>
                                        {mode.icon} {mode.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {isQuantumMode && (
                            <p className="text-xs text-purple-200 mt-1">{selectedQuantumMode.description}</p>
                        )}
                    </div>

                    {/* File Upload Area */}
                    <div {...getRootProps()} className={`dropzone-holographic p-6 rounded-lg text-center cursor-pointer mb-4 ${isDragActive ? 'active' : ''}`}>
                        <input {...getInputProps()} />
                        <p className="text-sm text-gray-400">
                            {isProcessingFile ? 'Processing files...' : 'Drag & drop files here, or click to select'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Supports: Images, PDF, Text, Excel (Max 50MB)
                        </p>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2 text-center">Select files to include in your next prompt.</p>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                        {uploadedFiles.map((uf, index) => (
                             <div 
                                 key={index}
                                 onClick={() => handleToggleFileSelection(index)}
                                 className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-all duration-200 border-2 ${selectedFileIndices.has(index) ? 'border-teal-500 bg-teal-900/40' : 'border-transparent bg-gray-700/50 hover:bg-gray-700'}`}
                             >
                                <div className="flex-shrink-0">{getFileIcon(uf.file)}</div>
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-sm font-medium text-gray-200 truncate">{uf.file.name}</p>
                                    <p className="text-xs text-gray-400">{formatBytes(uf.file.size)} - {uf.file.type || 'unknown'}</p>
                                    {uf.extractedText && (
                                        <p className="text-xs text-green-400">✓ Text extracted</p>
                                    )}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-red-500/50 flex-shrink-0"><CloseIcon className="w-4 h-4" /></button>
                             </div>
                        ))}
                         {uploadedFiles.length === 0 && <p className="text-sm text-gray-500 text-center pt-10">No files uploaded.</p>}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-700/50">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Quick AI Command</label>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="text"
                                value={aiCommand}
                                onChange={e => setAiCommand(e.target.value)}
                                placeholder="e.g., 'Analyze this document'"
                                className="flex-1 p-2 bg-gray-900/70 text-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <button
                                onClick={() => { handleSend(aiCommand); setAiCommand(''); }}
                                disabled={isLoading || !aiCommand.trim()}
                                className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                                {isQuantumMode ? <QuantumIcon className="w-4 h-4" /> : <BrainIcon className="w-4 h-4" />}
                                Generate
                            </button>
                        </div>
                    </div>
                </Panel>
            </div>

            {/* Right Panel: Chat Interface */}
            <div className="w-full md:w-2/3 xl:w-3/4 flex-shrink-1">
                <Panel className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-blue-400/20">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-blue-300">Enhanced AI Assistant</h2>
                            {isQuantumMode && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 rounded-full border border-purple-500/30">
                                    <QuantumIcon className="w-4 h-4 text-purple-300" />
                                    <span className="text-xs text-purple-300 font-medium">Quantum Mode</span>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleClearChat} 
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
                        >
                            <ClearChatIcon className="w-4 h-4"/>
                            Clear Chat
                        </button>
                    </div>
                    
                    {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-lg mb-4">{error}</div>}
                    
                    <div className="flex-grow overflow-y-auto pr-4 space-y-6">
                        {messages.map((msg) => (
                             <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && (
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 mt-1 flex items-center justify-center ${
                                        isQuantumMode ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-purple-500/50'
                                    }`}>
                                        {isQuantumMode ? <QuantumIcon className="w-4 h-4 text-white" /> : <BrainIcon className="w-4 h-4 text-white" />}
                                    </div>
                                )}
                                <div className={`max-w-[85%] p-4 rounded-xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                    {msg.imageUrl && (
                                        <img src={msg.imageUrl} alt="User attachment" className="rounded-lg mb-2 max-h-48 w-auto" />
                                    )}
                                    <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}/>
                                    {msg.outputFile && (
                                        <button onClick={() => handleDownload(msg.outputFile)} className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors">
                                            <DownloadIcon className="w-4 h-4" /> Download {msg.outputFile.filename}
                                        </button>
                                    )}
                                </div>
                                {msg.sender === 'user' && <div className="w-8 h-8 bg-blue-500/50 rounded-full flex-shrink-0 mt-1"></div>}
                             </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-start gap-3 justify-start">
                               <div className={`w-8 h-8 rounded-full flex-shrink-0 mt-1 flex items-center justify-center ${
                                   isQuantumMode ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-purple-500/50'
                               }`}>
                                   {isQuantumMode ? <QuantumIcon className="w-4 h-4 text-white animate-spin" /> : <BrainIcon className="w-4 h-4 text-white" />}
                               </div>
                               <div className="max-w-[85%] p-4 rounded-xl bg-gray-700 text-gray-200 rounded-bl-none">
                                   <div className="flex items-center space-x-2">
                                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                                       <span className="text-sm text-gray-400">
                                           {isQuantumMode ? `${selectedQuantumMode.name} processing...` : 'AI is thinking...'}
                                       </span>
                                   </div>
                               </div>
                            </div>
                         )}
                        <div ref={chatEndRef}></div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-700/50">
                        <div className={`flex items-end space-x-3 p-2 rounded-lg border transition-colors ${
                            isQuantumMode 
                                ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 focus-within:border-purple-400' 
                                : 'bg-gray-700/50 border-transparent focus-within:border-teal-500'
                        }`}>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); setInput(''); } }}
                                placeholder={isQuantumMode 
                                    ? `Ask the Quantum AI to ${selectedQuantumMode.name.toLowerCase()}...` 
                                    : "Ask the AI to analyze files, generate code, create documents..."
                                }
                                className="flex-1 p-2 bg-transparent text-gray-200 focus:outline-none placeholder-gray-500 resize-none overflow-y-hidden"
                                rows={1}
                                style={{ maxHeight: '160px' }}
                                disabled={isLoading}
                            />
                            <button 
                                onClick={() => { handleSend(input); setInput(''); }} 
                                disabled={isLoading || (!input.trim() && selectedFileIndices.size === 0)} 
                                className={`p-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end ${
                                    isQuantumMode 
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500' 
                                        : 'bg-teal-600 hover:bg-teal-500'
                                }`}
                            >
                                {isQuantumMode ? <QuantumIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
};