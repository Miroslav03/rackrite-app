import type { LiftFamily } from "@/domain/domain.types";
import type { ProgressOverview } from "@/domain/progress/analysis/progress.analysis.types";
import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import type { CompetitionLiftExposure } from "@/domain/progress/history/progress.history.types";
import { addLocalCalendarDays } from "@/shared/utils/localCalendar";

type AlgorithmSetGroup = {
  weight: number;
  reps: number;
  rpes: readonly (number | null)[];
};

type AlgorithmSessionInput = {
  kind: "heavy" | "volume" | "technique";
  label: string;
  groups: readonly AlgorithmSetGroup[];
};

export type AlgorithmTrainingWeek = readonly AlgorithmSessionInput[];

export type AlgorithmCheckpoint = {
  week: number;
  day: number;
  label: string;
  history: readonly CompetitionLiftExposure[];
  overview: ProgressOverview;
};

export type AlgorithmScenario = {
  number: number;
  title: string;
  intent: string;
  liftFamily: LiftFamily;
  sessions: readonly (AlgorithmSessionInput & { week: number; day: number })[];
  history: readonly CompetitionLiftExposure[];
  checkpoints: readonly AlgorithmCheckpoint[];
};

type ScenarioInput = Pick<
  AlgorithmScenario,
  "number" | "title" | "intent" | "liftFamily"
> & {
  workoutIdPrefix: string;
  weeks: readonly AlgorithmTrainingWeek[];
};

// Fixed local dates preserve calendar-week comparisons on every device.
const firstHeavyTime = new Date(2026, 0, 5, 18).getTime();
const sessionDayOffsets = { heavy: 0, volume: 3, technique: 5 } as const;

export function buildAlgorithmScenario({
  number,
  title,
  intent,
  liftFamily,
  workoutIdPrefix,
  weeks,
}: ScenarioInput): AlgorithmScenario {
  const exerciseId = `competition_${liftFamily}`;
  const sessions = weeks.flatMap((week, weekIndex) =>
    week.map((session, dayIndex) => ({
      ...session,
      week: weekIndex + 1,
      day: dayIndex + 1,
    })),
  );
  const history = sessions.map((session) => {
    const finishedAt = addLocalCalendarDays(
      firstHeavyTime,
      (session.week - 1) * 7 + sessionDayOffsets[session.kind],
    );
    const workoutId = `${workoutIdPrefix}_week_${session.week}_${session.kind}`;
    const entryId = `${workoutId}_entry`;
    const sets = session.groups.flatMap((group) =>
      group.rpes.map((rpe) => ({
        weight: group.weight,
        reps: group.reps,
        rpe: rpe === null ? null : Math.floor(rpe),
      })),
    );

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
        liftFamily,
      },
      entries: [
        {
          exercise: { id: entryId, workoutId, exerciseId, orderIndex: 0 },
          sets: sets.map((set, setIndex) => ({
            ...set,
            id: `${entryId}_set_${setIndex + 1}`,
            workoutExerciseId: entryId,
            setIndex,
            type: "working",
            finishedAt: finishedAt - (sets.length - setIndex) * 60000,
          })),
        },
      ],
    } satisfies CompetitionLiftExposure;
  });
  const checkpoints = sessions.map((session, index) => {
    const prefix = history.slice(0, index + 1);
    return {
      week: session.week,
      day: session.day,
      label: session.label,
      history: prefix,
      overview: analyzeCompetitionLifts(
        prefix,
        history[index].workout.finishedAt,
      ),
    };
  });

  return { number, title, intent, liftFamily, sessions, history, checkpoints };
}
