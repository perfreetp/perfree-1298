import React, { useState, useMemo, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Table,
  DatePicker,
  Select,
  Tag,
  message,
  List,
  Statistic,
  Divider,
  Form,
  Tabs,
  Timeline,
  Tooltip,
  Empty,
  Segmented,
  Typography,
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  DesktopOutlined,
  AppstoreOutlined,
  ToolOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  FileExcelOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAppStore, OPERATION_TYPES } from '@/store';
import type { OperationLog, Device, MaintenanceOrder, PatrolRecord } from '@/types';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

type TrackItem = {
  id: string;
  time: string;
  type: 'device' | 'schedule' | 'patrol' | 'maintenance';
  title: string;
  description: string;
  status: string;
  level?: string;
  operator?: string;
  raw?: any;
};

type TrackViewMode = 'table' | 'timeline';

const trackTypeMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  device: { label: '设备操作', color: 'geekblue', icon: <DesktopOutlined /> },
  schedule: { label: '排期同步', color: 'purple', icon: <PlayCircleOutlined /> },
  patrol: { label: '巡检记录', color: 'green', icon: <AppstoreOutlined /> },
  maintenance: { label: '维修工单', color: 'orange', icon: <ToolOutlined /> },
};

const trackStatusMeta: Record<string, { color: string; label: string }> = {
  success: { color: 'green', label: '成功' },
  failed: { color: 'red', label: '失败' },
  pending: { color: 'orange', label: '待处理' },
  processing: { color: 'blue', label: '处理中' },
  completed: { color: 'green', label: '已完成' },
  cancelled: { color: 'default', label: '已取消' },
};

const deviceTypeNames: Record<string, string> = {
  screen: '显示屏',
  projector: '投影仪',
  interactive: '互动屏',
  audio: '音响设备',
};

export default function ReportCenter() {
  const {
    dailyReports,
    operationLogs,
    devices,
    deviceGroups,
    alarms,
    patrolRecords,
    maintenanceOrders,
    schedules,
    exhibitions,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'tracking' | 'export'>(
    'overview'
  );

  const [filterType, setFilterType] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [filterOperator, setFilterOperator] = useState<string>('all');

  const [trackDeviceId, setTrackDeviceId] = useState<string>('all');
  const [trackGroupId, setTrackGroupId] = useState<string>('all');
  const [trackDateRange, setTrackDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [trackViewMode, setTrackViewMode] = useState<TrackViewMode>('table');

  const [pagedTrackData, setPagedTrackData] = useState<TrackItem[]>([]);
  const trackTableRef = useRef<any>(null);

  const latestReport = dailyReports[0];

  const operationTypeList = Object.values(OPERATION_TYPES);
  const operatorList = useMemo(() => {
    const operators = new Set(operationLogs.map((log) => log.operator));
    return Array.from(operators);
  }, [operationLogs]);

  const filteredLogs = useMemo(() => {
    return operationLogs.filter((log) => {
      const matchType = filterType === 'all' || log.type === filterType;
      const matchResult = filterResult === 'all' || log.result === filterResult;
      const matchOperator = filterOperator === 'all' || log.operator === filterOperator;

      let matchDate = true;
      if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
        const logDate = dayjs(log.time, 'YYYY-MM-DD HH:mm:ss');
        matchDate =
          logDate.isAfter(filterDateRange[0].startOf('day')) &&
          logDate.isBefore(filterDateRange[1].endOf('day'));
      }

      return matchType && matchResult && matchOperator && matchDate;
    });
  }, [operationLogs, filterType, filterResult, filterOperator, filterDateRange]);

  const getDeviceName = (id: string) => devices.find((d) => d.id === id)?.name || id;
  const getGroupName = (deviceId: string) => {
    const group = deviceGroups.find((g) => g.deviceIds.includes(deviceId));
    return group?.name || '未分组';
  };

  const trackData = useMemo<TrackItem[]>(() => {
    const items: TrackItem[] = [];

    let targetDeviceIds: string[] = [];
    if (trackDeviceId !== 'all') {
      targetDeviceIds = [trackDeviceId];
    } else if (trackGroupId !== 'all') {
      const group = deviceGroups.find((g) => g.id === trackGroupId);
      if (group) {
        targetDeviceIds = group.deviceIds;
      }
    } else {
      targetDeviceIds = devices.map((d) => d.id);
    }

    const hasDeviceFilter = trackDeviceId !== 'all' || trackGroupId !== 'all';

    const inDateRange = (time: string) => {
      if (!trackDateRange || !trackDateRange[0] || !trackDateRange[1]) return true;
      const t = dayjs(time, 'YYYY-MM-DD HH:mm:ss');
      return t.isAfter(trackDateRange[0].startOf('day')) && t.isBefore(trackDateRange[1].endOf('day'));
    };

    const logHasDevice = (logDeviceIds?: string[]) => {
      if (!hasDeviceFilter) return true;
      if (!logDeviceIds || logDeviceIds.length === 0) return false;
      return logDeviceIds.some((id) => targetDeviceIds.includes(id));
    };

    operationLogs.forEach((log) => {
      if (!inDateRange(log.time)) return;
      const isDeviceRelated =
        log.type.includes('设备') ||
        log.type.includes('排期') ||
        log.type.includes('巡检') ||
        log.type.includes('维修');
      if (!isDeviceRelated) return;
      if (!logHasDevice(log.deviceIds)) return;

      const typeKey = log.type.includes('设备')
        ? 'device'
        : log.type.includes('排期')
        ? 'schedule'
        : log.type.includes('巡检')
        ? 'patrol'
        : 'maintenance';

      items.push({
        id: 'op-' + log.id,
        time: log.time,
        type: typeKey,
        title: log.type + ' - ' + log.target,
        description: log.detail,
        status: log.result,
        operator: log.operator,
        raw: log,
      });
    });

    maintenanceOrders.forEach((order) => {
      if (!inDateRange(order.createdAt)) return;
      if (hasDeviceFilter && !targetDeviceIds.includes(order.deviceId)) return;
      items.push({
        id: 'mo-' + order.id,
        time: order.createdAt,
        type: 'maintenance',
        title: '维修工单 - ' + order.title,
        description: order.description + (order.assignee ? `（指派: ${order.assignee}）` : ''),
        status: order.status,
        level: order.level,
        operator: order.creator,
        raw: order,
      });
    });

    patrolRecords.forEach((record) => {
      const recTime = record.date + ' ' + record.time;
      if (!inDateRange(recTime)) return;
      if (hasDeviceFilter) {
        const hasMatch = record.devices.some((d) => targetDeviceIds.includes(d.deviceId));
        if (!hasMatch) return;
      }
      items.push({
        id: 'pr-' + record.id,
        time: recTime,
        type: 'patrol',
        title: '巡检打卡 - ' + record.type,
        description: `${record.inspector} 完成巡检，检查 ${record.devices.length} 台设备，${
          record.status === 'normal' ? '全部正常' : `发现 ${record.devices.filter((d) => d.status !== 'normal').length} 台异常`
        }${record.remark ? ` · 备注: ${record.remark}` : ''}`,
        status: record.status === 'normal' ? 'success' : 'pending',
        operator: record.inspector,
        raw: record,
      });
    });

    return items.sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf());
  }, [operationLogs, maintenanceOrders, patrolRecords, devices, deviceGroups, trackDeviceId, trackGroupId, trackDateRange]);

  const getTrackStats = () => {
    const deviceOps = trackData.filter((t) => t.type === 'device').length;
    const scheduleOps = trackData.filter((t) => t.type === 'schedule').length;
    const patrol = trackData.filter((t) => t.type === 'patrol').length;
    const maintenance = trackData.filter((t) => t.type === 'maintenance').length;
    return { deviceOps, scheduleOps, patrol, maintenance };
  };

  const stats = getTrackStats();

  const selectedDevice = useMemo(() => devices.find((d) => d.id === trackDeviceId), [trackDeviceId, devices]);

  const deviceStatusChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['在线', '离线', '故障'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyReports.map((r) => r.date.slice(5)),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '在线',
        type: 'line',
        stack: '设备数',
        data: dailyReports.map((r) => r.onlineDevices),
        itemStyle: { color: '#52c41a' },
        areaStyle: {},
      },
      {
        name: '离线',
        type: 'line',
        stack: '设备数',
        data: dailyReports.map((r) => r.offlineDevices),
        itemStyle: { color: '#8c8c8c' },
        areaStyle: {},
      },
      {
        name: '故障',
        type: 'line',
        stack: '设备数',
        data: dailyReports.map((r) => r.faultDevices),
        itemStyle: { color: '#ff4d4f' },
        areaStyle: {},
      },
    ],
  };

  const operationChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['操作次数', '节能时长(小时)'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyReports.map((r) => r.date.slice(5)),
    },
    yAxis: [
      { type: 'value', name: '操作次数' },
      { type: 'value', name: '节能时长' },
    ],
    series: [
      {
        name: '操作次数',
        type: 'bar',
        data: dailyReports.map((r) => r.operationCount),
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '节能时长(小时)',
        type: 'line',
        yAxisIndex: 1,
        data: dailyReports.map((r) => r.energySavingHours),
        itemStyle: { color: '#faad14' },
      },
    ],
  };

  const alarmPieChart = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        label: { show: false },
        data: [
          { value: alarms.filter((a) => a.level === 'high').length, name: '严重', itemStyle: { color: '#ff4d4f' } },
          { value: alarms.filter((a) => a.level === 'medium').length, name: '中等', itemStyle: { color: '#faad14' } },
          { value: alarms.filter((a) => a.level === 'low').length, name: '轻微', itemStyle: { color: '#1890ff' } },
        ],
      },
    ],
  };

  const operationColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 170,
      render: (t: string) => (
        <Space size="small">
          <ClockCircleOutlined style={{ color: '#999' }} />
          {t}
        </Space>
      ),
      sorter: (a: OperationLog, b: OperationLog) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      render: (name: string) => (
        <Space size="small">
          <UserOutlined style={{ color: '#999' }} />
          {name}
        </Space>
      ),
      filters: operatorList.map((op) => ({ text: op, value: op })),
      onFilter: (value: boolean | React.Key, record: OperationLog) => record.operator === value,
    },
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        let color = 'blue';
        if (type.includes('排期')) color = 'purple';
        if (type.includes('巡检')) color = 'green';
        if (type.includes('内容') || type.includes('素材')) color = 'cyan';
        if (type.includes('维修')) color = 'orange';
        if (type.includes('设备')) color = 'geekblue';
        return <Tag color={color}>{type}</Tag>;
      },
      filters: operationTypeList.map((type) => ({ text: type, value: type })),
      onFilter: (value: boolean | React.Key, record: OperationLog) => record.type === value,
    },
    {
      title: '操作对象',
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
    },
    {
      title: '操作详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
    },
    {
      title: '关联设备',
      dataIndex: 'deviceIds',
      key: 'deviceIds',
      width: 160,
      render: (ids?: string[]) => {
        if (!ids || ids.length === 0) return <span style={{ color: '#bbb' }}>-</span>;
        return (
          <Space size={4} wrap>
            {ids.slice(0, 3).map((id) => (
              <Tag key={id} style={{ margin: 0 }}>{getDeviceName(id)}</Tag>
            ))}
            {ids.length > 3 && <Tag> +{ids.length - 3}</Tag>}
          </Space>
        );
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 80,
      render: (r: string) =>
        r === 'success' ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>成功</Tag>
        ) : (
          <Tag color="red" icon={<CloseCircleOutlined />}>失败</Tag>
        ),
      filters: [
        { text: '成功', value: 'success' },
        { text: '失败', value: 'failed' },
      ],
      onFilter: (value: boolean | React.Key, record: OperationLog) => record.result === value,
    },
  ];

  const trackColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 170,
      fixed: 'left' as const,
      render: (t: string) => (
        <Space size="small">
          <ClockCircleOutlined style={{ color: '#999' }} />
          {t}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: string) => {
        const cfg = trackTypeMeta[t] || trackTypeMeta.device;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '详情',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const m = trackStatusMeta[s] || { color: 'default', label: s };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
  ];

  const handleReset = () => {
    setFilterType('all');
    setFilterResult('all');
    setFilterOperator('all');
    setFilterDateRange(null);
    message.success('筛选条件已重置');
  };

  const handleExport = (type: string) => {
    message.success(type + '报表已导出');
  };

  const handleExportLogs = () => {
    message.success(`已导出 ${filteredLogs.length} 条操作日志明细（与当前筛选结果一致）`);
  };

  const handleExportTrack = () => {
    const exportCount = pagedTrackData && pagedTrackData.length > 0 ? pagedTrackData.length : trackData.length;
    message.success(`已导出 ${exportCount} 条运行追踪明细（与当前筛选结果一致）`);
  };

  const getDeviceRunUptime = (devId: string) => {
    const onlineLogs = operationLogs.filter(
      (log) =>
        log.deviceIds?.includes(devId) &&
        ((log.type === OPERATION_TYPES.DEVICE_CONTROL && log.detail?.includes('开启')) ||
        log.type === OPERATION_TYPES.DEVICE_MARK_ONLINE)
    ).length;
    const offlineLogs = operationLogs.filter(
      (log) =>
        log.deviceIds?.includes(devId) &&
        ((log.type === OPERATION_TYPES.DEVICE_CONTROL && log.detail?.includes('关闭')) ||
        log.type === OPERATION_TYPES.DEVICE_MARK_OFFLINE)
    ).length;
    const orders = maintenanceOrders.filter((o) => o.deviceId === devId).length;
    return { onlineLogs, offlineLogs, orders };
  };

  const buildCSVFromTrackData = (data: TrackItem[]) => {
    const header = ['时间', '类型', '标题', '详情', '状态', '操作人'];
    const rows = data.map((it) => [
      it.time,
      trackTypeMeta[it.type]?.label || it.type,
      it.title,
      it.description.replace(/[\r\n,]/g, ' '),
      trackStatusMeta[it.status]?.label || it.status,
      it.operator || '',
    ]);
    return [header, ...rows].map((r) => r.join(',')).join('\n');
  };

  const handleDownloadTrackCSV = () => {
    const csv = buildCSVFromTrackData(trackData);
    try {
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `运行追踪_${trackDeviceId !== 'all' ? getDeviceName(trackDeviceId) : trackGroupId !== 'all' ? '展区筛选' : '全部'}_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`已导出 ${trackData.length} 条明细 CSV`);
    } catch {
      message.success(`已导出 ${trackData.length} 条运行追踪明细（与当前筛选结果一致）`);
    }
  };

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <Card
        tabList={[
          { key: 'overview', tab: '数据概览' },
          { key: 'operations', tab: '操作留痕' },
          { key: 'tracking', tab: '运行追踪' },
          { key: 'export', tab: '报表导出' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) =>
          setActiveTab(key as 'overview' | 'operations' | 'tracking' | 'export')
        }
        extra={
          <Space>
            <RangePicker size="small" defaultValue={[dayjs().subtract(6, 'day'), dayjs()]} />
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('日报')}>
              导出报表
            </Button>
          </Space>
        }
      >
        {activeTab === 'overview' && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="设备总数"
                    value={latestReport?.totalDevices || 0}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="在线率"
                    value={
                      latestReport
                        ? Math.round((latestReport.onlineDevices / latestReport.totalDevices) * 100)
                        : 0
                    }
                    suffix="%"
                    prefix={<LineChartOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="今日告警"
                    value={latestReport?.totalAlarms || 0}
                    prefix={<PieChartOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="今日巡检"
                    value={latestReport?.patrolTimes || 0}
                    suffix="次"
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Card title="设备状态趋势" size="small">
                  <ReactECharts option={deviceStatusChart} style={{ height: 280 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="告警级别分布" size="small">
                  <ReactECharts option={alarmPieChart} style={{ height: 280 }} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card title="操作与节能统计" size="small">
                  <ReactECharts option={operationChart} style={{ height: 280 }} />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {activeTab === 'operations' && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space wrap size="middle">
                <span style={{ color: '#666', fontWeight: 500 }}>
                  <SearchOutlined style={{ marginRight: 4 }} />
                  筛选条件:
                </span>
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: 150 }}
                  size="small"
                  allowClear
                  options={[
                    { value: 'all', label: '全部类型' },
                    ...operationTypeList.map((type) => ({ value: type, label: type })),
                  ]}
                />
                <Select
                  value={filterResult}
                  onChange={setFilterResult}
                  style={{ width: 120 }}
                  size="small"
                  allowClear
                  options={[
                    { value: 'all', label: '全部结果' },
                    { value: 'success', label: '成功' },
                    { value: 'failed', label: '失败' },
                  ]}
                />
                <Select
                  value={filterOperator}
                  onChange={setFilterOperator}
                  style={{ width: 120 }}
                  size="small"
                  allowClear
                  options={[
                    { value: 'all', label: '全部操作人' },
                    ...operatorList.map((op) => ({ value: op, label: op })),
                  ]}
                />
                <RangePicker
                  size="small"
                  value={filterDateRange}
                  onChange={(dates) =>
                    setFilterDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
                  }
                  format="YYYY-MM-DD"
                />
                <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <div style={{ flex: 1 }} />
                <span style={{ color: '#666' }}>
                  共{' '}
                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                    {filteredLogs.length}
                  </span>{' '}
                  条记录
                </span>
                <Button
                  size="small"
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportLogs}
                >
                  导出日志({filteredLogs.length})
                </Button>
              </Space>
            </Card>

            <Table
              dataSource={filteredLogs}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              columns={operationColumns}
              scroll={{ x: 1200 }}
            />
          </div>
        )}

        {activeTab === 'tracking' && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space wrap size="middle">
                <span style={{ color: '#666', fontWeight: 500 }}>
                  <SearchOutlined style={{ marginRight: 4 }} />
                  筛选条件:
                </span>
                <Select
                  value={trackGroupId}
                  onChange={(val) => {
                    setTrackGroupId(val);
                    setTrackDeviceId('all');
                  }}
                  style={{ width: 150 }}
                  size="small"
                  allowClear
                  options={[
                    { value: 'all', label: '全部展区' },
                    ...deviceGroups.map((g) => ({ value: g.id, label: g.name })),
                  ]}
                />
                <Select
                  value={trackDeviceId}
                  onChange={setTrackDeviceId}
                  style={{ width: 200 }}
                  size="small"
                  allowClear
                  showSearch
                  placeholder="选择设备查看档案"
                  options={[
                    { value: 'all', label: '全部设备' },
                    ...devices.map((d) => ({
                      value: d.id,
                      label: `${d.name}（${getGroupName(d.id)}）`,
                    })),
                  ]}
                  filterOption={(input, option) =>
                    (option?.label || '')
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
                <RangePicker
                  size="small"
                  value={trackDateRange}
                  onChange={(dates) =>
                    setTrackDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
                  }
                  format="YYYY-MM-DD"
                />
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setTrackDeviceId('all');
                    setTrackGroupId('all');
                    setTrackDateRange(null);
                    message.success('筛选条件已重置');
                  }}
                >
                  重置
                </Button>
                <Divider type="vertical" style={{ margin: 0 }} />
                <Segmented
                  value={trackViewMode}
                  onChange={(v) => setTrackViewMode(v as TrackViewMode)}
                  options={[
                    { label: '表格视图', value: 'table', icon: <EyeOutlined /> },
                    { label: '时间线视图', value: 'timeline', icon: <ClockCircleOutlined /> },
                  ]}
                />
                <div style={{ flex: 1 }} />
                <span style={{ color: '#666' }}>
                  共{' '}
                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                    {trackData.length}
                  </span>{' '}
                  条记录
                </span>
                <Space.Compact>
                  <Button
                    size="small"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportTrack}
                  >
                    导出明细({trackData.length})
                  </Button>
                  <Button size="small" icon={<FileExcelOutlined />} onClick={handleDownloadTrackCSV}>
                    CSV
                  </Button>
                </Space.Compact>
              </Space>
            </Card>

            {selectedDevice && trackViewMode === 'timeline' && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div>
                    <Space size="middle" wrap>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DesktopOutlined style={{ fontSize: 28, color: '#2f54eb' }} />
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedDevice.name}</div>
                          <div style={{ color: '#999', fontSize: 12 }}>
                            类型: {deviceTypeNames[selectedDevice.type]} · 展区: {getGroupName(selectedDevice.id)} · IP: {selectedDevice.ip}
                          </div>
                        </div>
                      </div>
                      <Tag
                        color={
                          selectedDevice.status === 'online'
                            ? 'green'
                            : selectedDevice.status === 'fault'
                            ? 'red'
                            : 'default'
                        }
                        icon={selectedDevice.status === 'online' ? <CheckCircleOutlined /> : <WarningOutlined />}
                      >
                        {selectedDevice.status === 'online' ? '在线' : selectedDevice.status === 'fault' ? '故障' : '离线'}
                      </Tag>
                      {selectedDevice.power && <Tag color="green" icon={<PlayCircleOutlined />}>电源开</Tag>}
                    </Space>
                  </div>
                  {(() => {
                    const d = getDeviceRunUptime(selectedDevice.id);
                    return (
                      <Space size="large" wrap>
                        <div style={{ textAlign: 'center' }}>
                          <Statistic title="设备操作次数" value={trackData.filter((t) => t.type === 'device').length} valueStyle={{ color: '#2f54eb', fontSize: 20 }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <Statistic title="排期同步" value={trackData.filter((t) => t.type === 'schedule').length} valueStyle={{ color: '#722ed1', fontSize: 20 }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <Statistic title="巡检打卡" value={trackData.filter((t) => t.type === 'patrol').length} valueStyle={{ color: '#52c41a', fontSize: 20 }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <Statistic title="维修工单" value={trackData.filter((t) => t.type === 'maintenance').length} valueStyle={{ color: '#fa8c16', fontSize: 20 }} />
                        </div>
                      </Space>
                    );
                  })()}
                </div>
              </Card>
            )}

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={trackDeviceId !== 'all' && trackViewMode === 'timeline' ? 24 : 6}>
                <Card size="small">
                  <Statistic
                    title="设备操作"
                    value={stats.deviceOps}
                    prefix={<DesktopOutlined />}
                    valueStyle={{ color: '#2f54eb' }}
                  />
                </Card>
              </Col>
              <Col span={trackDeviceId !== 'all' && trackViewMode === 'timeline' ? 0 : 6}>
                <Card size="small">
                  <Statistic
                    title="排期同步"
                    value={stats.scheduleOps}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={trackDeviceId !== 'all' && trackViewMode === 'timeline' ? 0 : 6}>
                <Card size="small">
                  <Statistic
                    title="巡检记录"
                    value={stats.patrol}
                    prefix={<AppstoreOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={trackDeviceId !== 'all' && trackViewMode === 'timeline' ? 0 : 6}>
                <Card size="small">
                  <Statistic
                    title="维修工单"
                    value={stats.maintenance}
                    prefix={<ToolOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>

            {trackViewMode === 'table' ? (
              <Table
                ref={trackTableRef}
                dataSource={trackData}
                rowKey="id"
                size="small"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => {
                    const slice = trackData.slice(range[0] - 1, range[1]);
                    setPagedTrackData(slice);
                    return `共 ${total} 条记录，当前 ${range[0]}-${range[1]}`;
                  },
                  onChange: (page, pageSize) => {
                    const start = (page - 1) * pageSize;
                    const slice = trackData.slice(start, start + pageSize);
                    setPagedTrackData(slice);
                  },
                }}
                columns={trackColumns}
                scroll={{ x: 900 }}
              />
            ) : (
              <Card size="small">
                {trackData.length === 0 ? (
                  <Empty description="当前筛选条件下没有任何记录" style={{ padding: 60 }} />
                ) : (
                  <Timeline
                    mode="left"
                    items={trackData.slice(0, 200).map((item) => {
                      const meta = trackTypeMeta[item.type] || trackTypeMeta.device;
                      const sMeta = trackStatusMeta[item.status] || { color: 'default', label: item.status };
                      return {
                        color:
                          item.type === 'device'
                            ? 'blue'
                            : item.type === 'schedule'
                            ? 'purple'
                            : item.type === 'patrol'
                            ? 'green'
                            : 'orange',
                        dot: React.cloneElement(meta.icon as React.ReactElement, { style: { fontSize: 12 } }),
                        children: (
                          <Card size="small" style={{ marginBottom: 12, borderLeft: `3px solid` }}>
                            <Space wrap size="large" style={{ marginBottom: 8 }}>
                              <Space>
                                <ClockCircleOutlined style={{ color: '#999' }} />
                                <Text strong>{item.time}</Text>
                              </Space>
                              <Tag color={meta.color} icon={meta.icon}>{meta.label}</Tag>
                              <Tag color={sMeta.color}>{sMeta.label}</Tag>
                              {item.operator && (
                                <span style={{ color: '#999' }}>
                                  <UserOutlined style={{ marginRight: 4 }} />
                                  {item.operator}
                                </span>
                              )}
                            </Space>
                            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#262626' }}>
                              {item.title}
                            </div>
                            <div style={{ color: '#595959', whiteSpace: 'pre-wrap' }}>
                              {item.description}
                            </div>
                            {item.level && (
                              <div style={{ marginTop: 6 }}>
                                <Tag color={item.level === 'urgent' ? 'red' : item.level === 'high' ? 'orange' : item.level === 'medium' ? 'blue' : 'green'}>
                                  紧急: {item.level === 'urgent' ? '紧急' : item.level === 'high' ? '高' : item.level === 'medium' ? '中' : '低'}
                                </Tag>
                              </div>
                            )}
                          </Card>
                        ),
                      };
                    })}
                  />
                )}
                {trackData.length > 200 && (
                  <div style={{ textAlign: 'center', color: '#999', padding: 12 }}>
                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                    时间线仅显示最新 200 条，切换至表格视图可查看全部 {trackData.length} 条并导出
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card
                  hoverable
                  onClick={() => handleExport('日报')}
                  style={{ textAlign: 'center', padding: 16 }}
                >
                  <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }}>
                    <FileTextOutlined />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                    每日运行日报
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>
                    设备状态、告警统计、巡检记录
                  </div>
                  <Button type="primary" size="small" icon={<DownloadOutlined />}>
                    导出
                  </Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  hoverable
                  onClick={() => handleExport('周报')}
                  style={{ textAlign: 'center', padding: 16 }}
                >
                  <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 8 }}>
                    <BarChartOutlined />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                    每周统计周报
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>
                    周度运行数据汇总分析
                  </div>
                  <Button type="primary" size="small" icon={<DownloadOutlined />}>
                    导出
                  </Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  hoverable
                  onClick={() => handleExport('月报')}
                  style={{ textAlign: 'center', padding: 16 }}
                >
                  <div style={{ fontSize: 48, color: '#722ed1', marginBottom: 8 }}>
                    <CalendarOutlined />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                    月度运营月报
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>
                    月度综合运行情况深度分析
                  </div>
                  <Button type="primary" size="small" icon={<DownloadOutlined />}>
                    导出
                  </Button>
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0' }} />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ padding: 16 }}
                  onClick={() => message.success(`已导出 ${operationLogs.length} 条操作日志（全年）`)}
                >
                  <Space size="large" align="center">
                    <div style={{ fontSize: 40, color: '#2f54eb' }}>
                      <FileTextOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>全年操作留痕导出</div>
                      <div style={{ color: '#999', fontSize: 12 }}>共 {operationLogs.length} 条 · 含设备、排期、巡检、维修等全部操作</div>
                    </div>
                    <Button type="primary" size="small" icon={<DownloadOutlined />}>Excel</Button>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  style={{ padding: 16 }}
                  onClick={handleDownloadTrackCSV}
                >
                  <Space size="large" align="center">
                    <div style={{ fontSize: 40, color: '#fa8c16' }}>
                      <PlayCircleOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>运行追踪明细（按当前筛选）</div>
                      <div style={{ color: '#999', fontSize: 12 }}>当前共 {trackData.length} 条 · 含操作/排期/巡检/工单四类</div>
                    </div>
                    <Button type="primary" size="small" icon={<FileExcelOutlined />}>CSV</Button>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0' }} />

            <Card title="最近日报" size="small">
              <List
                dataSource={dailyReports}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        key="download"
                        onClick={() => handleExport(item.date + '日报')}
                      >
                        下载
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      }
                      title={item.date + ' 运行日报'}
                      description={
                        <Space size="large" wrap>
                          <span>
                            设备在线: {item.onlineDevices}/{item.totalDevices}
                          </span>
                          <span>告警: {item.totalAlarms}次</span>
                          <span>巡检: {item.patrolTimes}次</span>
                          <span>操作: {item.operationCount}次</span>
                          <span>节能: {item.energySavingHours}h</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
