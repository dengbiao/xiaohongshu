import { create } from 'zustand';
import { FetchItem } from './fetchStore';
import { redBookRewriteService } from '../services/RedBookRewriteService';

export type RewriteSettings = {
  style: string;
  stylePriority: string;
  structurePriority: string;
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
  contentPages?: string[];
  generatedImages?: string[];
  version: number; // 版本号
  createdAt: number; // 创建时间戳
  status: RewriteStatus; // 改写状态
};

// 改写状态定义
export type RewriteStatus = "rewriting" | "success" | "error";

// 改写状态映射，用于跟踪每个原始内容的改写状态
type RewriteStatusMap = Record<number, RewriteStatus>;

// 创建用于传递给改写服务的笔记对象
interface NoteToRewrite {
  id: number;
  title: string;
  content: string;
  author?: string;
  url?: string;
  images?: string[];
}

type RewriteStore = {
  rewriteSettings: RewriteSettings;
  rewrittenItems: RewrittenItem[];
  rewriteStatusMap: RewriteStatusMap;
  updateSettings: (settings: Partial<RewriteSettings>) => void;
  rewriteContent: (item: FetchItem) => void;
  updateRewrittenItem: (id: number, updates: Partial<RewrittenItem>) => void;
  clearRewrittenItems: () => void;
  getRewrittenItemsByOriginalId: (originalItemId: number) => RewrittenItem[];
  getLatestRewrittenItemByOriginalId: (originalItemId: number) => RewrittenItem | undefined;
  getRewrittenVersionCount: (originalItemId: number) => number;
  isItemRewriting: (originalItemId: number) => boolean;
};

export const useRewriteStore = create<RewriteStore>((set, get) => ({
  rewriteSettings: {
    style: 'professional',
    stylePriority: 'medium',
    structurePriority: 'high',
    lengthAdjustment: 0,
    keywords: [],
    batchCount: 1,
  },
  rewrittenItems: [],
  rewriteStatusMap: {},

  // 更新设置
  updateSettings: (settings) => {
    set((state) => ({
      rewriteSettings: {
        ...state.rewriteSettings,
        ...settings
      }
    }));
  },

  // 改写内容
  rewriteContent: async (item: FetchItem) => {
    // 获取该原始内容的最新版本号
    const originalId = item.id;
    const existingVersions = get().rewrittenItems
      .filter(rewrittenItem => rewrittenItem.originalItemId === originalId)
      .map(rewrittenItem => rewrittenItem.version);
      
    // 如果没有版本，则从1开始，否则取最大版本号+1
    const newVersion = existingVersions.length > 0 
      ? Math.max(...existingVersions) + 1 
      : 1;
    
    // 创建一个"改写中"状态的版本
    const inProgressItem: RewrittenItem = {
      id: Date.now(),
      originalItemId: item.id,
      title: item.title,
      content: item.content || '正在改写中...',
      abstract: (item.content || '').substring(0, 150) + "...",
      version: newVersion,
      createdAt: Date.now(),
      status: "rewriting"
    };

    // 立即添加改写中的版本
    set((state) => {
      return {
        rewrittenItems: [...state.rewrittenItems, inProgressItem],
        rewriteStatusMap: { 
          ...state.rewriteStatusMap, 
          [item.id]: "rewriting" 
        }
      };
    });

    try {
      // 准备原始内容数据
      const noteToRewrite: NoteToRewrite = {
        id: item.id,
        title: item.title,
        content: item.content || '',
        author: item.author || '',
        url: item.url || '',
        images: item.images || []
      };

      // 在rewriteStore中获取设置并直接在服务中使用
      const settings = get().rewriteSettings;
      
      // 执行改写API调用，始终使用原始内容进行改写
      const result = await redBookRewriteService.rewriteNote({
        id: String(noteToRewrite.id),
        title: noteToRewrite.title,
        content: noteToRewrite.content,
        coverImage: noteToRewrite.images?.[0] || '',
        images: noteToRewrite.images || [],
        imagesText: item.imagesText || [],
        likes: 0,
        comments: 0,
        authorName: noteToRewrite.author || '',
        authorAvatar: '',
        publishTime: new Date().toISOString().split('T')[0]
      });
      
      // 生成摘要和内容页面
      const abstract = result.content.substring(0, 150) + "...";
      const contentPages = result.content
        .split("\n\n")
        .filter((paragraph) => paragraph.trim().length > 0);

      // 更新刚才创建的改写中的版本
      set((state) => {
        return {
          rewrittenItems: state.rewrittenItems.map(item => 
            item.id === inProgressItem.id 
              ? {
                  ...item,
                  title: result.title,
                  content: result.content,
                  abstract,
                  contentPages,
                  generatedImages: result.generatedImages || [],
                  status: "success"
                }
              : item
          ),
          rewriteStatusMap: { 
            ...state.rewriteStatusMap, 
            [item.id]: "success" 
          }
        };
      });
    } catch (error) {
      console.error('改写错误:', error);
      // 更新为错误状态
      set((state) => ({
        rewrittenItems: state.rewrittenItems.map(item => 
          item.id === inProgressItem.id 
            ? { ...item, status: "error" }
            : item
        ),
        rewriteStatusMap: { 
          ...state.rewriteStatusMap, 
          [item.id]: "error" 
        }
      }));
    }
  },

  // 更新已有的改写项
  updateRewrittenItem: (id, updates) => {
    set((state) => ({
      rewrittenItems: state.rewrittenItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  // 清除所有改写项
  clearRewrittenItems: () => {
    set({ rewrittenItems: [], rewriteStatusMap: {} });
  },

  // 获取指定原始笔记ID的所有改写版本，按版本号排序
  getRewrittenItemsByOriginalId: (originalItemId: number) => {
    return get().rewrittenItems.filter(item => item.originalItemId === originalItemId)
      .sort((a, b) => b.version - a.version); // 按版本号降序排序
  },

  // 获取指定原始笔记ID的改写版本数量
  getRewrittenVersionCount: (originalItemId: number) => {
    return get().rewrittenItems.filter(item => item.originalItemId === originalItemId).length;
  },

  // 获取指定原始笔记ID的最新改写版本
  getLatestRewrittenItemByOriginalId: (originalItemId: number) => {
    const items = get().rewrittenItems.filter(item => item.originalItemId === originalItemId)
      .sort((a, b) => b.version - a.version);
    return items.length > 0 ? items[0] : undefined;
  },

  // 检查指定原始笔记ID是否正在改写中
  isItemRewriting: (originalItemId: number) => {
    return get().rewriteStatusMap[originalItemId] === "rewriting";
  },
}));