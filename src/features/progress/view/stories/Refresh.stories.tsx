import type { Meta, StoryObj } from "@storybook/react-native";
import { ProgressStoryHost } from "./ProgressStoryHost";
import { createProgressStory, progressStoryMeta } from "./progressStory.config";

const meta = {
  ...progressStoryMeta,
  title: "Progress/Refresh",
} satisfies Meta<typeof ProgressStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OutdatedSnapshotRetry: Story = createProgressStory("stale");
export const RefreshingWithACurrentSnapshot: Story =
  createProgressStory("refresh-pending");
export const RetryingAnOutdatedSnapshot: Story =
  createProgressStory("refresh-retrying");
