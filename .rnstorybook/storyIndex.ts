import type { StoryIndex } from "storybook/internal/types";

/** Native Storybook 10.5.1 indexes by title even when CSF declares a stable ID. */
export function applyExplicitStoryIds(
  index: StoryIndex,
  modules: readonly unknown[],
): StoryIndex {
  const componentIds = new Map<string, string>();
  for (const module of modules) {
    if (!module || typeof module !== "object" || !("default" in module))
      continue;
    const meta = module.default;
    if (
      meta &&
      typeof meta === "object" &&
      "title" in meta &&
      typeof meta.title === "string" &&
      "id" in meta &&
      typeof meta.id === "string"
    ) {
      componentIds.set(meta.title, meta.id);
    }
  }

  return {
    ...index,
    entries: Object.fromEntries(
      Object.values(index.entries).map((entry) => {
        const componentId = componentIds.get(entry.title);
        if (entry.type !== "story" || !componentId) return [entry.id, entry];
        const exportId = entry.id.slice(entry.id.lastIndexOf("--") + 2);
        const id = `${componentId}--${exportId}`;
        return [id, { ...entry, id }];
      }),
    ),
  };
}
