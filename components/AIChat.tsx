
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Chat, GroundingChunk as GenAIGroundingChunk } from '@google/genai';
import { MODEL_TEXT } from '../constants';
import { ChatMessage, GroundingChunk, IconType } from '../types';

interface AIChatProps {
  onClose: () => void;
}

const SendIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const CloseIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LinkIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

const PaperclipIcon: IconType = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 0116.5 7.5c0 1.862-1.513 3.375-3.375 3.375S9.75 9.362 9.75 7.5c0-1.036.84-1.875 1.875-1.875s1.875.84 1.875 1.875v7.5A1.5 1.5 0 0112 18.75s-1.5-.672-1.5-1.5v-7.5c0-1.02.83-1.875 1.875-1.875a1.875 1.875 0 011.875 1.875v7.5c0 1.02-.83 1.875-1.875 1.875S10.5 17.02 10.5 16v-7.5" />
  </svg>
);


export const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGroundingChunks, setCurrentGroundingChunks] = useState<GroundingChunk[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    try {
      if (!process.env.API_KEY) {
        setError("API_KEY is not configured. Chatbot will not function.");
        console.error("API_KEY environment variable not set.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const newChat = ai.chats.create({
        model: MODEL_TEXT,
        config: {
          systemInstruction: 'You are a helpful AI assistant for the MasYun Data Analyzer. Be concise and helpful. You can use Google Search for recent information and analyze images.',
          tools: [{googleSearch: {}}], // Enable Google Search
        },
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
      reader.onloadend = () => {
        setAttachedFile(file);
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setError("Only image files can be attached.");
      setAttachedFile(null);
      setAttachmentPreview(null);
    }
    if (event.target) event.target.value = '';
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachmentPreview(null);
  };

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachedFile) || isLoading || !chat) return;

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
    removeAttachment();
    setIsLoading(true);
    setError(null);
    setCurrentGroundingChunks([]);

    try {
      // The parts for the message should be typed as an array of objects.
      const messageParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
      
      if (attachedFile && attachmentPreview) {
          const mimeType = attachedFile.type;
          const base64Data = attachmentPreview.split(',')[1];
          messageParts.push({
              inlineData: {
                  mimeType,
                  data: base64Data,
              }
          });
      }

      if (userMessageText) {
          messageParts.push({ text: userMessageText });
      }

      if (messageParts.length === 0) throw new Error("Cannot send an empty message.");

      // The original code's ternary operator created a union type of 'string | object[]'.
      // The error indicates that the 'string' type is not assignable where an object is expected.
      // By always passing an array of parts, we avoid this type issue.
      const result: GenerateContentResponse = await chat.sendMessage({ message: messageParts });
      const aiResponseText = result.text;
      
      const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
      let chunks: GroundingChunk[] = [];
      if (groundingMetadata?.groundingChunks && Array.isArray(groundingMetadata.groundingChunks)) {
          chunks = groundingMetadata.groundingChunks
              .filter((chunk: GenAIGroundingChunk) => chunk.web?.uri && chunk.web?.title)
              .map((chunk: GenAIGroundingChunk) => ({
                  web: {
                      uri: chunk.web!.uri,
                      title: chunk.web!.title,
                  }
              }));
      }
      setCurrentGroundingChunks(chunks);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e: any) {
      console.error("Error sending message to Gemini:", e);
      const errorMessage = e.message || "An error occurred while communicating with the AI.";
      setError(`AI Error: ${errorMessage}`);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `Error: Could not get response. ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chat, attachedFile, attachmentPreview]);

  return (
    <div className="fixed bottom-24 right-6 md:bottom-6 md:right-6 w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[500px] bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-xl shadow-2xl flex flex-col border border-gray-700 z-[1000] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-blue-300">AI Assistant</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="User attachment" className="rounded-lg mb-2 max-h-48 w-auto" />
              )}
              {msg.text && (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              )}
              <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-700 text-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {currentGroundingChunks.length > 0 && (
          <div className="p-3 border-t border-gray-700 bg-gray-700 bg-opacity-50">
              <p className="text-xs text-gray-400 mb-1">Sources:</p>
              <ul className="space-y-1">
                  {currentGroundingChunks.map((chunk, index) => (
                      <li key={index} className="text-xs">
                          <a 
                              href={chunk.web?.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center"
                          >
                            <LinkIcon className="w-3 h-3 mr-1 inline-block" />
                            {chunk.web?.title || chunk.web?.uri}
                          </a>
                      </li>
                  ))}
              </ul>
          </div>
      )}

      {attachmentPreview && (
        <div className="p-2 border-t border-gray-700 bg-gray-700/30">
            <div className="relative w-20 h-20 bg-gray-900/50 p-1 rounded-md">
                <img src={attachmentPreview} alt="Attachment preview" className="w-full h-full object-cover rounded" />
                <button
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 leading-none shadow-md hover:bg-red-700 transition-colors"
                    aria-label="Remove attachment"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}

      {error && <div className="p-3 bg-red-500 text-white text-sm text-center">{error}</div>}

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !chat}
              className="p-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Attach file"
          >
              <PaperclipIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder={isLoading ? "AI is responding..." : "Ask AI or attach an image..."}
            className="flex-1 p-3 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            disabled={isLoading || !chat}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !attachedFile) || !chat}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
