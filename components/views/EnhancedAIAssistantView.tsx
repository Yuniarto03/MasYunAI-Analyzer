import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Panel } from '../Panel';
import { IconType, ChatMessage } from '../../types';
import { generateMultiFunctionalResponse, analyzeTextWithGemini } from '../../services/geminiService';
import { marked } from 'marked';
import * as XLSX from 'xlsx';

// Enhanced Icons
const SendIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const FileIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-3.343-3.343A1 1 0 0011.657 4H4zm7 2.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0111 4.75z" clipRule="evenodd" /></svg>;
const ImageIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 00-1.06 0l-3.22 3.22zM4.5 6a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" /></svg>;
const BrainIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const CodeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>;
const AnalyzeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;

// Enhanced file type detection
type UploadedFile = {
    file: File;
    type: 'image' | 'text' | 'spreadsheet' | 'code' | 'other';
    preview: string | null;
    analysis?: string;
};

// AI Assistant Templates
const AI_TEMPLATES = [
    {
        id: 'data-analysis',
        name: 'Data Analysis',
        icon: AnalyzeIcon,
        prompt: 'Analyze the uploaded data and provide insights about patterns, trends, and anomalies. Include statistical summaries and recommendations.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'code-review',
        name: 'Code Review',
        icon: CodeIcon,
        prompt: 'Review the uploaded code for best practices, potential bugs, performance issues, and suggest improvements.',
        color: 'from-green-500 to-emerald-500'
    },
    {
        id: 'document-summary',
        name: 'Document Summary',
        icon: FileIcon,
        prompt: 'Summarize the key points from the uploaded document and extract the most important information.',
        color: 'from-purple-500 to-violet-500'
    },
    {
        id: 'creative-writing',
        name: 'Creative Assistant',
        icon: BrainIcon,
        prompt: 'Help me with creative writing, brainstorming ideas, or improving existing content.',
        color: 'from-pink-500 to-rose-500'
    }
];

const initialMessage: ChatMessage = { 
    id: 'init', 
    sender: 'ai', 
    text: "🚀 **Enhanced AI Assistant Ready!** I can help you with data analysis, code review, document processing, creative writing, and much more. Upload files or ask me anything!", 
    timestamp: new Date() 
};

export const EnhancedAIAssistantView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [selectedFileIndices, setSelectedFileIndices] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
    const [conversationMode, setConversationMode] = useState<'chat' | 'analysis' | 'creative'>('chat');
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
            textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [input]);

    // Enhanced file processing
    const processFile = async (file: File): Promise<UploadedFile> => {
        let type: UploadedFile['type'] = 'other';
        let preview: string | null = null;
        
        if (file.type.startsWith('image/')) {
            type = 'image';
            preview = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
        } else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            type = 'text';
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
            type = 'spreadsheet';
        } else if (file.name.match(/\.(js|ts|py|java|cpp|c|html|css|json)$/)) {
            type = 'code';
        }
        
        return { file, type, preview };
    };

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setError(null);
        if (fileRejections.length > 0) {
            setError(`File rejected: ${fileRejections[0].errors[0].message}. Max size is 20MB.`);
            return;
        }

        for (const file of acceptedFiles) {
            const processedFile = await processFile(file);
            setUploadedFiles(prev => [...prev, processedFile]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 20 * 1024 * 1024, // 20 MB
        accept: {
            'image/*': ['.jpeg', '.png', '.gif', '.webp', '.bmp'],
            'text/*': ['.txt', '.csv', '.json', '.md', '.py', '.js', '.html', '.css'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        }
    });

    const handleTemplateSelect = (template: typeof AI_TEMPLATES[0]) => {
        setActiveTemplate(template.id);
        setInput(template.prompt);
        setConversationMode(template.id.includes('analysis') ? 'analysis' : 
                           template.id.includes('creative') ? 'creative' : 'chat');
    };

    const handleSend = useCallback(async (promptToSend: string) => {
        if ((!promptToSend.trim() && selectedFileIndices.size === 0) || isLoading) return;

        const userMessageText = promptToSend.trim();
        const selectedFiles = Array.from(selectedFileIndices).map(i => uploadedFiles[i]);
        
        // Enhanced user message with file context
        let displayText = userMessageText;
        if (selectedFiles.length > 0) {
            displayText += `\n\n📎 Attached: ${selectedFiles.map(f => f.file.name).join(', ')}`;
        }

        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            text: displayText,
            sender: 'user',
            timestamp: new Date(),
            imageUrl: selectedFiles.find(f => f.type === 'image')?.preview || undefined,
        };
        
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // Enhanced context building
            let enhancedPrompt = userMessageText;
            
            if (conversationMode === 'analysis') {
                enhancedPrompt = `[DATA ANALYSIS MODE] ${enhancedPrompt}`;
            } else if (conversationMode === 'creative') {
                enhancedPrompt = `[CREATIVE MODE] ${enhancedPrompt}`;
            }

            // Process files for AI
            const imageFilesToSend: { name: string; mimeType: string; data: string; }[] = [];
            
            for (const uploadedFile of selectedFiles) {
                const file = uploadedFile.file;
                
                if (uploadedFile.type === 'image' && uploadedFile.preview) {
                    const base64Data = uploadedFile.preview.split(',')[1];
                    imageFilesToSend.push({ 
                        name: file.name, 
                        mimeType: file.type, 
                        data: base64Data 
                    });
                } else if (uploadedFile.type === 'text' || uploadedFile.type === 'code') {
                    const textContent = await file.text();
                    enhancedPrompt += `\n\n[File: ${file.name}]\n${textContent}`;
                } else if (uploadedFile.type === 'spreadsheet') {
                    const arrayBuffer = await file.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    if (firstSheetName) {
                        const worksheet = workbook.Sheets[firstSheetName];
                        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
                        enhancedPrompt += `\n\n[Spreadsheet: ${file.name}]\n${csvContent.slice(0, 5000)}${csvContent.length > 5000 ? '...(truncated)' : ''}`;
                    }
                }
            }

            const result = await generateMultiFunctionalResponse(enhancedPrompt, imageFilesToSend);
            
            const aiMessage: ChatMessage = { 
                id: (Date.now() + 1).toString(), 
                text: result.content, 
                sender: 'ai', 
                timestamp: new Date() 
            };
            
            if (result.isDownloadable) {
                aiMessage.outputFile = { 
                    filename: result.filename, 
                    content: result.content, 
                    mimeType: result.mimeType 
                };
                aiMessage.text = `✅ **File Generated Successfully!**\n\nI've created \`${result.filename}\` for you. Click the download button below to save it.`;
            }

            setMessages(prev => [...prev, aiMessage]);

        } catch (e: any) {
            setError(`AI Error: ${e.message}`);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `❌ **Error**: ${e.message}`,
                sender: 'ai',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            setSelectedFileIndices(new Set());
            setActiveTemplate(null);
        }
    }, [isLoading, uploadedFiles, selectedFileIndices, conversationMode]);

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

    const getFileIcon = (file: UploadedFile) => {
        switch (file.type) {
            case 'image': return <ImageIcon className="w-8 h-8 text-purple-400" />;
            case 'code': return <CodeIcon className="w-8 h-8 text-green-400" />;
            case 'spreadsheet': return <AnalyzeIcon className="w-8 h-8 text-blue-400" />;
            case 'text': return <FileIcon className="w-8 h-8 text-yellow-400" />;
            default: return <FileIcon className="w-8 h-8 text-gray-400" />;
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            {/* Enhanced Left Panel */}
            <div className="w-full md:w-1/3 xl:w-1/4 flex-shrink-0 space-y-4">
                {/* AI Templates */}
                <Panel>
                    <h3 className="text-lg font-semibold text-blue-300 mb-4">🤖 AI Templates</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {AI_TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template)}
                                className={`p-3 rounded-lg text-left transition-all duration-200 ${
                                    activeTemplate === template.id
                                        ? 'bg-gradient-to-r ' + template.color + ' text-white'
                                        : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <template.icon className="w-6 h-6" />
                                    <div>
                                        <div className="font-medium text-sm">{template.name}</div>
                                        <div className="text-xs opacity-80 mt-1">
                                            {template.prompt.slice(0, 50)}...
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </Panel>

                {/* Enhanced File Management */}
                <Panel>
                    <h3 className="text-lg font-semibold text-purple-300 mb-4">📁 File Context</h3>
                    
                    {/* Conversation Mode Selector */}
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Mode</label>
                        <select 
                            value={conversationMode} 
                            onChange={(e) => setConversationMode(e.target.value as any)}
                            className="w-full p-2 bg-gray-700 text-gray-200 rounded-md text-sm"
                        >
                            <option value="chat">💬 General Chat</option>
                            <option value="analysis">📊 Data Analysis</option>
                            <option value="creative">🎨 Creative Writing</option>
                        </select>
                    </div>

                    <div {...getRootProps()} className={`dropzone-holographic p-4 rounded-lg text-center cursor-pointer mb-4 ${isDragActive ? 'active' : ''}`}>
                        <input {...getInputProps()} />
                        <div className="text-sm text-gray-400">
                            {isDragActive ? "Drop files here..." : "Drag & drop files or click"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Images, documents, code, spreadsheets
                        </div>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {uploadedFiles.map((uf, index) => (
                            <div 
                                key={index}
                                onClick={() => {
                                    const newSelection = new Set(selectedFileIndices);
                                    if (newSelection.has(index)) {
                                        newSelection.delete(index);
                                    } else {
                                        newSelection.add(index);
                                    }
                                    setSelectedFileIndices(newSelection);
                                }}
                                className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all duration-200 border-2 ${
                                    selectedFileIndices.has(index) 
                                        ? 'border-purple-500 bg-purple-900/40' 
                                        : 'border-transparent bg-gray-700/50 hover:bg-gray-700'
                                }`}
                            >
                                <div className="flex-shrink-0">{getFileIcon(uf)}</div>
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-sm font-medium text-gray-200 truncate">{uf.file.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {formatBytes(uf.file.size)} • {uf.type}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                                        setSelectedFileIndices(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(index);
                                            return newSet;
                                        });
                                    }} 
                                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-red-500/50 flex-shrink-0"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {uploadedFiles.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-6">No files uploaded</p>
                        )}
                    </div>
                </Panel>
            </div>

            {/* Enhanced Chat Interface */}
            <div className="w-full md:w-2/3 xl:w-3/4 flex-shrink-1">
                <Panel className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                        <div>
                            <h2 className="text-xl font-semibold text-blue-300">🚀 Enhanced AI Assistant</h2>
                            <p className="text-sm text-gray-400">
                                Mode: {conversationMode === 'chat' ? '💬 General' : 
                                      conversationMode === 'analysis' ? '📊 Analysis' : '🎨 Creative'}
                                {selectedFileIndices.size > 0 && ` • ${selectedFileIndices.size} files selected`}
                            </p>
                        </div>
                        <button 
                            onClick={() => setMessages([initialMessage])} 
                            className="px-3 py-1.5 text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
                        >
                            Clear Chat
                        </button>
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-lg mb-4">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex-grow overflow-y-auto pr-4 space-y-4 mb-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex-shrink-0 mt-1 flex items-center justify-center">
                                        <BrainIcon className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] p-4 rounded-xl ${
                                    msg.sender === 'user' 
                                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-none' 
                                        : 'bg-gray-700/80 backdrop-blur-sm text-gray-200 rounded-bl-none border border-gray-600'
                                }`}>
                                    {msg.imageUrl && (
                                        <img src={msg.imageUrl} alt="Attachment" className="rounded-lg mb-3 max-h-48 w-auto" />
                                    )}
                                    <div 
                                        className="prose prose-sm prose-invert max-w-none" 
                                        dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
                                    />
                                    {msg.outputFile && (
                                        <button 
                                            onClick={() => handleDownload(msg.outputFile)} 
                                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                                        >
                                            <DownloadIcon className="w-4 h-4" /> 
                                            Download {msg.outputFile.filename}
                                        </button>
                                    )}
                                    <p className="text-xs opacity-70 mt-2 text-right">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex-shrink-0 mt-1 flex items-center justify-center text-white font-bold text-sm">
                                        U
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex items-start gap-3 justify-start">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex-shrink-0 mt-1 flex items-center justify-center">
                                    <BrainIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="max-w-[85%] p-4 rounded-xl bg-gray-700/80 backdrop-blur-sm text-gray-200 rounded-bl-none border border-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-0"></div>
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                        <span className="text-sm text-gray-400">AI is processing...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef}></div>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-end space-x-3 bg-gray-700/50 p-3 rounded-lg border border-gray-600 focus-within:border-purple-500 transition-colors">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { 
                                    if (e.key === 'Enter' && !e.shiftKey) { 
                                        e.preventDefault(); 
                                        handleSend(input); 
                                    } 
                                }}
                                placeholder={`Ask me anything${selectedFileIndices.size > 0 ? ' about your files' : ''}...`}
                                className="flex-1 p-2 bg-transparent text-gray-200 focus:outline-none placeholder-gray-500 resize-none overflow-y-auto"
                                rows={1}
                                style={{ maxHeight: '120px' }}
                                disabled={isLoading}
                            />
                            <button 
                                onClick={() => { handleSend(input); }} 
                                disabled={isLoading || (!input.trim() && selectedFileIndices.size === 0)} 
                                className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 self-end"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {selectedFileIndices.size > 0 && (
                            <div className="mt-2 text-xs text-gray-400">
                                💡 Tip: I can analyze, summarize, or help you work with your selected files
                            </div>
                        )}
                    </div>
                </Panel>
            </div>
        </div>
    );
};

export default EnhancedAIAssistantView;