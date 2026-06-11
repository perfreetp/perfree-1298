import { create } from 'zustand';

export interface WindowItem {
  id: string;
  title: string;
  icon: string;
  component: string;
  closable: boolean;
}

interface WindowState {
  windows: WindowItem[];
  activeWindow: string | null;
  openWindow: (window: Omit<WindowItem, 'closable'> & { closable?: boolean }) => void;
  closeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
}

export const useWindowStore = create<WindowState>((set, get) => ({
  windows: [
    { id: 'exhibition', title: '展项列表', icon: 'AppstoreOutlined', component: 'ExhibitionList', closable: false },
  ],
  activeWindow: 'exhibition',

  openWindow: (window) => {
    const { windows } = get();
    const existing = windows.find((w) => w.id === window.id);
    if (existing) {
      set({ activeWindow: window.id });
      return;
    }
    set({
      windows: [...windows, { ...window, closable: window.closable ?? true }],
      activeWindow: window.id,
    });
  },

  closeWindow: (id) => {
    const { windows, activeWindow } = get();
    const newWindows = windows.filter((w) => w.id !== id);
    const newActive =
      activeWindow === id
        ? newWindows.length > 0
          ? newWindows[newWindows.length - 1].id
          : null
        : activeWindow;
    set({ windows: newWindows, activeWindow: newActive });
  },

  setActiveWindow: (id) => set({ activeWindow: id }),
}));
