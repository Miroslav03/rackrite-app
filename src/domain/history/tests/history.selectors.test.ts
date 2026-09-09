import { createWorkoutWithTwoExercises } from "@/domain/workout/tests/workout.test.helpers";
import type {
  WorkoutAggregate,
  WorkoutSet,
} from "@/domain/workout/workout.types";

import { summarizeCompletedWorkout } from "../history.utils";

function completedWorkout(sets: Partial<WorkoutSet>[]): WorkoutAggregate {
  const aggregate = createWorkoutWithTwoExercises();
  return {
    workout: {
      ...aggregate.workout,
      status: "completed",
      startedAt: 0,
      finishedAt: 4_530_000,
    },
    exercises: aggregate.exercises.map((exercise, index) =>
      index === 0
        ? {
            ...exercise,
            sets: sets.map((set, setIndex) => ({
              ...exercise.sets[0],
              id: `set_${setIndex}`,
              setIndex,
              weight: 100,
              reps: 5,
              finishedAt: 1000,
              ...set,
            })),
          }
        : exercise,
    ),
  };
}

describe("history summaries", () => {
  it("counts completed sets and volume by type, omitting skipped exercises and sets", () => {
    const aggregate = completedWorkout([
      { type: "warmup", weight: 40, reps: 10 },
      { type: "working", weight: 80, reps: 5 },
      { type: "top", weight: 100, reps: 3 },
      { type: "backoff", weight: 70, reps: 5 },
      { type: "top", weight: 200, reps: 10, finishedAt: null },
    ]);
    const original = JSON.stringify(aggregate);
    expect(summarizeCompletedWorkout(aggregate)).toMatchObject({
      durationMinutes: 75,
      totalWeight: 1450,
      liftFamilies: ["bench"],
      exercises: [
        {
          name: "Competition Bench",
          totalSets: 4,
          setCounts: { warmup: 1, working: 1, top: 1, backoff: 1 },
          topSet: { weight: 100, reps: 3 },
        },
      ],
    });
    expect(JSON.stringify(aggregate)).toBe(original);
  });

  it("chooses weight then reps, ignoring warm-ups and the explicit Top tag", () => {
    expect(
      summarizeCompletedWorkout(
        completedWorkout([
          { type: "warmup", weight: 200, reps: 10 },
          { type: "top", weight: 80, reps: 10 },
          { type: "working", weight: 100, reps: 3 },
          { type: "backoff", weight: 100, reps: 5 },
          { type: "working", weight: 100, reps: 5 },
        ]),
      ).exercises[0].topSet,
    ).toEqual({ weight: 100, reps: 5 });
  });

  it("falls back to warm-ups and preserves zero weights", () => {
    const summary = summarizeCompletedWorkout(
      completedWorkout([
        { type: "warmup", weight: 0, reps: 10 },
        { type: "warmup", weight: 0, reps: 5 },
      ]),
    );
    expect(summary.totalWeight).toBe(0);
    expect(summary.exercises[0].topSet).toEqual({ weight: 0, reps: 10 });
    expect(summary.exercises[0].totalSets).toBe(2);
  });

  it("includes variations in family badges and accessories in the ledger", () => {
    const aggregate = completedWorkout([{ type: "working" }]);
    aggregate.exercises[1].sets[0] = {
      ...aggregate.exercises[1].sets[0],
      weight: 20,
      reps: 10,
      finishedAt: 1000,
    };
    const bench = aggregate.exercises[0];
    aggregate.exercises.splice(1, 0, {
      ...bench,
      workoutExercise: { ...bench.workoutExercise, id: "paused_bench" },
      exercise: {
        id: "paused_bench",
        name: "Paused Bench",
        kind: "lift_variation",
        origin: "built_in",
        liftFamily: "bench",
        defaultRestSeconds: 180,
      },
    });
    const summary = summarizeCompletedWorkout(aggregate);
    expect(summary.liftFamilies).toEqual(["bench"]);
    expect(summary.exercises.map(({ name }) => name)).toEqual([
      "Competition Bench",
      "Paused Bench",
      "Barbell Row",
    ]);
    expect(summary.totalWeight).toBe(1200);
  });

  it("rejects active workouts and completed workouts without a finish timestamp", () => {
    expect(() =>
      summarizeCompletedWorkout(createWorkoutWithTwoExercises()),
    ).toThrow("completed workout");
    const aggregate = completedWorkout([]);
    aggregate.workout.finishedAt = null;
    expect(() => summarizeCompletedWorkout(aggregate)).toThrow("finish time");
  });
});
