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
  PatrolDevice,
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
import dayjs from 'dayjs';

export const OPERATION_TYPES = {
  DEVICE_CONTROL: '设备控制',
  SCHEDULE_CONTROL: '排期控制',
  SCHEDULE_ADD: '排期新增',
  SCHEDULE_EDIT: '排期编辑',
  SCHEDULE_DELETE: '排期删除',
  EXHIBITION_SWITCH: '展览切换',
  CONTENT_PUBLISH: '素材上架',
  CONTENT_ROLLBACK: '版本回退',
  CONTENT_UPLOAD: '素材上传',
  PLAYLIST_SYNC: '播放列表同步',
  ALARM_HANDLE: '告警处理',
  DEVICE_MARK_OFFLINE: '设备离线标记',
  DEVICE_MARK_ONLINE: '设备上线标记',
  MAINTENANCE_CREATE: '维修工单创建',
  MAINTENANCE_UPDATE: '工单状态更新',
  PATROL_CHECKIN: '巡检打卡',
  ENERGY_SAVING: '节能模式',
  EMERGENCY_MODE: '应急模式',
  EMERGENCY_BROADCAST: '应急广播',
} as const;

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
  addContent: (content: Omit<ContentItem, 'id' | 'uploadTime' | 'versions'> & { note: string }) => void;

  addSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  updateSchedule: (scheduleId: string, schedule: Partial<ScheduleItem>) => void;
  deleteSchedule: (scheduleId: string) => void;
  toggleSchedule: (scheduleId: string) => void;
  syncPlaylist: (playlistId: string) => void;

  handleAlarm: (alarmId: string, handler: string, note: string) => void;
  markOffline: (deviceId: string) => void;
  markOnline: (deviceId: string) => void;

  createMaintenanceOrder: (order: Omit<MaintenanceOrder, 'id' | 'createdAt'>) => void;
  updateMaintenanceStatus: (orderId: string, status: MaintenanceOrder['status']) => void;

  addPatrolRecord: (record: Omit<PatrolRecord, 'id'>) => void;
  addPatrolRecordWithOrders: (
    record: Omit<PatrolRecord, 'id'>,
    abnormalDevices: PatrolDevice[]
  ) => void;

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

  toggleDevicePower: (deviceId: string) => {
    const device = get().devices.find((d) => d.id === deviceId);
    const newPower = !device?.power;

    set((state) => {
      const newStatus: DeviceStatus = newPower ? 'online' : 'standby';
      return {
        devices: state.devices.map((d) =>
          d.id === deviceId
            ? {
                ...d,
                power: newPower,
                status: newStatus,
                brightness: newPower ? (d.brightness || 70) : 0,
                volume: newPower ? (d.volume || 50) : 0,
              }
            : d
        ),
      };
    });

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.DEVICE_CONTROL,
      target: device?.name || deviceId,
      detail: `${newPower ? '开启' : '关闭'}设备`,
      result: 'success',
    });
  },

  setDeviceVolume: (deviceId: string, volume: number) => {
    const device = get().devices.find((d) => d.id === deviceId);

    set((state) => ({
      devices: state.devices.map((d) => (d.id === deviceId ? { ...d, volume } : d)),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.DEVICE_CONTROL,
      target: device?.name || deviceId,
      detail: `调整音量到 ${volume}%`,
      result: 'success',
    });
  },

  setDeviceBrightness: (deviceId: string, brightness: number) => {
    const device = get().devices.find((d) => d.id === deviceId);

    set((state) => ({
      devices: state.devices.map((d) => (d.id === deviceId ? { ...d, brightness } : d)),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.DEVICE_CONTROL,
      target: device?.name || deviceId,
      detail: `调整亮度到 ${brightness}%`,
      result: 'success',
    });
  },

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
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.DEVICE_CONTROL,
      target: group.name,
      detail: `一键${power ? '开启' : '关闭'}组内 ${group.deviceIds.length} 台设备`,
      result: 'success',
    });
  },

  setDeviceStatus: (deviceId: string, status: DeviceStatus) => {
    const device = get().devices.find((d) => d.id === deviceId);

    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? { ...d, status, power: status === 'online' ? true : false }
          : d
      ),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.DEVICE_CONTROL,
      target: device?.name || deviceId,
      detail: `设置状态为 ${status}`,
      result: 'success',
    });
  },

  switchExhibition: (exhibitionId: string) => {
    const state = get();
    const exhibition = state.exhibitions.find((e) => e.id === exhibitionId);
    if (!exhibition) return;

    set({ currentExhibition: exhibitionId });

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.EXHIBITION_SWITCH,
      target: exhibition.name,
      detail: `切换展览主题，关联 ${exhibition.deviceIds.length} 台设备`,
      result: 'success',
    });
  },

  publishContent: (contentId: string) => {
    const content = get().contents.find((c) => c.id === contentId);

    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === contentId ? { ...c, status: 'published' as const } : c
      ),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.CONTENT_PUBLISH,
      target: content?.name || contentId,
      detail: `素材上架，版本 ${content?.version}`,
      result: 'success',
    });
  },

  rollbackContent: (contentId: string, version: string) => {
    const content = get().contents.find((c) => c.id === contentId);

    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === contentId ? { ...c, version, status: 'published' as const } : c
      ),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.CONTENT_ROLLBACK,
      target: content?.name || contentId,
      detail: `从版本 ${content?.version} 回退到版本 ${version}`,
      result: 'success',
    });
  },

  addContent: (contentData) => {
    const newContent: ContentItem = {
      id: generateId(),
      name: contentData.name,
      type: contentData.type,
      size: contentData.size,
      duration: contentData.duration,
      version: 'v1.0',
      versions: [
        {
          version: 'v1.0',
          uploadTime: dayjs().format('YYYY-MM-DD HH:mm'),
          uploader: '值班员',
          size: contentData.size,
          note: contentData.note || '初始版本',
        },
      ],
      status: 'draft' as const,
      thumbnail: contentData.thumbnail,
      uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      uploader: '值班员',
      description: contentData.description,
    };

    set((state) => ({
      contents: [newContent, ...state.contents],
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.CONTENT_UPLOAD,
      target: newContent.name,
      detail: `上传新素材，类型: ${newContent.type}，大小: ${newContent.size}`,
      result: 'success',
    });
  },

  addSchedule: (schedule) => {
    const newSchedule: ScheduleItem = {
      ...schedule,
      id: generateId(),
    };
    const exhibition = get().exhibitions.find((e) => e.id === schedule.exhibitionId);

    set((state) => ({
      schedules: [...state.schedules, newSchedule],
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.SCHEDULE_ADD,
      target: schedule.name,
      detail: `新增排期：${exhibition?.name || ''}，${schedule.startTime}-${schedule.endTime}，关联 ${schedule.deviceIds.length} 台设备`,
      result: 'success',
    });
  },

  updateSchedule: (scheduleId, scheduleData) => {
    const oldSchedule = get().schedules.find((s) => s.id === scheduleId);

    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === scheduleId ? { ...s, ...scheduleData } : s
      ),
    }));

    const newSchedule = get().schedules.find((s) => s.id === scheduleId);
    const exhibition = get().exhibitions.find((e) => e.id === newSchedule?.exhibitionId);

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.SCHEDULE_EDIT,
      target: oldSchedule?.name || scheduleId,
      detail: `编辑排期：${exhibition?.name || ''}，${newSchedule?.startTime}-${newSchedule?.endTime}，关联 ${newSchedule?.deviceIds.length} 台设备`,
      result: 'success',
    });
  },

  deleteSchedule: (scheduleId) => {
    const schedule = get().schedules.find((s) => s.id === scheduleId);

    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== scheduleId),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.SCHEDULE_DELETE,
      target: schedule?.name || scheduleId,
      detail: '删除排期',
      result: 'success',
    });
  },

  toggleSchedule: (scheduleId) => {
    const schedule = get().schedules.find((s) => s.id === scheduleId);

    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === scheduleId
          ? { ...s, status: s.status === 'running' ? 'paused' : ('running' as const) }
          : s
      ),
    }));

    const newStatus = get().schedules.find((s) => s.id === scheduleId)?.status;

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.SCHEDULE_CONTROL,
      target: schedule?.name || scheduleId,
      detail: newStatus === 'running' ? '启动播放排期' : '暂停播放排期',
      result: 'success',
    });
  },

  syncPlaylist: (playlistId) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.PLAYLIST_SYNC,
      target: playlist?.name || playlistId,
      detail: `同步播放列表到 ${playlist?.deviceIds.length} 台设备`,
      result: 'success',
    });
  },

  handleAlarm: (alarmId, handler, note) => {
    const alarm = get().alarms.find((a) => a.id === alarmId);

    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId
          ? {
              ...a,
              handled: true,
              handler,
              handleNote: note,
              handleTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            }
          : a
      ),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: handler,
      type: OPERATION_TYPES.ALARM_HANDLE,
      target: alarm?.deviceName || alarmId,
      detail: `处理告警：${alarm?.message}，处理说明：${note}`,
      result: 'success',
    });
  },

  markOffline: (deviceId) => {
    const device = get().devices.find((d) => d.id === deviceId);

    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, status: 'offline' as const, power: false } : d
      ),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.DEVICE_MARK_OFFLINE,
      target: device?.name || deviceId,
      detail: '标记设备为离线',
      result: 'success',
    });
  },

  markOnline: (deviceId) => {
    const device = get().devices.find((d) => d.id === deviceId);

    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, status: 'online' as const, power: true } : d
      ),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.DEVICE_MARK_ONLINE,
      target: device?.name || deviceId,
      detail: '标记设备为在线',
      result: 'success',
    });
  },

  createMaintenanceOrder: (order) => {
    const newOrder: MaintenanceOrder = {
      ...order,
      id: generateId(),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };

    set((state) => ({
      maintenanceOrders: [newOrder, ...state.maintenanceOrders],
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: order.creator,
      type: OPERATION_TYPES.MAINTENANCE_CREATE,
      target: order.deviceName,
      detail: `创建维修工单，紧急程度：${order.level}，指派给：${order.assignee}`,
      result: 'success',
    });
  },

  updateMaintenanceStatus: (orderId, status) => {
    const order = get().maintenanceOrders.find((o) => o.id === orderId);

    set((state) => ({
      maintenanceOrders: state.maintenanceOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              completedAt: status === 'completed' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : undefined,
            }
          : o
      ),
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.MAINTENANCE_UPDATE,
      target: order?.deviceName || orderId,
      detail: `更新工单状态为：${status}`,
      result: 'success',
    });
  },

  addPatrolRecord: (record) => {
    const newRecord: PatrolRecord = {
      ...record,
      id: generateId(),
    };

    set((state) => ({
      patrolRecords: [newRecord, ...state.patrolRecords],
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: record.inspector,
      type: OPERATION_TYPES.PATROL_CHECKIN,
      target: record.type,
      detail: `完成巡检打卡，检查 ${record.devices.length} 台设备，状态：${record.status}`,
      result: 'success',
    });
  },

  addPatrolRecordWithOrders: (record, abnormalDevices) => {
    const newRecord: PatrolRecord = {
      ...record,
      id: generateId(),
    };

    const newOrders: MaintenanceOrder[] = abnormalDevices.map((d) => ({
      id: generateId(),
      title: `${d.deviceName}巡检发现异常`,
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      description: d.note || '巡检发现异常，需要维修',
      level: d.status === 'fault' ? 'high' : 'medium',
      status: 'pending',
      assignee: '未分配',
      creator: record.inspector,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: `巡检发现，来源：${record.type}`,
    }));

    set((state) => ({
      patrolRecords: [newRecord, ...state.patrolRecords],
      maintenanceOrders: [...newOrders, ...state.maintenanceOrders],
    }));

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: record.inspector,
      type: OPERATION_TYPES.PATROL_CHECKIN,
      target: record.type,
      detail: `完成巡检打卡，检查 ${record.devices.length} 台设备，发现 ${abnormalDevices.length} 个异常，已自动生成维修工单`,
      result: 'success',
    });
  },

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
    } else {
      set((state) => ({
        devices: state.devices.map((d) =>
          d.status === 'online' && d.type === 'screen'
            ? { ...d, brightness: Math.min((d.brightness || 40) + 30, 100) }
            : d
        ),
      }));
    }

    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.ENERGY_SAVING,
      target: '全馆设备',
      detail: newMode ? '开启节能模式，降低屏幕亮度' : '关闭节能模式，恢复屏幕亮度',
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
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.EMERGENCY_MODE,
      target: '全馆设备',
      detail: newMode ? '启动应急模式，关闭所有显示设备' : '解除应急模式',
      result: 'success',
    });
  },

  broadcastEmergency: (message) => {
    get().addOperationLog({
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: '值班员',
      type: OPERATION_TYPES.EMERGENCY_BROADCAST,
      target: '全馆音响',
      detail: message,
      result: 'success',
    });
  },
}));
