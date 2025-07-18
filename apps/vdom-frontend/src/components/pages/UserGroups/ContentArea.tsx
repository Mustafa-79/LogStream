import "ojs/ojbutton";
import "oj-c/progress-circle";
import { UserGroupCard } from './UserGroupCard';
import { IGroup } from './types';

interface ContentAreaProps {
  loading: boolean;
  error: string | null;
  userGroups: IGroup[];
  searchTerm: string;
  selectedApplications: Set<string>;
  getStatusFilterValue: () => 'active' | 'inactive' | 'all';
  onDeleteGroup: (groupId: string) => Promise<void>;
  onEditGroup: (group: IGroup) => void;
  onRetry: () => void;
}

export function ContentArea({
  loading,
  error,
  userGroups,
  searchTerm,
  selectedApplications,
  getStatusFilterValue,
  onDeleteGroup,
  onEditGroup,
  onRetry
}: ContentAreaProps) {
  if (loading) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">Loading user groups...</div>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <oj-c-progress-circle
              class="oj-sm-margin-4x-vertical oj-sm-padding-4x"
              aria-labelledby="lgLabel indetLabel"
              size="lg"
              value={-1}
            ></oj-c-progress-circle>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom" style={{ color: 'var(--oj-core-color-danger)' }}>
            Error loading user groups
          </div>
          <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{error}</p>
          <oj-button class="oj-button-primary" onojAction={onRetry}>
            Retry
          </oj-button>
        </div>
      </div>
    );
  }

  if (userGroups.length === 0) {
    return (
      <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">No user groups found</div>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-flex oj-flex-row">
      {userGroups.map(group => (
        <UserGroupCard 
          key={group._id} 
          group={group} 
          onDelete={onDeleteGroup} 
          onEdit={onEditGroup} 
        />
      ))}
    </div>
  );
}
