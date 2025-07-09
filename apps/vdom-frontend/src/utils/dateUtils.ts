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
