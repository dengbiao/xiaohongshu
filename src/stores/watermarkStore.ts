import { create } from 'zustand';

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

export const useWatermarkStore = create<WatermarkStore>((set) => ({
  watermarkSettings: {
    text: '小红书内容助手',
    font: 'sans-serif',
    color: '#ff4d6d',
    opacity: 30,
    size: 18,
    density: 3
  },
  
  savedWatermarks: [
    {
      id: 1,
      name: '默认水印',
      settings: {
        text: '小红书内容助手',
        font: 'sans-serif',
        color: '#ff4d6d',
        opacity: 30,
        size: 18,
        density: 3
      }
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
  ],
  
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
}));