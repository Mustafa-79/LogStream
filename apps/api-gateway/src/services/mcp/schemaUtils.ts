import { GeminiTool, MCPTool } from './types';

export class SchemaUtils {
    static sanitizeSchemaForGemini(schema: any): any {
        if (!schema || typeof schema !== 'object') {
            return { type: "object", properties: {}, required: [] };
        }

        // Create a clean schema object with only Gemini-supported properties
        const cleanSchema: any = {
            type: "object",
            properties: {},
            required: schema.required || []
        };

        // Recursively clean properties
        if (schema.properties && typeof schema.properties === 'object') {
            cleanSchema.properties = this.cleanProperties(schema.properties);
        }

        return cleanSchema;
    }

    static convertMCPToolsToGemini(tools: MCPTool[]): GeminiTool[] {
        return tools.map(tool => ({
            name: tool.name,
            description: tool.description || `Tool: ${tool.name}`,
            parameters: this.sanitizeSchemaForGemini(tool.inputSchema)
        }));
    }

    private static cleanProperties(properties: Record<string, any>): Record<string, any> {
        const cleanProps: Record<string, any> = {};

        for (const [key, value] of Object.entries(properties)) {
            if (!value || typeof value !== 'object') {
                cleanProps[key] = { type: "string" };
                continue;
            }

            const cleanProp: any = {};

            // Copy only supported properties
            if (value.type) {
                cleanProp.type = value.type;
            } else {
                cleanProp.type = "string";
            }

            if (value.description) {
                cleanProp.description = value.description;
            }

            if (value.enum && Array.isArray(value.enum)) {
                cleanProp.enum = value.enum;
            }

            // Handle array types
            if (value.type === 'array' && value.items) {
                cleanProp.items = this.cleanSchemaObject(value.items);
            }

            // Handle object types
            if (value.type === 'object' && value.properties) {
                cleanProp.properties = this.cleanProperties(value.properties);
                if (value.required) {
                    cleanProp.required = value.required;
                }
            }

            cleanProps[key] = cleanProp;
        }

        return cleanProps;
    }

    private static cleanSchemaObject(obj: any): any {
        if (!obj || typeof obj !== 'object') {
            return { type: "string" };
        }

        const cleaned: any = {};

        // Only include basic JSON Schema properties supported by Gemini
        if (obj.type) {
            cleaned.type = obj.type;
        } else {
            cleaned.type = "string";
        }

        if (obj.description) {
            cleaned.description = obj.description;
        }

        if (obj.enum && Array.isArray(obj.enum)) {
            cleaned.enum = obj.enum;
        }

        if (obj.type === 'array' && obj.items) {
            cleaned.items = this.cleanSchemaObject(obj.items);
        }

        if (obj.type === 'object' && obj.properties) {
            cleaned.properties = this.cleanProperties(obj.properties);
            if (obj.required) {
                cleaned.required = obj.required;
            }
        }

        return cleaned;
    }
}
