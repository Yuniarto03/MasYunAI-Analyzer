
import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { ChatMessage, IconType } from '../../types';
import { generateMultiFunctionalResponse } from '../../services/geminiService';
import { marked } from 'marked';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import PptxGenJS from 'pptxgenjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Icons
const SendIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const PaperclipIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 0116.5 7.5c0 1.862-1.513 3.375-3.375 3.375S9.75 9.362 9.75 7.5c0-1.036.84-1.875 1.875-1.875s1.875.84 1.875 1.875v7.5A1.5 1.5 0 0112 18.75s-1.5-.672-1.5-1.5v-7.5c0-1.02.83-1.875 1.875-1.875a1.875 1.875 0 011.875 1.875v7.5c0 1.02-.83 1.875-1.875 1.875S10.5 17.02 10.5 16v-7.5" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

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

const handleDownload = (format: 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'image', rawContent: any, fileName: string) => {
    try {
        if (format === 'docx' && rawContent) {
            const doc = new Document({
                sections: [{
                    children: rawContent.map((p: {type: string, text: string}) => new Paragraph({
                        children: [new TextRun(p.text)],
                        heading: p.type === 'heading' ? HeadingLevel.HEADING_1 : undefined,
                    }))
                }]
            });
            Packer.toBlob(doc).then(blob => triggerDownload(blob, `${fileName}.docx`));
        } else if (format === 'xlsx' && rawContent) {
            const ws = XLSX.utils.json_to_sheet(rawContent);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        } else if (format === 'pptx' && rawContent) {
            let pres = new PptxGenJS();
            pres.layout = 'LAYOUT_WIDE';
            rawContent.forEach((slideData: {title: string, bullets: string[]}) => {
                let slide = pres.addSlide();
                slide.addText(slideData.title, { x: 0.5, y: 0.25, fontSize: 24, bold: true, color: '363636' });
                slide.addText(slideData.bullets.join('\n'), { x: 0.5, y: 1.5, fontSize: 18, bullet: true, color: '363636' });
            });
            pres.writeFile({ fileName: `${fileName}.pptx` });
        } else if (format === 'pdf' && rawContent) {
            const doc = new jsPDF();
            autoTable(doc, {
                head: [rawContent.headers],
                body: rawContent.rows,
            });
            doc.save(`${fileName}.pdf`);
        } else if (format === 'image' && typeof rawContent === 'string') {
            const byteCharacters = atob(rawContent);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            triggerDownload(blob, `${fileName}.jpg`);
        } else {
            console.error('Unsupported download format or invalid content:', format, rawContent);
        }
    } catch (e) {
        console.error("Error during file download generation:", e);
        alert("Sorry, there was an error generating the file for download.");
    }
};

export const AIAssistantView: React.FC = () => {
    const { tableData, fileHeaders } = useContext(DataContext);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
             if (file.type.startsWith('image/') || file.type === 'text/plain' || file.type === 'text/csv' || file.type.startsWith('application/vnd')) {
                setError(null);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachedFile(file);
                    if (file.type.startsWith('image/')) {
                        setAttachmentPreview(reader.result as string);
                    } else {
                        setAttachmentPreview(null);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                setError("Unsupported file type.");
                setAttachedFile(null);
                setAttachmentPreview(null);
            }
        }
       
        if (event.target) event.target.value = '';
    };

    const removeAttachment = () => {
        setAttachedFile(null);
        setAttachmentPreview(null);
    };

    const handleSend = useCallback(async () => {
        if ((!input.trim() && !attachedFile) || isLoading) return;

        const userMessageText = input.trim();
        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            text: userMessageText,
            sender: 'user',
            timestamp: new Date(),
            imageUrl: attachmentPreview || undefined,
        };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        
        const filesToSend: { name: string; mimeType: string; data: string }[] = [];
        if (attachedFile && attachmentPreview) {
             filesToSend.push({ name: attachedFile.name, mimeType: attachedFile.type, data: attachmentPreview.split(',')[1] });
        }
        removeAttachment();
        setIsLoading(true);
        setError(null);
        
        let promptText = userMessageText;
        if (tableData.length > 0) {
            promptText += `\n\n[Context from loaded data: ${fileHeaders.join(', ')}]`;
        }
        
        try {
            const aiResponse = await generateMultiFunctionalResponse(promptText, filesToSend);
            
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: aiResponse.text || '',
                sender: 'ai',
                timestamp: new Date(),
                isDownloadable: aiResponse.isDownloadable,
                downloadOptions: aiResponse.downloadOptions,
                rawContent: aiResponse.rawContent,
                imageUrl: aiResponse.imageUrl,
            };
            
            setMessages(prev => [...prev, aiMessage]);
        } catch (e: any) {
            setError(`AI Error: ${e.message}`);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `Sorry, I encountered an error: ${e.message}`,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, attachedFile, attachmentPreview, isLoading, tableData, fileHeaders]);


    return (
        <div className="h-full flex flex-col p-0 bg-transparent">
            <Panel title="AI Assistant" className="h-full flex flex-col !bg-transparent !border-none !shadow-none">
                <div className="flex-grow overflow-y-auto pr-4 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex-shrink-0"></div>}
                            <div className={`max-w-[85%] p-4 rounded-lg shadow-md ${msg.sender === 'user' ? 'bg-blue-600/80 text-white' : 'bg-gray-700/70 text-gray-200'}`}>
                                {msg.imageUrl && <img src={msg.imageUrl} alt="Attachment" className="rounded-lg mb-2 max-h-60 w-auto" />}
                                {msg.text && <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} />}
                                {msg.isDownloadable && msg.downloadOptions && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.downloadOptions.map(opt => (
                                            <button 
                                                key={opt.format}
                                                onClick={() => handleDownload(opt.format, msg.rawContent, `MasYunAI_Export_${Date.now()}`)}
                                                className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 rounded-md text-white flex items-center gap-2"
                                            >
                                                <DownloadIcon className="w-4 h-4" /> {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs opacity-60 mt-2 text-right">{msg.timestamp.toLocaleTimeString()}</p>
                            </div>
                            {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0"></div>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex-shrink-0"></div>
                            <div className="max-w-[85%] p-4 rounded-lg shadow-md bg-gray-700/70 text-gray-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                                    <span className="text-sm">AI is analyzing...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                    {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
                    {attachedFile && (
                        <div className="mb-2 p-2 bg-gray-700/50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <PaperclipIcon className="w-5 h-5" />
                                <span className="truncate max-w-xs">{attachedFile.name}</span>
                            </div>
                            <button onClick={removeAttachment} className="p-1 rounded-full hover:bg-red-500/20 text-red-400">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center space-x-3">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isLoading}
                            className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                        >
                            <PaperclipIcon className="w-6 h-6" />
                        </button>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                            placeholder="Ask a question, request content generation, or analyze an attached image..."
                            className="flex-1 p-3 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || (!input.trim() && !attachedFile)}
                            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors self-stretch flex items-center"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </Panel>
        </div>
    );
};
