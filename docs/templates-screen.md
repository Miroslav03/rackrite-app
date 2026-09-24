# Templates — domain and persistence foundation

A template describes a reusable training day. The current implementation covers
its domain model, editing rules, validation, mappers, and local persistence.
The Templates screen, feature controllers, duplication, starting a workout from
a template, and saving a workout as a template are later work.

## Model

- `Template` contains its ID, name, optional description, and creation/update times.
- `TemplateExercise` references an existing `Exercise` definition and stores its
  order, optional notes, rest-duration snapshot, and creation/update times.
- `TemplateSet` is one planned set: type, required reps, optional target RPE,
  order, and creation/update times. It has no planned weight or completion state.
- `TemplateAggregate` owns exercise aggregates, each combining a template exercise,
  its exercise definition, and ordered sets.

Four sets of five reps are four `TemplateSet` records. They can be summarized as
4×5 in a future UI without introducing a separate set-count field.

The runtime source of truth is
[`templates.types.ts`](../src/domain/templates/templates.types.ts). The older
`docs/types/template/` interfaces describe an earlier UI exploration with sections
and grouped set definitions; they are not contracts for this implementation.

## Exercise rules

Templates follow the workout exercise rules:

- At most one competition lift per family: squat, bench, or deadlift.
- Any number of lift variations, including multiple variations from the same family.
- Any number of accessories, including repeated exercise definitions with distinct
  template-exercise IDs.
- No maximum of three exercises and no family enable/disable sections.

For example, a Bench Volume Day can contain Competition Bench, Paused Bench,
Close Grip Bench, and Barbell Row. Each has its own sets and rest duration.

## Editing and validation

Creation produces an empty in-memory draft with a blank name. Metadata, exercise
selection, notes, rest duration, and set values can be edited through pure domain
functions. The caller supplies IDs and timestamps.

- Names are trimmed. Optional descriptions and notes are trimmed, with blank text
  normalized to `null`. Duplicate template names are allowed.
- Reps and rest duration must be positive integers.
- Set types are `warmup`, `working`, `top`, and `backoff`.
- RPE is `null` or a whole number from 1 through 10, matching workouts.
- Adding an exercise creates its first set. Initial reps and rest duration are
  required; type defaults to `working` and RPE to `null`.
- Changing an exercise definition preserves existing sets, notes, and rest duration
  unless the caller explicitly changes the latter fields.
- Exercise and set positions are contiguous and zero-based. Moving a set keeps it
  within its exercise; an unchanged position returns the original aggregate.
- Removing an exercise removes its sets. Removing its last set also removes the
  exercise. Remaining records are reindexed.
- Mutations return new aggregates without modifying inputs. IDs and creation times
  remain stable; changed records and their ancestors receive the supplied update time.

Drafts may have no exercises or a blank name. Every existing exercise still needs
valid sets. Saving requires a nonblank name and at least one exercise with valid
sets. There is no persisted draft status or draft autosave.

## Persistence

SQLite stores `templates`, `template_exercises`, and `template_sets`. Child rows
cascade on parent deletion; referenced exercise definitions remain intact.
Deleting a template does not delete workouts or clear their `sourceTemplateId`.

The domain owns the `TemplateRepository` contract. Its object implementation offers
metadata listing, complete aggregate lookup, insertion, differential updates, and
deletion. Lists sort by `updatedAt` descending, then ID descending. Missing lookup
returns `null`; deleting a missing template is a no-op.

Writes validate save eligibility before opening a transaction. Inserts and updates
use synchronous Drizzle Expo transaction callbacks so all related changes commit
or roll back together. Mappers translate every field explicitly, sort hydrated
children, and reject incomplete aggregates or broken references.

## Development database compatibility

The three template tables were added to the existing `0000_init.sql` migration and
its Drizzle snapshot because the application is not in production. The migration
journal still has one entry. Existing installations that already applied `0000`
will not rerun it automatically and must recreate their development database before
using templates. Recreating it loses local development workouts and other local data.
No application data is cleared automatically by this change.

## Verification

Domain tests cover editing, immutability, ownership, ordering, values, and save
eligibility. Mapper tests cover complete round trips and invalid stored rows.
Repository tests apply `0000_init.sql` to temporary SQLite storage and exercise the
real Drizzle Expo driver, adapting its synchronous native client calls to Node's
built-in SQLite API. These tests require Node 24 or newer, add no dependency, and
cover CRUD, foreign keys, cascades, workout preservation, and injected-failure rollback.
They do not substitute for native-device integration checks when the feature UI is wired.
