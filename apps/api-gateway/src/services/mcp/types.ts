export interface UserContext {
    userId?: string;
    role?: string;
    userGroup?: string;
    permissions?: string[];
}

export interface MCPTool {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
        [key: string]: any;
    };
}

export interface GeminiTool {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties?: Record<string, any>;
        required?: string[];
        [key: string]: any;
    };
}

export interface QueryResult {
    tool: string;
    input: Record<string, any>;
    output?: any;
    error?: string;
    success: boolean;
}

export interface QueryResponse {
    query_results?: QueryResult[];
    interpretation: string;
    success: boolean;
    conversationHistory?: any[];
}

export interface AccessCheckResult {
    allowed: boolean;
    reason?: string;
    modifiedInput?: any;
}
