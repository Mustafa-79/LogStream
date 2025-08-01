import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import enhancedLogger from "../../config/logger";
import { UserContext, AccessCheckResult } from './types';

export class AccessController {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    checkBasicAccess(toolName: string, toolInput: any, userContext: UserContext): AccessCheckResult {
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
            const writeTools = ['insert', 'insertOne', 'insertMany', 'update', 'updateOne', 'updateMany', 'delete', 'deleteOne', 'deleteMany', 'replaceOne'];

            if (writeTools.includes(toolName)) {
                const collectionName = collection === 'applications' ? 'applications' :
                    collection === 'logs' ? 'logs' : 'alerts';
                return {
                    allowed: false,
                    reason: `Access denied: Only administrators can create, update, or delete ${collectionName}.`
                };
            }

            const readOnlyTools = ['find', 'findOne', 'count', 'aggregate', 'distinct'];
            if (readOnlyTools.includes(toolName)) {
                return { allowed: true };
            }
        }

        const readOnlyTools = ['find', 'findOne', 'count', 'aggregate', 'distinct'];
        if (readOnlyTools.includes(toolName)) {
            return { allowed: true };
        }

        return {
            allowed: false,
            reason: 'Access denied: Insufficient permissions for this operation.'
        };
    }

    async checkGroupBasedAccess(toolName: string, toolInput: any, userContext: UserContext): Promise<AccessCheckResult> {
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
            const writeTools = ['insert', 'insertOne', 'insertMany', 'update', 'updateOne', 'updateMany', 'delete', 'deleteOne', 'deleteMany', 'replaceOne'];

            if (writeTools.includes(toolName)) {
                const collectionName = collection === 'applications' ? 'applications' :
                    collection === 'logs' ? 'logs' : 'alerts';
                return {
                    allowed: false,
                    reason: `Access denied: Only administrators can create, update, or delete ${collectionName}.`
                };
            }

            const modifiedInput = await this.modifyQueryForUserAccess(toolName, toolInput, userContext);
            return { allowed: true, modifiedInput };
        }

        const readOnlyTools = ['find', 'findOne', 'count', 'aggregate', 'distinct'];
        if (readOnlyTools.includes(toolName)) {
            return { allowed: true, modifiedInput: toolInput };
        }

        return {
            allowed: false,
            reason: 'Access denied: Insufficient permissions for this operation.'
        };
    }

    private async modifyQueryForUserAccess(toolName: string, toolInput: any, userContext: UserContext): Promise<any> {
        try {
            const accessibleAppIds = await this.getUserAccessibleApplications(userContext);

            if (!accessibleAppIds || accessibleAppIds.length === 0) {
                return {
                    ...toolInput,
                    filter: { _id: { $in: [] } },
                    query: { _id: { $in: [] } }
                };
            }

            const collection = toolInput?.collection || '';
            let modifiedInput = { ...toolInput };

            if (collection === 'applications') {
                const objectIdAppIds = accessibleAppIds.map(id => ({ $oid: id }));
                const applicationFilter = { _id: { $in: objectIdAppIds } };

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
                const objectIdAppIds = accessibleAppIds.map(id => ({ $oid: id }));
                const logsFilter = { sourceApp: { $in: objectIdAppIds } };

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
                const objectIdAppIds = accessibleAppIds.map(id => ({ $oid: id }));
                const alertsFilter = {
                    $or: [
                        { sourceApp: { $in: objectIdAppIds } },
                        { applicationId: { $in: objectIdAppIds } }
                    ]
                };

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
                        {
                            $match: {
                                memberIDs: { $oid: userId },
                                active: true,
                                deleted: false
                            }
                        },
                        { $unwind: "$applicationIDs" },
                        {
                            $group: {
                                _id: null,
                                applicationIds: { $addToSet: "$applicationIDs" }
                            }
                        },
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
