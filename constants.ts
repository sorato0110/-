import { ZoneType, ZoneConfig } from './types';

export const STORAGE_KEY_ITEMS = 'ideaMatrix:v1:items';
export const STORAGE_KEY_FILTERS = 'ideaMatrix:v1:filters';
export const STORAGE_KEY_TITLE = 'ideaMatrix:v1:title';

export const ZONES: Record<ZoneType, ZoneConfig> = {
  [ZoneType.QUICK_WINS]: {
    id: ZoneType.QUICK_WINS,
    label: '美味しい実験',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeClass: 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
  },
  [ZoneType.MAJOR_PROJECTS]: {
    id: ZoneType.MAJOR_PROJECTS,
    label: '大型案件',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeClass: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
  },
  [ZoneType.FILL_INS]: {
    id: ZoneType.FILL_INS,
    label: '余裕があれば',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeClass: 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
  },
  [ZoneType.IGNORE]: {
    id: ZoneType.IGNORE,
    label: 'やらない候補',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    activeClass: 'bg-slate-500 text-white border-slate-600 hover:bg-slate-600'
  },
};