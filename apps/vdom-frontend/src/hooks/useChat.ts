import { useState, useCallback, useEffect } from "preact/hooks";
import ChatService, { Message, ChatQueryRequest } from "../services/chatService";
import StarredMessageService, { StarredMessage } from "../services/starredMessageService";

interface CopilotState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationHistory: any[];
  starredMessages: StarredMessage[];
  isStarredMessagesOpen: boolean;
  isLoadingStarredMessages: boolean;
}

interface CopilotActions {
  // UI State actions
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  minimizeCopilot: () => void;
  restoreCopilot: () => void;
  
  // Message actions
  sendMessage: (userInput: string) => Promise<void>;
  clearMessages: () => void;

  // Starred messages actions
  toggleStarredMessages: () => void;
  starMessage: (message: Message) => Promise<void>;
  unstarMessage: (starredMessageId: string) => Promise<void>;
  loadStarredMessages: () => Promise<void>;
}

interface UseChatReturn {
  state: CopilotState;
  actions: CopilotActions;
}

export const useChat = (userRole: string = 'user'): UseChatReturn => {
  const [state, setState] = useState<CopilotState>({
    isOpen: false,
    isMinimized: false,
    messages: [
      {
        id: '1',
        type: 'assistant',
        content: `Hi! I'm your MongoDB query assistant. I can help you analyze logs, applications, and system data using natural language. Try asking me things like:

• "How many logs were created today?"
• "Show me error logs from the past hour"
• "What applications have the most logs?"
• "Find logs containing 'database connection' in the message"

${userRole === 'admin' ? 'As an admin, you have full access to all data and operations.' : 'You have read-only access to logs and applications data.'}

What would you like to know?`,
        timestamp: new Date(),
      }
    ],
    isLoading: false,
    error: null,
    conversationHistory: [],
    starredMessages: [],
    isStarredMessagesOpen: false,
    isLoadingStarredMessages: false,
  });

  // Load starred messages on initialization
  useEffect(() => {
    const initializeStarredMessages = async () => {
      try {
        const response = await StarredMessageService.getStarredMessages();
        setState(prev => ({
          ...prev,
          starredMessages: response.data.starredMessages,
        }));
      } catch (error) {
        // Silently fail on initialization - user will still be able to star messages
        console.warn('Could not load initial starred messages:', error);
      }
    };

    initializeStarredMessages();
  }, []);

  const actions: CopilotActions = {
    // UI State actions
    openCopilot: useCallback(() => {
      setState(prev => ({ ...prev, isOpen: true }));
    }, []),

    closeCopilot: useCallback(() => {
      setState(prev => ({ ...prev, isOpen: false, isMinimized: false }));
    }, []),

    toggleCopilot: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        isOpen: !prev.isOpen,
        isMinimized: false 
      }));
    }, []),

    minimizeCopilot: useCallback(() => {
      setState(prev => ({ ...prev, isMinimized: true }));
    }, []),

    restoreCopilot: useCallback(() => {
      setState(prev => ({ ...prev, isMinimized: false }));
    }, []),

    // Message actions
    sendMessage: useCallback(async (userInput: string) => {
      if (!userInput.trim() || state.isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: userInput.trim(),
        timestamp: new Date(),
      };

      const loadingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Analyzing your query...',
        timestamp: new Date(),
        loading: true,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage, loadingMessage],
        isLoading: true,
        error: null,
      }));

      try {
        // Build conversation history from messages INCLUDING the current user message
        const conversationHistory = [];
        
        // Add previous messages to conversation history
        for (const message of state.messages) {
          if (message.type === 'user') {
            conversationHistory.push({
              role: "user",
              parts: [{ text: message.content }]
            });
          } else if (message.type === 'assistant' && !message.loading) {
            conversationHistory.push({
              role: "model", 
              parts: [{ text: message.content }]
            });
          }
        }

        // Add current user message to conversation history
        conversationHistory.push({
          role: "user",
          parts: [{ text: userMessage.content }]
        });

        const queryRequest: ChatQueryRequest = {
          query: userMessage.content,
          conversationHistory: conversationHistory
        };

        const response = await ChatService.sendQuery(queryRequest);

        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: response.data.interpretation || 'Query completed successfully.',
          timestamp: new Date(),
          queryResults: response.data.query_results,
          success: response.data.success,
        };

        setState(prev => ({
          ...prev,
          messages: prev.messages.slice(0, -1).concat(assistantMessage),
          isLoading: false,
          conversationHistory: response.data.conversationHistory || prev.conversationHistory
        }));
      } catch (err) {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again or rephrase your question.`,
          timestamp: new Date(),
          success: false,
        };

        setState(prev => ({
          ...prev,
          messages: prev.messages.slice(0, -1).concat(errorMessage),
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to send message',
        }));
        throw err; // Re-throw so the component can handle the error
      }
    }, [state.isLoading, state.messages]),

    clearMessages: useCallback(() => {
      setState(prev => ({
        ...prev,
        messages: [
          {
            id: '1',
            type: 'assistant',
            content: `Chat cleared! I'm ready to help you with your MongoDB queries. What would you like to know?`,
            timestamp: new Date(),
          }
        ],
        error: null,
        conversationHistory: []
      }));
    }, []),

    // Starred messages actions
    toggleStarredMessages: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        isStarredMessagesOpen: !prev.isStarredMessagesOpen 
      }));
    }, []),

    starMessage: useCallback(async (message: Message) => {
      try {
        const response = await StarredMessageService.starMessage({
          messageContent: message.content,
        });

        // Update the message to mark it as starred and add to starred messages
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === message.id ? { ...msg, isStarred: true } : msg
          ),
          starredMessages: [...prev.starredMessages, response.data]
        }));
      } catch (error) {
        console.error('Error starring message:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to star message'
        }));
      }
    }, []),

    unstarMessage: useCallback(async (starredMessageId: string) => {
      try {
        await StarredMessageService.unstarMessage(starredMessageId);

        // Find the starred message that was removed
        const removedStarredMessage = state.starredMessages.find(starred => starred._id === starredMessageId);
        
        // Update the message to mark it as not starred and remove from starred messages
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.type === 'user' && removedStarredMessage && msg.content === removedStarredMessage.messageContent 
              ? { ...msg, isStarred: false } 
              : msg
          ),
          starredMessages: prev.starredMessages.filter(starred => starred._id !== starredMessageId)
        }));
      } catch (error) {
        console.error('Error unstarring message:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to unstar message'
        }));
      }
    }, [state.starredMessages]),

    loadStarredMessages: useCallback(async () => {
      setState(prev => ({ ...prev, isLoadingStarredMessages: true }));
      try {
        const response = await StarredMessageService.getStarredMessages();
        setState(prev => {
          // Update starred status for existing messages
          const updatedMessages = prev.messages.map(msg => ({
            ...msg,
            isStarred: msg.type === 'user' && response.data.starredMessages.some(
              starred => starred.messageContent === msg.content
            )
          }));

          return {
            ...prev,
            messages: updatedMessages,
            starredMessages: response.data.starredMessages,
            isLoadingStarredMessages: false,
          };
        });
      } catch (error) {
        console.error('Error loading starred messages:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load starred messages',
          isLoadingStarredMessages: false,
        }));
      }
    }, []),
  };

  return { state, actions };
};