


import { GoogleGenAI, GenerateContentResponse, Part, Type } from '@google/genai';
import { marked } from 'marked';
import { DiagramNode, DiagramEdge, RouteResult, ChatMessage, AiOutputTypeHint, AiDocumentResponse, CombinedAiOutput, TableRow } from '../types';
import { MODEL_TEXT, MODEL_IMAGE } from '../constants';

let ai: GoogleGenAI;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

// --- START: AI Assistant Content Generation ---

const contentGenerationSystemInstruction = `You are a multi-functional AI assistant for "MasYun Data Analyzer".
Your primary goal is to respond with structured JSON when the user asks to create content that can be downloaded as a file (DOCX, PPTX, XLSX, PDF). For all other conversational queries or analyses that should be displayed in chat, respond with Markdown.

**JSON Structure for File Generation:**
When a user prompt implies file creation (e.g., "create a presentation about...", "make a table of...", "write a document on..."), you MUST respond with ONLY a valid JSON object with the following structure:
{
  "type": "file_generation",
  "format": "pptx" | "docx" | "table" | "pdf_table",
  "content": ...
}

- For "pptx": \`content\` is an array of slide objects: \`[{ title: "string", bullets: ["string", ...] }, ...]\`.
- For "docx": \`content\` is an array of paragraph objects: \`[{ type: "heading" | "paragraph", text: "string" }, ...]\`.
- For "table" (for XLSX/CSV): \`content\` is an array of row objects, where keys are headers: \`[{ "Header 1": "value", "Header 2": "value" }, ...]\`.
- For "pdf_table": \`content\` is an object: \`{ "headers": ["Header 1", ...], "rows": [["cell1", "cell2", ...], ...] }\`.

**Image Generation:**
If the user prompt is clearly asking to "draw", "generate an image of", "create a picture of", or similar, respond with a JSON object:
{
  "type": "image_generation",
  "prompt": "The user's original image prompt string here"
}

**Chat/Markdown Response:**
For any other request (e.g., "summarize this file", "explain this concept", "what are the key takeaways?"), respond directly with your answer in well-formatted MARKDOWN. DO NOT wrap your markdown response in JSON.`;


export const generateImageWithGemini = async (prompt: string): Promise<string> => {
    const genAI = getAI();
    const response = await genAI.models.generateImages({
        model: MODEL_IMAGE,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
        },
    });
    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("Image generation failed or returned no images.");
};

export const generateMultiFunctionalResponse = async (
    prompt: string,
    files: { name: string; mimeType: string; data: string }[]
): Promise<Partial<ChatMessage>> => {
    const genAI = getAI();
    const parts: Part[] = [];

    files.forEach(file => {
        parts.push({
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            }
        });
    });
    parts.push({ text: prompt });
    
    const response = await genAI.models.generateContent({
        model: MODEL_TEXT,
        contents: { parts },
        config: { systemInstruction: contentGenerationSystemInstruction },
    });
    
    const responseText = response.text;

    try {
        const parsedJson = JSON.parse(responseText);
        if (parsedJson.type === 'file_generation') {
            const downloadOptions: ChatMessage['downloadOptions'] = [];
            const { format } = parsedJson;
            if (format === 'table') {
                downloadOptions.push({ format: 'xlsx', label: 'Download XLSX' });
            } else if (format === 'pptx') {
                downloadOptions.push({ format: 'pptx', label: 'Download PPTX' });
            } else if (format === 'docx') {
                downloadOptions.push({ format: 'docx', label: 'Download DOCX' });
            } else if (format === 'pdf_table') {
                downloadOptions.push({ format: 'pdf', label: 'Download PDF' });
            }

            return {
                text: `I have generated content in the requested format. You can download it now.`,
                isDownloadable: true,
                downloadOptions,
                rawContent: parsedJson.content,
            };
        }
        if(parsedJson.type === 'image_generation' && parsedJson.prompt) {
            const imageBytes = await generateImageWithGemini(parsedJson.prompt);
            return {
                text: `Generated image for: *${parsedJson.prompt}*`,
                isDownloadable: true,
                downloadOptions: [{ format: 'image', label: 'Download Image' }],
                rawContent: imageBytes,
                imageUrl: `data:image/jpeg;base64,${imageBytes}`
            }
        }
    } catch (e) {
        // Not JSON, so it's a regular markdown response
        return { text: responseText };
    }

    // Fallback for unexpected JSON structure
    return { text: responseText };
};


// --- END: AI Assistant Content Generation ---

// --- START: AI Document Analysis ---
export const analyzeDocument = async (instruction: string, file?: File, outputTypeHint: AiOutputTypeHint = 'text'): Promise<AiDocumentResponse> => {
    const genAI = getAI();
    const parts: Part[] = [];

    if (file) {
        const base64data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        parts.push({ inlineData: { mimeType: file.type, data: base64data } });
    }

    parts.push({ text: instruction });

    const response = await genAI.models.generateContent({
        model: MODEL_TEXT,
        contents: { parts },
        config: {
            // A more generic system instruction for this view
            systemInstruction: `You are an AI assistant skilled in document analysis and content generation. The user has provided an instruction and may have uploaded a file. Follow the instruction and generate the output in the format hinted by the user. Hint: ${outputTypeHint}`,
        },
    });

    const responseText = response.text;
    // For now, we'll return the raw text. A more sophisticated implementation
    // would parse this text based on the outputTypeHint to create structured data.
    return {
        type: 'text',
        content: responseText,
        fileName: file?.name,
        originalUserHint: outputTypeHint,
    };
};
// --- END: AI Document Analysis ---


// Generic text generation function, used by other service functions
export const analyzeTextWithGemini = async (
    prompt: string, 
    systemInstruction?: string,
    responseType: 'text' | 'json' = 'text'
): Promise<{ type: 'text' | 'json' | 'error', content: string }> => {
    try {
        const genAI = getAI();
        const response = await genAI.models.generateContent({
            model: MODEL_TEXT,
            contents: prompt,
            config: {
                ...(systemInstruction && { systemInstruction }),
                ...(responseType === 'json' && { responseMimeType: "application/json" }),
            },
        });
        const text = response.text;
        if (!text) {
            return { type: 'error', content: 'Received empty response from AI.' };
        }
        return { type: responseType, content: text };
    } catch (error: any) {
        console.error('Error with Gemini API:', error);
        return { type: 'error', content: error.message || 'An unknown error occurred.' };
    }
};

// For DataTableView
export const analyzeSelectedData = async (dataJson: string): Promise<string> => {
    const prompt = `Here is a JSON array of selected data rows. Provide a concise but insightful analysis. What patterns, correlations, or anomalies do you see? Present your findings in well-structured Markdown format.\n\nData:\n${dataJson}`;
    const response = await analyzeTextWithGemini(prompt, 'You are a helpful data analyst.');
    if (response.type === 'error') throw new Error(response.content);
    return marked.parse(response.content) as string;
};

// For StatisticalAnalysisView
export const getStatisticalAnalysis = async (summaryText: string, userQuery?: string, isSubset?: boolean): Promise<string> => {
    const queryPart = userQuery 
        ? `The user has a specific question: "${userQuery}". Please answer this question based on the stats.`
        : 'Based on these statistics, provide a high-level summary. What are the most interesting findings? What could be potential next steps for analysis?';
    const subsetPart = isSubset ? "Note: This analysis is for a SUBSET of the original data. Mention this in your analysis." : "";
    const prompt = `You are a helpful data scientist. Here is an automated statistical summary of a dataset:\n\n${summaryText}\n\n${queryPart}\n\n${subsetPart}\n\nProvide the analysis in clear, well-structured Markdown.`;
    const response = await analyzeTextWithGemini(prompt);
    if (response.type === 'error') throw new Error(response.content);
    return marked.parse(response.content) as string;
};

// For DataCleaningView
export const getAICleaningSuggestions = async (headers: string[], sampleData: TableRow[]): Promise<string> => {
    const prompt = `
You are a data cleaning expert integrated into the "MasYun Data Analyzer" application.
The user has provided a dataset. Your task is to analyze the headers and a sample of the data to identify potential data quality issues and suggest cleaning steps.

Here is the context:
- Available Columns: [${headers.join(', ')}]
- Sample Data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

Based on this, provide a concise, actionable report in Markdown format. Structure your response with the following sections:

### 1. Data Quality Quick Scan
- Briefly mention potential issues you see in the sample data.
- Examples: Mixed data types in a column, inconsistent casing, leading/trailing whitespace, potential special characters, values that look like they need parsing (e.g., 'USD 1,200.50').

### 2. Recommended Cleaning Steps
- Provide a bulleted list of specific, recommended actions.
- For each recommendation, state the column it applies to and the suggested action.
- Examples:
  - **Column 'Region'**: Convert to Title Case for consistency.
  - **Column 'Sales'**: Remove 'USD' and commas, then convert to a numeric data type.
  - **All Text Columns**: Trim leading/trailing whitespace.
  - **Column 'ID'**: Check for and remove any duplicate rows based on this column.
  - **Column 'OrderDate'**: Standardize to YYYY-MM-DD format.

Your response should be clear, easy to understand for a business user, and focused on practical cleaning actions that can be performed within the application.
`;
    const response = await analyzeTextWithGemini(prompt);
    if (response.type === 'error') throw new Error(response.content);
    return marked.parse(response.content) as string;
};


// For AboutView
export const generateDocumentation = async (features: string): Promise<string> => {
    const prompt = `Generate a user-friendly, comprehensive user manual for the "MasYun Data Analyzer" application based on the following features list. The output must be a single, complete HTML file. Use professional but engaging language. Structure it with a title, introduction, and sections for each major feature. Use semantic HTML tags (h1, h2, p, ul, li, strong, code). Style it with embedded CSS within a <style> tag in the <head>. The styling should be clean, modern, and reflect the app's dark, holographic theme (dark backgrounds, bright text colors like cyan, purple, and green, maybe some subtle glow effects).\n\nFeatures:\n${features}`;
    const response = await analyzeTextWithGemini(prompt, 'You are a technical writer creating user documentation.');
    if (response.type === 'error') return `<h1>Error</h1><p>${response.content}</p>`;
    const html = response.content.replace(/^```html\n?/, '').replace(/```$/, '');
    return html;
};

// For DiagrammingMatrixView
export const generateDiagramFromPrompt = async (prompt: string): Promise<{ nodes: DiagramNode[], edges: DiagramEdge[] }> => {
    const systemInstruction = `You are an AI that generates graph data for a diagramming tool. The user will provide a prompt. You MUST respond with only a valid JSON object containing two keys: "nodes" and "edges".
    "nodes" should be an array of objects, each with:
    - id: A unique string identifier.
    - type: "rectangle", "ellipse", or "diamond".
    - position: An object with "x" and "y" coordinates. Distribute nodes logically.
    - size: An object with "width" and "height". Use 150 for width and 75 for height.
    - data: An object with a "label" (a concise string for the node) and a "style" object. Style can be empty {}.
    "edges" should be an array of objects, each with:
    - id: A unique string identifier.
    - source: The "id" of the source node.
    - target: The "id" of the target node.
    - label: (Optional) A short label for the edge.
    Do not include any explanation or markdown formatting. Only the JSON object.`;
    
    const response = await analyzeTextWithGemini(prompt, systemInstruction, 'json');
    if (response.type === 'error') throw new Error(response.content);
    try {
        const parsed = JSON.parse(response.content);
        if (!parsed.nodes || !parsed.edges) throw new Error("AI response is missing 'nodes' or 'edges' array.");
        return parsed as { nodes: DiagramNode[], edges: DiagramEdge[] };
    } catch (e) {
        throw new Error("AI returned an invalid JSON format for the diagram.");
    }
};

// For RoutePlannerView
export const geocodeAddressWithGemini = async (address: string): Promise<[number, number] | { error: string }> => {
    const prompt = `Geocode the following address and return only the latitude and longitude as a JSON object with "lat" and "lon" keys. Example: {"lat": 48.8584, "lon": 2.2945}. Address: "${address}"`;
    const response = await analyzeTextWithGemini(prompt, 'You are a geocoding service. Respond only with JSON.', 'json');
    if (response.type === 'error') return { error: response.content };
    try {
        const parsed = JSON.parse(response.content);
        if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number') return [parsed.lat, parsed.lon];
        return { error: 'Invalid geocoding response format.' };
    } catch (e) { return { error: 'Failed to parse geocoding response.' }; }
};

export const getRouteAnalysisForDisplay = async (from: string, to: string, distance: string | null, duration: string | null, mode: string, country: string): Promise<string> => {
    const prompt = `Provide a very brief, one-paragraph analysis for a travel route.
    - From: ${from}
    - To: ${to}
    - Distance (straight-line): ${distance || 'N/A'}
    - Estimated Duration (${mode}): ${duration || 'N/A'}
    - Country context: ${country}
    Mention any major geographical features, potential challenges (e.g., mountains, water crossings, border), or notable points of interest along the general path. Keep it concise.`;
    const response = await analyzeTextWithGemini(prompt);
    if (response.type === 'error') return `AI Analysis Error: ${response.content}`;
    return response.content;
};

// For MapView
export const getMapInsights = async (context: string, userPrompt: string): Promise<string> => {
    const systemInstruction = `You are a geographical data analyst. Based on the following map data context and user query, provide concise, insightful analysis in well-structured Markdown. Focus on patterns, anomalies, and potential next steps for investigation.`;
    const fullPrompt = `Map Context:\n${context}\n\nUser's Question:\n${userPrompt}`;
    const response = await analyzeTextWithGemini(fullPrompt, systemInstruction, 'text');
    if (response.type === 'error') throw new Error(response.content);
    return response.content;
};


// For AdvancedAIToolsView
export const generateAICommand = async (prompt: string): Promise<string> => {
    const response = await analyzeTextWithGemini(prompt);
    if (response.type === 'error') throw new Error(response.content);
    return response.content;
};