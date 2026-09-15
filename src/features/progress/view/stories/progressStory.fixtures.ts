import type { LiftFamily } from "@/domain/domain.types";
import type {
  LiftAnalysis,
  ProgressOverview,
} from "@/domain/progress/analysis/progress.analysis.types";
import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import type { CompetitionLiftExposure } from "@/domain/progress/history/progress.history.types";
import type { Measurement } from "@/domain/progress/measurements/progress.measurements.types";
import type { LiftTrendMetrics } from "@/domain/progress/trends/progress.trends.types";

import { addLocalCalendarDays } from "@/shared/utils/localCalendar";

// Fixed local dates keep previews reproducible, even when the device clock changes.
export const storyAnalysisTime = new Date(2026, 8, 15, 12).getTime();
export const storyFamilies = ["squat", "bench", "deadlift"] as const;

function historyFor(family: LiftFamily): CompetitionLiftExposure[] {
  const weight = { squat: 140, bench: 100, deadlift: 180 }[family];

  return Array.from({ length: 16 }, (_, index) => {
    const finishedAt = addLocalCalendarDays(storyAnalysisTime, -60 + index * 4);
    const workoutId = `preview_${family}_${index}`;
    const entryId = `${workoutId}_entry`;
    const exerciseId = `competition_${family}`;

    return {
      workout: {
        id: workoutId,
        status: "completed",
        startedAt: finishedAt - 3600000,
        finishedAt,
      },
      exercise: {
        id: exerciseId,
        kind: "competition_lift",
        origin: "built_in",
        liftFamily: family,
      },
      entries: [
        {
          exercise: { id: entryId, workoutId, exerciseId, orderIndex: 0 },
          sets: Array.from({ length: 3 }, (_, setIndex) => ({
            id: `${entryId}_${setIndex}`,
            workoutExerciseId: entryId,
            setIndex,
            type: "working",
            weight,
            reps: 3,
            rpe: 8,
            finishedAt: finishedAt - 60000 + setIndex,
          })),
        },
      ],
    };
  });
}

export const recordedOverview = analyzeCompetitionLifts(
  storyFamilies.flatMap(historyFor),
  storyAnalysisTime,
);
export const emptyOverview = analyzeCompetitionLifts([], storyAnalysisTime);
export const earlyOverview = analyzeCompetitionLifts(
  storyFamilies.map((family) => historyFor(family)[15]),
  storyAnalysisTime,
);

export const available = (value: number): Measurement => ({
  status: "available",
  value,
});

/** Explicit visual overrides exercise presentation states without pretending the classifier generated them. */
export function previewOverview(
  change: (analysis: LiftAnalysis) => Partial<LiftAnalysis>,
  overview: ProgressOverview = recordedOverview,
): ProgressOverview {
  const lift = (family: LiftFamily): LiftAnalysis => ({
    ...overview.lifts[family],
    ...change(overview.lifts[family]),
    family,
  });

  return {
    ...overview,
    lifts: {
      squat: lift("squat"),
      bench: lift("bench"),
      deadlift: lift("deadlift"),
    },
  };
}

export function withTrends(
  change: (trends: LiftTrendMetrics) => Partial<LiftTrendMetrics>,
) {
  return previewOverview((analysis) => ({
    trends: { ...analysis.trends, ...change(analysis.trends) },
  }));
}
