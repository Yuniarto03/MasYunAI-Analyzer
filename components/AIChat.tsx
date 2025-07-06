

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Chat, GroundingChunk as GenAIGroundingChunk } from '@google/genai';
import { MODEL_TEXT } from '../constants';
import { ChatMessage, GroundingChunk, IconType, IconProps } from '../types';

interface AIChatProps {
  onClose: () => void;
}

// --- Icons for the Chat Component ---
const SendIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const LinkIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const PaperclipIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 0116.5 7.5c0 1.862-1.513 3.375-3.375 3.375S9.75 9.362 9.75 7.5c0-1.036.84-1.875 1.875-1.875s1.875.84 1.875 1.875v7.5A1.5 1.5 0 0112 18.75s-1.5-.672-1.5-1.5v-7.5c0-1.02.83-1.875 1.875-1.875a1.875 1.875 0 011.875 1.875v7.5c0 1.02-.83 1.875-1.875 1.875S10.5 17.02 10.5 16v-7.5" /></svg>;
const MaximizeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6L9 9" /></svg>;
const RestoreIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>;
const MoreIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5.75a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01A.75.75 0 0110 5.75zM10 9.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01A.75.75 0 0110 9.25zM10 12.75a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01A.75.75 0 0110 12.75z" /></svg>;

const base64Icon = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAH0AfQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1VWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8MTIxMjJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+qKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigA...';

export const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGroundingChunks, setCurrentGroundingChunks] = useState<GroundingChunk[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  // New state for draggability, maximization, and menu
  const [position, setPosition] = useState<{ top: number, left: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ top: number, left: number } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const systemInstruction = 'You are a helpful AI assistant for the MasYun Data Analyzer. Be concise and helpful. You can use Google Search for recent information and analyze images.';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Set initial position after component mounts
  useEffect(() => {
    if (chatContainerRef.current && !position) {
      const rect = chatContainerRef.current.getBoundingClientRect();
      setPosition({ top: rect.top, left: rect.left });
    }
  }, [position]);

  // Dragging logic
  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMaximized || !position) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.left,
      y: e.clientY - position.top
    });
  };

  useEffect(() => {
    const handleDragMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMaximized || !position) return;
      const newTop = Math.max(0, e.clientY - dragOffset.y);
      const newLeft = Math.max(0, e.clientX - dragOffset.x);
      setPosition({ top: newTop, left: newLeft });
    };

    const handleDragMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMouseMove);
      window.addEventListener('mouseup', handleDragMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMouseMove);
      window.removeEventListener('mouseup', handleDragMouseUp);
    };
  }, [isDragging, dragOffset, isMaximized, position]);

  // Menu logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const toggleMaximize = () => {
    if (isMaximized) {
      setPosition(lastPosition); // Restore to last free position
    } else {
      setLastPosition(position); // Save current position
      setPosition(null); // Let CSS handle centering
    }
    setIsMaximized(!isMaximized);
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsMenuOpen(false);
  };

  const handleExportChat = () => {
    const content = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.sender.toUpperCase()}:\n${msg.text}`)
      .join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MasYun_Chat_Export_${new Date().toISOString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMenuOpen(false);
  };
  
  const handleViewPrompt = () => {
    alert(`System Prompt:\n\n${systemInstruction}`);
    setIsMenuOpen(false);
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    try {
      if (!process.env.API_KEY) {
        setError("API_KEY is not configured. Chatbot will not function.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const newChat = ai.chats.create({
        model: MODEL_TEXT,
        config: { systemInstruction, tools: [{googleSearch: {}}] },
      });
      setChat(newChat);
    } catch (e) {
      console.error("Failed to initialize Gemini AI Chat:", e);
      setError("Failed to initialize AI Chat. Please check console for details.");
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => { setAttachedFile(file); setAttachmentPreview(reader.result as string); };
      reader.readAsDataURL(file);
    } else if (file) {
      setError("Only image files can be attached.");
      setAttachedFile(null); setAttachmentPreview(null);
    }
    if (event.target) event.target.value = '';
  };

  const removeAttachment = () => { setAttachedFile(null); setAttachmentPreview(null); };

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachedFile) || isLoading || !chat) return;

    const userMessageText = input.trim();
    const newUserMessage: ChatMessage = { id: Date.now().toString(), text: userMessageText, sender: 'user', timestamp: new Date(), imageUrl: attachmentPreview || undefined };
    setMessages(prev => [...prev, newUserMessage]);
    setInput(''); removeAttachment(); setIsLoading(true); setError(null); setCurrentGroundingChunks([]);

    try {
      const messageParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
      if (attachedFile && attachmentPreview) {
          messageParts.push({ inlineData: { mimeType: attachedFile.type, data: attachmentPreview.split(',')[1] } });
      }
      if (userMessageText) { messageParts.push({ text: userMessageText }); }
      if (messageParts.length === 0) throw new Error("Cannot send an empty message.");

      const result: GenerateContentResponse = await chat.sendMessage({ message: messageParts });
      const aiResponseText = result.text;
      
      const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
      let chunks: GroundingChunk[] = [];
      if (groundingMetadata?.groundingChunks && Array.isArray(groundingMetadata.groundingChunks)) {
          chunks = groundingMetadata.groundingChunks.filter((c: GenAIGroundingChunk) => c.web?.uri && c.web?.title).map((c: GenAIGroundingChunk) => ({ web: { uri: c.web!.uri, title: c.web!.title } }));
      }
      setCurrentGroundingChunks(chunks);

      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: aiResponseText, sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e: any) {
      console.error("Error sending message to Gemini:", e);
      const errorMessage = e.message || "An error occurred while communicating with the AI.";
      setError(`AI Error: ${errorMessage}`);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: `Error: Could not get response. ${errorMessage}`, sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chat, attachedFile, attachmentPreview]);

  const containerDynamicStyles: React.CSSProperties = isMaximized 
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    : (position ? { top: position.top, left: position.left, bottom: 'auto', right: 'auto' } : {});

  const containerClasses = `fixed z-[1000] ${!position && !isMaximized ? 'bottom-24 right-6 md:bottom-6 md:right-6' : ''}`;

  return (
    <div ref={chatContainerRef} className={containerClasses} style={containerDynamicStyles}>
      <div className={`
        flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-700
        ${isMaximized ? 'w-[90vw] h-[90vh]' : 'w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[500px]'}
      `}>
        <div 
          className={`flex items-center justify-between p-4 border-b border-gray-700 ${!isMaximized ? 'cursor-grab' : 'cursor-default'}`}
          onMouseDown={handleDragMouseDown}
        >
          <div className="flex items-center gap-3">
             <img src={base64Icon} alt="MasYunAI" className="w-8 h-8 rounded-full object-cover" />
             <h3 className="text-lg font-semibold text-blue-300">MasYunAI</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsMenuOpen(p => !p)} className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-full transition-colors">
                <MoreIcon className="w-5 h-5" />
              </button>
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-10 text-sm">
                  <button onClick={() => {setShowTimestamps(p => !p); setIsMenuOpen(false);}} className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">{showTimestamps ? 'Hide' : 'Show'} Timestamps</button>
                  <button onClick={handleViewPrompt} className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">View System Prompt</button>
                  <button onClick={handleClearChat} className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">Clear Chat</button>
                  <button onClick={handleExportChat} className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">Export Chat</button>
                </div>
              )}
            </div>
            <button onClick={toggleMaximize} className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-full transition-colors">
              {isMaximized ? <RestoreIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-full transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                {msg.imageUrl && <img src={msg.imageUrl} alt="User attachment" className="rounded-lg mb-2 max-h-48 w-auto" />}
                {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                {showTimestamps && <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp.toLocaleTimeString()}</p>}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="max-w-[80%] p-3 rounded-lg bg-gray-700 text-gray-200"><div className="flex items-center space-x-2"><div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div><span className="text-sm">AI is thinking...</span></div></div></div>}
          <div ref={messagesEndRef} />
        </div>

        {currentGroundingChunks.length > 0 && (
            <div className="p-3 border-t border-gray-700 bg-gray-700 bg-opacity-50"><p className="text-xs text-gray-400 mb-1">Sources:</p><ul className="space-y-1">{currentGroundingChunks.map((chunk, index) => (<li key={index} className="text-xs"><a href={chunk.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline flex items-center"><LinkIcon className="w-3 h-3 mr-1 inline-block" />{chunk.web?.title || chunk.web?.uri}</a></li>))}</ul></div>
        )}

        {attachmentPreview && (<div className="p-2 border-t border-gray-700 bg-gray-700/30"><div className="relative w-20 h-20 bg-gray-900/50 p-1 rounded-md"><img src={attachmentPreview} alt="Attachment preview" className="w-full h-full object-cover rounded" /><button onClick={removeAttachment} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 leading-none shadow-md hover:bg-red-700" aria-label="Remove attachment"><CloseIcon className="w-4 h-4" /></button></div></div>)}
        
        {error && <div className="p-3 bg-red-500 text-white text-sm text-center">{error}</div>}

        <div className="p-4 border-t border-gray-700"><div className="flex items-center space-x-2"><input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" /><button onClick={() => fileInputRef.current?.click()} disabled={isLoading || !chat} className="p-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg disabled:opacity-50 transition-colors" aria-label="Attach file"><PaperclipIcon className="w-5 h-5" /></button><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()} placeholder={isLoading ? "AI is responding..." : "Ask AI or attach an image..."} className="flex-1 p-3 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading || !chat} /><button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachedFile) || !chat} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"><SendIcon className="w-5 h-5" /></button></div></div>
      </div>
    </div>
  );
};