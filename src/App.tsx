import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import WindowTabs from './components/WindowTabs';
import WindowContent from './components/WindowContent';

function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <HeaderBar />
        <WindowTabs />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <WindowContent />
        </div>
      </div>
    </div>
  );
}

export default App;
