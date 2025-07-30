import { h } from "preact";
import { registerCustomElement } from "ojs/ojvcomponent";
import "ojs/ojbutton";

interface ChatFabProps {
  OnClick: () => void;
  isOpen: boolean;
}

export const ChatFab = registerCustomElement(
  "app-chat-fab",
  ({ OnClick, isOpen = false }: ChatFabProps) => {
    if (isOpen) return null; 

    return (
      <div
        style="
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1500;
          transition: transform 0.2s ease-in-out;
        "
      >
        <oj-button
          chroming="callToAction"
          onojAction={OnClick}
          title="Open MongoDB Copilot"
          style="
            border-radius: 50%;
            width: 64px;
            height: 64px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border: none;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
          "
        >
          🤖
        </oj-button>
        
        {/* Tooltip */}
        <div
          style="
            position: absolute;
            bottom: 100%;
            right: 0;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: #1f2937;
            color: white;
            border-radius: 6px;
            font-size: 0.875rem;
            white-space: nowrap;
            opacity: 0;
            transform: translateY(8px);
            transition: all 0.2s ease-in-out;
            pointer-events: none;
          "
          className="copilot-tooltip"
        >
          Ask MongoDB Copilot
          <div
            style="
              position: absolute;
              top: 100%;
              right: 16px;
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 4px solid #1f2937;
            "
          />
        </div>
        
        <style>
          {`
            .copilot-tooltip:hover {
              opacity: 1 !important;
              transform: translateY(0) !important;
            }
          `}
        </style>
      </div>
    );
  }
);