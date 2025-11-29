
import { ZoneType, ZoneConfig, EffortLevel, HypothesisStatus, ImpactType, KpiConfigItem } from './types';

export const STORAGE_KEY_ITEMS = 'ideaMatrix:v1:items';
export const STORAGE_KEY_FILTERS = 'ideaMatrix:v1:filters';
export const STORAGE_KEY_TITLE = 'ideaMatrix:v1:title';
export const STORAGE_KEY_HYPOTHESIS = 'hypothesisPracticeBoard:v1';
export const STORAGE_KEY_EXPERIMENTS = 'hypothesisAnalysisBoard:v1:experiments';
export const STORAGE_KEY_CONFIDENCE = 'hypothesisAnalysisBoard:v1:confidence';
export const STORAGE_KEY_KPI_CONFIG = 'hypothesisAnalysisBoard:v1:kpiConfig';

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

// Hypothesis Board Constants
export const EFFORT_LABELS: Record<EffortLevel, { label: string, color: string }> = {
  tiny: { label: 'とても小さい', color: 'bg-emerald-100 text-emerald-800' },
  small: { label: '小さい', color: 'bg-blue-100 text-blue-800' },
  normal: { label: 'ふつう', color: 'bg-yellow-100 text-yellow-800' },
  heavy: { label: '重め', color: 'bg-red-100 text-red-800' },
};

export const STATUS_LABELS: Record<HypothesisStatus, { label: string, color: string }> = {
  'not-started': { label: '未着手', color: 'bg-slate-100 text-slate-600' },
  'running': { label: '実行中', color: 'bg-indigo-100 text-indigo-700 animate-pulse' },
  'done': { label: '完了', color: 'bg-emerald-100 text-emerald-800' },
};

// Confidence Board Constants
export const IMPACT_OPTIONS: Record<ImpactType, { label: string, color: string }> = {
  'plus-large': { label: 'かなりプラス (++20%)', color: 'text-emerald-600' },
  'plus-small': { label: '少しプラス (+5-10%)', color: 'text-teal-500' },
  'neutral': { label: 'ほぼ変わらない', color: 'text-slate-500' },
  'minus-small': { label: '少しマイナス (-5-10%)', color: 'text-amber-500' },
  'minus-large': { label: 'かなりマイナス (-20%)', color: 'text-rose-600' },
};

export const DEFAULT_KPI_CONFIG: KpiConfigItem[] = [
  { id: 'reach', label: 'リーチ(表示)', helper: 'どれくらいの人に届いたか', role: 'denominator' },
  { id: 'responses', label: '反応数', helper: 'いいね・コメント・クリックの合計など', role: 'numerator' },
  { id: 'sales', label: '売上/成約', helper: '購入や問い合わせなど、ゴールにつながる数', role: 'none' }
];
