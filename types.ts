export type ScaleValue = 1 | 2 | 3 | 4 | 5;

export enum ZoneType {
  QUICK_WINS = 'QUICK_WINS', // High Impact, Low Cost
  MAJOR_PROJECTS = 'MAJOR_PROJECTS', // High Impact, High Cost
  FILL_INS = 'FILL_INS', // Low Impact, Low Cost
  IGNORE = 'IGNORE', // Low Impact, High Cost
}

export interface Idea {
  id: string;
  title: string;
  memo: string;
  impact: ScaleValue;
  cost: ScaleValue;
  score: number;
  zone: ZoneType;
  createdAt: number;
}

export interface ZoneConfig {
  id: ZoneType;
  label: string;
  color: string;
  bg: string;
  border: string;
  activeClass: string;
}

export interface FilterState {
  [ZoneType.QUICK_WINS]: boolean;
  [ZoneType.MAJOR_PROJECTS]: boolean;
  [ZoneType.FILL_INS]: boolean;
  [ZoneType.IGNORE]: boolean;
}

// --- Hypothesis Board Types ---

export type EffortLevel = 'tiny' | 'small' | 'normal' | 'heavy';
export type HypothesisStatus = 'not-started' | 'running' | 'done';

export interface HypothesisItem {
  id: string;
  ideaTitle: string;
  hypothesis: string;
  platform: string;
  platformNote: string;
  duration: string;
  effort: EffortLevel;
  kpi: string;
  status: HypothesisStatus;
  learning: string;
  createdAt: number;
}
