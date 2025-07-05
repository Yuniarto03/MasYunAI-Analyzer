// Enhanced API Router for AI and Map Services
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { MODEL_TEXT } from '../constants';

export class APIRouter {
    private static instance: APIRouter;
    private client: GoogleGenAI | null = null;
    private isInitialized = false;
    private apiKey: string;

    private constructor() {
        // Use the provided API key
        this.apiKey = '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';
        this.initialize();
    }

    public static getInstance(): APIRouter {
        if (!APIRouter.instance) {
            APIRouter.instance = new APIRouter();
        }
        return APIRouter.instance;
    }

    private initialize() {
        try {
            // Use the hardcoded API key if environment variable is not available
            const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || this.apiKey;
            
            if (!apiKey) {
                console.warn("No API key found");
                return;
            }
            
            this.client = new GoogleGenAI({ apiKey });
            this.isInitialized = true;
            console.log("✅ API Router initialized successfully with provided key");
        } catch (error) {
            console.error("❌ Failed to initialize API Router:", error);
        }
    }

    public isReady(): boolean {
        return this.isInitialized && this.client !== null;
    }

    public getClient(): GoogleGenAI {
        if (!this.client) {
            throw new Error("API Router not initialized. Please check your API key.");
        }
        return this.client;
    }

    // Enhanced AI Chat with context awareness
    public async enhancedChat(
        message: string, 
        context?: {
            conversationType?: 'general' | 'data_analysis' | 'code_review' | 'creative';
            previousMessages?: Array<{role: 'user' | 'assistant', content: string}>;
            attachedFiles?: Array<{name: string, type: string, content: string}>;
        }
    ): Promise<string> {
        if (!this.isReady()) {
            throw new Error("API Router not ready");
        }

        let enhancedPrompt = message;
        
        // Add context-specific instructions
        if (context?.conversationType) {
            const contextInstructions = {
                data_analysis: "You are a data analysis expert. Focus on statistical insights, patterns, and actionable recommendations.",
                code_review: "You are a senior software engineer. Review code for best practices, bugs, and optimization opportunities.",
                creative: "You are a creative writing assistant. Help with storytelling, brainstorming, and creative expression.",
                general: "You are a helpful AI assistant with broad knowledge across many domains."
            };
            
            enhancedPrompt = `${contextInstructions[context.conversationType]}\n\n${message}`;
        }

        // Add file context
        if (context?.attachedFiles && context.attachedFiles.length > 0) {
            enhancedPrompt += "\n\nAttached files context:\n";
            context.attachedFiles.forEach(file => {
                enhancedPrompt += `\n[${file.name} (${file.type})]\n${file.content.slice(0, 2000)}${file.content.length > 2000 ? '...(truncated)' : ''}\n`;
            });
        }

        try {
            const response = await this.client!.models.generateContent({
                model: MODEL_TEXT,
                contents: enhancedPrompt,
                config: {
                    temperature: context?.conversationType === 'creative' ? 0.8 : 0.7,
                    maxOutputTokens: 2048,
                }
            });

            return response.text;
        } catch (error) {
            console.error("Enhanced chat error:", error);
            throw new Error(`AI Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Geographic data processing
    public async processGeographicData(
        locations: string[],
        analysisType: 'geocoding' | 'route_analysis' | 'spatial_analysis' = 'geocoding'
    ): Promise<any> {
        if (!this.isReady()) {
            throw new Error("API Router not ready");
        }

        const prompts = {
            geocoding: `Convert these locations to coordinates (lat, lng): ${locations.join(', ')}. Return as JSON array.`,
            route_analysis: `Analyze potential routes between these locations: ${locations.join(' -> ')}. Consider distance, travel time, and geographic challenges.`,
            spatial_analysis: `Perform spatial analysis on these locations: ${locations.join(', ')}. Identify clusters, patterns, and geographic relationships.`
        };

        try {
            const response = await this.client!.models.generateContent({
                model: MODEL_TEXT,
                contents: prompts[analysisType],
                config: {
                    temperature: 0.3, // Lower temperature for more precise geographic data
                    responseMimeType: analysisType === 'geocoding' ? "application/json" : undefined
                }
            });

            if (analysisType === 'geocoding') {
                try {
                    return JSON.parse(response.text);
                } catch {
                    return { error: "Failed to parse geocoding response" };
                }
            }

            return response.text;
        } catch (error) {
            console.error("Geographic data processing error:", error);
            throw new Error(`Geographic processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Advanced data visualization suggestions
    public async suggestVisualization(
        dataDescription: string,
        dataFields: string[],
        visualizationType?: 'map' | 'chart' | 'dashboard'
    ): Promise<string> {
        if (!this.isReady()) {
            throw new Error("API Router not ready");
        }

        const prompt = `
        Data Description: ${dataDescription}
        Available Fields: ${dataFields.join(', ')}
        Visualization Type: ${visualizationType || 'any'}
        
        Suggest the best visualization approach for this data. Include:
        1. Recommended chart/map types
        2. Field mappings (which fields for x-axis, y-axis, color, size, etc.)
        3. Color palette suggestions
        4. Interactive features that would enhance the visualization
        5. Potential insights this visualization could reveal
        `;

        try {
            const response = await this.client!.models.generateContent({
                model: MODEL_TEXT,
                contents: prompt,
                config: {
                    temperature: 0.6,
                    maxOutputTokens: 1024,
                }
            });

            return response.text;
        } catch (error) {
            console.error("Visualization suggestion error:", error);
            throw new Error(`Visualization suggestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Code generation and analysis
    public async generateCode(
        description: string,
        language: string,
        framework?: string,
        additionalRequirements?: string[]
    ): Promise<{code: string, explanation: string, filename: string}> {
        if (!this.isReady()) {
            throw new Error("API Router not ready");
        }

        const prompt = `
        Generate ${language} code ${framework ? `using ${framework}` : ''} for: ${description}
        
        ${additionalRequirements ? `Additional requirements: ${additionalRequirements.join(', ')}` : ''}
        
        Provide:
        1. Clean, well-commented code
        2. Brief explanation of the implementation
        3. Suggested filename
        
        Format your response as:
        FILENAME: [suggested filename]
        
        EXPLANATION:
        [brief explanation]
        
        CODE:
        [the actual code]
        `;

        try {
            const response = await this.client!.models.generateContent({
                model: MODEL_TEXT,
                contents: prompt,
                config: {
                    temperature: 0.4,
                    maxOutputTokens: 2048,
                }
            });

            const text = response.text;
            const filenameMatch = text.match(/FILENAME:\s*(.+)/);
            const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]*?)(?=CODE:|$)/);
            const codeMatch = text.match(/CODE:\s*([\s\S]*)/);

            return {
                filename: filenameMatch?.[1]?.trim() || `generated.${language}`,
                explanation: explanationMatch?.[1]?.trim() || "Generated code implementation",
                code: codeMatch?.[1]?.trim() || text
            };
        } catch (error) {
            console.error("Code generation error:", error);
            throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Health check
    public async healthCheck(): Promise<{status: 'healthy' | 'unhealthy', details: string}> {
        if (!this.isReady()) {
            return {
                status: 'unhealthy',
                details: 'API Router not initialized or API key missing'
            };
        }

        try {
            const response = await this.client!.models.generateContent({
                model: MODEL_TEXT,
                contents: "Respond with 'OK' if you're working properly.",
                config: { maxOutputTokens: 10 }
            });

            return {
                status: response.text.includes('OK') ? 'healthy' : 'unhealthy',
                details: `API response: ${response.text}`
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}

// Export singleton instance
export const apiRouter = APIRouter.getInstance();

// Enhanced service functions using the router
export const enhancedChatService = {
    sendMessage: (message: string, context?: any) => apiRouter.enhancedChat(message, context),
    processFiles: (files: File[], message: string) => {
        // Process files and send to enhanced chat
        return apiRouter.enhancedChat(message, {
            conversationType: 'data_analysis',
            attachedFiles: files.map(f => ({
                name: f.name,
                type: f.type,
                content: '' // Would be populated with file content
            }))
        });
    }
};

export const geoService = {
    geocodeLocations: (locations: string[]) => apiRouter.processGeographicData(locations, 'geocoding'),
    analyzeRoutes: (locations: string[]) => apiRouter.processGeographicData(locations, 'route_analysis'),
    spatialAnalysis: (locations: string[]) => apiRouter.processGeographicData(locations, 'spatial_analysis')
};

export const visualizationService = {
    suggest: (dataDescription: string, fields: string[], type?: 'map' | 'chart' | 'dashboard') => 
        apiRouter.suggestVisualization(dataDescription, fields, type)
};

export const codeService = {
    generate: (description: string, language: string, framework?: string, requirements?: string[]) =>
        apiRouter.generateCode(description, language, framework, requirements)
};