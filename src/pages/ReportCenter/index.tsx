import { useState } from 'react';
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
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ReportCenter() {
  const { dailyReports, operationLogs, devices, alarms, patrolRecords } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'export'>('overview');

  const latestReport = dailyReports[0];

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
    },
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '操作对象',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: '操作详情',
      dataIndex: 'detail',
      key: 'detail',
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
    },
  ];

  const handleExport = (type: string) => {
    message.success(type + '报表已导出');
  };

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <Card
        tabList={[
          { key: 'overview', tab: '数据概览' },
          { key: 'operations', tab: '操作留痕' },
          { key: 'export', tab: '报表导出' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as 'overview' | 'operations' | 'export')}
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
                    value={latestReport ? Math.round((latestReport.onlineDevices / latestReport.totalDevices) * 100) : 0}
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
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Select defaultValue="all" style={{ width: 120 }} size="small">
                  <Select.Option value="all">全部类型</Select.Option>
                  <Select.Option value="设备控制">设备控制</Select.Option>
                  <Select.Option value="排期控制">排期控制</Select.Option>
                  <Select.Option value="故障告警">故障告警</Select.Option>
                  <Select.Option value="巡检打卡">巡检打卡</Select.Option>
                </Select>
                <Select defaultValue="all" style={{ width: 120 }} size="small">
                  <Select.Option value="all">全部结果</Select.Option>
                  <Select.Option value="success">成功</Select.Option>
                  <Select.Option value="failed">失败</Select.Option>
                </Select>
              </Space>
            </div>

            <Table
              dataSource={operationLogs}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
              columns={operationColumns}
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
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>每日运行日报</div>
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
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>每周统计周报</div>
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
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>月度运营月报</div>
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
                      avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={item.date + ' 运行日报'}
                      description={
                        <Space size="large">
                          <span>设备在线: {item.onlineDevices}/{item.totalDevices}</span>
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
