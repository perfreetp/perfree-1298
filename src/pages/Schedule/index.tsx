import { useState, useMemo } from 'react';
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
  DatePicker,
  Alert,
  Badge,
  Radio,
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
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import dayjs from 'dayjs';
import type { ScheduleItem, Playlist } from '@/types';

const { RangePicker } = DatePicker;

const weekdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
];

const repeatNames: Record<string, string> = {
  once: '单次',
  daily: '每天',
  weekly: '每周',
  workday: '工作日',
};

export default function Schedule() {
  const {
    schedules,
    playlists,
    exhibitions,
    devices,
    deviceGroups,
    toggleSchedule,
    syncPlaylist,
    syncSchedule,
    contents,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    checkScheduleConflict,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'schedule' | 'playlist'>('schedule');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string>('');
  const [form] = Form.useForm();
  const formRepeat = Form.useWatch('repeat', form);

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

  const isScheduleActiveOnDate = (schedule: ScheduleItem, date: dayjs.Dayjs) => {
    const weekday = date.day();
    const dateStr = date.format('YYYY-MM-DD');

    if (schedule.validFrom && dayjs(schedule.validFrom).isAfter(date, 'day')) {
      return false;
    }
    if (schedule.validTo && dayjs(schedule.validTo).isBefore(date, 'day')) {
      return false;
    }

    switch (schedule.repeat) {
      case 'daily':
        return true;
      case 'workday':
        return weekday >= 1 && weekday <= 5;
      case 'weekly':
        return schedule.weekday !== undefined && schedule.weekday === weekday;
      case 'once':
        return schedule.date === dateStr;
      default:
        return true;
    }
  };

  const filteredSchedules = useMemo(() => {
    let result = [...schedules];
    result = result.filter((s) => isScheduleActiveOnDate(s, selectedDate));
    if (selectedGroupId !== 'all') {
      const group = deviceGroups.find((g) => g.id === selectedGroupId);
      if (group) {
        result = result.filter((s) =>
          s.deviceIds.some((id) => group.deviceIds.includes(id))
        );
      }
    }
    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, selectedDate, selectedGroupId, deviceGroups]);

  const timelineData = useMemo(() => {
    const hours = [];
    for (let h = 6; h <= 22; h++) {
      hours.push(h);
    }
    return hours;
  }, []);

  const getSchedulePosition = (schedule: ScheduleItem) => {
    const startHour = parseInt(schedule.startTime.split(':')[0]);
    const startMin = parseInt(schedule.startTime.split(':')[1]);
    const endHour = parseInt(schedule.endTime.split(':')[0]);
    const endMin = parseInt(schedule.endTime.split(':')[1]);

    const startOffset = ((startHour - 6) + startMin / 60) * 60;
    const endOffset = ((endHour - 6) + endMin / 60) * 60;
    const width = endOffset - startOffset;

    return { left: startOffset, width: Math.max(width, 40) };
  };

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setConflictWarning('');
    form.resetFields();
    form.setFieldsValue({
      name: '',
      startTime: dayjs('09:00', 'HH:mm'),
      endTime: dayjs('17:00', 'HH:mm'),
      repeat: 'workday',
      exhibitionId: exhibitions[0]?.id,
      deviceIds: [],
      contentIds: [],
      onceDate: selectedDate,
      weekdays: [selectedDate.day()],
      validRange: [selectedDate, selectedDate.add(90, 'day')],
    });
    setModalVisible(true);
  };

  const handleEditSchedule = (record: ScheduleItem) => {
    setSelectedSchedule(record);
    setConflictWarning('');

    const formValues: any = {
      name: record.name,
      startTime: dayjs(record.startTime, 'HH:mm'),
      endTime: dayjs(record.endTime, 'HH:mm'),
      repeat: record.repeat,
      exhibitionId: record.exhibitionId,
      deviceIds: record.deviceIds,
      contentIds: record.contentIds,
    };

    if (record.repeat === 'once' && record.date) {
      formValues.onceDate = dayjs(record.date);
    } else {
      formValues.onceDate = selectedDate;
    }
    if (record.repeat === 'weekly' && record.weekday !== undefined) {
      formValues.weekdays = [record.weekday];
    } else {
      formValues.weekdays = [selectedDate.day()];
    }
    if (record.validFrom && record.validTo) {
      formValues.validRange = [dayjs(record.validFrom), dayjs(record.validTo)];
    } else {
      formValues.validRange = [selectedDate, selectedDate.add(90, 'day')];
    }

    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    deleteSchedule(scheduleId);
    message.success('排期已删除');
  };

  const handleSyncSchedule = (scheduleId: string) => {
    syncSchedule(scheduleId);
    message.success('排期已同步到设备');
  };

  const handleSyncPlaylist = (playlistId: string) => {
    syncPlaylist(playlistId);
    message.success('播放列表已同步到设备');
  };

  const checkConflict = () => {
    const startTime = form.getFieldValue('startTime');
    const endTime = form.getFieldValue('endTime');
    const deviceIds = form.getFieldValue('deviceIds') || [];

    if (!startTime || !endTime || deviceIds.length === 0) {
      setConflictWarning('');
      return;
    }

    const result = checkScheduleConflict(
      deviceIds,
      startTime.format('HH:mm'),
      endTime.format('HH:mm'),
      selectedSchedule?.id
    );

    if (result.conflict) {
      const conflictNames = result.conflictingSchedules.map((s) => s.name).join('、');
      setConflictWarning(`时间冲突！与排期 "${conflictNames}" 的设备播放时间重叠`);
    } else {
      setConflictWarning('');
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const values = await form.validateFields();
      const startTime = values.startTime.format('HH:mm');
      const endTime = values.endTime.format('HH:mm');

      const conflictResult = checkScheduleConflict(
        values.deviceIds || [],
        startTime,
        endTime,
        selectedSchedule?.id
      );

      if (conflictResult.conflict) {
        Modal.confirm({
          title: '时间冲突提醒',
          content: `当前选择的设备与已有排期存在时间重叠，是否仍要保存？`,
          okText: '继续保存',
          cancelText: '取消',
          onOk: () => {
            doSaveSchedule(values, startTime, endTime);
          },
        });
        return;
      }

      doSaveSchedule(values, startTime, endTime);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const doSaveSchedule = (values: any, startTime: string, endTime: string) => {
    const scheduleData: any = {
      name: values.name,
      startTime,
      endTime,
      repeat: values.repeat,
      exhibitionId: values.exhibitionId,
      deviceIds: values.deviceIds || [],
      contentIds: values.contentIds || [],
      status: selectedSchedule ? selectedSchedule.status : 'scheduled',
    };

    if (values.repeat === 'once') {
      scheduleData.date = values.onceDate ? values.onceDate.format('YYYY-MM-DD') : selectedDate.format('YYYY-MM-DD');
      scheduleData.weekday = undefined;
    } else if (values.repeat === 'weekly') {
      scheduleData.weekday = values.weekdays && values.weekdays[0] !== undefined ? values.weekdays[0] : selectedDate.day();
      scheduleData.date = undefined;
    } else {
      scheduleData.date = undefined;
      scheduleData.weekday = undefined;
    }

    if (values.validRange && values.validRange.length === 2) {
      scheduleData.validFrom = values.validRange[0].format('YYYY-MM-DD');
      scheduleData.validTo = values.validRange[1].format('YYYY-MM-DD');
    }

    if (selectedSchedule) {
      updateSchedule(selectedSchedule.id, scheduleData);
      message.success('排期已更新');
    } else {
      addSchedule(scheduleData);
      message.success('排期已创建');
    }

    setModalVisible(false);
    form.resetFields();
    setConflictWarning('');
  };

  const getScheduleDisplayInfo = (record: ScheduleItem) => {
    const parts: string[] = [];
    if (record.repeat === 'once' && record.date) {
      parts.push(record.date);
    } else if (record.repeat === 'weekly' && record.weekday !== undefined) {
      const wd = weekdayOptions.find((w) => w.value === record.weekday);
      if (wd) parts.push('每' + wd.label);
    }
    if (record.validFrom && record.validTo) {
      parts.push(`有效期: ${record.validFrom} ~ ${record.validTo}`);
    } else if (record.validFrom) {
      parts.push(`从 ${record.validFrom} 起`);
    } else if (record.validTo) {
      parts.push(`到 ${record.validTo} 止`);
    }
    return parts.join('  ·  ');
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
        <div>
          <Space size="small">
            <ClockCircleOutlined style={{ color: '#888' }} />
            <span>{record.startTime} - {record.endTime}</span>
            <Tag>{repeatNames[record.repeat]}</Tag>
          </Space>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {getScheduleDisplayInfo(record)}
          </div>
        </div>
      ),
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
      width: 280,
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
            <Button size="small" icon={<SyncOutlined />} onClick={() => handleSyncSchedule(record.id)} />
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

  const renderTimelineView = () => (
    <div>
      <div
        style={{
          position: 'relative',
          height: 400,
          border: '1px solid #e8e8e8',
          borderRadius: 4,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        <div style={{ display: 'flex', position: 'relative', minWidth: 960, height: '100%' }}>
          {timelineData.map((hour) => (
            <div
              key={hour}
              style={{
                width: 60,
                flexShrink: 0,
                borderRight: '1px solid #f0f0f0',
                textAlign: 'center',
                paddingTop: 8,
                color: '#999',
                fontSize: 12,
              }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 40, left: 0, right: 0, bottom: 0 }}>
          {filteredSchedules.map((schedule, idx) => {
            const pos = getSchedulePosition(schedule);
            const exhibition = exhibitions.find((e) => e.id === schedule.exhibitionId);
            return (
              <div
                key={schedule.id}
                style={{
                  position: 'absolute',
                  top: idx * 36 + 8,
                  left: pos.left,
                  width: pos.width,
                  height: 28,
                  background:
                    schedule.status === 'running'
                      ? '#52c41a'
                      : schedule.status === 'paused'
                      ? '#faad14'
                      : '#1890ff',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 12,
                  padding: '4px 8px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  opacity: schedule.status === 'completed' ? 0.5 : 1,
                }}
                onClick={() => handleEditSchedule(schedule)}
                title={`${schedule.name} - ${exhibition?.name || ''}`}
              >
                <Badge
                  status={schedule.status === 'running' ? 'success' : schedule.status === 'paused' ? 'warning' : 'default'}
                  text={schedule.name}
                  style={{ color: '#fff' }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
        提示：点击时间轴上的排期条可快速编辑
      </div>
    </div>
  );

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
            <Space>
              <Select
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: '全部展区' },
                  ...deviceGroups.map((g) => ({ value: g.id, label: g.name })),
                ]}
              />
              <Button.Group>
                <Button
                  icon={<UnorderedListOutlined />}
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  列表
                </Button>
                <Button
                  icon={<CalendarOutlined />}
                  type={viewMode === 'timeline' ? 'primary' : 'default'}
                  onClick={() => setViewMode('timeline')}
                >
                  时间轴
                </Button>
              </Button.Group>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSchedule}>
                新建排期
              </Button>
            </Space>
          ) : (
            <Button icon={<SyncOutlined />} onClick={() => message.success('所有播放列表已同步')}>
              全部同步
            </Button>
          )
        }
      >
        {activeTab === 'schedule' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <DatePicker value={selectedDate} onChange={setSelectedDate} style={{ width: 180 }} />
              <span style={{ color: '#666' }}>
                共 {filteredSchedules.length} 条排期
                {filteredSchedules.length === 0 && selectedDate && (
                  <Tag color="default" style={{ marginLeft: 8 }}>
                    {selectedDate.format('YYYY-MM-DD')} 无安排
                  </Tag>
                )}
              </span>
            </div>
            {viewMode === 'list' && (
              <Table
                dataSource={filteredSchedules}
                rowKey="id"
                pagination={{ pageSize: 8 }}
                columns={scheduleColumns}
                scroll={{ x: 900 }}
                locale={{ emptyText: selectedDate ? `${selectedDate.format('YYYY-MM-DD')} 暂无排期安排` : '暂无数据' }}
              />
            )}
            {viewMode === 'timeline' && renderTimelineView()}
          </div>
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
          setConflictWarning('');
        }}
        onOk={handleSaveSchedule}
        okText="保存"
        cancelText="取消"
        width={680}
        maskClosable={false}
      >
        {conflictWarning && (
          <Alert
            message="时间冲突"
            description={conflictWarning}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
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
                <TimePicker style={{ width: '100%' }} format="HH:mm" onChange={checkConflict} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束时间"
                name="endTime"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" onChange={checkConflict} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              {formRepeat === 'once' && (
                <Form.Item
                  label="单次日期"
                  name="onceDate"
                  rules={[{ required: true, message: '请选择日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              )}
              {formRepeat === 'weekly' && (
                <Form.Item
                  label="每周几"
                  name="weekdays"
                  rules={[{ required: true, message: '请选择周几' }]}
                >
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    options={weekdayOptions}
                  />
                </Form.Item>
              )}
            </Col>
          </Row>
          <Form.Item
            label="有效期范围"
            name="validRange"
            rules={[{ required: true, message: '请选择有效期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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
              onChange={checkConflict}
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
