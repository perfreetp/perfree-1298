import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Modal,
  Form,
  Input,
  TimePicker,
  Select,
  List,
  message,
  Tooltip,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import dayjs from 'dayjs';
import type { ScheduleItem, Playlist } from '@/types';

export default function Schedule() {
  const {
    schedules,
    playlists,
    exhibitions,
    devices,
    toggleSchedule,
    syncPlaylist,
    contents,
    addSchedule,
    updateSchedule,
    deleteSchedule,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'schedule' | 'playlist'>('schedule');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [form] = Form.useForm();

  const repeatNames: Record<string, string> = {
    once: '单次',
    daily: '每天',
    weekly: '每周',
    workday: '工作日',
  };

  const statusColors: Record<string, string> = {
    scheduled: 'default',
    running: 'success',
    completed: 'blue',
    paused: 'warning',
  };

  const statusNames: Record<string, string> = {
    scheduled: '待执行',
    running: '运行中',
    completed: '已完成',
    paused: '已暂停',
  };

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      startTime: dayjs('09:00', 'HH:mm'),
      endTime: dayjs('17:00', 'HH:mm'),
      repeat: 'workday',
      exhibitionId: exhibitions[0]?.id,
      deviceIds: [],
      contentIds: [],
    });
    setModalVisible(true);
  };

  const handleEditSchedule = (record: ScheduleItem) => {
    setSelectedSchedule(record);
    form.setFieldsValue({
      name: record.name,
      startTime: dayjs(record.startTime, 'HH:mm'),
      endTime: dayjs(record.endTime, 'HH:mm'),
      repeat: record.repeat,
      exhibitionId: record.exhibitionId,
      deviceIds: record.deviceIds,
      contentIds: record.contentIds,
    });
    setModalVisible(true);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    deleteSchedule(scheduleId);
    message.success('排期已删除');
  };

  const handleSyncPlaylist = (playlistId: string) => {
    syncPlaylist(playlistId);
    message.success('播放列表已同步到设备');
  };

  const handleSaveSchedule = async () => {
    try {
      const values = await form.validateFields();
      const scheduleData = {
        name: values.name,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        repeat: values.repeat,
        exhibitionId: values.exhibitionId,
        deviceIds: values.deviceIds || [],
        contentIds: values.contentIds || [],
        status: selectedSchedule ? selectedSchedule.status : 'scheduled',
      };

      if (selectedSchedule) {
        updateSchedule(selectedSchedule.id, scheduleData);
        message.success('排期已更新');
      } else {
        addSchedule(scheduleData);
        message.success('排期已创建');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const scheduleColumns = [
    {
      title: '排期名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '关联展览',
      dataIndex: 'exhibitionId',
      key: 'exhibitionId',
      render: (id: string) => {
        const exh = exhibitions.find((e) => e.id === id);
        return exh?.name || '-';
      },
    },
    {
      title: '播放时间',
      key: 'time',
      render: (_: unknown, record: ScheduleItem) => (
        <Space>
          <ClockCircleOutlined />
          {record.startTime} - {record.endTime}
        </Space>
      ),
    },
    {
      title: '重复周期',
      dataIndex: 'repeat',
      key: 'repeat',
      render: (r: string) => <Tag>{repeatNames[r]}</Tag>,
    },
    {
      title: '设备数',
      key: 'deviceCount',
      render: (_: unknown, record: ScheduleItem) => <span>{record.deviceIds.length} 台</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusColors[s]} icon={s === 'running' ? <PlayCircleOutlined /> : undefined}>
          {statusNames[s]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: ScheduleItem) => (
        <Space size="small">
          <Switch
            size="small"
            checked={record.status === 'running'}
            onChange={() => toggleSchedule(record.id)}
            checkedChildren="运行"
            unCheckedChildren="暂停"
            disabled={record.status === 'completed'}
          />
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditSchedule(record)} />
          </Tooltip>
          <Tooltip title="同步到设备">
            <Button size="small" icon={<SyncOutlined />} onClick={() => handleSyncPlaylist(record.id)} />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个排期吗？"
            onConfirm={() => handleDeleteSchedule(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <Card
        tabList={[
          { key: 'schedule', tab: '定时排期' },
          { key: 'playlist', tab: '播放列表' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as 'schedule' | 'playlist')}
        extra={
          activeTab === 'schedule' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSchedule}>
              新建排期
            </Button>
          ) : (
            <Button icon={<SyncOutlined />} onClick={() => message.success('所有播放列表已同步')}>
              全部同步
            </Button>
          )
        }
      >
        {activeTab === 'schedule' && (
          <Table
            dataSource={schedules}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            columns={scheduleColumns}
            scroll={{ x: 900 }}
          />
        )}

        {activeTab === 'playlist' && (
          <Row gutter={[16, 16]}>
            {playlists.map((pl) => (
              <Col span={12} key={pl.id}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <AppstoreOutlined />
                      {pl.name}
                      {pl.isPlaying && <Tag color="green">播放中</Tag>}
                    </Space>
                  }
                  extra={
                    <Space size="small">
                      <Button size="small" icon={<SyncOutlined />} onClick={() => handleSyncPlaylist(pl.id)}>
                        同步
                      </Button>
                      <Button size="small" type="primary" onClick={() => {
                        setSelectedPlaylist(pl);
                        setPlaylistModalVisible(true);
                      }}>
                        详情
                      </Button>
                    </Space>
                  }
                >
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
                    关联设备: {pl.deviceIds.length} 台
                  </div>
                  <List
                    size="small"
                    dataSource={pl.items}
                    renderItem={(item, index) => {
                      const content = contents.find((c) => c.id === item.contentId);
                      return (
                        <List.Item>
                          <Space>
                            <Tag>{index + 1}</Tag>
                            <span>{content?.name}</span>
                            <span style={{ color: '#999' }}>
                              {Math.floor(item.duration / 60)}分{item.duration % 60}秒
                            </span>
                          </Space>
                          {index === pl.currentIndex && pl.isPlaying && (
                            <Tag color="green">当前播放</Tag>
                          )}
                        </List.Item>
                      );
                    }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title={selectedSchedule ? '编辑排期' : '新建排期'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSaveSchedule}
        okText="保存"
        cancelText="取消"
        width={600}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="排期名称"
            name="name"
            rules={[{ required: true, message: '请输入排期名称' }]}
          >
            <Input placeholder="请输入排期名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="开始时间"
                name="startTime"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束时间"
                name="endTime"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="重复周期"
            name="repeat"
            rules={[{ required: true, message: '请选择重复周期' }]}
          >
            <Select
              options={[
                { value: 'once', label: '单次' },
                { value: 'daily', label: '每天' },
                { value: 'weekly', label: '每周' },
                { value: 'workday', label: '工作日' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="关联展览"
            name="exhibitionId"
            rules={[{ required: true, message: '请选择关联展览' }]}
          >
            <Select
              options={exhibitions.map((e) => ({ value: e.id, label: e.name }))}
            />
          </Form.Item>
          <Form.Item
            label="播放设备"
            name="deviceIds"
            rules={[{ required: true, message: '请至少选择一台播放设备' }]}
          >
            <Select
              mode="multiple"
              options={devices.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="请选择播放设备"
            />
          </Form.Item>
          <Form.Item label="播放内容" name="contentIds">
            <Select
              mode="multiple"
              options={contents.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="请选择播放内容（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="播放列表详情"
        open={playlistModalVisible}
        onCancel={() => setPlaylistModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedPlaylist && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{selectedPlaylist.name}</div>
              <div style={{ color: '#666' }}>
                共 {selectedPlaylist.items.length} 个节目，
                关联 {selectedPlaylist.deviceIds.length} 台设备
              </div>
            </div>
            <List
              dataSource={selectedPlaylist.items}
              renderItem={(item, index) => {
                const content = contents.find((c) => c.id === item.contentId);
                return (
                  <List.Item key={item.contentId}>
                    <List.Item.Meta
                      avatar={<Tag color="blue">{index + 1}</Tag>}
                      title={content?.name}
                      description={`时长: ${Math.floor(item.duration / 60)}分${item.duration % 60}秒 · ${content?.type}`}
                    />
                    {index === selectedPlaylist.currentIndex && selectedPlaylist.isPlaying && (
                      <Tag color="green">当前播放</Tag>
                    )}
                  </List.Item>
                );
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
