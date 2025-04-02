import axios from 'axios';
import { CozeAPI } from '@coze/api';


// 定义抓取结果的接口
export interface ScrapedNote {
  id: string;
  title: string;
  content: string;
  abstract?: string;
  coverImage: string;
  images: string[];
  imagesText?: Array<{code: number, text: string}>;
  video?: string;
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

// 定义Coze API响应的接口
interface CozeAPIResponse {
  code: number;
  cost: string;
  data: string;
  debug_url: string;
  msg: string;
  token: number;
}

interface CozeAPIOutputData {
  output: {
    banner: string;
    bannerList: string[];
    bannerListText: Array<{code: number, text: string}>;
    content: string;
    title: string;
    video: string | null;
  }
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
      }) as unknown as CozeAPIResponse;

      if (res.code !== 0) {
        throw new Error(`API调用失败: ${res.msg}`);
      }

      // 解析JSON字符串数据
      const parsedData = JSON.parse(res.data) as CozeAPIOutputData;
      const output = parsedData.output;
      
      // 构建抓取结果
      const scrapedData: ScrapedNote = {
        id: noteId,
        title: output.title,
        content: output.content,
        coverImage: output.banner,
        images: output.bannerList || [],
        imagesText: output.bannerListText || [],
        ...(output.video && { video: output.video }),
        likes: 0,
        comments: 0,
        authorName: '作者信息暂缺',
        authorAvatar: '',
        publishTime: new Date().toISOString().split('T')[0],
        commentList: []
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