type RowWithId = {
  id: string;
};

// BE AWARE THAT THIS IS A SHALLOW COPY COMPERATOR SINCE IT DIRECTLY USES Object.is
// IF YOUR OBJECT HAS REFERANCE VALUES YOU NEED TO EXTEND IT TO A RECURSIVE ALGORITHM
export function haveSamePersistedRowValues<TRow extends RowWithId>(
  previous: TRow,
  next: TRow,
): boolean {
  const previousKeys = Object.keys(previous) as Array<keyof TRow>;
  const nextKeys = Object.keys(next);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  return previousKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(next, key) &&
      Object.is(previous[key], next[key]),
  );
}

type RowChanges<TRow extends RowWithId> = {
  inserted: TRow[];
  updated: TRow[];
  deleted: TRow[];
};

export function diffRowsById<TRow extends RowWithId>(
  previousRows: TRow[],
  nextRows: TRow[],
): RowChanges<TRow> {
  const previousRowsById = new Map(previousRows.map((row) => [row.id, row]));
  const nextRowsById = new Map(nextRows.map((row) => [row.id, row]));

  const inserted: TRow[] = [];
  const updated: TRow[] = [];
  const deleted: TRow[] = [];

  for (const nextRow of nextRows) {
    const previousRow = previousRowsById.get(nextRow.id);

    if (!previousRow) {
      inserted.push(nextRow);
      continue;
    }

    if (!haveSamePersistedRowValues(previousRow, nextRow)) {
      updated.push(nextRow);
    }
  }

  for (const previousRow of previousRows) {
    if (!nextRowsById.has(previousRow.id)) {
      deleted.push(previousRow);
    }
  }

  return {
    inserted,
    updated,
    deleted,
  };
}
