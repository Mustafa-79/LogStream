export class ConversationManager {
    static hasUserConfirmedWriteOperation(conversationHistory: any[], currentToolCall: any): boolean {
        const confirmationKeywords = ['yes', 'confirm', 'proceed', 'execute', 'go ahead'];
        const denyKeywords = ['no', 'cancel', 'abort', 'stop', 'deny'];
        
        // Look through recent messages in reverse order (most recent first)
        // We need to find if there was a confirmation request and then a user confirmation
        let foundUserConfirmation = false;
        let foundConfirmationRequest = false;
        
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            const message = conversationHistory[i];
            
            if (message.role === 'user' && !foundUserConfirmation) {
                let userText = '';
                if (message.parts && Array.isArray(message.parts)) {
                    for (const part of message.parts) {
                        if (part.text) {
                            userText += part.text.trim() + ' ';
                        }
                    }
                }
                
                // Clean up the text and normalize it
                userText = userText.toLowerCase().trim();
                
                if (userText) {
                    // Check for denial first - if user said no, return false immediately
                    if (denyKeywords.some(keyword => userText.includes(keyword))) {
                        return false;
                    }
                    
                    // Check for exact confirmation matches first
                    if (userText === 'yes' || userText === 'confirm' || userText === 'proceed') {
                        foundUserConfirmation = true;
                        // Continue looking for the confirmation request
                    } else if (confirmationKeywords.some(keyword => userText.includes(keyword))) {
                        foundUserConfirmation = true;
                        // Continue looking for the confirmation request
                    }
                }
            } else if (message.role === 'model' && foundUserConfirmation && !foundConfirmationRequest) {
                const assistantContent = this.getMessageTextFromParts(message.parts);
                const confirmationPhrases = [
                    'confirm',
                    'proceed',
                    'do you want',
                    'are you sure',
                    'permission',
                    'authorization',
                    'yes or no',
                    'please confirm'
                ];
                
                if (confirmationPhrases.some(phrase => assistantContent.toLowerCase().includes(phrase))) {
                    foundConfirmationRequest = true;
                    // Found both user confirmation and prior confirmation request
                    return true;
                }
            }
            
            // Don't look too far back in history
            if (i < conversationHistory.length - 10) break;
        }
        
        return false;
    }

    static getMessageTextFromParts(parts: any[]): string {
        if (!parts || !Array.isArray(parts)) {
            return '';
        }
        
        return parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text || '')
            .join(' ');
    }

    static buildConversationHistory(conversationHistory: any[], systemPrompt: string, userQuery: string): { conversationHistory: any[], systemInstruction: string } {
        // For Google Gemini, we need to separate system instruction from conversation history
        let currentConversationHistory = conversationHistory.length > 0 ? 
            [...conversationHistory] : [];

        // Remove any existing system prompts from conversation history (they shouldn't be there)
        currentConversationHistory = currentConversationHistory.filter(msg => 
            !(msg.role === 'system' || 
              (msg.role === 'user' && msg.parts && msg.parts.some((part: any) => part.text && part.text.includes('You are a MongoDB query assistant'))))
        );

        return {
            conversationHistory: currentConversationHistory,
            systemInstruction: systemPrompt
        };
    }
}
