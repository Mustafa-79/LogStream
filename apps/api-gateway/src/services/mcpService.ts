import { GoogleGenerativeAI } from '@google/generative-ai';
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

interface GeminiTool {
    name: string;
    description: string;
    parameters: {
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
    private genAI: GoogleGenerativeAI;
    private model: any;
    private isConnected: boolean = false;

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

            const geminiTools: GeminiTool[] = availableTools.map(tool => ({
                name: tool.name,
                description: tool.description || `Tool: ${tool.name}`,
                parameters: this.sanitizeSchemaForGemini(tool.inputSchema)
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
            const maxIterations = 5; // Reduced to prevent infinite loops
            let conversationHistory: any[] = [];

            // Build initial conversation with system prompt and user query
            conversationHistory.push({
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Query: ${userQuery}\n\nPlease analyze this query and execute the necessary database operations to provide a complete answer. Once you have all the information needed to answer the user's question, provide a final response without making additional tool calls.` }]
            });

            while (iterationCount < maxIterations) {
                iterationCount++;
                enhancedLogger.info(`MCP Query iteration ${iterationCount}`);

                const response = await this.model.generateContent({
                    contents: conversationHistory,
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
                    // Add function calls to the response
                    for (const call of functionCalls) {
                        assistantMessage.parts.push({
                            functionCall: {
                                name: call.name,
                                args: call.args
                            }
                        });
                    }
                }

                conversationHistory.push(assistantMessage);

                // Check if this looks like a final answer (no function calls or explicit conclusion)
                if (!functionCalls || functionCalls.length === 0) {
                    return {
                        query_results: allResults,
                        interpretation: responseText || "Query completed",
                        success: true
                    };
                }

                // Check if we're repeating the same tool calls
                if (iterationCount > 2 && this.hasRepeatedToolCalls(allResults, functionCalls)) {
                    enhancedLogger.warn('Detected repeated tool calls, stopping to prevent infinite loop');
                    return {
                        query_results: allResults,
                        interpretation: responseText || this.generateSummaryFromResults(allResults),
                        success: true
                    };
                }

                // Execute function calls and collect results
                const functionResults: any[] = [];
                const iterationResults: QueryResult[] = [];

                for (const functionCall of functionCalls) {
                    try {
                        const toolName = functionCall.name;
                        const toolInput = functionCall.args;

                        // Check if this is a write operation that needs confirmation
                        const writeTools = ['insert', 'insertOne', 'insertMany', 'update', 'updateOne', 'updateMany', 'delete', 'deleteOne', 'deleteMany', 'replaceOne'];
                        const isWriteOperation = writeTools.includes(toolName);
                        
                        // Check if we need to wait for user confirmation for write operations
                        if (isWriteOperation && !this.hasUserConfirmedWriteOperation(messages, { name: toolName, input: toolInput })) {
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
                                    response: { error: "WRITE_OPERATION_CONFIRMATION_REQUIRED - This write operation requires user confirmation before execution." }
                                }
                            });
                            continue;
                        }

                        // Check role-based access control
                        const accessCheck = this.checkToolAccess(toolName, toolInput, userContext);
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
                                    response: { error: `Access Denied - ${accessCheck.reason}` }
                                }
                            });
                            continue;
                        }

                        // For non-admin users, modify query based on user group access
                        let finalToolInput = toolInput;
                        if (userContext.role !== 'admin') {
                            const groupAccessCheck = await this.checkToolAccessWithUserGroups(
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
                                        response: { error: `Access Denied - ${groupAccessCheck.reason}` }
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

                        // Format result for Gemini conversation
                        functionResults.push({
                            functionResponse: {
                                name: toolName,
                                response: toolResult.content
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
                                response: { error: errorMessage }
                            }
                        });
                    }
                }

                // Add function results to conversation history
                if (functionResults.length > 0) {
                    conversationHistory.push({
                        role: "user",
                        parts: functionResults
                    });
                }

                // Check if we have enough information for a complete answer after each iteration
                if (this.hasCompleteAnswer(allResults, userQuery)) {
                    enhancedLogger.info('Detected complete answer, prompting for final response');
                    // Add a prompt for final summary
                    conversationHistory.push({
                        role: "user", 
                        parts: [{ text: "Based on the tool results above, please provide a complete and final answer to the user's question. Do not make any more tool calls." }]
                    });
                    
                    // Get final response
                    const finalResponse = await this.model.generateContent({
                        contents: conversationHistory,
                        generationConfig: {
                            maxOutputTokens: 2000,
                            temperature: 0.1,
                        }
                    });

                    return {
                        query_results: allResults,
                        interpretation: finalResponse.response.text() || this.generateSummaryFromResults(allResults),
                        success: true
                    };
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

            // Generate final interpretation
            return {
                query_results: allResults,
                interpretation: this.generateSummaryFromResults(allResults),
                success: true
            };

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

🚨 CRITICAL SAFETY REQUIREMENT - USER CONFIRMATION FOR WRITE OPERATIONS:
**BEFORE executing ANY write operation (insert, update, delete, replace), you MUST ask for explicit user confirmation first.**

Write operations include: insert, insertOne, insertMany, update, updateOne, updateMany, delete, deleteOne, deleteMany, replaceOne

**PROCEDURE FOR WRITE OPERATIONS:**
1. When a user requests a write operation, DO NOT execute the tool call immediately
2. Instead, respond with a clear explanation of what will be modified/deleted/created
3. Ask for explicit confirmation: "Do you want me to proceed with this operation? Please confirm with 'yes' or 'no'."
4. ONLY after the user confirms with 'yes' should you proceed with the actual tool execution
5. If user says 'no' or anything other than 'yes', abort the operation

**Example flow:**
User: "Delete all logs older than 30 days"
Assistant: "I understand you want to delete logs older than 30 days. This operation will permanently remove X log entries from the database. Do you want me to proceed with this deletion? Please confirm with 'yes' or 'no'."
User: "yes"
Assistant: [Now execute the delete tool call]

This confirmation step is MANDATORY for all write operations and cannot be skipped.

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
3. **For write operations**: ALWAYS ask for user confirmation first before executing
4. **For application-related log queries**: Always first lookup the application by name to get its ObjectId, then use that ObjectId to query logs
5. Use the available MCP tools to execute the query
6. For complex queries, break them down into multiple steps and execute tools sequentially
7. Return results in a user-friendly format
8. Always respect user permissions and data access controls - if access is denied, explain why
9. **Remember**: Non-admin users will automatically only see data for applications they have access to through their user groups
10. For aggregation queries, prefer using MongoDB aggregation pipelines
11. Handle errors gracefully and provide helpful feedback
12. If you need more information after executing a tool, ask follow-up questions or make additional tool calls

Example workflow for "how many logs for App 1":
1. Query applications collection: {"name": "App 1"} to get the ObjectId (automatically filtered to user's accessible apps)
2. Query logs collection: {"sourceApp": ObjectId("found_id")} to count logs (automatically filtered to user's accessible apps)

Example access control scenarios:
- Non-admin asks "show me all users" → DENY: "Access denied: Only administrators can access user management."
- Non-admin asks "create new application" → DENY: "Access denied: Only administrators can create applications."
- Non-admin asks "show me applications" → ALLOW: Shows only applications the user has access to through their groups
- Non-admin asks "how many logs for App 1" → ALLOW: Shows logs only if App 1 is in user's accessible applications
- Non-admin asks "delete old logs" → ASK CONFIRMATION: "This will delete X logs. Do you want me to proceed? Please confirm with 'yes' or 'no'."
- Non-admin user in "Developers" group with access to App 6, 7 asks "show all applications" → Returns only App 6 and 7
- Non-admin user in "QA" group with access to App 1, 2, 3 asks "show logs" → Returns only logs from App 1, 2, and 3

Remember: Only execute queries that the user has permission to run based on their role and user group. For complex queries requiring multiple steps, execute them in logical sequence. If access is denied, clearly explain the reason and suggest alternative queries the user can perform. The system automatically ensures users only see data for applications they have access to. **ALWAYS ask for confirmation before any write operation.**`;
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

    private hasUserConfirmedWriteOperation(messages: any[], currentToolCall: any): boolean {
        // Check if user has confirmed this specific write operation
        // Look for recent user messages containing confirmation keywords
        const confirmationKeywords = ['yes', 'confirm', 'proceed', 'execute', 'go ahead'];
        const denyKeywords = ['no', 'cancel', 'abort', 'stop', 'deny'];
        
        // Look through recent messages in reverse order (most recent first)
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            
            // Skip if not a user message
            if (message.role !== 'user') continue;
            
            // Check if this is a user response (text content)
            let userText = '';
            if (typeof message.content === 'string') {
                userText = message.content.toLowerCase().trim();
            } else if (message.content && Array.isArray(message.content)) {
                for (const content of message.content) {
                    if (content.type === 'text' && content.text) {
                        userText += content.text.toLowerCase().trim() + ' ';
                    }
                }
            }
            
            if (userText) {
                // Check for confirmation
                if (confirmationKeywords.some(keyword => userText.includes(keyword))) {
                    // Additional check: make sure this confirmation is recent and relevant
                    return this.isConfirmationRelevant(messages, i, currentToolCall);
                }
                
                // Check for denial - if user said no, return false
                if (denyKeywords.some(keyword => userText.includes(keyword))) {
                    return false;
                }
            }
            
            // Stop looking after checking the last 5 user messages to avoid false positives
            let userMessageCount = 0;
            if (message.role === 'user') userMessageCount++;
            if (userMessageCount >= 5) break;
        }
        
        return false;
    }

    private isConfirmationRelevant(messages: any[], confirmationIndex: number, currentToolCall: any): boolean {
        // Check if there was a confirmation request before the user's confirmation
        // Look for assistant messages that asked for confirmation
        for (let i = confirmationIndex - 1; i >= 0; i--) {
            const message = messages[i];
            
            if (message.role === 'assistant') {
                // Check if this assistant message contains a confirmation request
                const assistantContent = this.getMessageText(message);
                const confirmationPhrases = [
                    'confirm',
                    'proceed',
                    'do you want',
                    'are you sure',
                    'permission',
                    'authorization',
                    'yes or no'
                ];
                
                if (confirmationPhrases.some(phrase => assistantContent.toLowerCase().includes(phrase))) {
                    return true;
                }
            }
            
            // Stop if we find another tool result that suggests a different context
            if (message.role === 'user' && message.content && Array.isArray(message.content)) {
                for (const content of message.content) {
                    if (content.type === 'tool_result') {
                        break;
                    }
                }
            }
        }
        
        return false;
    }

    private getMessageText(message: any): string {
        if (typeof message.content === 'string') {
            return message.content;
        }
        
        if (Array.isArray(message.content)) {
            return message.content
                .filter((item: any) => item.type === 'text')
                .map((item: any) => item.text || '')
                .join(' ');
        }
        
        return '';
    }

    private sanitizeSchemaForGemini(schema: any): any {
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

    private cleanProperties(properties: Record<string, any>): Record<string, any> {
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

    private cleanSchemaObject(obj: any): any {
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

    private hasRepeatedToolCalls(allResults: QueryResult[], newFunctionCalls: any[]): boolean {
        if (allResults.length === 0 || !newFunctionCalls || newFunctionCalls.length === 0) {
            return false;
        }

        // For simple queries like "count", if we've already done the same operation, it's a repeat
        const recentResults = allResults.slice(-3); // Check last 3 tool calls
        
        for (const functionCall of newFunctionCalls) {
            const toolName = functionCall.name;
            const toolArgs = functionCall.args;
            
            // For count operations, if we've already counted the same collection, it's a repeat
            if (toolName === 'count') {
                const sameCountCalls = recentResults.filter(result => 
                    result.tool === 'count' && 
                    result.input?.collection === toolArgs?.collection &&
                    result.input?.database === toolArgs?.database
                );
                
                if (sameCountCalls.length >= 1) {
                    return true;
                }
            }
            
            // For other operations, check exact matches
            const exactMatches = recentResults.filter(result => 
                result.tool === toolName && 
                JSON.stringify(result.input) === JSON.stringify(toolArgs)
            );
            
            if (exactMatches.length >= 1) {
                return true;
            }
        }

        return false;
    }

    private hasCompleteAnswer(allResults: QueryResult[], userQuery: string): boolean {
        if (allResults.length === 0) {
            return false;
        }

        const successfulResults = allResults.filter(r => r.success);
        
        // If we have no successful results, we don't have an answer
        if (successfulResults.length === 0) {
            return false;
        }

        // For count queries, one successful count is enough
        const queryLower = userQuery.toLowerCase();
        const isCountQuery = ['count', 'how many', 'total', 'number of'].some(term => queryLower.includes(term));
        
        if (isCountQuery) {
            const hasCountResult = successfulResults.some(result => result.tool === 'count');
            if (hasCountResult) {
                return true;
            }
        }

        // For "show me" or "list" queries, if we have find results, we likely have enough
        const isListQuery = ['show', 'list', 'get', 'find'].some(term => queryLower.includes(term));
        if (isListQuery) {
            const hasFindResult = successfulResults.some(result => 
                ['find', 'aggregate'].includes(result.tool) && 
                result.output && 
                Array.isArray(result.output)
            );
            if (hasFindResult) {
                return true;
            }
        }

        // If we have multiple successful operations, we likely have enough data
        if (successfulResults.length >= 2) {
            return true;
        }

        // If we have a comprehensive result (find/aggregate with data), that's usually enough
        const hasDataResult = successfulResults.some(result => 
            ['find', 'aggregate', 'count'].includes(result.tool) && 
            result.output && 
            Array.isArray(result.output) && 
            result.output.length > 0
        );

        return hasDataResult;
    }

    private generateSummaryFromResults(allResults: QueryResult[]): string {
        if (allResults.length === 0) {
            return "No operations were performed.";
        }

        const successful = allResults.filter(r => r.success);
        const failed = allResults.filter(r => !r.success);

        let summary = `Executed ${allResults.length} operation(s): ${successful.length} successful, ${failed.length} failed.`;

        // Add specific results for common operations
        const countResults = successful.filter(r => r.tool === 'count');
        if (countResults.length > 0) {
            for (const result of countResults) {
                if (result.output && Array.isArray(result.output)) {
                    for (const item of result.output) {
                        if (item.type === 'text' && item.text) {
                            const match = item.text.match(/(\d+)/);
                            if (match) {
                                summary += ` Found ${match[1]} records.`;
                            }
                        }
                    }
                }
            }
        }

        const findResults = successful.filter(r => r.tool === 'find');
        if (findResults.length > 0) {
            for (const result of findResults) {
                if (result.output && Array.isArray(result.output)) {
                    const textItems = result.output.filter(item => item.type === 'text');
                    if (textItems.length > 0) {
                        summary += ` Retrieved data from ${result.input?.collection || 'database'}.`;
                    }
                }
            }
        }

        if (failed.length > 0) {
            summary += ` Some operations failed due to: ${failed.map(f => f.error).join(', ')}.`;
        }

        return summary;
    }
}

export default MongoMCPClient;
export type { UserContext, MCPTool, QueryResult, QueryResponse, GeminiTool };