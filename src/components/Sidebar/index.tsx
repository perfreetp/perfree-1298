import { Menu } from 'antd';
import {
  AppstoreOutlined,
  ScheduleOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  WarningOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useWindowStore } from '@/store/windowStore';
import type { MenuProps } from 'antd';

const menuItems: MenuProps['items'] = [
  { key: 'exhibition', icon: <AppstoreOutlined />, label: '展项列表' },
  { key: 'schedule', icon: <ScheduleOutlined />, label: '播放排期' },
  { key: 'device', icon: <DashboardOutlined />, label: '设备状态' },
  { key: 'content', icon: <FolderOpenOutlined />, label: '内容库' },
  { key: 'emergency', icon: <WarningOutlined />, label: '应急控制' },
  { key: 'patrol', icon: <CheckSquareOutlined />, label: '巡检记录' },
  { key: 'report', icon: <BarChartOutlined />, label: '报表中心' },
];

const componentMap: Record<string, string> = {
  exhibition: 'ExhibitionList',
  schedule: 'Schedule',
  device: 'DeviceStatus',
  content: 'ContentLibrary',
  emergency: 'EmergencyControl',
  patrol: 'PatrolRecord',
  report: 'ReportCenter',
};

const titleMap: Record<string, string> = {
  exhibition: '展项列表',
  schedule: '播放排期',
  device: '设备状态',
  content: '内容库',
  emergency: '应急控制',
  patrol: '巡检记录',
  report: '报表中心',
};

const iconMap: Record<string, string> = {
  exhibition: 'AppstoreOutlined',
  schedule: 'ScheduleOutlined',
  device: 'DashboardOutlined',
  content: 'FolderOpenOutlined',
  emergency: 'WarningOutlined',
  patrol: 'CheckSquareOutlined',
  report: 'BarChartOutlined',
};

export default function Sidebar() {
  const { openWindow, activeWindow } = useWindowStore();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    openWindow({
      id: key,
      title: titleMap[key],
      icon: iconMap[key],
      component: componentMap[key],
      closable: key !== 'exhibition',
    });
  };

  return (
    <div style={{ width: 220, background: '#001529', height: '100%' }}>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid #1f2f4d',
        }}
      >
        数字展厅中控
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={activeWindow ? [activeWindow] : []}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </div>
  );
}
