import axios from 'axios';
import { CozeAPI } from '@coze/api';


// 定义抓取结果的接口
export interface ScrapedNote {
  id: string;
  title: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  authorName: string;
  authorAvatar: string;
  publishTime: string;
  commentList?: CommentItem[];
}

export interface CommentItem {
  id: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  time: string;
  likes: number;
}

class RedBookScraperService {
  private apiEndpoint: string;
  private token: string;

  constructor() {
    // 配置API端点和token
    this.apiEndpoint = 'https://api.coze.cn/api/workflow/runs/stream';
    this.token = 'pat_UYwhd7p59aWQUJj76JQ3fv1KsylZ6QltwYI03RM77mU36zBEw4SAY0kkufKa2OL5';
  }

  /**
   * 从URL中提取小红书笔记ID
   */
  private extractNoteId(url: string): string | null {
    // 尝试从URL中提取笔记ID
    const patterns = [
      /xiaohongshu\.com\/explore\/([a-zA-Z0-9]+)/,
      /xhslink\.com\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * 抓取单个小红书笔记
   */
  async scrapeNote(url: string): Promise<ScrapedNote | null> {
    try {
      const noteId = this.extractNoteId(url);
      if (!noteId) {
        throw new Error('无效的小红书链接');
      }


      const apiClient = new CozeAPI({
        token: 'pat_UYwhd7p59aWQUJj76JQ3fv1KsylZ6QltwYI03RM77mU36zBEw4SAY0kkufKa2OL5',
        baseURL: 'https://api.coze.cn',
        allowPersonalAccessTokenInBrowser: true,
      });
      const res = await apiClient.workflows.runs.create({
        workflow_id: '7488314439156187190',
        app_id: '7488290964172341302',
        is_async: false,
        parameters: {
          input_url: url,
        },
      })

      return res;

      // // 由于我们无法直接使用 Coze API，暂时使用模拟数据
      // // 在实际应用中，这里应替换为真实的 API 调用
      // const response = await axios.post(this.apiEndpoint, {
      //   workflow_id: '7488314439156187190',
      //   parameters: {
      //     "input_url": url
      //   }
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      // return response.data;
      
      // 模拟抓取结果
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
      
      const mockImages = [
        `https://picsum.photos/seed/${noteId}1/800/600`,
        `https://picsum.photos/seed/${noteId}2/800/600`,
        `https://picsum.photos/seed/${noteId}3/800/600`,
      ];
      
      // 生成随机标题
      const titles = [
        '这款神仙水乳真的绝了！用了三天皮肤状态直接起飞',
        '今日份穿搭分享|初春叠穿有点复杂但很值得',
        '终于找到了平价替代!这家店的小众香水也太好闻了',
        '上海探店|隐藏在街角的复古咖啡馆，氛围感拉满',
        '三亚旅游攻略|本地人带你玩转亚龙湾，绝不踩雷'
      ];
      
      // 生成随机内容片段
      const contentParts = [
        '最近入手了这款超级火爆的产品，真的是相见恨晚！',
        '分享一下我的使用心得，希望对和我一样纠结的朋友有所帮助。',
        '真的很推荐大家试试看，性价比超高而且效果立竿见影。',
        '不得不说，这绝对是我今年买到的最满意的东西之一了！',
        '本人已经回购三次了，家里常备，真的是用一次爱一次。'
      ];
      
      // 随机选择标题和内容
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      let randomContent = '';
      for (let i = 0; i < 3; i++) {
        randomContent += contentParts[Math.floor(Math.random() * contentParts.length)] + ' ';
      }
      
      // 构建模拟的抓取结果
      const scrapedData: ScrapedNote = {
        id: noteId,
        title: randomTitle,
        content: randomContent,
        images: mockImages,
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 500),
        authorName: '小红书用户_' + Math.floor(Math.random() * 10000),
        authorAvatar: `https://picsum.photos/seed/avatar${noteId}/200/200`,
        publishTime: '2023-' + (Math.floor(Math.random() * 12) + 1) + '-' + (Math.floor(Math.random() * 28) + 1),
        commentList: Array(Math.floor(Math.random() * 5) + 1).fill(null).map((_, i) => ({
          id: `comment_${i}`,
          content: '这个真的太好了！我也想试试看。',
          authorName: '评论用户_' + Math.floor(Math.random() * 1000),
          authorAvatar: `https://picsum.photos/seed/comment${i}${noteId}/200/200`,
          time: '2023-' + (Math.floor(Math.random() * 12) + 1) + '-' + (Math.floor(Math.random() * 28) + 1),
          likes: Math.floor(Math.random() * 100)
        }))
      };
      
      return scrapedData;
    } catch (error) {
      console.error('抓取笔记时出错:', error);
      throw error;
    }
  }

  /**
   * 批量抓取小红书笔记
   */
  async scrapeMultipleNotes(urls: string[]): Promise<(ScrapedNote | null)[]> {
    try {
      // 同时发起多个请求，提高效率
      const promises = urls.map(url => this.scrapeNote(url).catch(() => null));
      return await Promise.all(promises);
    } catch (error) {
      console.error('批量抓取笔记时出错:', error);
      throw error;
    }
  }
}

export const redBookScraperService = new RedBookScraperService();