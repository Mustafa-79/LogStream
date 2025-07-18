import { Pagination } from './types';

interface StatusFooterProps {
  loading: boolean;
  error: string | null;
  userGroupsLength: number;
  pagination: Pagination;
}

export function StatusFooter({ loading, error, userGroupsLength, pagination }: StatusFooterProps) {
  if (loading || error || userGroupsLength === 0) {
    return null;
  }

  return (
    <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
      <p style="margin: 0;">
        Page {pagination.currentPage} of {pagination.totalPages} •
        Last updated: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}
