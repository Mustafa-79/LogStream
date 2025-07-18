import "ojs/ojbutton";
import { Pagination } from './types';

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onFirstPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
  getVisiblePageNumbers: () => number[];
}

export function PaginationControls({
  pagination,
  onPageChange,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
  getVisiblePageNumbers
}: PaginationControlsProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center">
        <div class="oj-typography-body-sm" style="color: #6b7280;">
          Showing {((pagination.currentPage - 1) * pagination.groupsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.groupsPerPage, pagination.totalGroups)} of {pagination.totalGroups} entries
        </div>

        <div class="oj-flex oj-sm-align-items-center" style="gap: 8px;">
          <oj-button
            class="oj-button-outlined-chrome"
            disabled={!pagination.hasPrev}
            onojAction={onFirstPage}
            style="min-width: auto; padding: 8px 12px;"
          >
            <span class="oj-typography-body-sm">First</span>
          </oj-button>

          <oj-button
            class="oj-button-outlined-chrome"
            disabled={!pagination.hasPrev}
            onojAction={onPrevPage}
            style="min-width: auto; padding: 8px 12px;"
          >
            <span class="oj-typography-body-sm">‹ Prev</span>
          </oj-button>

          {getVisiblePageNumbers().map((pageNum) => (
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
            disabled={!pagination.hasNext}
            onojAction={onNextPage}
            style="min-width: auto; padding: 8px 12px;"
          >
            <span class="oj-typography-body-sm">Next ›</span>
          </oj-button>

          <oj-button
            class="oj-button-outlined-chrome"
            disabled={!pagination.hasNext}
            onojAction={onLastPage}
            style="min-width: auto; padding: 8px 12px;"
          >
            <span class="oj-typography-body-sm">Last</span>
          </oj-button>
        </div>
      </div>
    </div>
  );
}
