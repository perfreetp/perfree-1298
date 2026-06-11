import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Alert,
  List,
  Tag,
  Divider,
  Statistic,
} from 'antd';
import {
  WarningOutlined,
  ThunderboltOutlined,
  SoundOutlined,
  PoweroffOutlined,
  ExclamationCircleFilled,
  SafetyOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';

export default function EmergencyControl() {
  const { emergencyMode, toggleEmergencyMode, devices, deviceGroups, broadcastEmergency, toggleGroupPower } = useAppStore();
  const [broadcastVisible, setBroadcastVisible] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; title: string; onOk: () => void } | null>(null);

  const onlineScreens = devices.filter((d) => (d.type === 'screen' || d.type === 'projector') && d.status === 'online').length;
  const onlineAudio = devices.filter((d) => d.type === 'audio' && d.status === 'online').length;

  const handleEmergencyToggle = () => {
    if (!emergencyMode) {
      setConfirmAction({
        type: 'emergency',
        title: '启动应急模式',
        onOk: () => {
          toggleEmergencyMode();
          message.warning('应急模式已启动，所有显示设备已关闭');
          setConfirmModalVisible(false);
        },
      });
      setConfirmModalVisible(true);
    } else {
      toggleEmergencyMode();
      message.success('应急模式已解除');
    }
  };

  const handleAllPower = (power: boolean) => {
    setConfirmAction({
      type: power ? 'power-on' : 'power-off',
      title: power ? '一键开启所有设备' : '一键关闭所有设备',
      onOk: () => {
        deviceGroups.forEach((g) => toggleGroupPower(g.id, power));
        message.success(`已${power ? '开启' : '关闭'}所有设备`);
        setConfirmModalVisible(false);
      },
    });
    setConfirmModalVisible(true);
  };

  const handleBroadcast = () => {
    if (broadcastText.trim()) {
      broadcastEmergency(broadcastText);
      message.success('应急广播已发送');
      setBroadcastVisible(false);
      setBroadcastText('');
    }
  };

  const emergencyContacts = [
    { name: '值班主管', phone: '138****1234', role: '现场指挥' },
    { name: '技术保障', phone: '139****5678', role: '设备维修' },
    { name: '安保队长', phone: '137****9012', role: '人员疏散' },
    { name: '消防值班', phone: '119', role: '火警处置' },
  ];

  const emergencyProcedures = [
    { step: 1, title: '确认情况', desc: '确认紧急事件类型和影响范围' },
    { step: 2, title: '启动应急模式', desc: '按下应急按钮，关闭非必要设备' },
    { step: 3, title: '发布广播', desc: '通过全馆音响发布应急通知' },
    { step: 4, title: '人员疏散', desc: '引导参观者安全撤离' },
    { step: 5, title: '上报上级', desc: '及时向主管部门汇报情况' },
  ];

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      {emergencyMode && (
        <Alert
          message="应急模式已启动"
          description="所有显示设备已关闭，音响系统保持待机以便发布广播。请确认现场安全后再解除应急模式。"
          type="error"
          showIcon
          icon={<ExclamationCircleFilled />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" danger onClick={toggleEmergencyMode}>
              解除应急
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined />
                应急控制
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card
                  hoverable
                  style={{
                    textAlign: 'center',
                    background: emergencyMode ? '#fff1f0' : '#fff',
                    borderColor: emergencyMode ? '#ff4d4f' : '#d9d9d9',
                    borderWidth: 2,
                  }}
                  onClick={handleEmergencyToggle}
                >
                  <div
                    style={{
                      fontSize: 48,
                      color: emergencyMode ? '#ff4d4f' : '#ff4d4f',
                      marginBottom: 8,
                    }}
                  >
                    <ExclamationCircleFilled />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: emergencyMode ? '#ff4d4f' : '#333' }}>
                    {emergencyMode ? '解除应急模式' : '启动应急模式'}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    关闭所有显示设备，保留广播
                  </div>
                </Card>
              </Col>

              <Col span={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => setBroadcastVisible(true)}
                >
                  <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }}>
                    <SoundOutlined />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>应急广播</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    全馆语音通知
                  </div>
                </Card>
              </Col>

              <Col span={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => handleAllPower(true)}
                >
                  <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 8 }}>
                    <PoweroffOutlined />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>一键全开</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    开启所有设备
                  </div>
                </Card>
              </Col>

              <Col span={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  onClick={() => handleAllPower(false)}
                >
                  <div style={{ fontSize: 48, color: '#faad14', marginBottom: 8 }}>
                    <PoweroffOutlined />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>一键全关</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    关闭所有设备
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <Space>
                <PhoneOutlined />
                应急联系人
              </Space>
            }
            size="small"
          >
            <List
              dataSource={emergencyContacts}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={item.name}
                    description={item.role}
                  />
                  <Tag color="blue">{item.phone}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                应急处置流程
              </Space>
            }
            size="small"
          >
            <List
              dataSource={emergencyProcedures}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#1890ff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}
                      >
                        {item.step}
                      </div>
                    }
                    title={item.title}
                    description={item.desc}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                分区快速控制
              </Space>
            }
            size="small"
          >
            <Row gutter={[16, 16]}>
              {deviceGroups.map((group) => {
                const groupDevices = devices.filter((d) => d.groupId === group.id);
                const onlineCount = groupDevices.filter((d) => d.status === 'online').length;
                return (
                  <Col span={6} key={group.id}>
                    <Card size="small" title={group.name} extra={`${onlineCount}/${groupDevices.length}在线`}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Button
                          type="primary"
                          size="small"
                          block
                          icon={<PoweroffOutlined />}
                          onClick={() => toggleGroupPower(group.id, true)}
                        >
                          开启
                        </Button>
                        <Button
                          size="small"
                          block
                          danger
                          icon={<PoweroffOutlined />}
                          onClick={() => toggleGroupPower(group.id, false)}
                        >
                          关闭
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        title="应急广播"
        open={broadcastVisible}
        onCancel={() => setBroadcastVisible(false)}
        onOk={handleBroadcast}
        okText="发送广播"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <Alert
          message="广播将发送到所有在线音响设备"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form layout="vertical">
          <Form.Item label="广播内容" required>
            <Input.TextArea
              rows={4}
              placeholder="请输入广播内容..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              maxLength={200}
              showCount
            />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            常用语：
            <Space wrap style={{ marginLeft: 8 }}>
              <Tag style={{ cursor: 'pointer' }} onClick={() => setBroadcastText('请各位参观者保持冷静，从最近的安全出口有序撤离。')}>
                疏散通知
              </Tag>
              <Tag style={{ cursor: 'pointer' }} onClick={() => setBroadcastText('展厅即将闭馆，请您有序离场，感谢您的参观。')}>
                闭馆通知
              </Tag>
              <Tag style={{ cursor: 'pointer' }} onClick={() => setBroadcastText('因设备维护，部分展项暂停开放，敬请谅解。')}>
                维护通知
              </Tag>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title={confirmAction?.title}
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={() => confirmAction?.onOk()}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        {confirmAction?.type === 'emergency' && (
          <Alert
            message="确认启动应急模式？"
            description="启动后将关闭所有显示设备，仅保留音响系统用于广播。此操作可能影响正在进行的展览。"
            type="warning"
            showIcon
          />
        )}
        {confirmAction?.type === 'power-off' && (
          <Alert
            message="确认关闭所有设备？"
            description="将关闭所有展厅设备，包括大屏、投影、互动屏和音响。"
            type="warning"
            showIcon
          />
        )}
        {confirmAction?.type === 'power-on' && (
          <Alert
            message="确认开启所有设备？"
            description="将开启所有展厅设备，可能需要几分钟时间全部启动。"
            type="info"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
}
