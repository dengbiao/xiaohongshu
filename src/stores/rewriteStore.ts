import { create } from 'zustand';
import { FetchItem } from './fetchStore';
import { redBookRewriteService, RewrittenNote } from '../services/RedBookRewriteService';
import { ScrapedNote } from '../services/RedBookScraperService';

export type RewriteSettings = {
  style: string;
  differenceRate: number;
  lengthAdjustment: number;
  keywords: string[];
  batchCount: number;
};

export type RewrittenItem = {
  id: number;
  originalItemId: number; // 原始笔记的ID
  title: string;
  content: string;
  abstract?: string; 
  imageCount?: number;
  generatedImages?: string[]; // 从内容生成的图片
  contentPages?: string[]; // 分页内容
};

// 改写状态映射：ID -> 状态
export type RewriteStatusMap = {
  [originalItemId: number]: boolean; // true表示正在改写，false表示改写完成
};

type RewriteStore = {
  rewriteSettings: RewriteSettings;
  rewrittenItems: RewrittenItem[];
  rewriteStatusMap: RewriteStatusMap; // 记录每个笔记的改写状态
  updateSettings: (settings: Partial<RewriteSettings>) => void;
  rewriteContent: (item: FetchItem) => void;
  clearRewrittenItems: () => void;
  updateRewrittenItem: (id: number, updatedItem: Partial<RewrittenItem>) => void;
  getRewrittenItemByOriginalId: (originalItemId: number) => RewrittenItem | undefined;
  isItemRewriting: (originalItemId: number) => boolean;
};

export const useRewriteStore = create<RewriteStore>((set, get) => ({
  rewriteSettings: {
    style: 'casual',
    differenceRate: 40,
    lengthAdjustment: 0,
    keywords: [],
    batchCount: 1
  },
  rewrittenItems: [],
  rewriteStatusMap: {},
  
  updateSettings: (settings) => {
    set((state) => ({
      rewriteSettings: { ...state.rewriteSettings, ...settings }
    }));
  },
  
  rewriteContent: async (item) => {
    if (!item.content) return;
    
    // 更新当前笔记的改写状态为"改写中"
    set((state) => ({
      rewriteStatusMap: { 
        ...state.rewriteStatusMap, 
        [item.id]: true 
      }
    }));
    
    try {
      const { batchCount } = get().rewriteSettings;
      const newItems = [];
      
      // 构建用于改写的笔记对象
      const note: ScrapedNote = {
        id: String(item.id), // 转换为字符串类型
        title: item.title || '',
        content: item.content,
        coverImage: item.images?.[0] || '', // 使用第一张图片作为封面
        images: item.images || [],
        imagesText: item.imagesText || [],
        likes: item.likes || 0,
        comments: item.comments || 0,
        authorName: item.author || '',
        authorAvatar: '',
        publishTime: item.publishTime || new Date().toISOString().split('T')[0]
      };
      
      // 使用改写服务进行内容改写
      for (let i = 0; i < batchCount; i++) {
        try {
          // 调用改写服务
          const rewrittenNote = await redBookRewriteService.rewriteNote(note);
          
          if (rewrittenNote) {
            newItems.push({
              id: Date.now() + i,
              originalItemId: item.id, // 保存原始笔记的ID
              title: rewrittenNote.title,
              content: rewrittenNote.content,
              abstract: rewrittenNote.abstract,
              imageCount: note.images.length,
              generatedImages: rewrittenNote.generatedImages,
              contentPages: rewrittenNote.contentPages
            });
          }
        } catch (error) {
          console.error('改写内容时出错:', error);
        }
        
        // 在多个版本之间添加小延迟
        if (i < batchCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // 更新改写结果，并将当前笔记的改写状态设为完成
      set((state) => {
        // 移除原有的同一笔记的改写结果
        const filteredItems = state.rewrittenItems.filter(
          item => !newItems.some(newItem => newItem.originalItemId === item.originalItemId)
        );
        
        return {
          rewrittenItems: [...newItems, ...filteredItems],
          rewriteStatusMap: { 
            ...state.rewriteStatusMap, 
            [item.id]: false // 改写完成
          }
        };
      });
    } catch (error) {
      console.error('改写内容时出错:', error);
      // 更新当前笔记的改写状态为"完成"（即使出错）
      set((state) => ({
        rewriteStatusMap: { 
          ...state.rewriteStatusMap, 
          [item.id]: false 
        }
      }));
    }
  },
  
  clearRewrittenItems: () => {
    set({ 
      rewrittenItems: [],
      rewriteStatusMap: {}
    });
  },

  // 更新指定ID的改写内容
  updateRewrittenItem: (id: number, updatedItem: Partial<RewrittenItem>) => {
    set((state) => ({
      rewrittenItems: state.rewrittenItems.map(item => 
        item.id === id ? { ...item, ...updatedItem } : item
      )
    }));
  },
  
  // 根据原始笔记ID获取对应的改写结果
  getRewrittenItemByOriginalId: (originalItemId: number) => {
    return get().rewrittenItems.find(item => item.originalItemId === originalItemId);
  },
  
  // 检查指定原始笔记ID是否正在改写中
  isItemRewriting: (originalItemId: number) => {
    return !!get().rewriteStatusMap[originalItemId];
  }
}));