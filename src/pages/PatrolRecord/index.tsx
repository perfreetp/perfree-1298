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
  Timeline,
  Row,
  Col,
  Statistic,
  DatePicker,
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
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { PatrolRecord, MaintenanceOrder } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function PatrolRecord() {
  const { patrolRecords, maintenanceOrders, devices, addPatrolRecord, createMaintenanceOrder } = useAppStore();
  const [activeTab, setActiveTab] = useState<'patrol' | 'maintenance'>('patrol');
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PatrolRecord | null>(null);
  const [maintDetailVisible, setMaintDetailVisible] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState<MaintenanceOrder | null>(null);
  const [createMaintVisible, setCreateMaintVisible] = useState(false);

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

  const handleCheckin = () => {
    setCheckinModalVisible(true);
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
    setCreateMaintVisible(true);
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
      render: (t) => (
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
      render: (t) => <Tag color={patrolTypeColors[t]}>{patrolTypeNames[t]}</Tag>,
    },
    {
      title: '巡检员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 100,
      render: (name) => (
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
      render: (s) =>
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
      render: (_, record) => <span>{record.devices.length} 台</span>,
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
      render: (_, record) => (
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
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
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
      render: (l) => <Tag color={maintLevelColors[l]}>{maintLevelNames[l]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => <Tag color={maintStatusColors[s]}>{maintStatusNames[s]}</Tag>,
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
      width: 100,
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewMaintDetail(record)}>
          详情
        </Button>
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
          />
        )}

        {activeTab === 'maintenance' && (
          <Table
            dataSource={maintenanceOrders}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8 }}
            columns={maintColumns}
          />
        )}
      </Card>

      <Modal
        title="巡检打卡"
        open={checkinModalVisible}
        onCancel={() => setCheckinModalVisible(false)}
        onOk={() => {
          addPatrolRecord({
            date: dayjs().format('YYYY-MM-DD'),
            time: dayjs().format('HH:mm'),
            inspector: '当前值班员',
            type: 'morning',
            status: 'normal',
            devices: devices.slice(0, 5).map((d) => ({
              deviceId: d.id,
              deviceName: d.name,
              status: d.status === 'online' ? 'normal' : d.status === 'fault' ? 'fault' : 'offline',
              note: '',
            })),
            remark: '巡检正常',
            images: [],
          });
          message.success('巡检打卡成功');
          setCheckinModalVisible(false);
        }}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="巡检类型">
                <Select
                  defaultValue="morning"
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
              <Form.Item label="巡检区域">
                <Select
                  mode="multiple"
                  placeholder="请选择巡检区域"
                  defaultValue={['group-1', 'group-2']}
                  options={[
                    { value: 'group-1', label: '一楼大厅' },
                    { value: 'group-2', label: '二楼展厅A' },
                    { value: 'group-3', label: '二楼展厅B' },
                    { value: 'group-4', label: '三楼多功能厅' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="巡检备注">
            <Input.TextArea rows={3} placeholder="请输入巡检备注，如有异常请详细描述" />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            提示：巡检打卡将记录当前时间和巡检人员信息
          </div>
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
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>设备检查情况 ({selectedRecord.devices.length} 台)</div>
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
        onOk={() => {
          createMaintenanceOrder({
            title: '设备维修',
            deviceId: 'dev-1',
            deviceName: '大厅主大屏',
            description: '设备故障需要维修',
            level: 'medium',
            status: 'pending',
            assignee: '未分配',
            creator: '值班员',
            remark: '',
          });
          message.success('工单已创建');
          setCreateMaintVisible(false);
        }}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="设备" required>
            <Select
              placeholder="请选择设备"
              options={devices.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
          <Form.Item label="标题" required>
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item label="问题描述" required>
            <Input.TextArea rows={4} placeholder="请详细描述问题" />
          </Form.Item>
          <Form.Item label="紧急程度">
            <Select
              defaultValue="medium"
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
