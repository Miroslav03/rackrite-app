export interface HistoryOverviewMetrics {
  last30DaysVolumeKg: number | null;
  volumeChangeVsPrevious30DaysPct: number | null;
  sessionsLast30Days: number;
}

export interface HistoryWorkoutSummaryMetrics {
  totalVolumeKg: number | null;
  totalCompletedSets: number;
}
