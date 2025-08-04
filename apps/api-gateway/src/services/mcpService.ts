import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import enhancedLogger from "../config/logger";
import config from '../config/config';

// Import our modular components
import { UserContext, MCPTool, GeminiTool, QueryResult, QueryResponse } from './mcp/types';
import { AccessController } from './mcp/accessController';
import { ConversationManager } from './mcp/conversationManager';
import { QueryAnalyzer } from './mcp/queryAnalyzer';
import { SchemaUtils } from './mcp/schemaUtils';
import { SystemPromptGenerator } from './mcp/systemPromptGenerator';

class MongoMCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private genAI: GoogleGenerativeAI;
    private model: any;
    private isConnected: boolean = false;
    private accessController: AccessController | null = null;

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async initialize(): Promise<void> {
        try {
            // Get MongoDB URI from config
            const mongoUri = config.mongoose;

            if (!mongoUri) {
                throw new Error('MongoDB URI not found in config or environment variables');
            }

            // Initialize MCP client with MongoDB server using npx
            this.transport = new StdioClientTransport({
                command: "npx",
                args: [
                    "-y",
                    "mongodb-mcp-server",
                    "--connectionString",
                    mongoUri
                ],
                env: {
                    ...process.env,
                    MONGODB_URI: mongoUri
                }
            });

            this.client = new Client({
                name: "logging-dashboard-client",
                version: "1.0.0"
            }, {
                capabilities: {
                    tools: {}
                }
            });

            // Add connection timeout
            const connectTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('MCP connection timeout after 30 seconds')), 30000);
            });

            await Promise.race([
                this.client.connect(this.transport),
                connectTimeout
            ]);

            this.isConnected = true;
            this.accessController = new AccessController(this.client);
            enhancedLogger.info('MongoDB MCP client connected successfully');
        } catch (error: any) {
            enhancedLogger.error('Failed to initialize MCP client:', error);

            this.isConnected = false;
            throw error;
        }
    }

    async executeNaturalLanguageQuery(
        userQuery: string,
        userContext: UserContext = {},
        conversationHistory: any[] = []
    ): Promise<QueryResponse> {
        if (!this.isConnected || !this.client || !this.accessController) {
            throw new Error('MCP client not connected');
        }

        try {
            const toolsResponse = await this.client.listTools();
            const availableTools = toolsResponse.tools || [];

            const geminiTools: GeminiTool[] = SchemaUtils.convertMCPToolsToGemini(availableTools);
            const systemPrompt = SystemPromptGenerator.buildSystemPrompt(userContext);

            const allResults: QueryResult[] = [];
            let iterationCount = 0;
            const maxIterations = 5;
            
            const { conversationHistory: processedHistory, systemInstruction } = ConversationManager.buildConversationHistory(
                conversationHistory, 
                systemPrompt, 
                userQuery
            );
            let currentConversationHistory = processedHistory;

            while (iterationCount < maxIterations) {
                iterationCount++;
                enhancedLogger.info(`MCP Query iteration ${iterationCount}`);

                const response = await this.model.generateContent({
                    contents: currentConversationHistory,
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    tools: geminiTools.length > 0 ? [{
                        functionDeclarations: geminiTools.map(tool => ({
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters
                        }))
                    }] : undefined,
                    generationConfig: {
                        maxOutputTokens: 4000,
                        temperature: 0.1,
                    }
                });

                const responseText = response.response.text();
                const functionCalls = response.response.functionCalls();

                // Add assistant response to conversation history
                const assistantMessage: any = {
                    role: "model",
                    parts: []
                };

                if (responseText) {
                    assistantMessage.parts.push({ text: responseText });
                }

                if (functionCalls && functionCalls.length > 0) {
                    for (const call of functionCalls) {
                        assistantMessage.parts.push({
                            functionCall: {
                                name: call.name,
                                args: call.args
                            }
                        });
                    }
                }

                currentConversationHistory.push(assistantMessage);

                // Check if this looks like a final answer
                if (!functionCalls || functionCalls.length === 0) {
                    return {
                        query_results: allResults,
                        interpretation: responseText || "Query completed",
                        success: true,
                        conversationHistory: currentConversationHistory
                    };
                }

                // Check if we're repeating the same tool calls
                if (iterationCount > 2 && QueryAnalyzer.hasRepeatedToolCalls(allResults, functionCalls)) {
                    enhancedLogger.warn('Detected repeated tool calls, stopping to prevent infinite loop');
                    
                    const finalInterpretation = responseText || QueryAnalyzer.generateSummaryFromResults(allResults);
                    currentConversationHistory.push({
                        role: "model",
                        parts: [{ text: finalInterpretation }]
                    });
                    
                    return {
                        query_results: allResults,
                        interpretation: finalInterpretation,
                        success: true,
                        conversationHistory: currentConversationHistory
                    };
                }

                // Execute function calls
                const { functionResults, iterationResults } = await this.executeFunctionCalls(
                    functionCalls, 
                    userContext, 
                    currentConversationHistory, 
                    allResults
                );

                // Add function results to conversation history
                if (functionResults.length > 0) {
                    const resultTexts = this.formatFunctionResults(functionResults);
                    currentConversationHistory.push({
                        role: "user",
                        parts: [{ text: `Tool Results: ${resultTexts.join('\n')}` }]
                    });
                }

                // Check if we have enough information for a complete answer
                if (QueryAnalyzer.hasCompleteAnswer(allResults, userQuery)) {
                    enhancedLogger.info('Detected complete answer, prompting for final response');
                    currentConversationHistory.push({
                        role: "user", 
                        parts: [{ text: "Based on the tool results above, please provide a complete and final answer to the user's question. Do not make any more tool calls." }]
                    });
                    
                    const finalResponse = await this.model.generateContent({
                        contents: currentConversationHistory,
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        },
                        generationConfig: {
                            maxOutputTokens: 2000,
                            temperature: 0.1,
                        }
                    });

                    const finalInterpretation = finalResponse.response.text() || QueryAnalyzer.generateSummaryFromResults(allResults);
                    
                    currentConversationHistory.push({
                        role: "model",
                        parts: [{ text: finalInterpretation }]
                    });

                    return {
                        query_results: allResults,
                        interpretation: finalInterpretation,
                        success: true,
                        conversationHistory: currentConversationHistory
                    };
                }

                // If all tool calls failed, break the loop
                if (iterationResults.length > 0 && iterationResults.every((r: QueryResult) => !r.success)) {
                    enhancedLogger.warn('All tool calls failed in current iteration, ending query execution');
                    break;
                }
            }

            // Generate final interpretation
            const finalInterpretation = QueryAnalyzer.generateSummaryFromResults(allResults);
            
            currentConversationHistory.push({
                role: "model",
                parts: [{ text: finalInterpretation }]
            });
            
            return {
                query_results: allResults,
                interpretation: finalInterpretation,
                success: true,
                conversationHistory: currentConversationHistory
            };

        } catch (error: any) {
            enhancedLogger.error('Error executing natural language query:', error);
            throw error;
        }
    }

    private async executeFunctionCalls(
        functionCalls: any[], 
        userContext: UserContext, 
        conversationHistory: any[], 
        allResults: QueryResult[]
    ): Promise<{ functionResults: any[], iterationResults: QueryResult[] }> {
        const functionResults: any[] = [];
        const iterationResults: QueryResult[] = [];

        for (const functionCall of functionCalls) {
            try {
                const toolName = functionCall.name;
                const toolInput = functionCall.args;

                // Check if this is a write operation that needs confirmation
                const writeTools = ['insert', 'insertOne', 'insertMany', 'update', 'updateOne', 'updateMany', 'delete', 'deleteOne', 'deleteMany', 'replaceOne'];
                const isWriteOperation = writeTools.includes(toolName);
                
                if (isWriteOperation && !ConversationManager.hasUserConfirmedWriteOperation(conversationHistory, { name: toolName, input: toolInput })) {
                    const result: QueryResult = {
                        tool: toolName,
                        input: toolInput,
                        error: "PENDING_USER_CONFIRMATION",
                        success: false
                    };

                    iterationResults.push(result);
                    allResults.push(result);

                    functionResults.push({
                        functionResponse: {
                            name: toolName,
                            response: {
                                content: JSON.stringify({ error: "WRITE_OPERATION_CONFIRMATION_REQUIRED - This write operation requires user confirmation before execution." })
                            }
                        }
                    });
                    continue;
                }

                // Check role-based access control
                const accessCheck = this.accessController!.checkBasicAccess(toolName, toolInput, userContext);
                if (!accessCheck.allowed) {
                    const result: QueryResult = {
                        tool: toolName,
                        input: toolInput,
                        error: accessCheck.reason,
                        success: false
                    };

                    iterationResults.push(result);
                    allResults.push(result);

                    functionResults.push({
                        functionResponse: {
                            name: toolName,
                            response: {
                                content: JSON.stringify({ error: `Access Denied - ${accessCheck.reason}` })
                            }
                        }
                    });
                    continue;
                }

                // For non-admin users, modify query based on user group access
                let finalToolInput = toolInput;
                if (userContext.role !== 'admin') {
                    const groupAccessCheck = await this.accessController!.checkGroupBasedAccess(
                        toolName,
                        toolInput,
                        userContext
                    );

                    if (!groupAccessCheck.allowed) {
                        const result: QueryResult = {
                            tool: toolName,
                            input: toolInput,
                            error: groupAccessCheck.reason,
                            success: false
                        };

                        iterationResults.push(result);
                        allResults.push(result);

                        functionResults.push({
                            functionResponse: {
                                name: toolName,
                                response: {
                                    content: JSON.stringify({ error: `Access Denied - ${groupAccessCheck.reason}` })
                                }
                            }
                        });
                        continue;
                    }

                    finalToolInput = groupAccessCheck.modifiedInput || toolInput;
                }

                const toolResult = await this.client!.callTool({
                    name: toolName,
                    arguments: (finalToolInput || {}) as Record<string, unknown>
                });

                console.log(`Tool ${toolName} executed successfully with input:`, finalToolInput);

                const result: QueryResult = {
                    tool: toolName,
                    input: finalToolInput,
                    output: toolResult.content,
                    success: true
                };

                iterationResults.push(result);
                allResults.push(result);

                functionResults.push({
                    functionResponse: {
                        name: toolName,
                        response: {
                            content: JSON.stringify(toolResult.content)
                        }
                    }
                });

            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                enhancedLogger.error(`Tool execution failed for ${functionCall.name}:`, error);

                const result: QueryResult = {
                    tool: functionCall.name,
                    input: functionCall.args,
                    error: errorMessage,
                    success: false
                };

                iterationResults.push(result);
                allResults.push(result);

                functionResults.push({
                    functionResponse: {
                        name: functionCall.name,
                        response: {
                            content: JSON.stringify({ error: errorMessage })
                        }
                    }
                });
            }
        }

        return { functionResults, iterationResults };
    }

    private formatFunctionResults(functionResults: any[]): string[] {
        const resultTexts: string[] = [];
        for (const funcResult of functionResults) {
            const toolName = funcResult.functionResponse.name;
            const response = funcResult.functionResponse.response;
            if (response.content) {
                try {
                    const parsedContent = JSON.parse(response.content);
                    if (parsedContent.error) {
                        resultTexts.push(`Tool ${toolName}: Error - ${parsedContent.error}`);
                    } else {
                        resultTexts.push(`Tool ${toolName}: ${response.content}`);
                    }
                } catch {
                    resultTexts.push(`Tool ${toolName}: ${response.content}`);
                }
            }
        }
        return resultTexts;
    }

    async getAvailableTools(): Promise<MCPTool[]> {
        if (!this.isConnected || !this.client) {
            throw new Error('MCP client not connected');
        }

        try {
            const toolsResponse = await this.client.listTools();
            const tools = toolsResponse.tools || [];

            return tools.map(tool => ({
                name: tool.name,
                description: tool.description || `Tool: ${tool.name}`,
                inputSchema: {
                    ...tool.inputSchema,
                    type: tool.inputSchema?.type || "object",
                    properties: tool.inputSchema?.properties || {},
                    required: tool.inputSchema?.required || []
                }
            }));
        } catch (error: any) {
            enhancedLogger.error('Error fetching available tools:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.close();
            this.isConnected = false;
            enhancedLogger.info('MongoDB MCP client disconnected');
        }
    }

    get connected(): boolean {
        return this.isConnected;
    }
}

export default MongoMCPClient;
export type { UserContext, MCPTool, QueryResult, QueryResponse, GeminiTool };