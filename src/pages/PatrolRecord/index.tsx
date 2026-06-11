import { useState } from 'react';
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
  Checkbox,
  Radio,
  Divider,
  Tooltip,
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
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { PatrolRecord, MaintenanceOrder, PatrolDevice } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function PatrolRecord() {
  const {
    patrolRecords,
    maintenanceOrders,
    devices,
    deviceGroups,
    addPatrolRecordWithOrders,
    createMaintenanceOrder,
    updateMaintenanceStatus,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'patrol' | 'maintenance'>('patrol');
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PatrolRecord | null>(null);
  const [maintDetailVisible, setMaintDetailVisible] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState<MaintenanceOrder | null>(null);
  const [createMaintVisible, setCreateMaintVisible] = useState(false);
  const [checkinForm] = Form.useForm();
  const [maintForm] = Form.useForm();

  const [patrolDevices, setPatrolDevices] = useState<PatrolDevice[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

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

  const handleCheckin = () => {
    const allDevices: PatrolDevice[] = devices.map((d) => ({
      deviceId: d.id,
      deviceName: d.name,
      status: d.status === 'online' ? 'normal' : d.status === 'fault' ? 'fault' : 'offline',
      note: '',
      groupId: d.groupId,
    }));
    setPatrolDevices(allDevices);
    setSelectedAreas(deviceGroups.map((g) => g.id));
    checkinForm.resetFields();
    checkinForm.setFieldsValue({
      type: 'morning',
      areas: deviceGroups.map((g) => g.id),
      remark: '',
    });
    setCheckinModalVisible(true);
  };

  const handleAreaChange = (areas: string[]) => {
    setSelectedAreas(areas);
  };

  const handleDeviceStatusChange = (deviceId: string, status: 'normal' | 'fault' | 'offline') => {
    setPatrolDevices((prev) =>
      prev.map((d) => (d.deviceId === deviceId ? { ...d, status } : d))
    );
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
    maintForm.resetFields();
    maintForm.setFieldsValue({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      title: `${device.deviceName} - 维修工单`,
      description: device.note || '巡检发现异常，需要维修',
      level: device.status === 'fault' ? 'high' : 'medium',
      assignee: '未分配',
    });
    setCreateMaintVisible(true);
  };

  const handleSaveCheckin = async () => {
    try {
      const values = await checkinForm.validateFields();
      
      const filteredDevices = patrolDevices.filter((d) =>
        selectedAreas.includes(d.groupId || '')
      );

      const abnormalDevices = filteredDevices.filter((d) => d.status !== 'normal');

      const recordData: Omit<PatrolRecord, 'id'> = {
        date: dayjs().format('YYYY-MM-DD'),
        time: dayjs().format('HH:mm'),
        inspector: '当前值班员',
        type: values.type,
        status: abnormalDevices.length > 0 ? 'abnormal' : 'normal',
        devices: filteredDevices,
        remark: values.remark || '',
        images: [],
      };

      addPatrolRecordWithOrders(recordData, abnormalDevices);

      if (abnormalDevices.length > 0) {
        message.success(
          `巡检打卡成功，已生成 ${abnormalDevices.length} 张维修工单`
        );
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
      });

      message.success('工单已创建');
      setCreateMaintVisible(false);
      maintForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const filteredPatrolDevices = patrolDevices.filter((d) =>
    selectedAreas.includes(d.groupId || '')
  );

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
              title="本月巡检总数"
              value={patrolRecords.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="次"
            />
          </Card>
        </Col>
      </Row>

      <Card
        tabList={[
          { key: 'patrol', tab: '巡检记录' },
          { key: 'maintenance', tab: '维修工单' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as 'patrol' | 'maintenance')}
        extra={
          activeTab === 'patrol' ? (
            <Space>
              <RangePicker size="small" />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCheckin}>
                巡检打卡
              </Button>
            </Space>
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
            scroll={{ x: 1000 }}
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
        width={800}
        maskClosable={false}
        okButtonProps={{ disabled: filteredPatrolDevices.length === 0 }}
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
              <Form.Item
                label="巡检区域"
                name="areas"
                rules={[{ required: true, message: '请选择巡检区域' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择巡检区域"
                  options={deviceGroups.map((g) => ({ value: g.id, label: g.name }))}
                  onChange={handleAreaChange}
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
            </Space>
          </Divider>

          <div style={{ maxHeight: 300, overflow: 'auto', marginBottom: 16 }}>
            {filteredPatrolDevices.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                请先选择巡检区域
              </div>
            ) : (
              <List
                size="small"
                dataSource={filteredPatrolDevices}
                renderItem={(device) => (
                  <List.Item
                    key={device.deviceId}
                    style={{
                      padding: '12px 16px',
                      background: device.status !== 'normal' ? '#fff1f0' : '#fff',
                      borderLeft: device.status !== 'normal' ? '3px solid #f5222d' : 'none',
                    }}
                  >
                    <List.Item.Meta
                      title={device.deviceName}
                      description={
                        <Input
                          size="small"
                          placeholder="添加备注（可选）"
                          value={device.note}
                          onChange={(e) => handleDeviceNoteChange(device.deviceId, e.target.value)}
                          style={{ width: 300 }}
                        />
                      }
                    />
                    <Space size="middle">
                      <Radio.Group
                        size="small"
                        value={device.status}
                        onChange={(e) => handleDeviceStatusChange(device.deviceId, e.target.value)}
                      >
                        <Radio.Button value="normal">正常</Radio.Button>
                        <Radio.Button value="fault">故障</Radio.Button>
                        <Radio.Button value="offline">离线</Radio.Button>
                      </Radio.Group>
                      {device.status !== 'normal' && (
                        <Tooltip title="快速创建工单">
                          <Button
                            size="small"
                            type="primary"
                            danger
                            icon={<ToolOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateMaintFromAbnormal(device);
                            }}
                          >
                            转工单
                          </Button>
                        </Tooltip>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </div>

          <Form.Item label="巡检备注" name="remark">
            <TextArea rows={2} placeholder="请输入巡检备注，如有异常请详细描述" />
          </Form.Item>

          {abnormalDevicesCount > 0 && (
            <div
              style={{
                padding: '10px 12px',
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                borderRadius: 4,
                color: '#cf1322',
                fontSize: 12,
              }}
            >
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              检测到 {abnormalDevicesCount} 台异常设备，提交后将自动生成对应维修工单
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="巡检详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
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

            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>巡检备注</div>
              <div style={{ color: '#666' }}>{selectedRecord.remark || '无'}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="维修工单详情"
        open={maintDetailVisible}
        onCancel={() => setMaintDetailVisible(false)}
        footer={null}
        width={600}
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
                <span style={{ color: '#999' }}>设备: {selectedMaint.deviceName}</span>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>问题描述</div>
              <div style={{ color: '#666', padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {selectedMaint.description}
              </div>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 12 }}>创建人</div>
                <div>{selectedMaint.creator}</div>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 12 }}>指派给</div>
                <div>{selectedMaint.assignee}</div>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 12 }}>创建时间</div>
                <div>{selectedMaint.createdAt}</div>
              </Col>
            </Row>

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
    </div>
  );
}
