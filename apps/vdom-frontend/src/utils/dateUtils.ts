/**
 * Utility function to generate consistent default date filters
 * Returns the exact same timestamps to ensure consistency across components
 */
export const getDefaultDateFilters = () => {
  const currentTime = new Date();
  currentTime.setMilliseconds(0);

  const sevenDaysAgo = new Date(currentTime);
  sevenDaysAgo.setDate(currentTime.getDate() - 7);
  sevenDaysAgo.setMilliseconds(0);

  return {
    fromDate: sevenDaysAgo.toISOString(),
    toDate: currentTime.toISOString(),
  };
};

/**
 * Calculate minimum allowed date based on data retention period (DRP)
 * @param drpDays - Data retention period in days
 * @returns ISO string of the minimum allowed date
 */
export const calculateDRPMinDate = (drpDays: number): string => {
  const currentTime = new Date();
  const minDate = new Date(currentTime);
  minDate.setDate(currentTime.getDate() - drpDays);
  minDate.setMilliseconds(0);
  return minDate.toISOString();
};
