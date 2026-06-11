import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Switch,
  Slider,
  Modal,
  List,
  Badge,
  Tooltip,
  Divider,
  Select,
} from 'antd';
import {
  PoweroffOutlined,
  SoundOutlined,
  BulbOutlined,
  MonitorOutlined,
  VideoCameraOutlined,
  InteractionOutlined,
  AudioOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { Device, DeviceGroup, DeviceType } from '@/types';

const deviceTypeIcons: Record<DeviceType, React.ReactNode> = {
  screen: <MonitorOutlined />,
  projector: <VideoCameraOutlined />,
  interactive: <InteractionOutlined />,
  audio: <AudioOutlined />,
};

const deviceTypeNames: Record<DeviceType, string> = {
  screen: '大屏',
  projector: '投影',
  interactive: '互动屏',
  audio: '音响',
};

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

export default function ExhibitionList() {
  const {
    devices,
    deviceGroups,
    exhibitions,
    currentExhibition,
    toggleDevicePower,
    setDeviceVolume,
    setDeviceBrightness,
    toggleGroupPower,
    switchExhibition,
  } = useAppStore();

  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [controlModalVisible, setControlModalVisible] = useState(false);
  const [switchModalVisible, setSwitchModalVisible] = useState(false);

  const filteredDevices =
    selectedGroup === 'all'
      ? devices
      : devices.filter((d) => d.groupId === selectedGroup);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setControlModalVisible(true);
  };

  const currentExhibitionData = exhibitions.find((e) => e.id === currentExhibition);

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="当前展览"
            extra={
              <Button type="primary" size="small" onClick={() => setSwitchModalVisible(true)}>
                一键切换展览
              </Button>
            }
          >
            <Space size="large">
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                  {currentExhibitionData?.name}
                </div>
                <div style={{ color: '#666', fontSize: 13 }}>
                  {currentExhibitionData?.description}
                </div>
              </div>
              <Tag color="green">运行中</Tag>
              <div style={{ color: '#999', fontSize: 12 }}>
                关联设备: {currentExhibitionData?.deviceIds.length} 台
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="设备分组"
            extra={
              <Space>
                <Button size="small" icon={<PoweroffOutlined />} onClick={() => toggleGroupPower(selectedGroup === 'all' ? deviceGroups[0].id : selectedGroup, true)}>
                  一键开启
                </Button>
                <Button size="small" danger icon={<PoweroffOutlined />} onClick={() => toggleGroupPower(selectedGroup === 'all' ? deviceGroups[0].id : selectedGroup, false)}>
                  一键关闭
                </Button>
              </Space>
            }
          >
            <Space wrap size={[8, 8]} style={{ marginBottom: 16 }}>
              <Tag
                color={selectedGroup === 'all' ? 'blue' : 'default'}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => setSelectedGroup('all')}
              >
                全部设备
              </Tag>
              {deviceGroups.map((group) => (
                <Tag
                  key={group.id}
                  color={selectedGroup === group.id ? 'blue' : 'default'}
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  {group.name}
                </Tag>
              ))}
            </Space>

            <Row gutter={[16, 16]}>
              {filteredDevices.map((device) => (
                <Col xs={24} sm={12} md={8} lg={6} xl={6} key={device.id}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => handleDeviceClick(device)}
                    style={{ cursor: 'pointer' }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Space>
                        <span style={{ fontSize: 20 }}>{deviceTypeIcons[device.type]}</span>
                        <span style={{ fontWeight: 500 }}>{device.name}</span>
                      </Space>
                      <Badge status={statusColors[device.status] as any} text={statusNames[device.status]} />
                    </div>
                    <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                      {device.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Tag color="blue" style={{ margin: 0 }}>
                        {deviceTypeNames[device.type]}
                      </Tag>
                      <Switch
                        size="small"
                        checked={device.power}
                        disabled={device.status === 'fault' || device.status === 'offline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDevicePower(device.id);
                        }}
                      />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            {selectedDevice && deviceTypeIcons[selectedDevice.type]}
            {selectedDevice?.name} - 设备控制
          </Space>
        }
        open={controlModalVisible}
        onCancel={() => setControlModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedDevice && (
          <div>
            <Space style={{ marginBottom: 16 }} direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <div style={{ marginBottom: 8, color: '#666' }}>设备状态</div>
                <Space>
                  <Badge status={statusColors[selectedDevice.status] as any} text={statusNames[selectedDevice.status]} />
                  {selectedDevice.power ? (
                    <Tag color="green">电源开启</Tag>
                  ) : (
                    <Tag color="default">电源关闭</Tag>
                  )}
                  <Tag>{selectedDevice.ip}</Tag>
                </Space>
              </div>

              {selectedDevice.status === 'fault' && (
                <Alert
                  message="设备故障"
                  description={selectedDevice.faultMessage}
                  type="error"
                  showIcon
                />
              )}

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span><PoweroffOutlined /> 电源控制</span>
                  <Switch
                    checked={selectedDevice.power}
                    disabled={selectedDevice.status === 'fault' || selectedDevice.status === 'offline'}
                    onChange={() => toggleDevicePower(selectedDevice.id)}
                  />
                </div>
              </div>

              {selectedDevice.volume !== undefined && (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <SoundOutlined /> 音量: {selectedDevice.volume}%
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={selectedDevice.volume}
                    disabled={!selectedDevice.power}
                    onChange={(value) => setDeviceVolume(selectedDevice.id, value)}
                  />
                </div>
              )}

              {selectedDevice.brightness !== undefined && (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <BulbOutlined /> 亮度: {selectedDevice.brightness}%
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={selectedDevice.brightness}
                    disabled={!selectedDevice.power}
                    onChange={(value) => setDeviceBrightness(selectedDevice.id, value)}
                  />
                </div>
              )}

              <Divider style={{ margin: '12px 0' }} />

              <Space wrap>
                <Tooltip title="重新启动">
                  <Button icon={<ReloadOutlined />} size="small">重启</Button>
                </Tooltip>
                <Tooltip title="高级设置">
                  <Button icon={<SettingOutlined />} size="small">设置</Button>
                </Tooltip>
                <Tooltip title="远程桌面">
                  <Button icon={<MonitorOutlined />} size="small">远程</Button>
                </Tooltip>
              </Space>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="一键切换展览"
        open={switchModalVisible}
        onCancel={() => setSwitchModalVisible(false)}
        footer={null}
        width={700}
      >
        <Row gutter={[16, 16]}>
          {exhibitions.map((exh) => (
            <Col span={12} key={exh.id}>
              <Card
                hoverable
                onClick={() => {
                  switchExhibition(exh.id);
                  setSwitchModalVisible(false);
                }}
                style={{
                  borderColor: currentExhibition === exh.id ? '#1890ff' : '#d9d9d9',
                  borderWidth: currentExhibition === exh.id ? 2 : 1,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <img
                    src={exh.thumbnail}
                    alt={exh.name}
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 }}
                  />
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{exh.name}</div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                  {exh.deviceIds.length} 台设备 · {exh.contentIds.length} 个内容
                </div>
                <Tag color={exh.status === 'active' ? 'green' : 'default'}>
                  {exh.status === 'active' ? '已启用' : '未启用'}
                </Tag>
                {currentExhibition === exh.id && (
                  <Tag color="blue">当前</Tag>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  );
}
