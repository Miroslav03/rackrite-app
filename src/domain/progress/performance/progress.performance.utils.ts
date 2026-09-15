export function validRpe(rpe: number | null): rpe is number {
  return rpe !== null && Number.isInteger(rpe) && rpe >= 1 && rpe <= 10;
}
