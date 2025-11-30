
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
// MAB Statuses: not-started -> trial (start small) -> focus (scale up) / sustain (keep small) / drop (stop) -> completed
export type HypothesisStatus = 'not-started' | 'trial' | 'focus' | 'sustain' | 'drop' | 'completed' | 'running' | 'done';

export interface DailyLog {
  id: string;
  date: string;
  metrics: Record<string, number>; // e.g. { reach: 100, responses: 5 }
  memo: string;
  createdAt: number;
}

export interface HypothesisItem {
  id: string;
  ideaTitle: string;
  hypothesis: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  effort: EffortLevel;
  resourceAllocation?: number; // 0-100%
  kpi: string;
  status: HypothesisStatus;
  learning: string;
  dailyLogs?: DailyLog[]; // New: Store daily progress
  createdAt: number;
}

// --- Confidence Analysis Board Types ---

export interface ExperimentLog {
  id: string;
  ideaTitle: string;
  testTitle: string;
  period: string;
  reach: number;
  responses: number;
  sales: number;
  memo: string;
  // Analysis
  successFactors: string;
  failureFactors: string;
  feedback: string;
  createdAt: number;
}

export type ImpactType = 'plus-large' | 'plus-small' | 'neutral' | 'minus-small' | 'minus-large';

export interface ConfidenceData {
  ideaTitle: string;
  currentConfidence: number; // 0-100
  lastImpact: ImpactType;
  memo: string;
  updatedAt: number;
}

export type KpiRole = 'denominator' | 'numerator' | 'none';

export interface KpiConfigItem {
  id: 'reach' | 'responses' | 'sales';
  label: string;
  helper: string;
  role: KpiRole;
}
