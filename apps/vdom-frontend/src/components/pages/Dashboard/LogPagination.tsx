import { h } from "preact";
import { Pagination } from "./types";
import { getVisiblePageNumbers } from "../../../utils/logUtils";
import "ojs/ojbutton";

interface LogPaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onFirstPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
}

export function LogPagination({
  pagination,
  onPageChange,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage
}: LogPaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center">
        <div class="oj-typography-body-sm" style="color: #6b7280;">
          Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
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
  );
}