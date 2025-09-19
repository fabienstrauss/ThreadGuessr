import { addReport } from '../services/reports';

export async function postReportHandler(ctx: { userId: string; roundId?: string; reasons?: string[]; description?: string }): Promise<void> {
  if (!ctx.reasons || ctx.reasons.length === 0) {
    throw new Error('At least one report reason is required');
  }

  const report = {
    timestamp: new Date().toISOString(),
    userId: ctx.userId,
    ...(ctx.roundId && { roundId: ctx.roundId }),
    reasons: ctx.reasons,
    description: ctx.description || ''
  };

  addReport(report);
  console.warn("REPORT SUBMITTED:", report);
}
