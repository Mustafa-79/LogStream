export function parseLogLine(line: string) {
  // Example: [2025-06-24T10:13:19.975Z] [ERROR] [mcadatpj8molqcfa6zb] This is a ERROR log message
  const regex = /^\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)$/;
  const match = line.match(regex);
  if (!match) return null;
  return {
    date: new Date(match[1]),
    log_level: match[2],
    trace_id: match[3],
    message: match[4],
    // Add more fields as needed
  };
}