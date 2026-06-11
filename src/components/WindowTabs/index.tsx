import { Tabs } from 'antd';
import { useWindowStore } from '@/store/windowStore';
import {
  AppstoreOutlined,
  ScheduleOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  WarningOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';

const iconMap: Record<string, React.ReactNode> = {
  AppstoreOutlined: <AppstoreOutlined />,
  ScheduleOutlined: <ScheduleOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  FolderOpenOutlined: <FolderOpenOutlined />,
  WarningOutlined: <WarningOutlined />,
  CheckSquareOutlined: <CheckSquareOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

export default function WindowTabs() {
  const { windows, activeWindow, setActiveWindow, closeWindow } = useWindowStore();

  const items: TabsProps['items'] = windows.map((w) => ({
    key: w.id,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {iconMap[w.icon]}
        {w.title}
      </span>
    ),
    closable: w.closable,
    closeIcon: w.closable ? <CloseOutlined style={{ fontSize: 12 }} /> : null,
  }));

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        padding: '0 16px',
      }}
    >
      <Tabs
        activeKey={activeWindow || ''}
        onChange={(key) => setActiveWindow(key)}
        onEdit={(targetKey, action) => {
          if (action === 'remove' && typeof targetKey === 'string') {
            closeWindow(targetKey);
          }
        }}
        type="editable-card"
        hideAdd
        items={items}
        size="small"
        style={{ marginBottom: 0 }}
      />
    </div>
  );
}
