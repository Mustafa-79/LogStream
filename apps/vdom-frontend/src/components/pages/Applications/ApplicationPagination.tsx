import { h } from "preact";
import { Pagination, ApplicationFilters } from "./types";
import { getVisiblePageNumbers } from "../../../utils/applicationUtils";
import "ojs/ojbutton";

interface ApplicationPaginationProps {
  pagination: Pagination;
  currentFilters: ApplicationFilters;
  searchQuery: string;
  onPageChange: (page: number) => void;
  onFirstPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
}

export function ApplicationPagination({
  pagination,
  currentFilters,
  searchQuery,
  onPageChange,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage
}: ApplicationPaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <>
      {/* Pagination Controls */}
      <div style="margin-top: 32px; padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px;">
        <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center">
          <div class="oj-typography-body-sm" style="color: #6b7280;">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} applications
          </div>
          
          <div class="oj-flex oj-sm-align-items-center" style="gap: 8px;">
            <oj-button
              class="oj-button-outlined-chrome"
              disabled={!pagination.hasPrevPage}
              onojAction={onFirstPage}
              style="min-width: auto; padding: 8px 12px;"
            >
              <span class="oj-typography-body-sm">First</span>
            </oj-button>
            
            <oj-button
              class="oj-button-outlined-chrome"
              disabled={!pagination.hasPrevPage}
              onojAction={onPrevPage}
              style="min-width: auto; padding: 8px 12px;"
            >
              <span class="oj-typography-body-sm">‹ Prev</span>
            </oj-button>
            
            {getVisiblePageNumbers(pagination.currentPage, pagination.totalPages).map((pageNum) => (
              <oj-button
                key={pageNum}
                class={pageNum === pagination.currentPage ? "oj-button-primary" : "oj-button-outlined-chrome"}
                onojAction={() => onPageChange(pageNum)}
                style="min-width: 40px; padding: 8px 12px;"
              >
                <span class="oj-typography-body-sm">{pageNum}</span>
              </oj-button>
            ))}
            
            <oj-button
              class="oj-button-outlined-chrome"
              disabled={!pagination.hasNextPage}
              onojAction={onNextPage}
              style="min-width: auto; padding: 8px 12px;"
            >
              <span class="oj-typography-body-sm">Next ›</span>
            </oj-button>
            
            <oj-button
              class="oj-button-outlined-chrome"
              disabled={!pagination.hasNextPage}
              onojAction={onLastPage}
              style="min-width: auto; padding: 8px 12px;"
            >
              <span class="oj-typography-body-sm">Last</span>
            </oj-button>
          </div>
        </div>
      </div>

      {/* Page Info */}
      <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
        <p style="margin: 0;">
          Page {pagination.currentPage} of {pagination.totalPages} • 
          Last updated: {new Date().toLocaleTimeString()}
          {Object.keys(currentFilters).length > 0 && (
            <span> • Filtered by: {currentFilters.active === true ? 'Active applications' : currentFilters.active === false ? 'Inactive applications' : 'All applications'}</span>
          )}
          {searchQuery.trim() !== '' && (
            <span> • Search: "{searchQuery}"</span>
          )}
        </p>
      </div>
    </>
  );
}