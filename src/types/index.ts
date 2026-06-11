export type DeviceType = 'screen' | 'projector' | 'interactive' | 'audio';

export type DeviceStatus = 'online' | 'offline' | 'fault' | 'standby';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  groupId: string;
  power: boolean;
  volume?: number;
  brightness?: number;
  ip?: string;
  lastOnline?: string;
  faultMessage?: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  deviceIds: string[];
}

export interface Exhibition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  status: 'active' | 'inactive';
  contentIds: string[];
  deviceIds: string[];
  createdAt: string;
}

export interface ContentItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'ppt' | 'interactive';
  size: string;
  duration?: number;
  version: string;
  versions: ContentVersion[];
  status: 'published' | 'draft' | 'archived' | 'pending_review';
  thumbnail: string;
  uploadTime: string;
  uploader: string;
  description: string;
}

export interface ContentVersion {
  version: string;
  uploadTime: string;
  uploader: string;
  size: string;
  note: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  reviewTime?: string;
  reviewNote?: string;
}

export interface ScheduleItem {
  id: string;
  name: string;
  exhibitionId: string;
  startTime: string;
  endTime: string;
  repeat: 'once' | 'daily' | 'weekly' | 'workday';
  deviceIds: string[];
  contentIds: string[];
  status: 'scheduled' | 'running' | 'completed' | 'paused';
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  deviceIds: string[];
  isPlaying: boolean;
  currentIndex: number;
}

export interface PlaylistItem {
  contentId: string;
  duration: number;
  order: number;
}

export interface AlarmItem {
  id: string;
  type: 'fault' | 'offline' | 'warning';
  deviceId: string;
  deviceName: string;
  message: string;
  time: string;
  level: 'high' | 'medium' | 'low';
  handled: boolean;
  handler?: string;
  handleTime?: string;
  handleNote?: string;
}

export interface PatrolRecord {
  id: string;
  date: string;
  time: string;
  inspector: string;
  type: 'morning' | 'afternoon' | 'evening' | 'special';
  status: 'normal' | 'abnormal';
  devices: PatrolDevice[];
  remark: string;
  images: string[];
}

export interface PatrolDevice {
  deviceId: string;
  deviceName: string;
  status: 'normal' | 'fault' | 'offline';
  note: string;
  groupId?: string;
}

export interface PatrolRoute {
  id: string;
  name: string;
  description: string;
  area: string;
  deviceIds: string[];
  sortOrder: number;
}

export interface MaintenanceOrder {
  id: string;
  title: string;
  deviceId: string;
  deviceName: string;
  description: string;
  level: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  assignee: string;
  creator: string;
  createdAt: string;
  completedAt?: string;
  remark: string;
  source?: 'manual' | 'patrol' | 'alarm';
  patrolRecordId?: string;
}

export interface OperationLog {
  id: string;
  time: string;
  operator: string;
  type: string;
  target: string;
  detail: string;
  result: 'success' | 'failed';
}

export interface DailyReport {
  date: string;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  faultDevices: number;
  totalAlarms: number;
  handledAlarms: number;
  patrolTimes: number;
  operationCount: number;
  energySavingHours: number;
}
