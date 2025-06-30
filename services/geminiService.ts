// This file is a placeholder for more complex Gemini API interactions.
// For the current chat functionality, the logic is within AIChat.tsx for simplicity.
// If more features use Gemini (e.g., data analysis insights), centralize API calls here.

import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from '@google/genai';
import { MODEL_TEXT } from '../constants';
import { marked } from 'marked'; // Using a proper markdown parser for safety and features
import { LatLngTuple } from '../types';

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

// Retry mechanism with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a quota/rate limit error
      const isQuotaError = error?.error?.code === 429 || 
                          error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                          error?.message?.includes('quota') ||
                          error?.message?.includes('rate limit');
      
      // If it's the last attempt or not a quota error, throw immediately
      if (attempt === maxRetries || !isQuotaError) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Gemini API quota exceeded, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Generic command function for AI text generation
export const generateAICommand = async (prompt: string): Promise<string> => {
  return retryWithBackoff(async () => {
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
      throw error; // Re-throw for handling in retry mechanism
    }
  });
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
    return retryWithBackoff(async () => {
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
            throw error; // Re-throw for retry mechanism
        }
    }).catch(error => {
        // Final fallback after all retries failed
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
    });
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

    return retryWithBackoff(async () => {
        try {
            const client = getClient();
            const response: GenerateContentResponse = await client.models.generateContent({
                model: MODEL_TEXT,
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            console.error('Error analyzing data with Gemini:', error);
            throw error; // Re-throw for retry mechanism
        }
    }).catch(error => {
        if (error instanceof Error) {
            return `Error during analysis: ${error.message}`;
        }
        return 'An unknown error occurred during AI analysis.';
    });
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

    return retryWithBackoff(async () => {
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
            throw error; // Re-throw for retry mechanism
        }
    }).catch(error => {
        if (error instanceof Error) {
            return `<h3>AI Analysis Error</h3><p>An error occurred while communicating with the AI: ${error.message}</p>`;
        }
        return '<h3>AI Analysis Error</h3><p>An unknown error occurred during AI analysis.</p>';
    });
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

    return retryWithBackoff(async () => {
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
            throw error; // Re-throw for retry mechanism
        }
    }).catch(error => {
        if (error instanceof Error) {
            return `<h1>Error during documentation generation</h1><p>${error.message}</p>`;
        }
        return '<h1>An unknown error occurred during AI analysis.</h1>';
    });
};

export const generateDiagramFromPrompt = async (prompt: string): Promise<{ nodes: any[], edges: any[] }> => {
    return retryWithBackoff(async () => {
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
    });
};

// --- NEW: Enhanced Route Planner Functions ---

export const geocodeAddressWithGemini = async (address: string): Promise<LatLngTuple | { error: string }> => {
    try {
        return await retryWithBackoff(async () => {
            try {
                const client = getClient();
                const prompt = `Convert this address to latitude and longitude coordinates: "${address}". 
                Respond ONLY with the coordinates in the format: latitude,longitude (e.g., -6.2088,106.8456).
                If you cannot determine the coordinates, respond with "ERROR: Unable to geocode address".`;
                
                const response = await client.models.generateContent({
                    model: MODEL_TEXT,
                    contents: prompt,
                    config: {
                        temperature: 0.1, // Very low temperature for factual responses
                    }
                });
                
                const text = response.text.trim();
                
                if (text.startsWith('ERROR:')) {
                    return { error: text.replace('ERROR:', '').trim() };
                }
                
                const coords = text.split(',').map(coord => parseFloat(coord.trim()));
                if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    return [coords[0], coords[1]];
                }
                
                return { error: 'Invalid coordinate format received from AI' };
            } catch (error) {
                console.error('Error geocoding with Gemini:', error);
                throw error; // Re-throw for retry mechanism
            }
        });
    } catch (error: any) {
        console.error('Final geocoding error after retries:', error);
        
        // Check if it's a quota error and provide user-friendly message
        const isQuotaError = error?.error?.code === 429 || 
                            error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                            error?.message?.includes('quota') ||
                            error?.message?.includes('rate limit');
        
        if (isQuotaError) {
            return { error: 'API quota exceeded. Please try again later or check your API plan.' };
        }
        
        return { error: 'Failed to geocode address. Please try again later.' };
    }
};

export const reverseGeocodeWithGemini = async (lat: number, lng: number): Promise<{ address: string; city: string; country: string; fullLocation: string } | { error: string }> => {
    try {
        return await retryWithBackoff(async () => {
            try {
                const client = getClient();
                const prompt = `Convert these coordinates to a readable address and location information: ${lat}, ${lng}
                
                Respond in this exact format:
                ADDRESS: [full street address or landmark name]
                CITY: [city name]
                COUNTRY: [country name]
                FULL_LOCATION: [complete location description including city and country]
                
                If you cannot determine the location, respond with:
                ERROR: Unable to reverse geocode coordinates
                
                Example response:
                ADDRESS: Jalan Sudirman No. 1
                CITY: Jakarta
                COUNTRY: Indonesia
                FULL_LOCATION: Jakarta, Indonesia`;
                
                const response = await client.models.generateContent({
                    model: MODEL_TEXT,
                    contents: prompt,
                    config: {
                        temperature: 0.1,
                    }
                });
                
                const text = response.text.trim();
                
                if (text.startsWith('ERROR:')) {
                    return { error: text.replace('ERROR:', '').trim() };
                }
                
                const addressMatch = text.match(/ADDRESS:\s*(.+)/);
                const cityMatch = text.match(/CITY:\s*(.+)/);
                const countryMatch = text.match(/COUNTRY:\s*(.+)/);
                const fullLocationMatch = text.match(/FULL_LOCATION:\s*(.+)/);
                
                if (addressMatch && cityMatch && countryMatch && fullLocationMatch) {
                    return {
                        address: addressMatch[1].trim(),
                        city: cityMatch[1].trim(),
                        country: countryMatch[1].trim(),
                        fullLocation: fullLocationMatch[1].trim()
                    };
                }
                
                return { error: 'Invalid response format from AI' };
            } catch (error) {
                console.error('Error reverse geocoding with Gemini:', error);
                throw error; // Re-throw for retry mechanism
            }
        });
    } catch (error: any) {
        console.error('Final reverse geocoding error after retries:', error);
        
        // Check if it's a quota error and provide user-friendly message
        const isQuotaError = error?.error?.code === 429 || 
                            error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                            error?.message?.includes('quota') ||
                            error?.message?.includes('rate limit');
        
        if (isQuotaError) {
            return { error: 'API quota exceeded. Please try again later or check your API plan.' };
        }
        
        return { error: 'Failed to reverse geocode coordinates. Please try again later.' };
    }
};

export const findNearestValidCoordinates = async (lat: number, lng: number): Promise<{ coordinates: LatLngTuple; address: string; city: string; country: string; fullLocation: string; distance: string } | { error: string }> => {
    try {
        return await retryWithBackoff(async () => {
            try {
                const client = getClient();
                const prompt = `The coordinates ${lat}, ${lng} appear to be invalid or in an inaccessible location (possibly in the ocean, desert, or restricted area). 
                Find the nearest valid, accessible, populated location (like a nearby city, town, landmark, or populated area) and provide:
                
                COORDINATES: [latitude,longitude]
                ADDRESS: [readable address or landmark name]
                CITY: [city name]
                COUNTRY: [country name]
                FULL_LOCATION: [complete location description]
                DISTANCE: [approximate distance from original coordinates, e.g., "15 km away"]
                
                If you cannot find a suitable nearby location, respond with:
                ERROR: No valid nearby location found
                
                Example response:
                COORDINATES: -6.2088,106.8456
                ADDRESS: Jakarta City Center
                CITY: Jakarta
                COUNTRY: Indonesia
                FULL_LOCATION: Jakarta, Indonesia
                DISTANCE: 25 km away`;
                
                const response = await client.models.generateContent({
                    model: MODEL_TEXT,
                    contents: prompt,
                    config: {
                        temperature: 0.2,
                    }
                });
                
                const text = response.text.trim();
                
                if (text.startsWith('ERROR:')) {
                    return { error: text.replace('ERROR:', '').trim() };
                }
                
                const coordsMatch = text.match(/COORDINATES:\s*([^,]+),\s*(.+)/);
                const addressMatch = text.match(/ADDRESS:\s*(.+)/);
                const cityMatch = text.match(/CITY:\s*(.+)/);
                const countryMatch = text.match(/COUNTRY:\s*(.+)/);
                const fullLocationMatch = text.match(/FULL_LOCATION:\s*(.+)/);
                const distanceMatch = text.match(/DISTANCE:\s*(.+)/);
                
                if (coordsMatch && addressMatch && cityMatch && countryMatch && fullLocationMatch) {
                    const newLat = parseFloat(coordsMatch[1].trim());
                    const newLng = parseFloat(coordsMatch[2].trim());
                    
                    if (!isNaN(newLat) && !isNaN(newLng)) {
                        return {
                            coordinates: [newLat, newLng],
                            address: addressMatch[1].trim(),
                            city: cityMatch[1].trim(),
                            country: countryMatch[1].trim(),
                            fullLocation: fullLocationMatch[1].trim(),
                            distance: distanceMatch ? distanceMatch[1].trim() : 'Unknown distance'
                        };
                    }
                }
                
                return { error: 'Invalid response format from AI' };
            } catch (error) {
                console.error('Error finding nearest valid coordinates:', error);
                throw error; // Re-throw for retry mechanism
            }
        });
    } catch (error: any) {
        console.error('Final nearest coordinates error after retries:', error);
        
        // Check if it's a quota error and provide user-friendly message
        const isQuotaError = error?.error?.code === 429 || 
                            error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                            error?.message?.includes('quota') ||
                            error?.message?.includes('rate limit');
        
        if (isQuotaError) {
            return { error: 'API quota exceeded. Please try again later or check your API plan.' };
        }
        
        return { error: 'Failed to find nearest valid location. Please try again later.' };
    }
};

export const enhancedBulkGeocoding = async (input: string, isCoordinate: boolean = false): Promise<{
    originalInput: string;
    resolvedCoordinates: LatLngTuple | null;
    resolvedAddress: string;
    resolvedCity: string;
    resolvedCountry: string;
    resolvedFullLocation: string;
    processingType: 'coordinate_to_address' | 'address_to_coordinate' | 'nearest_valid_found' | 'failed';
    additionalInfo?: string;
    error?: string;
}> => {
    try {
        return await retryWithBackoff(async () => {
            try {
                const result = {
                    originalInput: input,
                    resolvedCoordinates: null as LatLngTuple | null,
                    resolvedAddress: '',
                    resolvedCity: '',
                    resolvedCountry: '',
                    resolvedFullLocation: '',
                    processingType: 'failed' as const,
                    additionalInfo: '',
                    error: ''
                };

                if (isCoordinate) {
                    // Input is coordinates - try to get address
                    const coords = input.split(',').map(c => parseFloat(c.trim()));
                    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                        result.resolvedCoordinates = [coords[0], coords[1]];
                        
                        // Try reverse geocoding
                        const reverseResult = await reverseGeocodeWithGemini(coords[0], coords[1]);
                        if (reverseResult && !('error' in reverseResult)) {
                            result.resolvedAddress = reverseResult.address;
                            result.resolvedCity = reverseResult.city;
                            result.resolvedCountry = reverseResult.country;
                            result.resolvedFullLocation = reverseResult.fullLocation;
                            result.processingType = 'coordinate_to_address';
                            result.additionalInfo = 'Successfully converted coordinates to address';
                        } else {
                            // Try to find nearest valid coordinates
                            const nearestResult = await findNearestValidCoordinates(coords[0], coords[1]);
                            if (nearestResult && !('error' in nearestResult)) {
                                result.resolvedCoordinates = nearestResult.coordinates;
                                result.resolvedAddress = nearestResult.address;
                                result.resolvedCity = nearestResult.city;
                                result.resolvedCountry = nearestResult.country;
                                result.resolvedFullLocation = nearestResult.fullLocation;
                                result.processingType = 'nearest_valid_found';
                                result.additionalInfo = `Found nearest valid location: ${nearestResult.distance}`;
                            } else {
                                result.error = 'Could not resolve coordinates to address or find nearest valid location';
                                result.resolvedAddress = `Coordinates: ${coords[0]}, ${coords[1]}`;
                                result.resolvedFullLocation = `Unknown Location (${coords[0]}, ${coords[1]})`;
                            }
                        }
                    } else {
                        result.error = 'Invalid coordinate format';
                    }
                } else {
                    // Input is address - try to get coordinates
                    const geocodeResult = await geocodeAddressWithGemini(input);
                    if (geocodeResult && !('error' in geocodeResult)) {
                        result.resolvedCoordinates = geocodeResult;
                        result.resolvedAddress = input;
                        result.resolvedFullLocation = input;
                        result.processingType = 'address_to_coordinate';
                        result.additionalInfo = 'Successfully converted address to coordinates';
                        
                        // Try to get more detailed location info
                        const reverseResult = await reverseGeocodeWithGemini(geocodeResult[0], geocodeResult[1]);
                        if (reverseResult && !('error' in reverseResult)) {
                            result.resolvedCity = reverseResult.city;
                            result.resolvedCountry = reverseResult.country;
                            result.resolvedFullLocation = reverseResult.fullLocation;
                        }
                    } else {
                        result.error = 'Could not geocode address';
                        result.resolvedAddress = input;
                        result.resolvedFullLocation = input;
                    }
                }

                return result;
            } catch (error) {
                console.error('Error in enhanced bulk geocoding:', error);
                throw error;
            }
        });
    } catch (error: any) {
        console.error('Final enhanced bulk geocoding error after retries:', error);
        
        // Check if it's a quota error and provide user-friendly message
        const isQuotaError = error?.error?.code === 429 || 
                            error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                            error?.message?.includes('quota') ||
                            error?.message?.includes('rate limit');
        
        const errorMessage = isQuotaError ? 
            'API quota exceeded. Please try again later or check your API plan.' :
            'Failed to process location after multiple attempts. Please try again later.';
        
        return {
            originalInput: input,
            resolvedCoordinates: null,
            resolvedAddress: input,
            resolvedCity: '',
            resolvedCountry: '',
            resolvedFullLocation: input,
            processingType: 'failed' as const,
            error: errorMessage
        };
    }
};

export const getRouteAnalysisForDisplay = async (
    fromLocation: string,
    toLocation: string,
    distance: string | null,
    duration: string | null,
    travelMode: string,
    country: string
): Promise<string> => {
    return retryWithBackoff(async () => {
        try {
            const client = getClient();
            const prompt = `Provide a brief route analysis for travel in ${country}:
            From: ${fromLocation}
            To: ${toLocation}
            Distance: ${distance || 'Unknown'}
            Estimated Duration: ${duration || 'Unknown'}
            Travel Mode: ${travelMode}
            
            Provide insights about:
            - Route characteristics and terrain
            - Traffic considerations
            - Best travel times
            - Alternative transportation options
            - Local travel tips
            
            Keep response under 150 words and use markdown formatting.`;
            
            const response = await client.models.generateContent({
                model: MODEL_TEXT,
                contents: prompt,
                config: {
                    temperature: 0.7,
                }
            });
            
            return response.text;
        } catch (error) {
            console.error('Error getting route analysis:', error);
            throw error; // Re-throw for retry mechanism
        }
    }).catch(error => {
        console.error('Final route analysis error after retries:', error);
        return 'Unable to generate route analysis at this time. Please try again later.';
    });
};

export const analyzeTextWithGemini = async (
    prompt: string,
    context?: string,
    responseType: 'text' | 'json' = 'text'
): Promise<{ type: 'text' | 'error'; content: string }> => {
    return retryWithBackoff(async () => {
        try {
            const client = getClient();
            let fullPrompt = prompt;
            if (context) {
                fullPrompt = `Context: ${context}\n\nQuery: ${prompt}`;
            }
            
            const response = await client.models.generateContent({
                model: MODEL_TEXT,
                contents: fullPrompt,
                config: {
                    temperature: 0.6,
                    responseMimeType: responseType === 'json' ? 'application/json' : undefined,
                }
            });
            
            return { type: 'text', content: response.text };
        } catch (error) {
            console.error('Error analyzing text with Gemini:', error);
            throw error; // Re-throw for retry mechanism
        }
    }).catch(error => {
        console.error('Final text analysis error after retries:', error);
        return { 
            type: 'error', 
            content: error instanceof Error ? 
                `Analysis failed after multiple attempts: ${error.message}` : 
                'Unknown error occurred during text analysis. Please try again later.' 
        };
    });
};

// You could add functions for image generation, specific data analysis prompts, etc.
// For example:
// export const analyzeDataWithAI = async (dataDescription: string, analysisGoal: string): Promise<string> => {
//   const prompt = `Analyze the following data: ${dataDescription}. The goal is: ${analysisGoal}. Provide insights.`;
//   return generateText(prompt);
// };

console.log('Gemini Service initialized with enhanced route processing capabilities. Ensure API_KEY is set in your environment.');