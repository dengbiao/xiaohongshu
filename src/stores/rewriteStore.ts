import { create } from 'zustand';
import { FetchItem } from './fetchStore';

export type RewriteSettings = {
  style: string;
  differenceRate: number;
  lengthAdjustment: number;
  keywords: string[];
  batchCount: number;
};

export type RewrittenItem = {
  id: number;
  title: string;
  content: string;
  imageCount?: number;
};

type RewriteStore = {
  rewriteSettings: RewriteSettings;
  rewrittenItems: RewrittenItem[];
  isRewriting: boolean;
  updateSettings: (settings: Partial<RewriteSettings>) => void;
  rewriteContent: (item: FetchItem) => void;
  clearRewrittenItems: () => void;
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
  isRewriting: false,
  
  updateSettings: (settings) => {
    set((state) => ({
      rewriteSettings: { ...state.rewriteSettings, ...settings }
    }));
  },
  
  rewriteContent: async (item) => {
    if (!item.content) return;
    
    set({ isRewriting: true });
    
    // 模拟改写过程
    // 这里只是简单示例，实际应用中应该基于设置进行更复杂的处理
    const { style, differenceRate, lengthAdjustment, batchCount } = get().rewriteSettings;
    const newItems = [];
    
    for (let i = 0; i < batchCount; i++) {
      // 根据风格调整内容
      let rewrittenContent = item.content;
      let rewrittenTitle = item.title || '';
      
      // 延迟模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟不同风格的改写
      if (style === 'casual') {
        rewrittenContent = `嘿，朋友们！${rewrittenContent.replace('分享', '告诉大家').replace('技巧', '小窍门')}`;
        rewrittenTitle = rewrittenTitle.replace('分享', '告诉你').replace('技巧', '小窍门');
      } else if (style === 'professional') {
        rewrittenContent = `研究表明，${rewrittenContent.replace('分享', '提供').replace('小技巧', '专业方法')}`;
        rewrittenTitle = rewrittenTitle.replace('分享', '解析').replace('技巧', '方法论');
      } else if (style === 'creative') {
        rewrittenContent = `✨灵感来袭✨ ${rewrittenContent.replace('分享', '创意呈现').replace('技巧', '妙招')}`;
        rewrittenTitle = `✨创意 | ${rewrittenTitle.replace('分享', '创意展示').replace('技巧', '妙招')}`;
      } else if (style === 'humorous') {
        rewrittenContent = `笑话来了！${rewrittenContent.replace('分享', '逗你一乐').replace('技巧', '搞笑绝招')}`;
        rewrittenTitle = `哈哈哈 | ${rewrittenTitle.replace('分享', '笑谈').replace('技巧', '绝招')}`;
      }
      
      // 根据长度调整
      if (lengthAdjustment > 0) {
        // 增加内容长度
        rewrittenContent += `\n\n更多${rewrittenTitle}相关的内容，欢迎关注我，下期将会带来更多精彩内容！`;
      } else if (lengthAdjustment < 0) {
        // 减少内容长度
        rewrittenContent = rewrittenContent.split(' ').slice(0, Math.max(3, Math.floor(rewrittenContent.split(' ').length * 0.7))).join(' ') + '...';
      }
      
      // 模拟图片数量
      const imageCount = Math.floor(Math.random() * 5) + 1;
      
      newItems.push({
        id: Date.now() + i,
        title: `${rewrittenTitle} (改写版本 ${i + 1})`,
        content: rewrittenContent,
        imageCount
      });
    }
    
    set((state) => ({
      rewrittenItems: [...newItems, ...state.rewrittenItems],
      isRewriting: false
    }));
  },
  
  clearRewrittenItems: () => {
    set({ rewrittenItems: [] });
  }
}));