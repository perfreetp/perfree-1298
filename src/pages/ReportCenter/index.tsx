import React, { useState, useMemo } from 'react';
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
} from '@ant-design/icons';
import { useAppStore, OPERATION_TYPES } from '@/store';
import type { OperationLog, Device, MaintenanceOrder, PatrolRecord } from '@/types';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

type TrackItem = {
  id: string;
  time: string;
  type: 'device' | 'schedule' | 'patrol' | 'maintenance';
  title: string;
  description: string;
  status: string;
  level?: string;
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

    const inDateRange = (time: string) => {
      if (!trackDateRange || !trackDateRange[0] || !trackDateRange[1]) return true;
      const t = dayjs(time, 'YYYY-MM-DD HH:mm:ss');
      return t.isAfter(trackDateRange[0].startOf('day')) && t.isBefore(trackDateRange[1].endOf('day'));
    };

    operationLogs.forEach((log) => {
      if (!inDateRange(log.time)) return;
      const isDeviceRelated =
        log.type.includes('设备') ||
        log.type.includes('排期') ||
        log.type.includes('巡检') ||
        log.type.includes('维修');
      if (!isDeviceRelated) return;
      items.push({
        id: 'op-' + log.id,
        time: log.time,
        type: log.type.includes('设备')
          ? 'device'
          : log.type.includes('排期')
          ? 'schedule'
          : log.type.includes('巡检')
          ? 'patrol'
          : 'maintenance',
        title: log.type + ' - ' + log.target,
        description: log.detail,
        status: log.result,
      });
    });

    maintenanceOrders.forEach((order) => {
      if (!inDateRange(order.createdAt)) return;
      if (targetDeviceIds.length > 0 && !targetDeviceIds.includes(order.deviceId)) return;
      items.push({
        id: 'mo-' + order.id,
        time: order.createdAt,
        type: 'maintenance',
        title: '维修工单 - ' + order.title,
        description: order.description,
        status: order.status,
        level: order.level,
      });
    });

    return items.sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf());
  }, [operationLogs, maintenanceOrders, devices, deviceGroups, trackDeviceId, trackGroupId, trackDateRange]);

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
      render: (t: string) => (
        <Space size="small">
          <ClockCircleOutlined style={{ color: '#999' }} />
          {t}
        </Space>
      ),
      sorter: (a: TrackItem, b: TrackItem) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: string) => {
        const typeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
          device: { label: '设备操作', color: 'geekblue', icon: <DesktopOutlined /> },
          schedule: { label: '排期同步', color: 'purple', icon: <PlayCircleOutlined /> },
          patrol: { label: '巡检记录', color: 'green', icon: <AppstoreOutlined /> },
          maintenance: { label: '维修工单', color: 'orange', icon: <ToolOutlined /> },
        };
        const cfg = typeMap[t] || typeMap.device;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
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
        const statusMap: Record<string, string> = {
          success: 'green',
          failed: 'red',
          pending: 'orange',
          processing: 'blue',
          completed: 'green',
          cancelled: 'default',
        };
        const nameMap: Record<string, string> = {
          success: '成功',
          failed: '失败',
          pending: '待处理',
          processing: '处理中',
          completed: '已完成',
          cancelled: '已取消',
        };
        return <Tag color={statusMap[s] || 'default'}>{nameMap[s] || s}</Tag>;
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
    message.success('已导出 ' + filteredLogs.length + ' 条操作日志');
  };

  const handleExportTrack = () => {
    message.success('已导出 ' + trackData.length + ' 条运行追踪明细');
  };

  const getTrackStats = () => {
    const deviceOps = trackData.filter((t) => t.type === 'device').length;
    const scheduleOps = trackData.filter((t) => t.type === 'schedule').length;
    const patrolRecords = trackData.filter((t) => t.type === 'patrol').length;
    const maintenance = trackData.filter((t) => t.type === 'maintenance').length;
    return { deviceOps, scheduleOps, patrolRecords, maintenance };
  };

  const stats = getTrackStats();

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
                  导出日志
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
              scroll={{ x: 1000 }}
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
                  style={{ width: 180 }}
                  size="small"
                  allowClear
                  showSearch
                  placeholder="选择设备"
                  options={[
                    { value: 'all', label: '全部设备' },
                    ...devices.map((d) => ({ value: d.id, label: d.name })),
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
                <div style={{ flex: 1 }} />
                <span style={{ color: '#666' }}>
                  共{' '}
                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                    {trackData.length}
                  </span>{' '}
                  条记录
                </span>
                <Button
                  size="small"
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportTrack}
                >
                  导出明细
                </Button>
              </Space>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="设备操作"
                    value={stats.deviceOps}
                    prefix={<DesktopOutlined />}
                    valueStyle={{ color: '#2f54eb' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="排期同步"
                    value={stats.scheduleOps}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="巡检记录"
                    value={stats.patrolRecords}
                    prefix={<AppstoreOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
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

            <Table
              dataSource={trackData}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              columns={trackColumns}
              scroll={{ x: 900 }}
            />
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

            <Card title="最近日报" size="small">
              <List
                dataSource={dailyReports}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
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
                        <Space size="large">
                          <span>
                            设备在线: {item.onlineDevices}/{item.totalDevices}
                          </span>
                          <span>告警: {item.totalAlarms}次</span>
                          <span>巡检: {item.patrolTimes}次</span>
                          <span>操作: {item.operationCount}次</span>
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
