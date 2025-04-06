import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type WatermarkSettings = {
  text: string;
  font: string;
  color: string;
  opacity: number;
  size: number;
  density: number;
};

export type WatermarkPreset = {
  id: number;
  name: string;
  settings: WatermarkSettings;
};

type WatermarkStore = {
  watermarkSettings: WatermarkSettings;
  savedWatermarks: WatermarkPreset[];
  updateSettings: (settings: Partial<WatermarkSettings>) => void;
  addWatermark: (preset: WatermarkPreset) => void;
  deleteWatermark: (id: number) => void;
  updateWatermark: (id: number, updates: Partial<WatermarkPreset>) => void;
};

// 默认水印设置
const defaultWatermarkSettings: WatermarkSettings = {
  text: '小红书内容助手',
  font: 'sans-serif',
  color: '#ff4d6d',
  opacity: 30,
  size: 18,
  density: 3
};

// 默认水印预设
const defaultWatermarks: WatermarkPreset[] = [
  {
    id: 1,
    name: '默认水印',
    settings: { ...defaultWatermarkSettings }
  },
  {
    id: 2,
    name: '简约水印',
    settings: {
      text: '版权所有',
      font: 'serif',
      color: '#000000',
      opacity: 20,
      size: 14,
      density: 2
    }
  }
];

// 创建持久化存储的Zustand store
export const useWatermarkStore = create<WatermarkStore>()(
  persist(
    (set) => ({
      watermarkSettings: { ...defaultWatermarkSettings },
      savedWatermarks: [...defaultWatermarks],
      
      updateSettings: (settings) => {
        set((state) => ({
          watermarkSettings: { ...state.watermarkSettings, ...settings }
        }));
      },
      
      addWatermark: (preset) => {
        set((state) => ({
          savedWatermarks: [...state.savedWatermarks, preset]
        }));
      },
      
      deleteWatermark: (id) => {
        set((state) => ({
          savedWatermarks: state.savedWatermarks.filter(preset => preset.id !== id)
        }));
      },
      
      // 新增：直接更新预设的方法，而不是删除再添加
      updateWatermark: (id, updates) => {
        set((state) => ({
          savedWatermarks: state.savedWatermarks.map(preset => 
            preset.id === id 
              ? { ...preset, ...updates } 
              : preset
          )
        }));
      }
    }),
    {
      name: 'watermark-storage', // localStorage 中的键名
      storage: createJSONStorage(() => localStorage), // 使用 localStorage
      partialize: (state) => ({ 
        watermarkSettings: state.watermarkSettings,
        savedWatermarks: state.savedWatermarks
      }),
      // 合并策略，保留已保存的预设
      merge: (persisted, current) => {
        const persistedState = persisted as WatermarkStore;
        return {
          ...current,
          watermarkSettings: persistedState.watermarkSettings || current.watermarkSettings,
          savedWatermarks: persistedState.savedWatermarks || current.savedWatermarks
        };
      },
      // 重新加载页面时，返回true表示允许恢复存储的状态
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('水印设置已从本地存储恢复', state);
        } else {
          console.warn('水印设置恢复失败，使用默认设置');
        }
      }
    }
  )
);