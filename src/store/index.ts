import { create } from 'zustand';
import {
  Device,
  DeviceGroup,
  Exhibition,
  ContentItem,
  ScheduleItem,
  Playlist,
  AlarmItem,
  PatrolRecord,
  MaintenanceOrder,
  OperationLog,
  DailyReport,
  DeviceStatus,
} from '@/types';
import {
  mockDevices,
  mockDeviceGroups,
  mockExhibitions,
  mockContents,
  mockSchedules,
  mockPlaylists,
  mockAlarms,
  mockPatrolRecords,
  mockMaintenanceOrders,
  mockOperationLogs,
  mockDailyReports,
} from '@/mock';

interface AppState {
  devices: Device[];
  deviceGroups: DeviceGroup[];
  exhibitions: Exhibition[];
  contents: ContentItem[];
  schedules: ScheduleItem[];
  playlists: Playlist[];
  alarms: AlarmItem[];
  patrolRecords: PatrolRecord[];
  maintenanceOrders: MaintenanceOrder[];
  operationLogs: OperationLog[];
  dailyReports: DailyReport[];
  currentExhibition: string | null;
  energySavingMode: boolean;
  emergencyMode: boolean;

  toggleDevicePower: (deviceId: string) => void;
  setDeviceVolume: (deviceId: string, volume: number) => void;
  setDeviceBrightness: (deviceId: string, brightness: number) => void;
  toggleGroupPower: (groupId: string, power: boolean) => void;
  setDeviceStatus: (deviceId: string, status: DeviceStatus) => void;

  switchExhibition: (exhibitionId: string) => void;
  publishContent: (contentId: string) => void;
  rollbackContent: (contentId: string, version: string) => void;

  toggleSchedule: (scheduleId: string) => void;
  syncPlaylist: (playlistId: string) => void;

  handleAlarm: (alarmId: string, handler: string, note: string) => void;
  markOffline: (deviceId: string) => void;

  createMaintenanceOrder: (order: Omit<MaintenanceOrder, 'id' | 'createdAt'>) => void;
  updateMaintenanceStatus: (orderId: string, status: MaintenanceOrder['status']) => void;

  addPatrolRecord: (record: Omit<PatrolRecord, 'id'>) => void;

  addOperationLog: (log: Omit<OperationLog, 'id'>) => void;

  toggleEnergySaving: () => void;
  toggleEmergencyMode: () => void;

  broadcastEmergency: (message: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppState>((set, get) => ({
  devices: mockDevices,
  deviceGroups: mockDeviceGroups,
  exhibitions: mockExhibitions,
  contents: mockContents,
  schedules: mockSchedules,
  playlists: mockPlaylists,
  alarms: mockAlarms,
  patrolRecords: mockPatrolRecords,
  maintenanceOrders: mockMaintenanceOrders,
  operationLogs: mockOperationLogs,
  dailyReports: mockDailyReports,
  currentExhibition: 'exh-1',
  energySavingMode: false,
  emergencyMode: false,

  toggleDevicePower: (deviceId: string) =>
    set((state) => {
      const device = state.devices.find((d) => d.id === deviceId);
      const newPower = !device?.power;
      const newStatus: DeviceStatus = newPower ? 'online' : 'standby';
      return {
        devices: state.devices.map((d) =>
          d.id === deviceId
            ? { ...d, power: newPower, status: newStatus, brightness: newPower ? (d.brightness || 70) : 0, volume: newPower ? (d.volume || 50) : 0 }
            : d
        ),
      };
    }),

  setDeviceVolume: (deviceId: string, volume: number) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === deviceId ? { ...d, volume } : d)),
    })),

  setDeviceBrightness: (deviceId: string, brightness: number) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === deviceId ? { ...d, brightness } : d)),
    })),

  toggleGroupPower: (groupId: string, power: boolean) => {
    const state = get();
    const group = state.deviceGroups.find((g) => g.id === groupId);
    if (!group) return;

    set((state) => ({
      devices: state.devices.map((d) =>
        group.deviceIds.includes(d.id) && d.status !== 'fault' && d.status !== 'offline'
          ? {
              ...d,
              power,
              status: power ? 'online' : 'standby',
              brightness: power ? (d.brightness || 70) : 0,
              volume: power ? (d.volume || 50) : 0,
            }
          : d
      ),
    }));

    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '设备控制',
      target: group.name,
      detail: `一键${power ? '开启' : '关闭'}组内设备`,
      result: 'success',
    });
  },

  setDeviceStatus: (deviceId: string, status: DeviceStatus) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? { ...d, status, power: status === 'online' ? true : false }
          : d
      ),
    })),

  switchExhibition: (exhibitionId: string) => {
    const state = get();
    const exhibition = state.exhibitions.find((e) => e.id === exhibitionId);
    if (!exhibition) return;

    set({ currentExhibition: exhibitionId });

    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '展览切换',
      target: exhibition.name,
      detail: '切换展览主题',
      result: 'success',
    });
  },

  publishContent: (contentId: string) =>
    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === contentId ? { ...c, status: 'published' } : c
      ),
    })),

  rollbackContent: (contentId: string, version: string) => {
    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === contentId ? { ...c, version, status: 'published' as const } : c
      ),
    }));

    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '版本回退',
      target: contentId,
      detail: `回退到版本 ${version}`,
      result: 'success',
    });
  },

  toggleSchedule: (scheduleId: string) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === scheduleId
          ? { ...s, status: s.status === 'running' ? 'paused' : 'running' }
          : s
      ),
    })),

  syncPlaylist: (playlistId: string) => {
    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '播放列表同步',
      target: playlistId,
      detail: '同步播放列表到设备',
      result: 'success',
    });
  },

  handleAlarm: (alarmId: string, handler: string, note: string) =>
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              handled: true,
              handler,
              handleNote: note,
              handleTime: new Date().toISOString(),
            }
          : a
      ),
    })),

  markOffline: (deviceId: string) => {
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, status: 'offline' as const, power: false } : d
      ),
    }));

    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '设备标记',
      target: deviceId,
      detail: '标记设备为离线',
      result: 'success',
    });
  },

  createMaintenanceOrder: (order) =>
    set((state) => ({
      maintenanceOrders: [
        ...state.maintenanceOrders,
        { ...order, id: generateId(), createdAt: new Date().toISOString() },
      ],
    })),

  updateMaintenanceStatus: (orderId, status) =>
    set((state) => ({
      maintenanceOrders: state.maintenanceOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            }
          : o
      ),
    })),

  addPatrolRecord: (record) =>
    set((state) => ({
      patrolRecords: [{ ...record, id: generateId() }, ...state.patrolRecords],
    })),

  addOperationLog: (log) =>
    set((state) => ({
      operationLogs: [{ ...log, id: generateId() }, ...state.operationLogs].slice(0, 500),
    })),

  toggleEnergySaving: () => {
    const state = get();
    const newMode = !state.energySavingMode;

    set({ energySavingMode: newMode });

    if (newMode) {
      set((state) => ({
        devices: state.devices.map((d) =>
          d.status === 'online' && d.type === 'screen'
            ? { ...d, brightness: Math.max((d.brightness || 70) - 30, 30) }
            : d
        ),
      }));
    }

    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '节能模式',
      target: '全馆设备',
      detail: newMode ? '开启节能模式' : '关闭节能模式',
      result: 'success',
    });
  },

  toggleEmergencyMode: () => {
    const state = get();
    const newMode = !state.emergencyMode;

    set({ emergencyMode: newMode });

    if (newMode) {
      set((state) => ({
        devices: state.devices.map((d) =>
          d.type === 'screen' || d.type === 'projector'
            ? { ...d, power: false, status: 'standby' as const }
            : d
        ),
      }));
    }

    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '应急模式',
      target: '全馆设备',
      detail: newMode ? '启动应急模式，关闭所有显示设备' : '解除应急模式',
      result: 'success',
    });
  },

  broadcastEmergency: (message: string) => {
    get().addOperationLog({
      time: new Date().toISOString(),
      operator: '当前用户',
      type: '应急广播',
      target: '全馆音响',
      detail: message,
      result: 'success',
    });
  },
}));
