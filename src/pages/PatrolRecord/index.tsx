import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  List,
  Row,
  Col,
  Statistic,
  DatePicker,
  Radio,
  Divider,
  Tooltip,
  Popconfirm,
  Empty,
  Descriptions,
  Alert,
} from 'antd';
import {
  CheckSquareOutlined,
  PlusOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  CalendarOutlined,
  ToolOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  LinkOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { PatrolRecord, MaintenanceOrder, PatrolDevice, PatrolRoute } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function PatrolRecord() {
  const {
    patrolRecords,
    patrolRoutes,
    maintenanceOrders,
    devices,
    deviceGroups,
    addPatrolRecordWithOrders,
    createMaintenanceOrder,
    updateMaintenanceStatus,
    linkMaintenanceToPatrol,
    addPatrolRoute,
    updatePatrolRoute,
    deletePatrolRoute,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'patrol' | 'maintenance' | 'routes'>('patrol');
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PatrolRecord | null>(null);
  const [maintDetailVisible, setMaintDetailVisible] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState<MaintenanceOrder | null>(null);
  const [createMaintVisible, setCreateMaintVisible] = useState(false);
  const [linkOrderVisible, setLinkOrderVisible] = useState(false);
  const [linkTargetDevice, setLinkTargetDevice] = useState<PatrolDevice | null>(null);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute | null>(null);
  const [checkinForm] = Form.useForm();
  const [maintForm] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [routeForm] = Form.useForm();

  const [patrolDevices, setPatrolDevices] = useState<PatrolDevice[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [manualOrderDeviceIds, setManualOrderDeviceIds] = useState<string[]>([]);
  const [linkedOrderMap, setLinkedOrderMap] = useState<Record<string, string>>({});
  const [currentMaintFromPatrol, setCurrentMaintFromPatrol] = useState<string | null>(null);

  const patrolTypeNames: Record<string, string> = {
    morning: '早间巡检',
    afternoon: '午间巡检',
    evening: '晚间巡检',
    special: '专项巡检',
  };

  const patrolTypeColors: Record<string, string> = {
    morning: 'blue',
    afternoon: 'green',
    evening: 'purple',
    special: 'orange',
  };

  const maintLevelNames: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低',
  };

  const maintLevelColors: Record<string, string> = {
    urgent: 'red',
    high: 'orange',
    medium: 'blue',
    low: 'green',
  };

  const maintStatusNames: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
  };

  const maintStatusColors: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green',
    cancelled: 'default',
  };

  const todayPatrols = patrolRecords.filter((r) => r.date === dayjs().format('YYYY-MM-DD'));
  const abnormalDevicesCount = patrolDevices.filter((d) => d.status !== 'normal').length;

  const getOpenOrdersForDevice = (deviceId: string): MaintenanceOrder[] => {
    return maintenanceOrders.filter(
      (o) =>
        o.deviceId === deviceId &&
        (o.status === 'pending' || o.status === 'processing')
    );
  };

  const getDeviceStatusByPatrol = (status: 'normal' | 'fault' | 'offline') => {
    if (status === 'fault') return 'fault';
    if (status === 'offline') return 'offline';
    return 'online';
  };

  const handleCheckin = () => {
    const allDevices: PatrolDevice[] = devices.map((d) => ({
      deviceId: d.id,
      deviceName: d.name,
      status: d.status === 'online' ? 'normal' : d.status === 'fault' ? 'fault' : 'offline',
      note: '',
      groupId: d.groupId,
    }));
    setPatrolDevices(allDevices);
    setSelectedRouteId('');
    setManualOrderDeviceIds([]);
    setLinkedOrderMap({});
    checkinForm.resetFields();
    checkinForm.setFieldsValue({
      type: 'morning',
      routeId: '',
      remark: '',
    });
    setCheckinModalVisible(true);
  };

  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    if (routeId) {
      const route = patrolRoutes.find((r) => r.id === routeId);
      if (route) {
        const routeDevices: PatrolDevice[] = route.deviceIds
          .map((id) => {
            const d = devices.find((dev) => dev.id === id);
            if (!d) return null;
            return {
              deviceId: d.id,
              deviceName: d.name,
              status: d.status === 'online' ? 'normal' : d.status === 'fault' ? 'fault' : 'offline',
              note: '',
              groupId: d.groupId,
            };
          })
          .filter(Boolean) as PatrolDevice[];
        setPatrolDevices(routeDevices);
      }
    } else {
      const allDevices: PatrolDevice[] = devices.map((d) => ({
        deviceId: d.id,
        deviceName: d.name,
        status: d.status === 'online' ? 'normal' : d.status === 'fault' ? 'fault' : 'offline',
        note: '',
        groupId: d.groupId,
      }));
      setPatrolDevices(allDevices);
    }
    setManualOrderDeviceIds([]);
    setLinkedOrderMap({});
  };

  const handleDeviceStatusChange = (deviceId: string, status: 'normal' | 'fault' | 'offline') => {
    setPatrolDevices((prev) =>
      prev.map((d) => (d.deviceId === deviceId ? { ...d, status } : d))
    );
    if (status === 'normal') {
      setManualOrderDeviceIds((prev) => prev.filter((id) => id !== deviceId));
      setLinkedOrderMap((prev) => {
        const next = { ...prev };
        delete next[deviceId];
        return next;
      });
    }
  };

  const handleDeviceNoteChange = (deviceId: string, note: string) => {
    setPatrolDevices((prev) =>
      prev.map((d) => (d.deviceId === deviceId ? { ...d, note } : d))
    );
  };

  const handleViewDetail = (record: PatrolRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleViewMaintDetail = (order: MaintenanceOrder) => {
    setSelectedMaint(order);
    setMaintDetailVisible(true);
  };

  const handleCreateMaint = () => {
    maintForm.resetFields();
    maintForm.setFieldsValue({
      level: 'medium',
      assignee: '未分配',
    });
    setCreateMaintVisible(true);
  };

  const handleCreateMaintFromAbnormal = (device: PatrolDevice) => {
    if (manualOrderDeviceIds.includes(device.deviceId)) {
      message.info('该设备已手动创建工单，提交时不会重复生成');
      return;
    }
    maintForm.resetFields();
    maintForm.setFieldsValue({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      title: `${device.deviceName} - 维修工单`,
      description: device.note || '巡检发现异常，需要维修',
      level: device.status === 'fault' ? 'high' : 'medium',
      assignee: '未分配',
    });
    setCurrentMaintFromPatrol(device.deviceId);
    setCreateMaintVisible(true);
  };

  const handleLinkExistingOrder = (device: PatrolDevice) => {
    setLinkTargetDevice(device);
    linkForm.resetFields();
    const openOrders = getOpenOrdersForDevice(device.deviceId);
    if (openOrders.length > 0) {
      linkForm.setFieldsValue({ orderId: openOrders[0].id });
    }
    setLinkOrderVisible(true);
  };

  const handleSaveLinkOrder = () => {
    if (!linkTargetDevice) return;
    const values = linkForm.getFieldsValue();
    if (!values.orderId) {
      message.warning('请选择要关联的工单');
      return;
    }
    setLinkedOrderMap((prev) => ({
      ...prev,
      [linkTargetDevice.deviceId]: values.orderId,
    }));
    const order = maintenanceOrders.find((o) => o.id === values.orderId);
    message.success(`已关联工单 ${order?.title || values.orderId}，提交时将同步巡检备注`);
    setLinkOrderVisible(false);
    setLinkTargetDevice(null);
  };

  const handleCancelLinkOrder = (deviceId: string) => {
    setLinkedOrderMap((prev) => {
      const next = { ...prev };
      delete next[deviceId];
      return next;
    });
    message.info('已取消关联');
  };

  const handleSaveCheckin = async () => {
    try {
      const values = await checkinForm.validateFields();

      const abnormalDevices = patrolDevices.filter((d) => d.status !== 'normal');

      const recordData: Omit<PatrolRecord, 'id'> = {
        date: dayjs().format('YYYY-MM-DD'),
        time: dayjs().format('HH:mm'),
        inspector: '当前值班员',
        type: values.type,
        status: abnormalDevices.length > 0 ? 'abnormal' : 'normal',
        devices: patrolDevices,
        remark: values.remark || '',
        images: [],
      };

      const skipIds = manualOrderDeviceIds.filter((id) =>
        abnormalDevices.some((d) => d.deviceId === id)
      );

      const validLinkedOrderIds: Record<string, string> = {};
      Object.entries(linkedOrderMap).forEach(([deviceId, orderId]) => {
        const isAbnormal = abnormalDevices.some((d) => d.deviceId === deviceId);
        if (isAbnormal && !skipIds.includes(deviceId)) {
          validLinkedOrderIds[deviceId] = orderId;
        }
      });

      addPatrolRecordWithOrders(recordData, abnormalDevices, skipIds, validLinkedOrderIds);

      const linkedCount = Object.keys(validLinkedOrderIds).length;
      const autoGenCount = abnormalDevices.length - skipIds.length - linkedCount;

      if (abnormalDevices.length > 0) {
        const parts: string[] = [];
        if (skipIds.length > 0) parts.push(`${skipIds.length} 台已手动转单`);
        if (linkedCount > 0) parts.push(`${linkedCount} 台关联已有工单`);
        parts.push(`自动生成 ${Math.max(0, autoGenCount)} 张维修工单`);
        message.success(`巡检打卡成功，${parts.join('，')}`);
      } else {
        message.success('巡检打卡成功');
      }

      setCheckinModalVisible(false);
      checkinForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleSaveMaint = async () => {
    try {
      const values = await maintForm.validateFields();
      const device = devices.find((d) => d.id === values.deviceId);

      createMaintenanceOrder({
        title: values.title,
        deviceId: values.deviceId,
        deviceName: device?.name || values.deviceName,
        description: values.description,
        level: values.level,
        status: 'pending',
        assignee: values.assignee,
        creator: '值班员',
        remark: values.remark || '',
        source: 'manual',
      });

      if (currentMaintFromPatrol && currentMaintFromPatrol === values.deviceId) {
        setManualOrderDeviceIds((prev) => [...prev, values.deviceId]);
        setCurrentMaintFromPatrol(null);
      }

      message.success('工单已创建');
      setCreateMaintVisible(false);
      maintForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleAddRoute = () => {
    setSelectedRoute(null);
    routeForm.resetFields();
    routeForm.setFieldsValue({
      name: '',
      description: '',
      area: '',
      deviceIds: [],
      sortOrder: patrolRoutes.length + 1,
    });
    setRouteModalVisible(true);
  };

  const handleEditRoute = (route: PatrolRoute) => {
    setSelectedRoute(route);
    routeForm.setFieldsValue({
      name: route.name,
      description: route.description,
      area: route.area,
      deviceIds: route.deviceIds,
      sortOrder: route.sortOrder,
    });
    setRouteModalVisible(true);
  };

  const handleDeleteRoute = (routeId: string) => {
    deletePatrolRoute(routeId);
    message.success('路线已删除');
  };

  const handleSaveRoute = async () => {
    try {
      const values = await routeForm.validateFields();

      if (selectedRoute) {
        updatePatrolRoute(selectedRoute.id, values);
        message.success('路线已更新');
      } else {
        addPatrolRoute(values);
        message.success('路线已创建');
      }

      setRouteModalVisible(false);
      routeForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const patrolColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      render: (t: string) => (
        <Space>
          <ClockCircleOutlined />
          {t}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: string) => <Tag color={patrolTypeColors[t]}>{patrolTypeNames[t]}</Tag>,
    },
    {
      title: '巡检员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 100,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) =>
        s === 'normal' ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>
        ) : (
          <Tag color="orange" icon={<ExclamationCircleOutlined />}>有异常</Tag>
        ),
    },
    {
      title: '设备数',
      key: 'deviceCount',
      width: 80,
      render: (_: unknown, record: PatrolRecord) => <span>{record.devices.length} 台</span>,
    },
    {
      title: '异常数',
      key: 'abnormalCount',
      width: 80,
      render: (_: unknown, record: PatrolRecord) => {
        const count = record.devices.filter((d) => d.status !== 'normal').length;
        return count > 0 ? <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{count} 台</span> : <span>-</span>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: PatrolRecord) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const maintColumns = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 140,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 80,
      render: (s: string) => {
        const sourceNames: Record<string, string> = {
          manual: '手动',
          patrol: '巡检',
          alarm: '告警',
        };
        return <Tag>{sourceNames[s] || '手动'}</Tag>;
      },
    },
    {
      title: '紧急程度',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (l: string) => <Tag color={maintLevelColors[l]}>{maintLevelNames[l]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={maintStatusColors[s]}>{maintStatusNames[s]}</Tag>,
    },
    {
      title: '指派给',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: MaintenanceOrder) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewMaintDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => {
                updateMaintenanceStatus(record.id, 'processing');
                message.success('工单已开始处理');
              }}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const routeColumns = [
    {
      title: '序号',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 60,
    },
    {
      title: '路线名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 140,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '设备数量',
      key: 'deviceCount',
      width: 100,
      render: (_: unknown, record: PatrolRoute) => <span>{record.deviceIds.length} 台</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: PatrolRoute) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRoute(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条巡检路线吗？"
            onConfirm={() => handleDeleteRoute(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const manualOrderCount = useMemo(
    () => manualOrderDeviceIds.filter((id) =>
      patrolDevices.some((d) => d.deviceId === id && d.status !== 'normal')
    ).length,
    [manualOrderDeviceIds, patrolDevices]
  );

  const linkedOrderCount = useMemo(
    () => Object.keys(linkedOrderMap).filter((id) =>
      patrolDevices.some((d) => d.deviceId === id && d.status !== 'normal')
    ).length,
    [linkedOrderMap, patrolDevices]
  );

  const getOrdersForPatrolRecord = (recordId: string): MaintenanceOrder[] => {
    return maintenanceOrders.filter((o) => o.patrolRecordId === recordId);
  };

  const getPatrolForOrder = (patrolRecordId?: string): PatrolRecord | undefined => {
    if (!patrolRecordId) return undefined;
    return patrolRecords.find((r) => r.id === patrolRecordId);
  };

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="今日巡检次数"
              value={todayPatrols.length}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待处理工单"
              value={maintenanceOrders.filter((o) => o.status === 'pending').length}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="处理中工单"
              value={maintenanceOrders.filter((o) => o.status === 'processing').length}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="巡检路线数"
              value={patrolRoutes.length}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="条"
            />
          </Card>
        </Col>
      </Row>

      <Card
        tabList={[
          { key: 'patrol', tab: '巡检记录' },
          { key: 'maintenance', tab: '维修工单' },
          { key: 'routes', tab: '巡检路线' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as 'patrol' | 'maintenance' | 'routes')}
        extra={
          activeTab === 'patrol' ? (
            <Space>
              <RangePicker size="small" />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCheckin}>
                巡检打卡
              </Button>
            </Space>
          ) : activeTab === 'routes' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoute}>
              新增路线
            </Button>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMaint}>
              创建工单
            </Button>
          )
        }
      >
        {activeTab === 'patrol' && (
          <Table
            dataSource={patrolRecords}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8 }}
            columns={patrolColumns}
            scroll={{ x: 1000 }}
          />
        )}

        {activeTab === 'maintenance' && (
          <Table
            dataSource={maintenanceOrders}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8 }}
            columns={maintColumns}
            scroll={{ x: 1100 }}
          />
        )}

        {activeTab === 'routes' && (
          <Table
            dataSource={[...patrolRoutes].sort((a, b) => a.sortOrder - b.sortOrder)}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8 }}
            columns={routeColumns}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      <Modal
        title="巡检打卡"
        open={checkinModalVisible}
        onCancel={() => setCheckinModalVisible(false)}
        onOk={handleSaveCheckin}
        okText="提交打卡"
        cancelText="取消"
        width={880}
        maskClosable={false}
        okButtonProps={{ disabled: patrolDevices.length === 0 }}
      >
        <Form form={checkinForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="巡检类型"
                name="type"
                rules={[{ required: true, message: '请选择巡检类型' }]}
              >
                <Select
                  options={[
                    { value: 'morning', label: '早间巡检' },
                    { value: 'afternoon', label: '午间巡检' },
                    { value: 'evening', label: '晚间巡检' },
                    { value: 'special', label: '专项巡检' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="巡检路线（可选）" name="routeId">
                <Select
                  placeholder="选择路线自动带出设备"
                  allowClear
                  options={patrolRoutes.map((r) => ({ value: r.id, label: r.name }))}
                  onChange={handleRouteChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '12px 0' }}>
            <Space>
              <span>设备检查</span>
              {abnormalDevicesCount > 0 && (
                <Tag color="red" icon={<ExclamationCircleOutlined />}>
                  {abnormalDevicesCount} 台异常
                </Tag>
              )}
              {manualOrderCount > 0 && (
                <Tag color="blue">
                  {manualOrderCount} 台已手动转单
                </Tag>
              )}
              {linkedOrderCount > 0 && (
                <Tag color="purple" icon={<LinkOutlined />}>
                  {linkedOrderCount} 台关联工单
                </Tag>
              )}
            </Space>
          </Divider>

          <div style={{ maxHeight: 340, overflow: 'auto', marginBottom: 16 }}>
            {patrolDevices.length === 0 ? (
              <Empty description="暂无检查设备" style={{ padding: 40 }} />
            ) : (
              <List
                size="small"
                dataSource={patrolDevices}
                renderItem={(device) => {
                  const isManualOrder = manualOrderDeviceIds.includes(device.deviceId);
                  const linkedOrderId = linkedOrderMap[device.deviceId];
                  const linkedOrder = linkedOrderId
                    ? maintenanceOrders.find((o) => o.id === linkedOrderId)
                    : null;
                  const openOrders = getOpenOrdersForDevice(device.deviceId);

                  return (
                    <List.Item
                      key={device.deviceId}
                      style={{
                        padding: '12px 16px',
                        background: device.status !== 'normal' ? '#fff1f0' : '#fff',
                        borderLeft: device.status !== 'normal' ? '3px solid #f5222d' : 'none',
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <Space wrap>
                            <span style={{ fontWeight: 500 }}>{device.deviceName}</span>
                            {openOrders.length > 0 && device.status === 'normal' && (
                              <Tooltip title={`该设备有 ${openOrders.length} 张未完成工单`}>
                                <Tag color="orange" icon={<ExclamationCircleOutlined />}>
                                  {openOrders.length} 张进行中工单
                                </Tag>
                              </Tooltip>
                            )}
                            {isManualOrder && device.status !== 'normal' && (
                              <Tag color="blue">已手动转单</Tag>
                            )}
                            {linkedOrder && device.status !== 'normal' && (
                              <Tag color="purple" icon={<LinkOutlined />}>
                                已关联: {linkedOrder.title}
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <Input
                              size="small"
                              placeholder="添加备注（可选）"
                              value={device.note}
                              onChange={(e) => handleDeviceNoteChange(device.deviceId, e.target.value)}
                              style={{ width: 340, marginBottom: openOrders.length > 0 && device.status !== 'normal' ? 6 : 0 }}
                            />
                            {openOrders.length > 0 && device.status !== 'normal' && (
                              <div style={{ fontSize: 12, color: '#d46b08' }}>
                                <ExclamationCircleOutlined /> 该设备已有 {openOrders.length} 张未完成工单：
                                {openOrders.map((o) => (
                                  <Tag
                                    key={o.id}
                                    style={{ marginLeft: 6, marginTop: 4 }}
                                    color={maintStatusColors[o.status]}
                                  >
                                    [{maintStatusNames[o.status]}] {o.title}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        }
                      />
                      <div style={{ flexShrink: 0, minWidth: 360 }}>
                        <div style={{ marginBottom: 8, textAlign: 'right' }}>
                          <Radio.Group
                            size="small"
                            value={device.status}
                            onChange={(e) => handleDeviceStatusChange(device.deviceId, e.target.value)}
                          >
                            <Radio.Button value="normal">正常</Radio.Button>
                            <Radio.Button value="fault">故障</Radio.Button>
                            <Radio.Button value="offline">离线</Radio.Button>
                          </Radio.Group>
                        </div>
                        {device.status !== 'normal' && (
                          <div style={{ textAlign: 'right' }}>
                            <Space size="small" wrap>
                              <Tooltip title="转工单到新维修单">
                                <Button
                                  size="small"
                                  type={!isManualOrder && !linkedOrder ? 'primary' : 'default'}
                                  danger={!isManualOrder && !linkedOrder}
                                  icon={<ToolOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateMaintFromAbnormal(device);
                                  }}
                                >
                                  {isManualOrder ? '重新转单' : '新建工单'}
                                </Button>
                              </Tooltip>
                              {openOrders.length > 0 && !linkedOrder && (
                                <Tooltip title="关联已有未完成工单，不再自动补单">
                                  <Button
                                    size="small"
                                    icon={<LinkOutlined />}
                                    onClick={() => handleLinkExistingOrder(device)}
                                  >
                                    关联工单
                                  </Button>
                                </Tooltip>
                              )}
                              {linkedOrder && (
                                <Tooltip title="取消本次关联">
                                  <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() => handleCancelLinkOrder(device.deviceId)}
                                  >
                                    取消关联
                                  </Button>
                                </Tooltip>
                              )}
                            </Space>
                          </div>
                        )}
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </div>

          <Form.Item label="巡检备注" name="remark">
            <TextArea rows={2} placeholder="请输入巡检备注，如有异常请详细描述" />
          </Form.Item>

          {abnormalDevicesCount > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 0 }}
              message={
                <span>
                  检测到 {abnormalDevicesCount} 台异常设备
                  {manualOrderCount > 0 && `，${manualOrderCount} 台已手动转单`}
                  {linkedOrderCount > 0 && `，${linkedOrderCount} 台关联已有工单`}
                  {`，将自动生成 ${Math.max(0, abnormalDevicesCount - manualOrderCount - linkedOrderCount)} 张工单`}
                </span>
              }
            />
          )}
        </Form>
      </Modal>

      <Modal
        title="巡检详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={680}
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space wrap size="large">
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>日期</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedRecord.date}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>时间</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedRecord.time}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>类型</div>
                  <Tag color={patrolTypeColors[selectedRecord.type]}>
                    {patrolTypeNames[selectedRecord.type]}
                  </Tag>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>巡检员</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedRecord.inspector}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>状态</div>
                  {selectedRecord.status === 'normal' ? (
                    <Tag color="green">正常</Tag>
                  ) : (
                    <Tag color="orange">有异常</Tag>
                  )}
                </div>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                设备检查情况 ({selectedRecord.devices.length} 台)
              </div>
              <List
                size="small"
                bordered
                dataSource={selectedRecord.devices}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.deviceName}
                      description={item.note || '正常'}
                    />
                    {item.status === 'normal' ? (
                      <Tag color="green">正常</Tag>
                    ) : item.status === 'fault' ? (
                      <Tag color="red">故障</Tag>
                    ) : (
                      <Tag color="default">离线</Tag>
                    )}
                  </List.Item>
                )}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>巡检备注</div>
              <div style={{ color: '#666' }}>{selectedRecord.remark || '无'}</div>
            </div>

            {getOrdersForPatrolRecord(selectedRecord.id).length > 0 && (
              <div>
                <Divider orientation="left" style={{ margin: '12px 0' }}>
                  关联维修工单 ({getOrdersForPatrolRecord(selectedRecord.id).length} 张)
                </Divider>
                <List
                  size="small"
                  bordered
                  dataSource={getOrdersForPatrolRecord(selectedRecord.id)}
                  renderItem={(order) => (
                    <List.Item
                      actions={[
                        <Button
                          key="view"
                          size="small"
                          type="link"
                          onClick={() => {
                            handleViewMaintDetail(order);
                            setDetailModalVisible(false);
                          }}
                        >
                          查看工单
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <span>{order.title}</span>
                            <Tag color={maintLevelColors[order.level]}>{maintLevelNames[order.level]}</Tag>
                            <Tag color={maintStatusColors[order.status]}>{maintStatusNames[order.status]}</Tag>
                            <Tag>{order.source === 'patrol' ? (order.patrolRecordId ? '巡检自动生成' : '巡检关联') : '手动'}</Tag>
                          </Space>
                        }
                        description={
                          <span>
                            {order.deviceName} · 创建 {order.createdAt}
                            {order.linkedPatrolNote && (
                              <span style={{ marginLeft: 12, color: '#1890ff' }}>
                                <LinkOutlined /> {order.linkedPatrolNote}
                              </span>
                            )}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="维修工单详情"
        open={maintDetailVisible}
        onCancel={() => setMaintDetailVisible(false)}
        footer={null}
        width={680}
      >
        {selectedMaint && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                {selectedMaint.title}
              </div>
              <Space wrap size="large">
                <Tag color={maintLevelColors[selectedMaint.level]}>
                  {maintLevelNames[selectedMaint.level]}
                </Tag>
                <Tag color={maintStatusColors[selectedMaint.status]}>
                  {maintStatusNames[selectedMaint.status]}
                </Tag>
                <Tag>
                  {selectedMaint.source === 'patrol'
                    ? selectedMaint.patrolRecordId
                      ? '巡检来源'
                      : '巡检关联'
                    : selectedMaint.source === 'alarm'
                    ? '告警来源'
                    : '手动创建'}
                </Tag>
                <span style={{ color: '#999' }}>设备: {selectedMaint.deviceName}</span>
              </Space>
            </div>

            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="创建人">{selectedMaint.creator}</Descriptions.Item>
              <Descriptions.Item label="指派给">{selectedMaint.assignee}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedMaint.createdAt}</Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedMaint.completedAt || '未完成'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>问题描述</div>
              <div style={{ color: '#666', padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {selectedMaint.description}
              </div>
            </div>

            {selectedMaint.patrolRecordId && (
              <div style={{ marginBottom: 16 }}>
                <Divider orientation="left" style={{ margin: '12px 0' }}>
                  <LinkOutlined /> 来源巡检
                </Divider>
                {(() => {
                  const patrol = getPatrolForOrder(selectedMaint.patrolRecordId);
                  return patrol ? (
                    <Card size="small" style={{ background: '#f0f5ff', border: '1px solid #adc6ff' }}>
                      <Row gutter={16}>
                        <Col span={6}>
                          <div style={{ color: '#999', fontSize: 12 }}>日期</div>
                          <div style={{ fontWeight: 'bold' }}>{patrol.date}</div>
                        </Col>
                        <Col span={6}>
                          <div style={{ color: '#999', fontSize: 12 }}>时间</div>
                          <div>{patrol.time}</div>
                        </Col>
                        <Col span={6}>
                          <div style={{ color: '#999', fontSize: 12 }}>类型</div>
                          <Tag color={patrolTypeColors[patrol.type]}>{patrolTypeNames[patrol.type]}</Tag>
                        </Col>
                        <Col span={6}>
                          <div style={{ color: '#999', fontSize: 12 }}>巡检员</div>
                          <div>{patrol.inspector}</div>
                        </Col>
                      </Row>
                      {selectedMaint.linkedPatrolNote && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ color: '#999', fontSize: 12 }}>巡检备注</div>
                          <div style={{ color: '#595959' }}>{selectedMaint.linkedPatrolNote}</div>
                        </div>
                      )}
                      <div style={{ marginTop: 12 }}>
                        <Button
                          size="small"
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            setSelectedRecord(patrol);
                            setMaintDetailVisible(false);
                            setDetailModalVisible(true);
                          }}
                        >
                          查看巡检详情
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div style={{ color: '#999' }}>巡检记录 #{selectedMaint.patrolRecordId}</div>
                  );
                })()}
              </div>
            )}

            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>备注</div>
              <div style={{ color: '#666' }}>{selectedMaint.remark || '无'}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="创建维修工单"
        open={createMaintVisible}
        onCancel={() => setCreateMaintVisible(false)}
        onOk={handleSaveMaint}
        okText="创建"
        cancelText="取消"
        width={500}
        maskClosable={false}
      >
        <Form form={maintForm} layout="vertical">
          <Form.Item
            label="设备"
            name="deviceId"
            rules={[{ required: true, message: '请选择设备' }]}
          >
            <Select
              placeholder="请选择设备"
              options={devices.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item
            label="问题描述"
            name="description"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述问题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="紧急程度" name="level">
                <Select
                  options={[
                    { value: 'urgent', label: '紧急' },
                    { value: 'high', label: '高' },
                    { value: 'medium', label: '中' },
                    { value: 'low', label: '低' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="指派给" name="assignee">
                <Select
                  options={[
                    { value: '未分配', label: '未分配' },
                    { value: '张技术', label: '张技术' },
                    { value: '李技术', label: '李技术' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="其他备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关联已有工单"
        open={linkOrderVisible}
        onCancel={() => {
          setLinkOrderVisible(false);
          setLinkTargetDevice(null);
        }}
        onOk={handleSaveLinkOrder}
        okText="确认关联"
        cancelText="取消"
        width={560}
        maskClosable={false}
      >
        {linkTargetDevice && (
          <div>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={
                <span>
                  为设备 <b>{linkTargetDevice.deviceName}</b> 关联已有的维修工单，
                  提交巡检时将不再自动补单，并同步本次巡检备注到工单
                </span>
              }
            />
            <Form form={linkForm} layout="vertical">
              <Form.Item
                label="选择要关联的未完成工单"
                name="orderId"
                rules={[{ required: true, message: '请选择要关联的工单' }]}
              >
                <Select
                  placeholder="请选择一张未完成工单"
                  options={getOpenOrdersForDevice(linkTargetDevice.deviceId).map((o) => ({
                    value: o.id,
                    label: `[${maintStatusNames[o.status]}] ${o.title}（${o.createdAt}）`,
                  }))}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={selectedRoute ? '编辑巡检路线' : '新增巡检路线'}
        open={routeModalVisible}
        onCancel={() => setRouteModalVisible(false)}
        onOk={handleSaveRoute}
        okText="保存"
        cancelText="取消"
        width={500}
        maskClosable={false}
      >
        <Form form={routeForm} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="路线名称"
                name="name"
                rules={[{ required: true, message: '请输入路线名称' }]}
              >
                <Input placeholder="请输入路线名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="排序"
                name="sortOrder"
                rules={[{ required: true, message: '请输入排序号' }]}
              >
                <Input type="number" placeholder="序号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="所属区域"
            name="area"
            rules={[{ required: true, message: '请选择所属区域' }]}
          >
            <Select
              placeholder="请选择所属区域"
              options={deviceGroups.map((g) => ({ value: g.name, label: g.name }))}
            />
          </Form.Item>
          <Form.Item
            label="路线描述"
            name="description"
          >
            <TextArea rows={2} placeholder="请描述路线巡检内容" />
          </Form.Item>
          <Form.Item
            label="巡检设备"
            name="deviceIds"
            rules={[{ required: true, message: '请至少选择一台设备' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择该路线包含的设备"
              options={devices.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
