import { Badge, Avatar, Dropdown, Space, Tooltip } from 'antd';
import {
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

export default function HeaderBar() {
  const { alarms, energySavingMode, toggleEnergySaving, emergencyMode } = useAppStore();
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unhandledAlarms = alarms.filter((a) => !a.handled);
  const highAlarms = unhandledAlarms.filter((a) => a.level === 'high');

  const userMenu = {
    items: [
      { key: 'profile', label: '个人信息', icon: <UserOutlined /> },
      { key: 'settings', label: '系统设置', icon: <SettingOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录' },
    ],
  };

  return (
    <div
      style={{
        height: 48,
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {emergencyMode && (
          <Badge
            status="error"
            text={
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                <ExclamationCircleFilled /> 应急模式已启动
              </span>
            }
          />
        )}
      </div>

      <Space size={24}>
        <span style={{ color: '#666', fontSize: 14 }}>{currentTime}</span>

        <Tooltip title={energySavingMode ? '关闭节能模式' : '开启节能模式'}>
          <span
            onClick={toggleEnergySaving}
            style={{
              cursor: 'pointer',
              fontSize: 18,
              color: energySavingMode ? '#faad14' : '#999',
            }}
          >
            {energySavingMode ? <BulbFilled /> : <BulbOutlined />}
          </span>
        </Tooltip>

        <Badge count={unhandledAlarms.length} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#666' }} />
        </Badge>

        {highAlarms.length > 0 && (
          <Badge count={highAlarms.length} size="small" color="#ff4d4f">
            <ExclamationCircleFilled
              style={{ fontSize: 18, cursor: 'pointer', color: '#ff4d4f' }}
            />
          </Badge>
        )}

        <Dropdown menu={userMenu} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size={28} icon={<UserOutlined />} />
            <span style={{ color: '#333' }}>值班员</span>
          </Space>
        </Dropdown>
      </Space>
    </div>
  );
}
