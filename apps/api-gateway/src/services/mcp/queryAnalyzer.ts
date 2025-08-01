import { QueryResult } from './types';

export class QueryAnalyzer {
    static hasRepeatedToolCalls(allResults: QueryResult[], newFunctionCalls: any[]): boolean {
        if (allResults.length === 0 || !newFunctionCalls || newFunctionCalls.length === 0) {
            return false;
        }

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

    static hasCompleteAnswer(allResults: QueryResult[], userQuery: string): boolean {
        if (allResults.length === 0) {
            return false;
        }

        const successfulResults = allResults.filter(r => r.success);
        
        // If we have no successful results, we don't have an answer
        if (successfulResults.length === 0) {
            return false;
        }

        // Only stop if we have a lot of operations (potential infinite loop)
        if (allResults.length >= 8) {
            return true;
        }

        // If we have some successful results but recent attempts are all failing,
        // let the LLM provide a response with what it has
        if (successfulResults.length >= 2) {
            const recentResults = allResults.slice(-3);
            const recentSuccessful = recentResults.filter(r => r.success);
            if (recentSuccessful.length === 0) {
                return true;
            }
        }

        // Otherwise, let the LLM continue and decide for itself
        return false;
    }

    static generateSummaryFromResults(allResults: QueryResult[]): string {
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
