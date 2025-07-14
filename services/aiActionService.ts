import { GoogleGenAI, Type } from '@google/genai';
import { AIActionPlan, AggregatorType } from '../types';
import { MODEL_TEXT } from '../constants';

const systemInstruction = `
You are a workflow planning AI for the "MasYun Data Analyzer" application.
Your task is to convert a user's natural language command into a structured JSON array of executable commands.
You MUST ONLY respond with the JSON array. Do not include any other text, markdown, or explanations.

The response must be a valid JSON array where each object has:
- "step": An integer starting from 1.
- "action": An object with a "command" name and its parameters.
- "explanation": A short, user-friendly string explaining what this step does.

Available Commands & Parameters:
1.  command: "NAVIGATE"
    - "view": (string) The ID of the view to navigate to.
    - Available views: 'welcome', 'dashboard', 'dataUpload', 'dataTable', 'visualizations', 'pivotTable', 'statisticalAnalysis', 'aiAssistant', 'map'.
    - Example: {"step": 1, "action": {"command": "NAVIGATE", "view": "dataUpload"}, "explanation": "Navigating to the Data Upload page."}

2.  command: "CREATE_PIVOT"
    - "name": (string) The name for the new pivot table report.
    - "rows": (string[]) An array of field names to use as rows.
    - "columns": (string[]) An array of field names to use as columns.
    - "values": (object[]) An array of value objects, each with:
        - "field": (string) The name of the field to aggregate.
        - "aggregator": (string) The aggregation function to use.
    - Available aggregators: 'sum', 'count', 'average', 'min', 'max', 'countNonEmpty'.
    - Example: {"step": 2, "action": {"command": "CREATE_PIVOT", "name": "Sales by Region", "rows": ["Region"], "columns": ["Category"], "values": [{"field": "Sales", "aggregator": "sum"}]}, "explanation": "Creating a new pivot table named 'Sales by Region'."}

3. command: "LOG_MESSAGE"
   - "message": (string) The message to display to the user.
   - "type": (string) The message type: 'info', 'success', or 'warning'.
   - Example: {"step": 3, "action": {"command": "LOG_MESSAGE", "message": "Pivot table created. Please click 'Update Analysis' to see the results.", "type": "info"}, "explanation": "Displaying a message to the user."}

Analyze the user's prompt and the available data fields to create a logical sequence of commands.
If the user's request is ambiguous or cannot be mapped to the available commands, return an empty array [].
`;

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            step: { type: Type.INTEGER },
            action: {
                type: Type.OBJECT,
                properties: {
                    command: { type: Type.STRING },
                    view: { type: Type.STRING },
                    name: { type: Type.STRING },
                    rows: { type: Type.ARRAY, items: { type: Type.STRING } },
                    columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                    values: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                field: { type: Type.STRING },
                                aggregator: { type: Type.STRING }
                            }
                        }
                    },
                    message: { type: Type.STRING },
                    type: { type: Type.STRING }
                },
                required: ["command"]
            },
            explanation: { type: Type.STRING }
        },
        required: ["step", "action", "explanation"]
    }
};

export const generateActionPlan = async (prompt: string, context: { fileHeaders: string[] }): Promise<AIActionPlan> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const fullPrompt = `User Command: "${prompt}"\n\nAvailable data fields: [${context.fileHeaders.join(', ')}]`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: fullPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const responseText = response.text;
        if (!responseText) {
            throw new Error("Received an empty response from the AI.");
        }

        const plan = JSON.parse(responseText);
        
        if (!Array.isArray(plan)) {
            throw new Error("AI did not return a valid JSON array for the action plan.");
        }

        // Basic validation of the plan structure
        const isValidPlan = plan.every(item => 
            typeof item.step === 'number' &&
            typeof item.action === 'object' &&
            typeof item.action.command === 'string' &&
            typeof item.explanation === 'string'
        );

        if (!isValidPlan) {
            throw new Error("The AI-generated plan has an invalid structure.");
        }

        return plan as AIActionPlan;

    } catch (error) {
        console.error("Error generating AI action plan:", error);
        throw new Error(`Failed to generate a valid action plan from the AI. Please try rephrasing your command. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
