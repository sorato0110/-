import { Idea, FilterState, ZoneType, ScaleValue, HypothesisItem, ExperimentLog, ConfidenceData, KpiConfigItem } from '../types';
import { STORAGE_KEY_ITEMS, STORAGE_KEY_FILTERS, STORAGE_KEY_TITLE, STORAGE_KEY_HYPOTHESIS, STORAGE_KEY_EXPERIMENTS, STORAGE_KEY_CONFIDENCE, STORAGE_KEY_KPI_CONFIG, DEFAULT_KPI_CONFIG, ZONES } from '../constants';

/**
 * Calculates the score and determines the zone based on Impact and Cost.
 * Score = Impact + (6 - Cost) -> Max 10, Min 2.
 * Zone Logic:
 *  - Impact >= 3 & Cost <= 2: Quick Wins
 *  - Impact >= 3 & Cost >= 3: Major Projects
 *  - Impact <= 2 & Cost <= 2: Fill-ins
 *  - Impact <= 2 & Cost >= 3: Ignore
 */
export const calculateMetrics = (impact: ScaleValue, cost: ScaleValue): { score: number, zone: ZoneType } => {
  const score = impact + (6 - cost);
  
  let zone: ZoneType;
  
  if (impact >= 3) {
    if (cost <= 2) zone = ZoneType.QUICK_WINS;
    else zone = ZoneType.MAJOR_PROJECTS;
  } else {
    if (cost <= 2) zone = ZoneType.FILL_INS;
    else zone = ZoneType.IGNORE;
  }

  return { score, zone };
};

// --- Storage Functions ---

export const loadItems = (): Idea[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    
    if (!Array.isArray(parsed)) return [];

    // Validate and migrate data
    return parsed.map((item: any) => {
      // Ensure zone exists and is valid
      if (!item.zone || !ZONES[item.zone as ZoneType]) {
        const { zone, score } = calculateMetrics(item.impact || 3, item.cost || 3);
        return { 
          ...item, 
          zone, 
          score: item.score || score,
          impact: item.impact || 3,
          cost: item.cost || 3,
          createdAt: item.createdAt || Date.now()
        };
      }
      return item;
    });
  } catch (e) {
    console.error('Failed to load items', e);
    return [];
  }
};

export const saveItems = (items: Idea[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items', e);
  }
};

export const loadFilters = (): FilterState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (!raw) {
       // Default all true
       return {
         [ZoneType.QUICK_WINS]: true,
         [ZoneType.MAJOR_PROJECTS]: true,
         [ZoneType.FILL_INS]: true,
         [ZoneType.IGNORE]: true,
       };
    }
    const parsed = JSON.parse(raw);
    
    if (!parsed || typeof parsed !== 'object') throw new Error("Invalid filters");

    // Ensure all keys exist
    return {
      [ZoneType.QUICK_WINS]: parsed[ZoneType.QUICK_WINS] ?? true,
      [ZoneType.MAJOR_PROJECTS]: parsed[ZoneType.MAJOR_PROJECTS] ?? true,
      [ZoneType.FILL_INS]: parsed[ZoneType.FILL_INS] ?? true,
      [ZoneType.IGNORE]: parsed[ZoneType.IGNORE] ?? true,
    };
  } catch (e) {
    return {
      [ZoneType.QUICK_WINS]: true,
      [ZoneType.MAJOR_PROJECTS]: true,
      [ZoneType.FILL_INS]: true,
      [ZoneType.IGNORE]: true,
    };
  }
};

export const saveFilters = (filters: FilterState) => {
  localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
};

export const loadTitle = (): string => {
  return localStorage.getItem(STORAGE_KEY_TITLE) || '';
};

export const saveTitle = (title: string) => {
  localStorage.setItem(STORAGE_KEY_TITLE, title);
};

// --- Hypothesis Board Storage ---

interface HypothesisStorageFormat {
  version: number;
  items: HypothesisItem[];
}

export const loadHypothesisItems = (): HypothesisItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
    if (!raw) return [];
    
    // Attempt to parse
    const parsed = JSON.parse(raw);

    // Check if it's the new format with version
    if (parsed && typeof parsed === 'object' && 'items' in parsed && Array.isArray(parsed.items)) {
      return parsed.items;
    } 
    // Legacy check: if it's just an array
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    return [];
  } catch (e) {
    console.error('Failed to load hypothesis items', e);
    return [];
  }
};

export const saveHypothesisItems = (items: HypothesisItem[]) => {
  try {
    const data: HypothesisStorageFormat = {
      version: 1,
      items: items,
    };
    localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save hypothesis items', e);
  }
};

// --- Confidence Board Storage ---

export const loadExperiments = (): ExperimentLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPERIMENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveExperiments = (items: ExperimentLog[]) => {
  localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(items));
};

export const loadConfidenceData = (): ConfidenceData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIDENCE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveConfidenceData = (items: ConfidenceData[]) => {
  localStorage.setItem(STORAGE_KEY_CONFIDENCE, JSON.stringify(items));
};

export const loadKpiConfig = (): KpiConfigItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KPI_CONFIG);
    if (!raw) return DEFAULT_KPI_CONFIG;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_KPI_CONFIG;
  } catch (e) {
    return DEFAULT_KPI_CONFIG;
  }
};

export const saveKpiConfig = (config: KpiConfigItem[]) => {
  localStorage.setItem(STORAGE_KEY_KPI_CONFIG, JSON.stringify(config));
};