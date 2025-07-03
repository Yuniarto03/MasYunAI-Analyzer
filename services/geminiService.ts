// This file is a placeholder for more complex Gemini API interactions.
// For the current chat functionality, the logic is within AIChat.tsx for simplicity.
// If more features use Gemini (e.g., data analysis insights), centralize API calls here.

import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from '@google/genai';
import { MODEL_TEXT } from '../constants';
import { marked } from 'marked'; // Using a proper markdown parser for safety and features
import { LatLngTuple, TravelMode } from '../types';

let ai: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// Generic command function for AI text generation
export const generateAICommand = async (prompt: string): Promise<string> => {
  try {
    const client = getClient();
    const params: GenerateContentParameters = {
      model: MODEL_TEXT,
      contents: prompt,
      // config: { // Optional: add specific config if needed
      //   temperature: 0.7,
      // }
    };
    const response: GenerateContentResponse = await client.models.generateContent(params);
    return response.text;
  } catch (error) {
    console.error('Error generating text from Gemini:', error);
    throw error; // Re-throw for handling in UI
  }
};

export interface MultiFunctionalResponse {
    isDownloadable: boolean;
    content: string;
    filename: string;
    mimeType: string;
}

export const generateMultiFunctionalResponse = async (
    prompt: string, 
    files: { name: string; mimeType: string; data: string }[]
): Promise<MultiFunctionalResponse> => {
    const client = getClient();
    const systemInstruction = `You are a highly intelligent, multi-functional AI assistant within the MasYun Data Analyzer platform. You can analyze data, answer complex questions, generate code, write documents, and create file content based on user requests. When asked to create a file, format your entire response as a raw string containing ONLY the file's content. To specify the filename and type for download, you MUST place a directive on the very first line of your response in the format: [DL_FILENAME: a_good_filename.ext]. If you are just answering a question, do not include the DL_FILENAME directive.`;
    
    const contents: any[] = [];
    if(prompt) contents.push({ text: prompt });

    files.forEach(file => {
        contents.push({ text: `[User has included the file '${file.name}' for analysis]` });
        contents.push({
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            }
        });
    });

    try {
        const response = await client.models.generateContent({
            model: MODEL_TEXT,
            contents: { parts: contents },
            config: {
                systemInstruction,
                temperature: 0.6,
            }
        });

        let text = response.text;
        const firstLineBreak = text.indexOf('\n');
        const firstLine = firstLineBreak === -1 ? text : text.substring(0, firstLineBreak);

        const dlRegex = /\[DL_FILENAME:\s*(.*?)\s*\]/;
        const match = firstLine.match(dlRegex);

        if (match && match[1]) {
            const filename = match[1].trim();
            const content = firstLineBreak === -1 ? '' : text.substring(firstLineBreak + 1);
            
            // Basic mime type detection from filename extension
            const ext = filename.split('.').pop()?.toLowerCase() || '';
            let mimeType = 'application/octet-stream';
            if (ext === 'txt') mimeType = 'text/plain';
            else if (ext === 'csv') mimeType = 'text/csv';
            else if (ext === 'json') mimeType = 'application/json';
            else if (ext === 'html') mimeType = 'text/html';
            else if (ext === 'xml') mimeType = 'application/xml';
            else if (ext === 'py') mimeType = 'text/x-python';
            else if (ext === 'js') mimeType = 'application/javascript';
            else if (ext === 'md') mimeType = 'text/markdown';
            
            return {
                isDownloadable: true,
                content: content,
                filename: filename,
                mimeType: mimeType
            };
        } else {
            return {
                isDownloadable: false,
                content: text,
                filename: '',
                mimeType: ''
            };
        }
    } catch (error) {
        console.error('Error generating multi-functional response from Gemini:', error);
        if (error instanceof Error) {
            return {
                isDownloadable: false,
                content: `**AI Error:**\n\n> ${error.message}`,
                filename: '',
                mimeType: '',
            };
        }
        return {
            isDownloadable: false,
            content: '**An unknown AI error occurred.**',
            filename: '',
            mimeType: '',
        };
    }
};


export const analyzeSelectedData = async (jsonData: string): Promise<string> => {
    const prompt = `
        You are an expert data analyst. Below is a JSON array of data representing a selection of rows from a larger dataset.
        Your task is to provide a concise summary of this specific data subset. 
        Focus on:
        1.  Key characteristics of the selected data.
        2.  Any obvious trends, patterns, or correlations you can spot within this selection.
        3.  Potential outliers or anomalies that stand out.
        
        Keep your analysis brief and to the point. Use markdown for formatting if needed (e.g., bullet points).

        Data Subset:
        ${jsonData}
    `;

    try {
        const client = getClient();
        const response: GenerateContentResponse = await client.models.generateContent({
            model: MODEL_TEXT,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error analyzing data with Gemini:', error);
        if (error instanceof Error) {
            return `Error during analysis: ${error.message}`;
        }
        return 'An unknown error occurred during AI analysis.';
    }
};

export const getStatisticalAnalysis = async (profilingSummary: string, userQuery?: string, isSubset: boolean = false): Promise<string> => {
    const systemInstruction = `You are a world-class statistician and data analyst integrated into the 'MasYun Data Analyzer' platform. Your responses must be clear, concise, and insightful. Use markdown for formatting, including tables, lists, and code blocks where appropriate.`;

    let prompt = `
        I have performed a statistical analysis on a dataset. Here is the summary of the data profile:
        ---
        ${profilingSummary}
        ---
    `;

    if (userQuery) {
        prompt += `
            Based on this data profile, please answer the following question: "${userQuery}"
            Provide a detailed answer, referencing the provided statistics. If the query asks for something not directly available in the summary (like correlation between two specific variables), explain what additional calculations would be needed, but still provide an educated hypothesis based on the data you do have.
        `;
    } else { // This is the "Auto Analyze" case
        const datasetContext = isSubset ? 'this data subset' : 'the entire dataset';
        prompt += `
            Based on this data profile, please provide a high-level automated analysis of ${datasetContext}. Your analysis should cover:
            1.  **Overall Summary & Key Findings**: A brief, executive-level summary of the most important characteristics of the data.
            2.  **Potential Data Quality Issues**: Point out any variables with a high number of missing values, potential outliers suggested by min/max/std dev, or low variance.
            3.  **Interesting Correlations or Relationships (Hypotheses)**: Based on the variable types and distributions, suggest potential relationships that would be interesting to investigate further (e.g., "The wide distribution in 'Sales' might be correlated with the 'Region' category. A deeper analysis could confirm this.").
            4.  **Suggestions for Next Steps**: Recommend what a data analyst might want to do next (e.g., "Create a scatter plot of 'Age' vs. 'Income' to explore their relationship," or "Normalize the 'TransactionAmount' column before using it in a machine learning model.").
        `;
    }

    try {
        const client = getClient();
        const response = await client.models.generateContent({
            model: MODEL_TEXT,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5, // Keep it more factual for analysis
            }
        });

        // Parse markdown to HTML for safe rendering.
        const rawText = response.text;
        const html = marked.parse(rawText);
        return html;

    } catch (error) {
        console.error('Error getting statistical analysis from Gemini:', error);
        if (error instanceof Error) {
            return `<h3>AI Analysis Error</h3><p>An error occurred while communicating with the AI: ${error.message}</p>`;
        }
        return '<h3>AI Analysis Error</h3><p>An unknown error occurred during AI analysis.</p>';
    }
};


export const generateDocumentation = async (featuresPrompt: string): Promise<string> => {
    const fullPrompt = `
        You are an expert technical writer. Your task is to generate a complete, well-structured, and user-friendly documentation in a single HTML file.
        The application is named "MasYun Data Analyzer".
        The HTML should be self-contained with modern CSS for styling. Use a clean, dark theme with a futuristic/holographic aesthetic that would fit a data analysis application with a space theme.
        The documentation should be comprehensive, covering all features listed below. Structure it with a clear table of contents, sections, and subsections.
        Explain what each feature does, how to use it, and any key benefits. Use a professional but accessible tone.
        
        Here are the features of the application to document:
        ---
        ${featuresPrompt}
        ---
        
        Ensure the final output is ONLY the HTML code, starting with <!DOCTYPE html> and ending with </html>. Do not include any explanatory text before or after the HTML block.
        The HTML should include styles for typography, links, code blocks, tables, and callouts (like notes or tips).
        The color palette should revolve around deep blues, purples, cyans, and magentas, consistent with a "holographic" or "nebula" theme.
    `;

    try {
        const client = getClient();
        const response: GenerateContentResponse = await client.models.generateContent({
            model: MODEL_TEXT,
            contents: fullPrompt,
            config: {
                // Higher temperature for more creative/descriptive writing
                temperature: 0.8,
            }
        });
        let htmlContent = response.text;

        // Clean up the response to ensure it's just HTML
        const htmlStartIndex = htmlContent.toLowerCase().indexOf('<!doctype html>');
        if (htmlStartIndex > -1) {
            htmlContent = htmlContent.substring(htmlStartIndex);
        }
        const htmlEndIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
        if (htmlEndIndex > -1) {
            htmlContent = htmlContent.substring(0, htmlEndIndex + 7);
        }
        // Also remove markdown fences if they exist
        htmlContent = htmlContent.replace(/^```html\s*/, '').replace(/\s*```$/, '');

        return htmlContent;
    } catch (error) {
        console.error('Error generating documentation with Gemini:', error);
        if (error instanceof Error) {
            return `<h1>Error during documentation generation</h1><p>${error.message}</p>`;
        }
        return '<h1>An unknown error occurred during AI analysis.</h1>';
    }
};

export const generateDiagramFromPrompt = async (prompt: string): Promise<{ nodes: any[], edges: any[] }> => {
    const client = getClient();
    const systemInstruction = `You are a creative diagram designer. Your task is to generate a JSON object representing a visually appealing diagram from text. The JSON object must have "nodes" and "edges".

- "nodes" is an array. Each node must have:
  - "id": A unique string (e.g., "node-1").
  - "type": "rectangle", "ellipse", "diamond", or "image".
  - "position": An object with "x" and "y" numbers. Arrange nodes logically.
  - "size": An object with "width" and "height".
  - "data": An object with:
    - "label": The text inside the node.
    - "style": An object. CRITICAL: For each node, assign a unique and vibrant \`backgroundColor\` and a contrasting \`borderColor\` from a futuristic palette (e.g., #0e182d, #1f2937 for backgrounds; #3b82f6, #8b5cf6, #10b981, #06b6d4, #eab308 for borders). Also set \`color\` for the text to be readable (e.g., #e5e7eb). If the user asks for an icon, include an "icon" property with a keyword (e.g., "database", "cloud").

- "edges" is an array. Each edge must have:
  - "id": A unique string (e.g., "edge-1").
  - "source": The source node "id".
  - "target": The target node "id".
  - "label": An optional label string.

Respond ONLY with the perfectly valid JSON object. Do not include any other text or markdown fences.

Example User Prompt: "Create a workflow for a web server. Start with a 'Client Request', which goes to a 'Load Balancer'. The load balancer then sends traffic to one of two 'Web Server' nodes, which both connect to a 'Database' node with a database icon."

Example JSON Response:
{
  "nodes": [
    { "id": "node-1", "type": "ellipse", "position": { "x": 325, "y": 50 }, "size": { "width": 150, "height": 50 }, "data": { "label": "Client Request", "style": { "backgroundColor": "#1f2937", "borderColor": "#3b82f6", "color": "#e5e7eb" } } },
    { "id": "node-2", "type": "rectangle", "position": { "x": 325, "y": 150 }, "size": { "width": 150, "height": 75 }, "data": { "label": "Load Balancer", "style": { "backgroundColor": "#1f2937", "borderColor": "#10b981", "color": "#e5e7eb" } } },
    { "id": "node-3", "type": "rectangle", "position": { "x": 200, "y": 275 }, "size": { "width": 150, "height": 75 }, "data": { "label": "Web Server 1", "style": { "backgroundColor": "#0e182d", "borderColor": "#06b6d4", "color": "#e5e7eb" } } },
    { "id": "node-4", "type": "rectangle", "position": { "x": 450, "y": 275 }, "size": { "width": 150, "height": 75 }, "data": { "label": "Web Server 2", "style": { "backgroundColor": "#0e182d", "borderColor": "#06b6d4", "color": "#e5e7eb" } } },
    { "id": "node-5", "type": "rectangle", "position": { "x": 325, "y": 425 }, "size": { "width": 150, "height": 75 }, "data": { "label": "Database", "style": { "icon": "database", "backgroundColor": "#1f2937", "borderColor": "#eab308", "color": "#e5e7eb" } } }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-1", "target": "node-2" },
    { "id": "edge-2", "source": "node-2", "target": "node-3" },
    { "id": "edge-3", "source": "node-2", "target": "node-4" },
    { "id": "edge-4", "source": "node-3", "target": "node-5" },
    { "id": "edge-5", "source": "node-4", "target": "node-5" }
  ]
}
`;

    const response = await client.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2, // Lower temperature for more predictable, structured output
        }
    });

    let jsonStr = response.text.trim();
    
    // The model might return the JSON inside markdown fences, with leading/trailing text.
    // This logic attempts to extract the core JSON object.
    const fenceRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/s;
    const fenceMatch = jsonStr.match(fenceRegex);
    
    if (fenceMatch && fenceMatch[1]) {
        jsonStr = fenceMatch[1];
    } else {
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
    }

    if (!jsonStr.startsWith('{')) {
        console.error("Diagram generation response was not valid JSON:", jsonStr);
        throw new Error(`The AI returned a non-JSON response. Please try again or rephrase your prompt.`);
    }

    try {
        const parsedData = JSON.parse(jsonStr);
        if (parsedData.nodes && parsedData.edges && Array.isArray(parsedData.nodes) && Array.isArray(parsedData.edges)) {
            // Ensure nodes have a data.style object, even if data or style is missing from the AI response
            const sanitizedNodes = parsedData.nodes.map((node: any) => ({
                ...node,
                data: {
                    ...(node.data || {}),
                    style: node.data?.style || {}
                }
            }));
            return { nodes: sanitizedNodes, edges: parsedData.edges };
        }
        throw new Error("Invalid JSON structure received from AI: missing 'nodes' or 'edges' array.");
    } catch (e: any) {
        console.error("Failed to parse JSON response from AI:", e);
        console.error("Attempted to parse the following text:", jsonStr);
        throw new Error(`The AI returned a malformed response that could not be parsed as JSON. Please try again or rephrase your prompt. Error: ${e.message}`);
    }
};

export const geocodeAddressWithGemini = async (address: string): Promise<LatLngTuple | { error: string }> => {
    const client = getClient();
    const prompt = `
      You are a geocoding service. Given the following address, provide its latitude and longitude.
      Address: "${address}"
      Respond with ONLY a valid JSON object in the format: {"lat": number, "lng": number}.
      If you cannot determine the coordinates, respond with: {"error": "Unable to geocode address."}
    `;

    try {
        const response = await client.models.generateContent({
            model: MODEL_TEXT,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0,
            }
        });

        const jsonStr = response.text.trim();
        if (!jsonStr.startsWith('{')) {
            console.error("Geocoding response was not valid JSON:", jsonStr);
            return { error: 'Invalid response format from AI geocoding service.' };
        }

        const parsedData = JSON.parse(jsonStr);
        
        if (parsedData.error) {
            return { error: parsedData.error };
        }
        if (typeof parsedData.lat === 'number' && typeof parsedData.lng === 'number') {
            return [parsedData.lat, parsedData.lng];
        }
        return { error: 'Invalid coordinates format from AI.' };

    } catch (error: any) {
        console.error("Error geocoding with Gemini:", error);
        return { error: error.message || "Failed to communicate with AI for geocoding." };
    }
};

export const getRouteAnalysisForDisplay = async (
    from: string,
    to: string,
    distance: string | null,
    duration: string | null,
    travelMode: TravelMode,
    countryContext: string
): Promise<string> => {
    const client = getClient();
    const prompt = `
      Provide a brief, insightful analysis for a route in ${countryContext}.
      - **From**: ${from}
      - **To**: ${to}
      - **Travel Mode**: ${travelMode}
      - **Distance**: ${distance}
      - **Estimated Duration**: ${duration}

      Your analysis should be in concise markdown and touch upon:
      1.  **A general overview** of the trip (e.g., "This is a significant cross-country journey...").
      2.  **Potential challenges** based on the travel mode and geography (e.g., "Expect varied terrain and potential for traffic in urban centers.", "As a walking route, this would require extensive planning and supplies.").
      3.  **One or two interesting landmarks or cities** that might be along or near the general path.
      
      Keep the response brief and easy to read.
    `;
    try {
        const response = await client.models.generateContent({ model: MODEL_TEXT, contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error getting route analysis from Gemini:", error);
        return "Could not load AI analysis for this route.";
    }
};

export const analyzeTextWithGemini = async (
    prompt: string,
    dataContext?: any, // Optional structured data context
    responseType: 'text' | 'json' = 'text'
): Promise<{ type: 'text' | 'json' | 'error', content: string | any }> => {
    const client = getClient();
    let fullPrompt = prompt;
    if (dataContext) {
        fullPrompt += `\n\n### Data Context\n\`\`\`json\n${JSON.stringify(dataContext, null, 2)}\n\`\`\``;
    }
    try {
        const response = await client.models.generateContent({
            model: MODEL_TEXT,
            contents: fullPrompt,
            config: {
                ...(responseType === 'json' && { responseMimeType: "application/json" }),
            }
        });

        if (responseType === 'json') {
            let jsonStr = response.text.trim();
            
            const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[1]) {
                jsonStr = match[1].trim();
            }
            
            if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
                console.error("AI response for JSON was not valid JSON:", jsonStr);
                return { type: 'error', content: 'AI returned a non-JSON response. It might be an error message.' };
            }

            try {
                return { type: 'json', content: JSON.parse(jsonStr) };
            } catch (e) {
                console.error("Failed to parse AI JSON response:", e, "\nString was:", jsonStr);
                return { type: 'error', content: 'Failed to parse JSON response from AI.' };
            }
        }
        return { type: 'text', content: response.text };

    } catch (error: any) {
        console.error("Error in analyzeTextWithGemini:", error);
        return { type: 'error', content: error.message || "An unknown error occurred during AI analysis." };
    }
};

console.log('Gemini Service initialized. Ensure API_KEY is set in your environment.');