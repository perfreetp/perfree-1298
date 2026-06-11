import { useWindowStore } from '@/store/windowStore';
import ExhibitionList from '@/pages/ExhibitionList';
import Schedule from '@/pages/Schedule';
import DeviceStatus from '@/pages/DeviceStatus';
import ContentLibrary from '@/pages/ContentLibrary';
import EmergencyControl from '@/pages/EmergencyControl';
import PatrolRecord from '@/pages/PatrolRecord';
import ReportCenter from '@/pages/ReportCenter';

const componentMap: Record<string, React.FC> = {
  ExhibitionList,
  Schedule,
  DeviceStatus,
  ContentLibrary,
  EmergencyControl,
  PatrolRecord,
  ReportCenter,
};

export default function WindowContent() {
  const { activeWindow, windows } = useWindowStore();

  const activeWindowData = windows.find((w) => w.id === activeWindow);
  const Component = activeWindowData ? componentMap[activeWindowData.component] : null;

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: '#f0f2f5' }}>
      {Component ? <Component /> : <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>请选择一个功能模块</div>}
    </div>
  );
}
