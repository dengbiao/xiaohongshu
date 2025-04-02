import { create } from 'zustand';

export type FetchItem = {
  id: number;
  url: string;
  status: 'pending' | 'fetching' | 'success' | 'error';
  title?: string;
  content?: string;
  images?: string[];
  imagesText?: Array<{code: number, text: string}>;
  video?: string;
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
    // 获取当前最大id
    const currentMaxId = get().fetchedItems.reduce((max, item) => 
      item.id > max ? item.id : max, 0
    );
    // 新id为最大id + 1
    const id = currentMaxId + 1;
    
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
