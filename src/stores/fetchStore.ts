import { create } from 'zustand';

export type FetchItem = {
  id: number;
  url: string;
  status: 'pending' | 'fetching' | 'success' | 'error';
  title?: string;
  content?: string;
  images?: string[];
  likes?: number;
  comments?: number;
  author?: string;
  publishTime?: string;
  commentList?: CommentItem[];
};

export type CommentItem = {
  id: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  time: string;
  likes: number;
};

type FetchStore = {
  fetchedItems: FetchItem[];
  isFetching: boolean;
  addLink: (url: string) => void;
  removeLink: (id: number) => void;
  updateFetchedItem: (id: number, updates: Partial<FetchItem>) => void;
  fetchLinks: () => void;
  clearLinks: () => void;
};

export const useFetchStore = create<FetchStore>((set, get) => ({
  fetchedItems: [],
  isFetching: false,
  
  addLink: (url) => {
    const id = Date.now();
    set((state) => ({
      fetchedItems: [...state.fetchedItems, { id, url, status: 'pending' }]
    }));
  },
  
  removeLink: (id) => {
    set((state) => ({
      fetchedItems: state.fetchedItems.filter(item => item.id !== id)
    }));
  },
  
  updateFetchedItem: (id, updates) => {
    set((state) => ({
      fetchedItems: state.fetchedItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  },
  
  fetchLinks: async () => {
    set({ isFetching: true });
    
    // 这个方法保留用于向后兼容，实际抓取功能已移至ContentFetch组件
    await new Promise(resolve => setTimeout(resolve, 500));
    
    set({ isFetching: false });
  },
  
  clearLinks: () => {
    set({ fetchedItems: [] });
  }
}));
