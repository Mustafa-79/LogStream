import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { registerCustomElement } from "ojs/ojvcomponent";
import "ojs/ojbutton";
import "ojs/ojinputtext";
import "oj-c/progress-circle";
import "ojs/ojmessages";

interface ChatProps {
  isOpen: boolean;
  OnClose: () => void;
  chatState: {
    messages: any[];
    isLoading: boolean;
    error: string | null;
  };
  chatActions: {
    sendMessage: (input: string) => Promise<void>;
    clearMessages: () => void;
  };
}

export const Chat = registerCustomElement(
  "app-chat",
  ({ isOpen = false, OnClose, chatState, chatActions }: ChatProps) => {
    const { messages, isLoading, error } = chatState;
    const { sendMessage, clearMessages } = chatActions;
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    useEffect(() => {
      if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, [isOpen]);

    const handleSendMessage = async () => {
      if (!inputValue.trim() || isLoading) return;

      const messageToSend = inputValue.trim();
      setInputValue('');

      try {
        await sendMessage(messageToSend);
      } catch (error) {
        // Error is already handled in the hook
        console.error('Failed to send message:', error);
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    };

    const handleClearChat = () => {
      clearMessages();
    };

    const formatQueryResults = (results: any[]) => {
      if (!results || results.length === 0) return null;

      return results.map((result, index) => (
        <div key={index} style="margin: 12px 0; padding: 12px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
          <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">
            Tool: {result.tool}
            <span style={`margin-left: 12px; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; ${result.success ? 'background: #dcfce7; color: #166534;' : 'background: #fef2f2; color: #dc2626;'}`}>
              {result.success ? 'Success' : 'Failed'}
            </span>
          </div>
          
          {result.input && (
            <div style="margin-bottom: 8px;">
              <strong style="color: #374151;">Input:</strong>
              <pre style="background: white; padding: 8px; border-radius: 4px; margin: 4px 0; font-size: 0.875rem; overflow-x: auto;">
                {JSON.stringify(result.input, null, 2)}
              </pre>
            </div>
          )}
          
          {result.output && (
            <div style="margin-bottom: 8px;">
              <strong style="color: #374151;">Output:</strong>
              <pre style="background: white; padding: 8px; border-radius: 4px; margin: 4px 0; font-size: 0.875rem; overflow-x: auto; max-height: 200px; overflow-y: auto;">
                {typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          )}
          
          {result.error && (
            <div style="color: #dc2626;">
              <strong>Error:</strong> {result.error}
            </div>
          )}
        </div>
      ));
    };

    if (!isOpen) return null;

    return (
      <div style="position: fixed; top: 0; right: 0; bottom: 0; width: 500px; background: white; box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1); z-index: 2000; display: flex; flex-direction: column;">
        {/* Header */}
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; background: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #111827;">
              🤖 MongoDB Copilot
            </h2>
            <div style="display: flex; gap: 8px;">
              <oj-button
                onojAction={handleClearChat}
                title="Clear Chat"
              >
                Clear
              </oj-button>
              <oj-button
                onojAction={OnClose}
                title="Close Copilot"
              >
                ✕
              </oj-button>
            </div>
          </div>
          <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
            Ask questions about your logs and applications in natural language
          </p>
        </div>

        {/* Messages */}
        <div style="flex: 1; overflow-y: auto; padding: 20px;">
          {messages.map((message) => (
            <div
              key={message.id}
              style={`margin-bottom: 16px; display: flex; ${message.type === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}`}
            >
              <div
                style={`max-width: 85%; padding: 12px 16px; border-radius: 12px; ${
                  message.type === 'user'
                    ? 'background: #3b82f6; color: white;'
                    : 'background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;'
                }`}
              >
                {message.loading && (
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <oj-c-progress-circle size="sm" value={-1}></oj-c-progress-circle>
                    <span>{message.content}</span>
                  </div>
                )}
                
                {!message.loading && (
                  <>
                    <div style="white-space: pre-wrap; line-height: 1.5;">
                      {message.content}
                    </div>
                    
                    {message.queryResults && message.queryResults.length > 0 && (
                      <div style="margin-top: 12px;">
                        <details style="cursor: pointer;">
                          <summary style="font-weight: 600; color: #475569; margin-bottom: 8px;">
                            View Query Details ({message.queryResults.length} operations)
                          </summary>
                          {formatQueryResults(message.queryResults)}
                        </details>
                      </div>
                    )}
                  </>
                )}
                
                <div style={`font-size: 0.75rem; margin-top: 8px; opacity: 0.7; ${message.type === 'user' ? 'color: rgba(255,255,255,0.8);' : 'color: #64748b;'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f8fafc;">
          <div style="display: flex; gap: 12px; align-items: flex-end;">
            <div style="flex: 1;">
              <oj-input-text
                ref={inputRef}
                value={inputValue}
                placeholder="Ask about logs, applications, or analytics..."
                onrawValueChanged={(event) => setInputValue(event.detail.value)}
                disabled={isLoading}
                style="width: 100%;"
              />
            </div>
            <oj-button
              chroming="callToAction"
              disabled={!inputValue.trim() || isLoading}
              onojAction={handleSendMessage}
              title="Send message"
            >
              {isLoading ? '⏳' : '↗'}
            </oj-button>
          </div>
          
          <div style="margin-top: 8px; font-size: 0.75rem; color: #6b7280;">
            Press Enter to send • Shift+Enter for new line
          </div>

          {error && (
            <div style="margin-top: 8px; padding: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 0.875rem; color: #dc2626;">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
);