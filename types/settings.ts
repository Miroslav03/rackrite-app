import { UnitSystem } from "./values";

export type UserSettingsId = string

export interface EquipmentSettings {
  barWeight: number;
  availablePlates: number[];
}

export interface UserSettings {
  id: UserSettingsId;
  unitSystem: UnitSystem;
  barWeight: number;
  equipmentByUnit: {
    kg: EquipmentSettings;
    lb: EquipmentSettings;
  };
  availablePlates: number[];
  restTimeByLiftFamilySec: {
    bench: number;
    squat: number;
    deadlift: number;
  };
  autoRestTimerEnabled: boolean;
  hapticFeedbackEnabled: boolean;  
  createdAt: number;
  updatedAt: number;
} 