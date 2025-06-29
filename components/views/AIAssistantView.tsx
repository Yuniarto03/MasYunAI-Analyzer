import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Panel } from '../Panel';
import { IconType, ChatMessage } from '../../types';
import { generateMultiFunctionalResponse } from '../../services/geminiService';
import { marked } from 'marked';

// --- Helper Functions & Types ---
type UploadedFile = {
    file: File;
    type: 'image' | 'text' | 'other';
    preview: string | null; // dataURL for images, text content for text, null for other
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
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const FileIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-3.343-3.343A1 1 0 0011.657 4H4zm7 2.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0111 4.75z" clipRule="evenodd" /></svg>;
const ImageIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 00-1.06 0l-3.22 3.22zM4.5 6a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" /></svg>;
const TextFileIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-3.343-3.343A1 1 0 0011.657 4H4zm3.75 3.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM7 9.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 017 9.5zm0 2.5a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;


export const AIAssistantView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [selectedFileIndices, setSelectedFileIndices] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (!process.env.API_KEY) {
            setError("API Key not configured. AI Assistant is disabled.");
        } else {
             setMessages([{ id: 'init', sender: 'ai', text: "Welcome to the AI Assistant. How can I help you analyze, create, or transform your data today? You can upload files on the left and ask me to process them.", timestamp: new Date() }]);
        }
    }, []);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setError(null);
        if (fileRejections.length > 0) {
            setError(`File rejected: ${fileRejections[0].errors[0].message}. Max size is 20MB.`);
            return;
        }

        acceptedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                let type: UploadedFile['type'] = 'other';
                let preview: string | null = null;

                if (file.type.startsWith('image/')) {
                    type = 'image';
                    preview = result;
                } else if (file.type.startsWith('text/')) {
                    type = 'text';
                    preview = result;
                }
                
                setUploadedFiles(prev => [...prev, { file, type, preview }]);
            };
            reader.onerror = () => setError(`Failed to read file: ${file.name}`);

            if (file.type.startsWith('image/')) reader.readAsDataURL(file);
            else if (file.type.startsWith('text/')) reader.readAsText(file);
            else setUploadedFiles(prev => [...prev, { file, type: 'other', preview: null }]);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 20 * 1024 * 1024, // 20 MB
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

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        const userInputText = input;
        setInput('');
        
        const newUserMessage: ChatMessage = { id: Date.now().toString(), text: userInputText, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setError(null);
        
        try {
            const filesToSend: { name: string; mimeType: string; data: string; }[] = [];
            for(const index of selectedFileIndices) {
                const uploadedFile = uploadedFiles[index];
                const b64Data = await readFileAsB64(uploadedFile.file);
                filesToSend.push({ name: uploadedFile.file.name, mimeType: uploadedFile.file.type || 'application/octet-stream', data: b64Data });
            }

            const result = await generateMultiFunctionalResponse(userInputText, filesToSend);
            
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
    }, [input, isLoading, uploadedFiles, selectedFileIndices]);
    
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

    const getFileIcon = (type: UploadedFile['type']) => {
        switch(type) {
            case 'image': return <ImageIcon className="w-8 h-8 text-fuchsia-400" />;
            case 'text': return <TextFileIcon className="w-8 h-8 text-sky-400" />;
            default: return <FileIcon className="w-8 h-8 text-gray-400" />;
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            {/* Left Panel: File Management */}
            <div className="w-full md:w-1/3 xl:w-1/4 flex-shrink-0">
                <Panel title="File Context" className="h-full flex flex-col">
                    <div {...getRootProps()} className={`dropzone-holographic p-6 rounded-lg text-center cursor-pointer mb-4 ${isDragActive ? 'active' : ''}`}>
                        <input {...getInputProps()} />
                        <p className="text-sm text-gray-400">Drag & drop files here, or click to select</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 text-center">Select files to include in your next prompt.</p>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                        {uploadedFiles.map((uf, index) => (
                             <div 
                                 key={index}
                                 onClick={() => handleToggleFileSelection(index)}
                                 className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-all duration-200 border-2 ${selectedFileIndices.has(index) ? 'border-teal-500 bg-teal-900/40' : 'border-transparent bg-gray-700/50 hover:bg-gray-700'}`}
                             >
                                <div className="flex-shrink-0">{getFileIcon(uf.type)}</div>
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-sm font-medium text-gray-200 truncate">{uf.file.name}</p>
                                    <p className="text-xs text-gray-400">{formatBytes(uf.file.size)} - {uf.file.type}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-red-500/50 flex-shrink-0"><CloseIcon className="w-4 h-4" /></button>
                             </div>
                        ))}
                         {uploadedFiles.length === 0 && <p className="text-sm text-gray-500 text-center pt-10">No files uploaded.</p>}
                    </div>
                </Panel>
            </div>

            {/* Right Panel: Chat Interface */}
            <div className="w-full md:w-2/3 xl:w-3/4 flex-shrink-1">
                <Panel title="AI Assistant" className="h-full flex flex-col">
                    {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-lg mb-4">{error}</div>}
                    <div className="flex-grow overflow-y-auto pr-4 space-y-6">
                        {messages.map((msg) => (
                             <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && <div className="w-8 h-8 bg-purple-500/50 rounded-full flex-shrink-0 mt-1"></div>}
                                <div className={`max-w-[85%] p-4 rounded-xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
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
                               <div className="w-8 h-8 bg-purple-500/50 rounded-full flex-shrink-0 mt-1"></div>
                               <div className="max-w-[85%] p-4 rounded-xl bg-gray-700 text-gray-200 rounded-bl-none">
                                   <div className="flex items-center space-x-2">
                                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                                       <span className="text-sm text-gray-400">AI is thinking...</span>
                                   </div>
                               </div>
                            </div>
                         )}
                        <div ref={chatEndRef}></div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-700">
                        <div className="flex items-center space-x-3 bg-gray-700/50 p-2 rounded-lg border border-transparent focus-within:border-teal-500 transition-colors">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Ask the AI to analyze files, generate code, create documents..."
                                className="flex-1 p-2 bg-transparent text-gray-200 focus:outline-none placeholder-gray-500 resize-none"
                                rows={2}
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
};
