import { h } from "preact";
import { LogStats } from "./types";
import "oj-c/progress-circle";
import "oj-c/action-card";

interface LogStatisticsProps {
  logStats: LogStats | null;
  statsLoading: boolean;
  statsError: string | null;
}

export function LogStatistics({ logStats, statsLoading, statsError }: LogStatisticsProps) {
  if (statsLoading) {
    return (
      <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-4x">
        <oj-c-progress-circle size="sm" value={-1}></oj-c-progress-circle>
        <span class="oj-typography-body-md oj-sm-margin-2x-start">Loading statistics...</span>
      </div>
    );
  }

  if (statsError || !logStats) {
    return (
      <div style="padding: 20px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px;">
        <p style="margin: 0;">No statistics available</p>
      </div>
    );
  }

  return (
    <div class="oj-flex oj-sm-flex-wrap" style="gap: 20px;">
      <div class="oj-sm-flex-initial" style="flex: 1 1 280px;">
        <oj-c-action-card
          style="min-width: 250px; cursor: pointer; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%;"
        >
          <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                Total Logs
              </div>
              <div class="oj-typography-heading-lg" style="color: #1f2937; font-weight: 700;">
                {logStats.totalCount}
              </div>
              <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                Results
              </div>
            </div>
          </div>
        </oj-c-action-card>
      </div>

      <div class="oj-sm-flex-initial" style="flex: 1 1 280px;">
        <oj-c-action-card
          style="min-width: 250px; cursor: pointer; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%;"
        >
          <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                Error Logs
              </div>
              <div class="oj-typography-heading-lg" style="color: #dc2626; font-weight: 700;">
                {logStats.errorCount}
              </div>
              <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                Critical issues
              </div>
            </div>
          </div>
        </oj-c-action-card>
      </div>

      <div class="oj-sm-flex-initial" style="flex: 1 1 280px;">
        <oj-c-action-card
          style="min-width: 250px; cursor: pointer; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%;"
        >
          <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                Warning Logs
              </div>
              <div class="oj-typography-heading-lg" style="color: #f59e0b; font-weight: 700;">
                {logStats.warningCount}
              </div>
              <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                Potential issues
              </div>
            </div>
          </div>
        </oj-c-action-card>
      </div>

      <div class="oj-sm-flex-initial" style="flex: 1 1 280px;">
        <oj-c-action-card
          style="min-width: 250px; cursor: pointer; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%;"
        >
          <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                Info & Debug Logs
              </div>
              <div class="oj-typography-heading-lg" style="color: #3b82f6; font-weight: 700;">
                {logStats.infoCount + logStats.debugCount}
              </div>
              <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                Informational logs
              </div>
            </div>
          </div>
        </oj-c-action-card>
      </div>
    </div>
  );
}