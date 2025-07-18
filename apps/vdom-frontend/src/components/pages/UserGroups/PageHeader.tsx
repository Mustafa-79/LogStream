import "ojs/ojbutton";

interface PageHeaderProps {
  loading: boolean;
  isSearching: boolean;
  onCreateGroup: () => void;
}

export function PageHeader({ loading, isSearching, onCreateGroup }: PageHeaderProps) {
  return (
    <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 24px;">
      <div style="flex: 1;">
        <h1 class="oj-typography-heading-lg" style="margin: 0;">
          User Groups
        </h1>
        <p class="oj-typography-body-md" style="color: #6b7280; margin-top: 4px;">
          Organize users into groups and manage their application access.
        </p>
      </div>
      <div style="flex-shrink: 0; margin-left: 16px;">
        <oj-button
          class="oj-button-primary"
          onojAction={onCreateGroup}
          disabled={loading || isSearching}
        >
          <span slot='startIcon' class='oj-ux-ico-plus'></span>
          Create Group
        </oj-button>
      </div>
    </div>
  );
}
