// ===== CXM Instrumentation Data Model =====
// Giai đoạn (Phase) ▸ Flow ▸ Stage ▸ Touchpoint ▸ Event ▸ KPI

export type InstrumentStatus = 'live' | 'validating' | 'designed' | 'gap';

export type Platform = 'ios' | 'android' | 'web' | 'server' | 'crm';

export type Channel =
  | 'app'
  | 'web'
  | 'hotline'
  | 'broker'
  | 'email'
  | 'sms'
  | 'zalo'
  | 'push'
  | 'branch'
  | 'backend';

export type KpiCategory =
  | 'conversion'
  | 'engagement'
  | 'satisfaction'
  | 'revenue'
  | 'risk'
  | 'ops';

export interface KPI {
  id: string;
  name: string;
  formula: string;
  value: string;
  target: string;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  trendGood: boolean; // trend này có tốt không
  owner: string;
  category: KpiCategory;
  criticality: 'north-star' | 'core' | 'supporting';
}

export interface InstrumentedEvent {
  id: string;
  name: string; // snake_case event name
  description: string;
  status: InstrumentStatus;
  platforms: Platform[];
  owner: string; // squad
  kpiIds: string[];
  volumePerDay: number; // 0 nếu chưa instrument
  lastSeen?: string;
}

export interface Touchpoint {
  id: string;
  name: string;
  channel: Channel;
  description: string;
  owner: string;
  events: InstrumentedEvent[];
  dailyUsers: number; // reach
  revenueImpact: number; // 1-10: mức liên quan doanh thu
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  touchpoints: Touchpoint[];
}

export interface Flow {
  id: string;
  name: string;
  owner: string; // squad
  description: string;
  stages: Stage[];
}

export interface Phase {
  id: string;
  code: string; // P1..P7
  name: string;
  description: string;
  color: string; // hex
  northStarKpiId: string;
  flows: Flow[];
}

// ===== PO Board =====
export type TaskColumn = 'backlog' | 'ready' | 'doing' | 'validating' | 'done';
export type TaskType = 'gap-closure' | 'enhancement' | 'fix' | 'governance' | 'experiment';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface POTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: Priority;
  column: TaskColumn;
  reach: number; // users/tuần ảnh hưởng
  impact: number; // 1-10
  confidence: number; // %
  effort: number; // person-week
  rice: number;
  owner: string;
  squad: string;
  phaseId: string;
  touchpointId?: string;
  eventId?: string;
  kpiIds: string[];
  due?: string;
  tags: string[];
  createdAt: string;
}

export interface CoverageStats {
  total: number;
  live: number;
  validating: number;
  designed: number;
  gap: number;
  score: number; // % live+validating
}

export const STATUS_META: Record<
  InstrumentStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  live: {
    label: 'Đang đo',
    color: 'text-emerald-700',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  validating: {
    label: 'Đang validate',
    color: 'text-sky-700',
    bg: 'bg-sky-500/10 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  designed: {
    label: 'Đã thiết kế',
    color: 'text-amber-700',
    bg: 'bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  gap: {
    label: 'Chưa đo (Gap)',
    color: 'text-rose-700',
    bg: 'bg-rose-500/10 border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  app: 'Mobile App',
  web: 'Web Trading',
  hotline: 'Hotline',
  broker: 'Broker / RM',
  email: 'Email',
  sms: 'SMS',
  zalo: 'Zalo OA',
  push: 'Push Notification',
  branch: 'Chi nhánh',
  backend: 'Hệ thống lõi',
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web',
  server: 'Server',
  crm: 'CRM',
};

export const KPI_CATEGORY_LABEL: Record<KpiCategory, string> = {
  conversion: 'Chuyển đổi',
  engagement: 'Tương tác',
  satisfaction: 'Hài lòng',
  revenue: 'Doanh thu',
  risk: 'Rủi ro',
  ops: 'Vận hành',
};
