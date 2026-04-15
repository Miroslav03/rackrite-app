import { UnitSystem } from "./values";

export type UserSettingsId = string

export interface UserSettings {
  id: string;
  unitSystem: UnitSystem;
  barWeight: number;
  availablePlates: number[];
  defaultRestTimeSec: number | null;
  autoRestTimerEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  createdAt: number;
  updatedAt: number;
} 