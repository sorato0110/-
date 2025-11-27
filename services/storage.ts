import { Idea, FilterState, ZoneType, ScaleValue } from '../types';
import { STORAGE_KEY_ITEMS, STORAGE_KEY_FILTERS, STORAGE_KEY_TITLE } from '../constants';

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

  // Refined Logic based on Matrix Visual Quadtrants roughly:
  // If we split strictly down the middle (2.5), 3 is "High".
  // Impact 3,4,5 = High. Cost 1,2 = Low. Cost 3,4,5 = High.
  // This matches the logic above.

  return { score, zone };
};

// --- Storage Functions ---

export const loadItems = (): Idea[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) return [];
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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