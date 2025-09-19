export interface Report {
  id: string;
  timestamp: string;
  userId: string;
  roundId?: string;
  reasons: string[];
  description: string;
}

// In-memory storage for reports (in production, use a proper database)
const reports: Report[] = [];

export function addReport(report: Omit<Report, 'id'>): void {
  const newReport: Report = {
    ...report,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
  };
  reports.push(newReport);
  console.log(`[reports] Added report: ${newReport.id}`);
}

export function getReports(): Report[] {
  return [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getReportsCount(): number {
  return reports.length;
}