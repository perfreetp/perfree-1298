import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Modal,
  List,
  Badge,
  Tooltip,
  message,
  Select,
  Input,
  Form,
  Alert,
} from 'antd';
import {
  DashboardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  ExclamationCircleFilled,
  BulbOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { Device, AlarmItem } from '@/types';
import ReactECharts from 'echarts-for-react';

export default function DeviceStatus() {
  const {
    devices,
    alarms,
    deviceGroups,
    energySavingMode,
    toggleEnergySaving,
    handleAlarm,
    markOffline,
    setDeviceStatus,
    createMaintenanceOrder,
  } = useAppStore();

  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmItem | null>(null);
  const [maintModalVisible, setMaintModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const faultCount = devices.filter((d) => d.status === 'fault').length;
  const standbyCount = devices.filter((d) => d.status === 'standby').length;

  const unhandledAlarms = alarms.filter((a) => !a.handled);
  const handledAlarms = alarms.filter((a) => a.handled);

  const filteredDevices =
    filterStatus === 'all' ? devices : devices.filter((d) => d.status === filterStatus);

  const statusColors: Record<string, string> = {
    online: 'success',
    offline: 'default',
    fault: 'error',
    standby: 'warning',
  };

  const statusNames: Record<string, string> = {
    online: '在线',
    offline: '离线',
    fault: '故障',
    standby: '待机',
  };

  const alarmLevelColors: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'blue',
  };

  const alarmLevelNames: Record<string, string> = {
    high: '严重',
    medium: '中等',
    low: '轻微',
  };

  const handleAlarmClick = (alarm: AlarmItem) => {
    setSelectedAlarm(alarm);
    setAlarmModalVisible(true);
  };

  const handleMarkOffline = (deviceId: string) => {
    Modal.confirm({
      title: '确认标记离线',
      content: '确定要将该设备标记为离线吗？',
      onOk: () => {
        markOffline(deviceId);
        message.success('已标记为离线');
      },
    });
  };

  const handleCreateMaint = (device: Device) => {
    setSelectedDevice(device);
    setMaintModalVisible(true);
  };

  const handleAlarmConfirm = () => {
    if (selectedAlarm) {
      handleAlarm(selectedAlarm.id, '当前值班员', '已收到告警，正在处理');
      message.success('告警已处理');
      setAlarmModalVisible(false);
    }
  };

  const deviceStatusChart = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: [
          { value: onlineCount, name: '在线', itemStyle: { color: '#52c41a' } },
          { value: offlineCount, name: '离线', itemStyle: { color: '#8c8c8c' } },
          { value: faultCount, name: '故障', itemStyle: { color: '#ff4d4f' } },
          { value: standbyCount, name: '待机', itemStyle: { color: '#faad14' } },
        ],
      },
    ],
  };

  const alarmColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (l: string) => <Tag color={alarmLevelColors[l]}>{alarmLevelNames[l]}</Tag>,
    },
    {
      title: '设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
    },
    {
      title: '告警内容',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_, record: AlarmItem) =>
        record.handled ? <Tag color="green">已处理</Tag> : <Tag color="red">未处理</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: AlarmItem) => (
        <Button size="small" type="primary" onClick={() => handleAlarmClick(record)} disabled={record.handled}>
          处理
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={devices.length}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线设备"
              value={onlineCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${devices.length}`}
            />
            <Progress percent={Math.round((onlineCount / devices.length) * 100)} size="small" strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="故障设备"
              value={faultCount}
              prefix={<ExclamationCircleFilled />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Progress percent={Math.round((faultCount / devices.length) * 100)} size="small" strokeColor="#ff4d4f" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={unhandledAlarms.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Progress percent={Math.round((unhandledAlarms.length / alarms.length) * 100)} size="small" strokeColor="#faad14" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="设备状态分布" size="small">
            <ReactECharts option={deviceStatusChart} style={{ height: 200 }} />
          </Card>
        </Col>
        <Col span={16}>
          <Card
            title="最新告警"
            size="small"
            extra={
              <Badge count={unhandledAlarms.length} size="small" offset={[10, 0]}>
                <Tag color="red">未处理</Tag>
              </Badge>
            }
          >
            <Table
              dataSource={alarms.slice(0, 5)}
              rowKey="id"
              size="small"
              pagination={false}
              columns={alarmColumns}
              onRow={(record) => ({
                onClick: () => handleAlarmClick(record),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="设备列表"
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Select
              defaultValue="all"
              size="small"
              style={{ width: 120 }}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'online', label: '在线' },
                { value: 'offline', label: '离线' },
                { value: 'fault', label: '故障' },
                { value: 'standby', label: '待机' },
              ]}
            />
            <Button size="small" icon={<ReloadOutlined />}>刷新</Button>
            <Button
              size="small"
              icon={energySavingMode ? <ThunderboltOutlined /> : <BulbOutlined />}
              type={energySavingMode ? 'primary' : 'default'}
              onClick={toggleEnergySaving}
            >
              {energySavingMode ? '节能模式开启' : '节能模式'}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredDevices}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: '设备名称',
              dataIndex: 'name',
              key: 'name',
              width: 160,
              render: (text, record) => (
                <Space>
                  <span style={{ color: statusColors[record.status as keyof typeof statusColors] }}>●</span>
                  {text}
                </Space>
              ),
            },
            {
              title: '类型',
              dataIndex: 'type',
              key: 'type',
              width: 80,
              render: (type) => {
                const names: Record<string, string> = {
                  screen: '大屏',
                  projector: '投影',
                  interactive: '互动屏',
                  audio: '音响',
                };
                return <Tag>{names[type]}</Tag>;
              },
            },
            {
              title: '位置',
              dataIndex: 'location',
              key: 'location',
            },
            {
              title: 'IP地址',
              dataIndex: 'ip',
              key: 'ip',
              width: 120,
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 80,
              render: (s) => <Tag color={statusColors[s]}>{statusNames[s]}</Tag>,
            },
            {
              title: '最后在线',
              dataIndex: 'lastOnline',
              key: 'lastOnline',
              width: 160,
            },
            {
              title: '操作',
              key: 'action',
              width: 180,
              render: (_, record) => (
                <Space size="small">
                  {record.status !== 'fault' && record.status !== 'offline' && (
                    <Tooltip title="标记离线">
                      <Button size="small" icon={<CloseCircleOutlined />} onClick={() => handleMarkOffline(record.id)} />
                    </Tooltip>
                  )}
                  {record.status === 'fault' && (
                    <Tooltip title="创建维修单">
                      <Button size="small" type="primary" danger icon={<SettingOutlined />} onClick={() => handleCreateMaint(record)}>
                        报修
                      </Button>
                    </Tooltip>
                  )}
                  {record.status === 'offline' && (
                    <Tooltip title="标记在线">
                      <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => {
                        setDeviceStatus(record.id, 'online');
                        message.success('已标记为在线');
                      }}>
                        上线
                      </Button>
                    </Tooltip>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="告警详情"
        open={alarmModalVisible}
        onCancel={() => setAlarmModalVisible(false)}
        onOk={handleAlarmConfirm}
        okText="标记已处理"
        cancelText="关闭"
        width={500}
      >
        {selectedAlarm && (
          <div>
            {!selectedAlarm.handled ? (
              <Alert
                message={selectedAlarm.message}
                description={`设备: ${selectedAlarm.deviceName}\n时间: ${selectedAlarm.time}`}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                message="已处理"
                description={`处理人: ${selectedAlarm.handler}\n处理时间: ${selectedAlarm.handleTime}\n处理说明: ${selectedAlarm.handleNote}`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Form layout="vertical">
              <Form.Item label="处理说明">
                <Input.TextArea rows={3} placeholder="请输入处理说明" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="创建维修工单"
        open={maintModalVisible}
        onCancel={() => setMaintModalVisible(false)}
        onOk={() => {
          if (selectedDevice) {
            createMaintenanceOrder({
              title: `${selectedDevice.name}维修`,
              deviceId: selectedDevice.id,
              deviceName: selectedDevice.name,
              description: selectedDevice.faultMessage || '设备故障，需要维修',
              level: 'high',
              status: 'pending',
              assignee: '未分配',
              creator: '值班员',
              remark: '',
            });
            message.success('维修工单已创建');
            setMaintModalVisible(false);
          }
        }}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="设备名称">
            <Input value={selectedDevice?.name} disabled />
          </Form.Item>
          <Form.Item label="故障描述" required>
            <Input.TextArea rows={4} defaultValue={selectedDevice?.faultMessage} />
          </Form.Item>
          <Form.Item label="紧急程度">
            <Select
              defaultValue="high"
              options={[
                { value: 'urgent', label: '紧急' },
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' },
              ]}
            />
          </Form.Item>
          <Form.Item label="指派给">
            <Select
              defaultValue="未分配"
              options={[
                { value: '未分配', label: '未分配' },
                { value: '张技术', label: '张技术' },
                { value: '李技术', label: '李技术' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
