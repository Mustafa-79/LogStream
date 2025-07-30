import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import enhancedLogger from "../config/logger";
import config from '../config/config';

interface UserContext {
    userId?: string;
    role?: string;
    userGroup?: string;
    permissions?: string[];
}

interface MCPTool {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
        [key: string]: any;
    };
}

interface AnthropicTool {
    name: string;
    description: string;
    input_schema: {
        type: "object";
        properties?: Record<string, any>;
        required?: string[];
        [key: string]: any;
    };
}

interface QueryResult {
    tool: string;
    input: Record<string, any>;
    output?: any;
    error?: string;
    success: boolean;
}

interface QueryResponse {
    query_results?: QueryResult[];
    interpretation: string;
    success: boolean;
}

class MongoMCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private anthropic: Anthropic;
    private isConnected: boolean = false;

    constructor() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }

        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
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
            enhancedLogger.info('MongoDB MCP client connected successfully');
        } catch (error: any) {
            enhancedLogger.error('Failed to initialize MCP client:', error);

            this.isConnected = false;
            throw error;
        }
    }

    async executeNaturalLanguageQuery(
        userQuery: string,
        userContext: UserContext = {}
    ): Promise<QueryResponse> {
        if (!this.isConnected || !this.client) {
            throw new Error('MCP client not connected');
        }

        try {
            const toolsResponse = await this.client.listTools();
            const availableTools = toolsResponse.tools || [];

            const anthropicTools: AnthropicTool[] = availableTools.map(tool => ({
                name: tool.name,
                description: tool.description || `Tool: ${tool.name}`,
                input_schema: {
                    ...tool.inputSchema,
                    type: "object" as const,
                    properties: tool.inputSchema?.properties || {},
                    required: tool.inputSchema?.required || []
                }
            }));

            const systemPrompt = this.buildSystemPrompt(userContext);

            const messages: any[] = [
                {
                    role: "user",
                    content: userQuery
                }
            ];

            const allResults: QueryResult[] = [];
            let iterationCount = 0;
            const maxIterations = 10;

            while (iterationCount < maxIterations) {
                iterationCount++;
                enhancedLogger.info(`MCP Query iteration ${iterationCount}`);

                const response = await this.anthropic.messages.create({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 4000,
                    system: systemPrompt,
                    messages: messages,
                    tools: anthropicTools,
                    tool_choice: { type: "auto" }
                });

                const assistantContent = response.content.map(block => {
                    if (block.type === 'text' && block.text) {
                        return {
                            type: "text" as const,
                            text: block.text
                        };
                    } else if (block.type === 'tool_use' && block.name && block.input && block.id) {
                        return {
                            type: "tool_use" as const,
                            id: block.id,
                            name: block.name,
                            input: block.input
                        };
                    }
                    return null;
                }).filter((block): block is NonNullable<typeof block> => block !== null);

                messages.push({
                    role: "assistant",
                    content: assistantContent
                });

                // Check if there are tool calls to execute
                const toolCalls = response.content.filter(content => content.type === 'tool_use');

                if (toolCalls.length === 0) {
                    // No more tool calls needed, break the loop
                    const finalText = response.content
                        .filter(block => block.type === 'text')
                        .map(block => (block as any).text)
                        .join(' ') || "Query completed";

                    return {
                        query_results: allResults,
                        interpretation: finalText,
                        success: true
                    };
                }

                // Execute tool calls and collect results
                const toolResults: any[] = [];
                const iterationResults: QueryResult[] = [];

                for (const toolCall of toolCalls) {
                    if (toolCall.type === 'tool_use' && toolCall.name && toolCall.input) {
                        try {
                            // Check role-based access control before executing tool
                            const accessCheck = this.checkToolAccess(toolCall.name, toolCall.input, userContext);
                            if (!accessCheck.allowed) {
                                const result: QueryResult = {
                                    tool: toolCall.name,
                                    input: toolCall.input,
                                    error: accessCheck.reason,
                                    success: false
                                };

                                iterationResults.push(result);
                                allResults.push(result);

                                // Add access denied result to conversation
                                toolResults.push({
                                    type: "tool_result" as const,
                                    tool_use_id: (toolCall as any).id || `tool_${Date.now()}`,
                                    content: `Access Denied: ${accessCheck.reason}`
                                });
                                continue;
                            }

                            // For non-admin users, modify query based on user group access
                            let finalToolInput = toolCall.input;
                            if (userContext.role !== 'admin') {
                                const groupAccessCheck = await this.checkToolAccessWithUserGroups(
                                    toolCall.name,
                                    toolCall.input,
                                    userContext
                                );

                                if (!groupAccessCheck.allowed) {
                                    const result: QueryResult = {
                                        tool: toolCall.name,
                                        input: toolCall.input,
                                        error: groupAccessCheck.reason,
                                        success: false
                                    };

                                    iterationResults.push(result);
                                    allResults.push(result);

                                    toolResults.push({
                                        type: "tool_result" as const,
                                        tool_use_id: (toolCall as any).id || `tool_${Date.now()}`,
                                        content: `Access Denied: ${groupAccessCheck.reason}`
                                    });
                                    continue;
                                }

                                finalToolInput = groupAccessCheck.modifiedInput || toolCall.input;
                            }

                            const toolResult = await this.client!.callTool({
                                name: toolCall.name,
                                arguments: (finalToolInput || {}) as Record<string, unknown>
                            });

                            console.log(`Tool ${toolCall.name} executed successfully with input:`, finalToolInput);

                            const result: QueryResult = {
                                tool: toolCall.name,
                                input: finalToolInput,
                                output: toolResult.content,
                                success: true
                            };

                            iterationResults.push(result);
                            allResults.push(result);

                            toolResults.push({
                                type: "tool_result" as const,
                                tool_use_id: (toolCall as any).id || `tool_${Date.now()}`,
                                content: JSON.stringify(toolResult.content)
                            });

                        } catch (error: any) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            enhancedLogger.error(`Tool execution failed for ${toolCall.name}:`, error);

                            const result: QueryResult = {
                                tool: toolCall.name,
                                input: toolCall.input,
                                error: errorMessage,
                                success: false
                            };

                            iterationResults.push(result);
                            allResults.push(result);

                            toolResults.push({
                                type: "tool_result" as const,
                                tool_use_id: (toolCall as any).id || `tool_${Date.now()}`,
                                content: `Error: ${errorMessage}`
                            });
                        }
                    }
                }

                // Add tool results to conversation for next iteration
                if (toolResults.length > 0) {
                    messages.push({
                        role: "user",
                        content: toolResults
                    });
                }

                // If all tool calls failed, break the loop
                if (iterationResults.length > 0 && iterationResults.every(r => !r.success)) {
                    enhancedLogger.warn('All tool calls failed in current iteration, ending query execution');
                    break;
                }
            }

            // If we've reached max iterations, get final interpretation
            if (iterationCount >= maxIterations) {
                enhancedLogger.warn(`Max iterations (${maxIterations}) reached for MCP query`);
            }

            // Get final interpretation from Claude
            try {
                const finalResponse = await this.anthropic.messages.create({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 2000,
                    system: systemPrompt,
                    messages: [
                        ...messages,
                        {
                            role: "user",
                            content: "Please provide a final summary and interpretation of all the results obtained from the tool calls."
                        }
                    ]
                });

                const interpretationText = finalResponse.content
                    .filter(block => block.type === 'text')
                    .map(block => (block as any).text)
                    .join(' ') || "Query execution completed";

                return {
                    query_results: allResults,
                    interpretation: interpretationText,
                    success: true
                };

            } catch (error: any) {
                enhancedLogger.error('Error getting final interpretation from Anthropic:', error);

                // Fallback to a simple summary if Anthropic call fails
                const fallbackInterpretation = `Executed ${allResults.length} tool(s) across ${iterationCount} iteration(s). ${allResults.filter(r => r.success).length} succeeded, ${allResults.filter(r => !r.success).length} failed.`;

                return {
                    query_results: allResults,
                    interpretation: fallbackInterpretation,
                    success: true
                };
            }

        } catch (error: any) {
            enhancedLogger.error('Error executing natural language query:', error);
            throw error;
        }
    }

    private buildSystemPrompt(userContext: UserContext): string {
        const userId = userContext.userId ? String(userContext.userId) : 'unknown';
        const role = userContext.role ? String(userContext.role) : 'user';

        return `You are a MongoDB query assistant for a logging dashboard application. The database is 'temp'. It contains the following collections:

1. logs - Application logs with fields: '_id', 'timestamp', 'logLevel', 'sourceApp' (ObjectId reference to applications), 'message', 'createdAt', 'default', 'traceId'
2. applications - Registered applications with fields: '_id', 'name', 'description', 'createdAt', 'updatedAt', 'active'
3. users - User accounts with fields: '_id', 'username', 'email', 'role', 'permissions', 'isActive', 'createdAt', 'updatedAt'
4. groups - User groups with fields: '_id', 'name', 'description', 'memberIDs', 'applicationIDs', 'active', 'createdAt', 'updatedAt'

IMPORTANT: The 'sourceApp' field in logs collection stores ObjectId references, not application names. When searching for logs by application name:
1. First find the application by name to get its _id (ObjectId)
2. Then search logs using that ObjectId in the sourceApp field
3. Use proper ObjectId syntax: {"sourceApp": {"$oid": "ObjectIdString"}} or use the ObjectId constructor

Current user context:
- User ID: ${userId}
- Role: ${role}

ROLE-BASED ACCESS CONTROL:
- Admin users: Full access to all collections and operations

- Non-admin users:
  * CANNOT access 'users' or 'groups' collections at all
  * Can only READ from 'applications' collection (find, count, aggregate) - NO create/update/delete
  * Can only READ from 'logs' and 'alerts' collections (find, count, aggregate) - NO create/update/delete
  * Read-only access to other collections

USER GROUP-BASED DATA FILTERING:
- Non-admin users can only see data for applications they have access to through their user groups
- User groups contain 'applicationIDs' field that defines which applications a user can access
- When querying applications: Results are automatically filtered to only show applications the user has access to
- When querying logs: Results are automatically filtered to only show logs from applications the user has access to
- When querying alerts: Results are automatically filtered to only show alerts from applications the user has access to
- If a user has no group memberships or group access, they will see no data

IMPORTANT SECURITY NOTE:
- All queries for applications, logs, and alerts are automatically filtered based on user's group membership
- Users will only see data for applications they are authorized to access
- This filtering happens automatically - you don't need to manually add filters for user access
- The system ensures data isolation between different user groups

When the user asks questions in natural language about logs, users, applications, groups, or analytics:
1. Analyze their request and determine the appropriate MongoDB operations
2. **Check user permissions**: Verify the user's role allows the requested operation before proceeding
3. **For application-related log queries**: Always first lookup the application by name to get its ObjectId, then use that ObjectId to query logs
4. Use the available MCP tools to execute the query
5. For complex queries, break them down into multiple steps and execute tools sequentially
6. Return results in a user-friendly format
7. Always respect user permissions and data access controls - if access is denied, explain why
8. **Remember**: Non-admin users will automatically only see data for applications they have access to through their user groups
9. For aggregation queries, prefer using MongoDB aggregation pipelines
10. Handle errors gracefully and provide helpful feedback
11. If you need more information after executing a tool, ask follow-up questions or make additional tool calls

Example workflow for "how many logs for App 1":
1. Query applications collection: {"name": "App 1"} to get the ObjectId (automatically filtered to user's accessible apps)
2. Query logs collection: {"sourceApp": ObjectId("found_id")} to count logs (automatically filtered to user's accessible apps)

Example access control scenarios:
- Non-admin asks "show me all users" → DENY: "Access denied: Only administrators can access user management."
- Non-admin asks "create new application" → DENY: "Access denied: Only administrators can create applications."
- Non-admin asks "show me applications" → ALLOW: Shows only applications the user has access to through their groups
- Non-admin asks "how many logs for App 1" → ALLOW: Shows logs only if App 1 is in user's accessible applications
- Non-admin asks "delete old logs" → DENY: "Access denied: Only administrators can delete logs."
- Non-admin user in "Developers" group with access to App 6, 7 asks "show all applications" → Returns only App 6 and 7
- Non-admin user in "QA" group with access to App 1, 2, 3 asks "show logs" → Returns only logs from App 1, 2, and 3

Remember: Only execute queries that the user has permission to run based on their role and user group. For complex queries requiring multiple steps, execute them in logical sequence. If access is denied, clearly explain the reason and suggest alternative queries the user can perform. The system automatically ensures users only see data for applications they have access to.`;
    }

    async getAvailableTools(): Promise<MCPTool[]> {
        if (!this.isConnected || !this.client) {
            throw new Error('MCP client not connected');
        }

        try {
            const toolsResponse = await this.client.listTools();
            const tools = toolsResponse.tools || [];

            // Convert and validate the tools to match our MCPTool interface
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

    private checkToolAccess(toolName: string, toolInput: any, userContext: UserContext): { allowed: boolean; reason?: string } {
        const isAdmin = userContext.role === 'admin';
        const collection = toolInput?.collection || '';

        if (isAdmin) {
            return { allowed: true };
        }

        if (collection === 'groups' || collection === 'users') {
            return {
                allowed: false,
                reason: 'Access denied: Only administrators can access user groups and user management.'
            };
        }

        if (['applications', 'logs', 'alerts'].includes(collection)) {
            // Check if it's a write operation (still blocked for non-admin users)
            const writeTools = ['insert', 'insertOne', 'insertMany', 'update', 'updateOne', 'updateMany', 'delete', 'deleteOne', 'deleteMany', 'replaceOne'];

            if (writeTools.includes(toolName)) {
                const collectionName = collection === 'applications' ? 'applications' :
                    collection === 'logs' ? 'logs' : 'alerts';
                return {
                    allowed: false,
                    reason: `Access denied: Only administrators can create, update, or delete ${collectionName}.`
                };
            }

            // Allow read operations (but they will be filtered by user's application access)
            const readOnlyTools = ['find', 'findOne', 'count', 'aggregate', 'distinct'];
            if (readOnlyTools.includes(toolName)) {
                return { allowed: true };
            }
        }

        // Check for other collections - allow read operations by default
        const readOnlyTools = ['find', 'findOne', 'count', 'aggregate', 'distinct'];
        if (readOnlyTools.includes(toolName)) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: 'Access denied: Insufficient permissions for this operation.'
        };
    }

    private async checkToolAccessWithUserGroups(
        toolName: string,
        toolInput: any,
        userContext: UserContext
    ): Promise<{ allowed: boolean; reason?: string; modifiedInput?: any }> {
        const isAdmin = userContext.role === 'admin';
        const collection = toolInput?.collection || '';

        if (isAdmin) {
            return { allowed: true, modifiedInput: toolInput };
        }

        if (collection === 'groups' || collection === 'users') {
            return {
                allowed: false,
                reason: 'Access denied: Only administrators can access user groups and user management.'
            };
        }

        if (['applications', 'logs', 'alerts'].includes(collection)) {
            // Check if it's a write operation (still blocked for non-admin)
            const writeTools = ['insert', 'insertOne', 'insertMany', 'update', 'updateOne', 'updateMany', 'delete', 'deleteOne', 'deleteMany', 'replaceOne'];

            if (writeTools.includes(toolName)) {
                const collectionName = collection === 'applications' ? 'applications' :
                    collection === 'logs' ? 'logs' : 'alerts';
                return {
                    allowed: false,
                    reason: `Access denied: Only administrators can create, update, or delete ${collectionName}.`
                };
            }

            // For read operations, modify the query to filter by user's application access
            const modifiedInput = await this.modifyQueryForUserAccess(toolName, toolInput, userContext);
            return { allowed: true, modifiedInput };
        }

        const readOnlyTools = ['find', 'findOne', 'count', 'aggregate', 'distinct'];
        if (readOnlyTools.includes(toolName)) {
            return { allowed: true, modifiedInput: toolInput };
        }

        // Default: deny write operations for non-admin users
        return {
            allowed: false,
            reason: 'Access denied: Insufficient permissions for this operation.'
        };
    }

    private async modifyQueryForUserAccess(
        toolName: string,
        toolInput: any,
        userContext: UserContext
    ): Promise<any> {
        try {
            const accessibleAppIds = await this.getUserAccessibleApplications(userContext);

            if (!accessibleAppIds || accessibleAppIds.length === 0) {
                // If user has no application access, return a query that will return no results
                return {
                    ...toolInput,
                    filter: { _id: { $in: [] } },
                    query: { _id: { $in: [] } }
                };
            }

            const collection = toolInput?.collection || '';
            let modifiedInput = { ...toolInput };

            if (collection === 'applications') {
                // Convert string IDs to ObjectId format for applications collection
                const objectIdAppIds = accessibleAppIds.map(id => ({ $oid: id }));
                const applicationFilter = { _id: { $in: objectIdAppIds } };

                // Merge with existing filter if present
                if (toolInput.filter) {
                    modifiedInput.filter = { $and: [toolInput.filter, applicationFilter] };
                } else if (toolInput.query) {
                    modifiedInput.query = { $and: [toolInput.query, applicationFilter] };
                } else {
                    modifiedInput.filter = applicationFilter;
                    modifiedInput.query = applicationFilter;
                }
            }
            else if (collection === 'logs') {
                // Convert string IDs to ObjectId format for logs collection
                const objectIdAppIds = accessibleAppIds.map(id => ({ $oid: id }));
                const logsFilter = { sourceApp: { $in: objectIdAppIds } };

                // Merge with existing filter if present
                if (toolInput.filter) {
                    modifiedInput.filter = { $and: [toolInput.filter, logsFilter] };
                } else if (toolInput.query) {
                    modifiedInput.query = { $and: [toolInput.query, logsFilter] };
                } else {
                    modifiedInput.filter = logsFilter;
                    modifiedInput.query = logsFilter;
                }
            }
            else if (collection === 'alerts') {
                // Convert string IDs to ObjectId format for alerts collection
                const objectIdAppIds = accessibleAppIds.map(id => ({ $oid: id }));
                const alertsFilter = {
                    $or: [
                        { sourceApp: { $in: objectIdAppIds } },
                        { applicationId: { $in: objectIdAppIds } }
                    ]
                };

                // Merge with existing filter if present
                if (toolInput.filter) {
                    modifiedInput.filter = { $and: [toolInput.filter, alertsFilter] };
                } else if (toolInput.query) {
                    modifiedInput.query = { $and: [toolInput.query, alertsFilter] };
                } else {
                    modifiedInput.filter = alertsFilter;
                    modifiedInput.query = alertsFilter;
                }
            }

            enhancedLogger.info(`Modified query for user ${userContext.userId} on collection ${collection}:`, JSON.stringify(modifiedInput));
            return modifiedInput;
        } catch (error: any) {
            enhancedLogger.error('Error modifying query for user access:', error);
            return {
                ...toolInput,
                filter: { _id: { $in: [] } },
                query: { _id: { $in: [] } }
            };
        }
    }

    private async getUserAccessibleApplications(userContext: UserContext): Promise<string[] | null> {
        if (!this.client || !this.isConnected) {
            enhancedLogger.error('MCP client not connected when getting user applications');
            return null;
        }

        try {
            const userId = userContext.userId;
            if (!userId) {
                enhancedLogger.warn('No userId provided in user context');
                return [];
            }

            const aggregationResult = await this.client.callTool({
                name: 'aggregate',
                arguments: {
                    database: 'temp',
                    collection: 'groups',
                    pipeline: [
                        // Stage 1: Match groups where user is a member and group is active
                        {
                            $match: {
                                memberIDs: { $oid: userId },
                                active: true,
                                deleted: false
                            }
                        },
                        { $unwind: "$applicationIDs" },
                        // Stage 3: Group and collect all unique application IDs
                        {
                            $group: {
                                _id: null,
                                applicationIds: { $addToSet: "$applicationIDs" }
                            }
                        },
                        // Stage 4: Project just the applicationIds array
                        {
                            $project: {
                                _id: 0,
                                applicationIds: 1
                            }
                        }
                    ]
                }
            });

            const accessibleAppIds: string[] = [];

            if (aggregationResult.content && Array.isArray(aggregationResult.content)) {
                for (const item of aggregationResult.content) {
                    if (item.type === 'text' && item.text) {
                        try {
                            const lines = item.text.split('\n');
                            for (const line of lines) {
                                if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
                                    const resultData = JSON.parse(line.trim());
                                    if (resultData.applicationIds && Array.isArray(resultData.applicationIds)) {
                                        for (const appId of resultData.applicationIds) {
                                            if (typeof appId === 'string') {
                                                accessibleAppIds.push(appId);
                                            } else if (appId && typeof appId === 'object' && appId.$oid) {
                                                accessibleAppIds.push(appId.$oid);
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (parseError) {
                            console.log('Failed to parse aggregation result:', String(parseError));
                        }
                    }
                }
            }

            const uniqueAppIds = [...new Set(accessibleAppIds)];
            enhancedLogger.info(`User ${userId} has access to applications: ${uniqueAppIds.join(', ')}`);

            return uniqueAppIds;
        } catch (error: any) {
            enhancedLogger.error('Error getting user accessible applications:', error);
            return null;
        }
    }
}

export default MongoMCPClient;
export type { UserContext, MCPTool, QueryResult, QueryResponse, AnthropicTool };