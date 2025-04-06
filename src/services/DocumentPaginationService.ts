import * as htmlToImage from 'html-to-image';

/**
 * 分页文档服务 - 处理文本分页和图片生成
 */
export class DocumentPaginationService {
  // 定义手动分页符标记
  public static readonly PAGE_BREAK_MARKER = '---PAGE_BREAK---';

  /**
   * 将文本内容分割成多个页面
   * @param content 要分割的文本内容
   * @param charsPerPage 每页字符数上限（默认1000）
   * @returns 分页后的内容数组
   */
  splitContentIntoPages(content: string, charsPerPage: number = 1000): string[] {
    // 首先检查是否包含手动分页符
    if (content.includes(DocumentPaginationService.PAGE_BREAK_MARKER)) {
      console.log('检测到手动分页符，按手动分页符和自动分页逻辑结合进行分页');
      
      // 按手动分页符拆分内容得到大块
      const sections = content.split(DocumentPaginationService.PAGE_BREAK_MARKER);
      const pages: string[] = [];
      
      // 对每个大块应用自动分页逻辑
      for (const section of sections) {
        const trimmedSection = section.trim();
        if (!trimmedSection) continue; // 跳过空部分
        
        // 将每一部分按照自动分页逻辑拆分
        const sectionPages = this.autoSplitContentIntoPages(trimmedSection, charsPerPage);
        pages.push(...sectionPages);
      }
      
      return pages;
    }

    // 如果没有手动分页符，直接使用自动分页逻辑
    return this.autoSplitContentIntoPages(content, charsPerPage);
  }
  
  /**
   * 自动将内容分页的内部实现方法
   * @param content 要分割的文本内容
   * @param charsPerPage 每页字符数上限
   * @returns 分页后的内容数组
   */
  private autoSplitContentIntoPages(content: string, charsPerPage: number): string[] {
    // 按换行符分割获取段落
    const paragraphs = content.split(/\n+/);
    const pages: string[] = [];
    let currentPage = '';

    for (const paragraph of paragraphs) {
      // 如果当前段落很长，需要进一步拆分
      if (paragraph.length > charsPerPage) {
        // 如果当前页已有内容，先保存
        if (currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = '';
        }

        // 拆分长段落
        let remainingText = paragraph;
        while (remainingText.length > 0) {
          // 尝试在合适的位置断句（标点符号后）
          let cutPoint = charsPerPage;
          if (remainingText.length > charsPerPage) {
            // 查找合适的断句点（句号、问号、感叹号等）
            for (let i = cutPoint - 1; i >= cutPoint - 200 && i >= 0; i--) {
              const char = remainingText[i];
              if (['。', '！', '？', '.', '!', '?'].includes(char)) {
                cutPoint = i + 1;
                break;
              }
            }
          } else {
            cutPoint = remainingText.length;
          }

          pages.push(remainingText.slice(0, cutPoint));
          remainingText = remainingText.slice(cutPoint);
        }
      } else if (currentPage.length + paragraph.length + 1 > charsPerPage) {
        // 如果添加这一段后会超过页面上限，保存当前页并开始新页面
        pages.push(currentPage);
        currentPage = paragraph;
      } else {
        // 将段落添加到当前页
        if (currentPage.length > 0) {
          currentPage += '\n\n';
        }
        currentPage += paragraph;
      }
    }

    // 添加最后一页
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }

  /**
   * 生成文档页面的HTML
   * @param text 页面文本内容
   * @param pageIndex 页码
   * @param totalPages 总页数
   * @returns 生成的HTML字符串
   */
  generateDocPageHtml(text: string, pageIndex: number, totalPages: number): string {
    // 处理特殊字符和格式
    // 先对文本进行编码处理，确保特殊字符不会造成问题
    const safeText = text.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;')
                          .replace(/'/g, '&#039;');
    
    // 进行格式化处理
    const formattedText = safeText
      .replace(/\\n/g, '<br/>') // 处理转义的换行符 
      .replace(/\n/g, '<br/>') // 处理常规换行符
      .replace(/#([^#\s]+)/g, '<span style="color:#333; font-weight:bold;">#$1</span>') // 处理标签
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // 处理加粗文本
      .replace(/### (.*?)(?:<br\/>|$)/g, '<h3 style="font-size:18px; margin:15px 0 10px; color:#333;">$1</h3>') // 处理三级标题
      .replace(/#### (.*?)(?:<br\/>|$)/g, '<h4 style="font-size:16px; margin:12px 0 8px; color:#444;">$1</h4>'); // 处理四级标题

    return `
      <div style="
        width: 794px;
        height: 1123px;
        padding: 50px 70px;
        box-sizing: border-box;
        font-family: 'SimSun', 'Microsoft YaHei', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #000;
        background-color: #fff;
        overflow: hidden;
        position: relative;
        text-align: left;
      ">
        <div style="
          height: 100%;
          overflow: hidden;
          text-align: justify;
          white-space: normal;
          word-wrap: break-word;
        ">
          ${formattedText}
        </div>
      </div>
    `;
  }

  /**
   * 将HTML内容转换为图片
   * @param html HTML内容
   * @returns 返回Promise，解析为图片的data URL
   */
  async htmlToImage(html: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个临时容器来渲染HTML
        const container = document.createElement('div');
        container.innerHTML = html;
        
        // 设置样式确保正确渲染但不显示
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.top = '0';
        container.style.zIndex = '-9999';
        container.style.width = '794px'; // A4宽度
        container.style.height = '1123px'; // A4高度
        container.style.backgroundColor = '#ffffff';
        container.style.overflow = 'hidden';
        
        // 添加到DOM以渲染
        document.body.appendChild(container);
        
        // 等待DOM渲染完成 - 增加延迟确保渲染
        setTimeout(() => {
          // 使用html-to-image生成图片
          htmlToImage.toPng(container, {
            quality: 0.95,
            width: 794,
            height: 1123,
            skipAutoScale: true,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            canvasWidth: 794,
            canvasHeight: 1123,
          })
          .then((dataUrl) => {
            // 移除临时容器
            document.body.removeChild(container);
            console.log('图片生成成功，数据URL长度:', dataUrl.length);
            resolve(dataUrl);
          })
          .catch((error) => {
            // 移除临时容器
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
            console.error('生成图片失败:', error);
            
            // 生成一个备用图片
            const canvas = document.createElement('canvas');
            canvas.width = 794;
            canvas.height = 1123;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // 在页面中央显示失败信息
              ctx.fillStyle = '#cc0000';
              ctx.font = '16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('图片生成失败 - 请查看文本内容', canvas.width/2, canvas.height/2);
            }
            resolve(canvas.toDataURL('image/png'));
          });
        }, 500); // 增加延迟时间从100ms到500ms
      } catch (error) {
        console.error('HTML转图片过程出错:', error);
        
        // 出错时创建一个基本的备用图片
        const canvas = document.createElement('canvas');
        canvas.width = 794;
        canvas.height = 1123;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 在页面中央显示失败信息
          ctx.fillStyle = '#cc0000';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('图片生成失败 - 请查看文本内容', canvas.width/2, canvas.height/2);
        }
        resolve(canvas.toDataURL('image/png'));
      }
    });
  }

  /**
   * 生成页面图片
   * @param contentPages 文本内容分页数组
   * @returns 图片URL数组的Promise
   */
  async generatePageImages(contentPages: string[]): Promise<string[]> {
    try {
      console.log(`开始为${contentPages.length}页内容生成图片...`);
      const result: string[] = [];
      const totalPages = contentPages.length;
      
      // 为了提高图片生成的成功率，我们限制并发数量并增加重试机制
      const generateImageWithRetry = async (
        pageContent: string, 
        pageIndex: number, 
        maxRetries: number = 2
      ): Promise<string> => {
        let retryCount = 0;
        let lastError = null;
        
        while (retryCount <= maxRetries) {
          try {
            console.log(`尝试生成第${pageIndex + 1}/${totalPages}页图片 (尝试 ${retryCount + 1}/${maxRetries + 1})...`);
            // 生成页面HTML
            const pageHtml = this.generateDocPageHtml(pageContent, pageIndex, totalPages);
            // 转换为图片
            const image = await this.htmlToImage(pageHtml);
            
            // 验证图片是否成功生成
            if (image && image.length > 1000) { // 有效的data URL应该很长
              console.log(`成功生成第${pageIndex + 1}/${totalPages}页图片，数据长度: ${image.length}`);
              return image;
            } else {
              throw new Error(`生成的图片数据无效`);
            }
          } catch (error) {
            retryCount++;
            lastError = error;
            console.warn(`第${pageIndex + 1}页图片生成失败，尝试重试 ${retryCount}/${maxRetries}`, error);
            
            // 等待一段时间再重试
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // 所有重试都失败，生成一个备用图片
        console.error(`生成第${pageIndex + 1}页图片失败，创建备用图片`, lastError);
        const canvas = document.createElement('canvas');
        canvas.width = 794;
        canvas.height = 1123;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 在页面中央显示失败信息
          ctx.fillStyle = '#cc0000';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('图片生成失败 - 请查看文本内容', canvas.width/2, canvas.height/2);
        }
        
        return canvas.toDataURL('image/png');
      };
      
      // 限制并发数为2，以避免浏览器资源耗尽
      const batchSize = 2;
      
      for (let i = 0; i < contentPages.length; i += batchSize) {
        const batch = contentPages.slice(i, i + batchSize);
        const batchPromises = batch.map((content, index) => 
          generateImageWithRetry(content, i + index)
        );
        
        try {
          const batchResults = await Promise.all(batchPromises);
          result.push(...batchResults);
          console.log(`完成批次 ${i / batchSize + 1}/${Math.ceil(contentPages.length / batchSize)}`);
        } catch (error) {
          console.error(`处理批次 ${i / batchSize + 1} 时发生错误:`, error);
          
          // 如果批处理失败，回退到逐个处理
          for (let j = 0; j < batch.length; j++) {
            try {
              const image = await generateImageWithRetry(batch[j], i + j);
              result.push(image);
            } catch (e) {
              // 生成一个空白页作为占位符
              const canvas = document.createElement('canvas');
              canvas.width = 794;
              canvas.height = 1123;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#cc0000';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('图片生成失败 - 请查看文本内容', canvas.width/2, canvas.height/2);
              }
              result.push(canvas.toDataURL('image/png'));
            }
          }
        }
      }
      
      console.log(`图片生成完成，共 ${result.length}/${contentPages.length} 张`);
      return result;
    } catch (error) {
      console.error('批量生成图片过程出错:', error);
      
      // 如果整个过程失败，为每页创建简单的占位符图片
      return contentPages.map((_, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = 794;
        canvas.height = 1123;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#cc0000';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('图片生成失败 - 请查看文本内容', canvas.width/2, canvas.height/2);
        }
        return canvas.toDataURL('image/png');
      });
    }
  }

  /**
   * 根据新的分页内容重新生成图片
   * @param contentPages 手动分页后的内容数组
   * @param originalImages 原始图片数组（如果有些页面未改变，可以重用对应的图片）
   * @returns 更新后的图片数组
   */
  async regenerateImages(contentPages: string[], originalImages: string[] = []): Promise<string[]> {
    console.log(`开始重新生成分页图片，共${contentPages.length}页`);
    
    // 创建新的图片数组
    const updatedImages = await this.generatePageImages(contentPages);
    
    return updatedImages;
  }

  /**
   * 处理内容并生成分页图片
   * @param content 原始文本内容
   * @returns 包含分页内容和图片的对象
   */
  async processContent(content: string): Promise<{contentPages: string[], images: string[]}> {
    // 分页
    const contentPages = this.splitContentIntoPages(content);
    // 生成图片
    const images = await this.generatePageImages(contentPages);
    
    return {
      contentPages,
      images
    };
  }

  /**
   * 根据更新后的内容重新处理分页和图片
   * @param content 更新后的内容
   * @param originalImages 原始图片数组
   * @returns 包含更新后的分页内容和图片的对象
   */
  async reprocessContent(content: string, originalImages: string[] = []): Promise<{contentPages: string[], images: string[]}> {
    // 分页
    const contentPages = this.splitContentIntoPages(content);
    // 重新生成图片
    const images = await this.regenerateImages(contentPages, originalImages);
    
    return {
      contentPages,
      images
    };
  }
}

export const documentPaginationService = new DocumentPaginationService(); 