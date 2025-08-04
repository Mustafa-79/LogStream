import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { registerCustomElement } from "ojs/ojvcomponent";
import "ojs/ojbutton";
import "oj-c/progress-circle";
import { StarredMessage } from "../../services/starredMessageService";

interface StarredMessagesProps {
    isOpen: boolean;
    OnClose: () => void;
    starredMessages: StarredMessage[];
    isLoading: boolean;
    OnLoadStarredMessages: () => void;
    OnUnstarMessage: (starredMessageId: string) => void;
    OnMessageClick: (messageContent: string) => void;
}

export const StarredMessages = registerCustomElement(
    "app-starred-messages",
    ({
        isOpen = false,
        OnClose,
        starredMessages = [],
        isLoading = false,
        OnLoadStarredMessages,
        OnUnstarMessage,
        OnMessageClick
    }: StarredMessagesProps) => {
        const [searchTerm, setSearchTerm] = useState('');

        useEffect(() => {
            if (isOpen && starredMessages.length === 0 && !isLoading) {
                OnLoadStarredMessages();
            }
        }, [isOpen]);

        const filteredMessages = starredMessages.filter(message =>
            message.messageContent.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const handleUnstar = async (starredMessageId: string) => {
            try {
                await OnUnstarMessage(starredMessageId);
                OnLoadStarredMessages();
            } catch (error) {
                console.error('Error unstarring message:', error);
            }
        };

        const handleMessageClick = (messageContent: string) => {
            OnMessageClick(messageContent);
            OnClose();
        };

        if (!isOpen) return null;

        return (
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 3000; display: flex; justify-content: center; align-items: center;">
                <div style="background: white; border-radius: 12px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25); max-width: 800px; width: 90%; max-height: 80%; display: flex; flex-direction: column;">
                    {/* Header */}
                    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; background: #f8fafc; border-radius: 12px 12px 0 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                                ⭐ Starred Messages
                                <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500;">
                                    {starredMessages.length}
                                </span>
                            </h2>
                            <oj-button
                                onojAction={OnClose}
                                title="Close Starred Messages"
                                style="min-width: auto; padding: 8px;"
                            >
                                ✕
                            </oj-button>
                        </div>

                        {/* Search */}
                        <div style="position: relative;">
                            <input
                                type="text"
                                placeholder="Search starred messages..."
                                value={searchTerm}
                                onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                                style="width: 90%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.875rem; background: white;"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div style="flex: 1; overflow-y: auto; padding: 24px;">
                        {isLoading && (
                            <div style="display: flex; justify-content: center; align-items: center; padding: 40px;">
                                <oj-c-progress-circle size="md" value={-1}></oj-c-progress-circle>
                                <span style="margin-left: 12px; color: #6b7280;">Loading starred messages...</span>
                            </div>
                        )}

                        {!isLoading && filteredMessages.length === 0 && starredMessages.length === 0 && (
                            <div style="text-align: center; padding: 40px; color: #6b7280;">
                                <div style="font-size: 3rem; margin-bottom: 16px;">⭐</div>
                                <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; color: #374151;">No starred messages yet</h3>
                                <p style="margin: 0; font-size: 0.875rem;">Star important messages by clicking the star icon next to them in the chat. Click on starred messages to reuse them!</p>
                            </div>
                        )}

                        {!isLoading && filteredMessages.length === 0 && starredMessages.length > 0 && (
                            <div style="text-align: center; padding: 40px; color: #6b7280;">
                                <div style="font-size: 2rem; margin-bottom: 16px;">🔍</div>
                                <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; color: #374151;">No messages found</h3>
                                <p style="margin: 0; font-size: 0.875rem;">Try adjusting your search term.</p>
                            </div>
                        )}

                        {!isLoading && filteredMessages.map((message) => (
                            <div
                                key={message._id}
                                style="margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: white; cursor: pointer; transition: all 0.2s ease-in-out;"
                                onMouseEnter={(e) => {
                                    (e.target as HTMLElement).style.borderColor = '#3b82f6';
                                    (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.borderColor = '#e5e7eb';
                                    (e.target as HTMLElement).style.boxShadow = 'none';
                                }}
                                onClick={() => handleMessageClick(message.messageContent)}
                            >
                                <div style="padding: 16px;">
                                    <div style="display: flex; align-items: center;">
                                        <span style="font-size: 0.75rem; color: #6b7280;">
                                            Starred on {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                                        </span>
                                      </div>

                                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; color: #374151; line-height: 1.6; white-space: pre-wrap;">
                                          {message.messageContent}
                                          <oj-button
                                            onojAction={(e) => {
                                                e.stopPropagation();
                                                handleUnstar(message._id);
                                            }}
                                            title="Remove from starred"
                                            style="min-width: auto; padding: 4px 8px; font-size: 0.75rem;"
                                        >
                                            🗑️
                                        </oj-button>
                                    </div>

                                    {/* Click hint */}
                                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #f3f4f6;">
                                        <span style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">
                                            💡 Click to use this message in chat
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    {!isLoading && filteredMessages.length > 0 && (
                        <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #f8fafc; border-radius: 0 0 12px 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #6b7280;">
                                <span>
                                    Showing {filteredMessages.length} of {starredMessages.length} starred messages
                                </span>
                                <oj-button
                                    onojAction={OnLoadStarredMessages}
                                    title="Refresh starred messages"
                                    style="min-width: auto; padding: 8px 12px; font-size: 0.75rem;"
                                >
                                    🔄 Refresh
                                </oj-button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);
