import * as htmlToImage from 'html-to-image';
import { useWatermarkStore } from '../stores/watermarkStore';

/**
 * 分页文档服务 - 处理文本分页和图片生成
 */
export class DocumentPaginationService {
  // 定义手动分页符标记 - 使用更明确的标记以便更容易识别
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
   * 获取当前水印配置
   * @returns 当前应用的水印配置
   */
  getWatermarkConfig() {
    // 从 store 获取当前水印配置
    const watermarkSettings = useWatermarkStore.getState().watermarkSettings;
    
    console.log('获取水印配置:', watermarkSettings);
    
    // 将水印配置映射到 addWatermark 方法需要的格式
    return {
      text: watermarkSettings.text || '小红书内容助手', // 使用水印文字
      opacity: (watermarkSettings.opacity || 30) / 100, // 将百分比转换为0-1范围
      fontSize: watermarkSettings.size || 18, // 文字大小
      fontColor: watermarkSettings.color || '#ff4d6d', // 文字颜色
      position: 'center' as const, // 水印位置
      rotate: -30, // 旋转角度
      density: watermarkSettings.density || 3, // 水印密度
    };
  }

  /**
   * 为图片添加水印
   * @param imageDataUrl 原始图片的data URL
   * @param watermarkConfig 水印配置信息
   * @returns 添加水印后的图片data URL
   */
  async addWatermark(
    imageDataUrl: string, 
    watermarkConfig: {
      text?: string; // 水印文字
      image?: string; // 水印图片URL
      opacity?: number; // 水印透明度 (0-1)
      position?: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'; // 水印位置
      fontSize?: number; // 文字大小
      fontColor?: string; // 文字颜色
      rotate?: number; // 旋转角度
      density?: number; // 水印密度 (值越大，水印越密集)
    } = {}
  ): Promise<string> {
    return new Promise((resolve) => {
      try {
        // 默认水印配置
        const config = {
          text: watermarkConfig.text || '',
          image: watermarkConfig.image || '',
          opacity: watermarkConfig.opacity !== undefined ? watermarkConfig.opacity : 0.3,
          position: watermarkConfig.position || 'center',
          fontSize: watermarkConfig.fontSize || 24,
          fontColor: watermarkConfig.fontColor || 'rgba(0, 0, 0, 0.7)',
          rotate: watermarkConfig.rotate !== undefined ? watermarkConfig.rotate : -30,
          density: watermarkConfig.density !== undefined ? watermarkConfig.density : 3
        };

        console.log('实际水印配置:', JSON.stringify(config, null, 2));

        // 创建图像对象来加载原始图片
        const img = new Image();
        img.onload = () => {
          // 创建Canvas并绘制原图
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('Canvas 2D context 创建失败');
            resolve(imageDataUrl); // 如果失败返回原图
            return;
          }
          
          // 绘制原图
          ctx.drawImage(img, 0, 0);
          
          // 应用水印
          ctx.save();
          
          // 设置透明度
          ctx.globalAlpha = config.opacity;
          
          if (config.text) {
            // 设置字体和颜色
            ctx.font = `${config.fontSize}px Arial, "Microsoft YaHei"`;
            ctx.fillStyle = config.fontColor;
            console.log(`设置字体: ${ctx.font}, 颜色: ${config.fontColor}, 透明度: ${config.opacity}`);
            
            // 基础间距 - 值越大，水印越稀疏
            const baseSpacingX = 300;
            const baseSpacingY = 200;
            
            // 根据密度调整间距 - 密度越大，间距越小
            // 将密度(1-5)映射到间距系数(1-0.5)
            const densityFactor = 1 - ((config.density - 1) / 10); // 1->1, 3->0.8, 5->0.6
            
            // 计算最终间距
            const spacingX = baseSpacingX * densityFactor;
            const spacingY = baseSpacingY * densityFactor;
            
            console.log(`生成水印网格 - 密度:${config.density}, 系数:${densityFactor.toFixed(2)}, 间距:${spacingX.toFixed(0)}x${spacingY.toFixed(0)}, 画布尺寸:${canvas.width}x${canvas.height}`);
            
            // 旋转角度（弧度）
            const rotateRad = (config.rotate * Math.PI) / 180;
            
            // 计算重复次数
            const cols = Math.ceil(canvas.width / spacingX) + 1; // 确保覆盖边缘
            const rows = Math.ceil(canvas.height / spacingY) + 1;
            
            console.log(`水印网格大小: ${cols}x${rows}，字体大小: ${config.fontSize}`);
            
            // 起始偏移，使水印更均匀分布
            const offsetX = spacingX / 2;
            const offsetY = spacingY / 2;
            
            // 绘制平铺水印
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                const x = offsetX + col * spacingX;
                const y = offsetY + row * spacingY;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotateRad);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(config.text, 0, 0);
                ctx.restore();
              }
            }
          }
          
          // 图片水印
          if (config.image) {
            const watermarkImg = new Image();
            watermarkImg.onload = () => {
              // 计算水印图片的绘制尺寸（确保不会太大）
              const maxSize = 100;
              const scale = Math.min(maxSize / watermarkImg.width, maxSize / watermarkImg.height);
              const width = watermarkImg.width * scale;
              const height = watermarkImg.height * scale;
              
              // 基础间距 - 值越大，水印越稀疏
              const baseSpacingX = 400;
              const baseSpacingY = 300;
              
              // 根据密度调整间距 - 密度越大，间距越小
              const densityFactor = 1 - ((config.density - 1) / 10); // 1->1, 3->0.8, 5->0.6
              
              // 计算最终间距
              const spacingX = baseSpacingX * densityFactor;
              const spacingY = baseSpacingY * densityFactor;
              
              // 旋转角度（弧度）
              const rotateRad = (config.rotate * Math.PI) / 180;
              
              // 计算重复次数
              const cols = Math.ceil(canvas.width / spacingX) + 1;
              const rows = Math.ceil(canvas.height / spacingY) + 1;
              
              // 起始偏移，使水印更均匀分布
              const offsetX = spacingX / 2;
              const offsetY = spacingY / 2;
              
              // 绘制平铺图片水印
              for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                  const x = offsetX + col * spacingX;
                  const y = offsetY + row * spacingY;
                  
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.rotate(rotateRad);
                  ctx.drawImage(watermarkImg, -width / 2, -height / 2, width, height);
                  ctx.restore();
                }
              }
              
              ctx.restore();
              resolve(canvas.toDataURL('image/png'));
            };
            
            watermarkImg.onerror = () => {
              console.error('水印图片加载失败');
              ctx.restore();
              resolve(canvas.toDataURL('image/png')); // 仅应用文字水印
            };
            
            watermarkImg.src = config.image;
          } else {
            // 没有图片水印时直接完成
            ctx.restore();
            resolve(canvas.toDataURL('image/png'));
          }
        };
        
        img.onerror = () => {
          console.error('原始图片加载失败');
          resolve(imageDataUrl); // 出错时返回原图
        };
        
        img.src = imageDataUrl;
      } catch (error) {
        console.error('添加水印过程出错:', error);
        resolve(imageDataUrl); // 出错时返回原图
      }
    });
  }

  /**
   * 处理内容并生成分页图片
   * @param content 原始文本内容
   * @param watermarkConfig 水印配置（可选，如果不提供则使用应用内配置）
   * @returns 包含分页内容和图片的对象
   */
  async processContent(
    content: string, 
    watermarkConfig?: {
      text?: string;
      image?: string;
      opacity?: number;
      position?: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
      fontSize?: number;
      fontColor?: string;
      rotate?: number;
    }
  ): Promise<{contentPages: string[], images: string[]}> {
    // 分页
    const contentPages = this.splitContentIntoPages(content);
    // 生成图片
    const images = await this.generatePageImages(contentPages);
    
    // 获取水印配置 - 如果没有传入则使用系统默认配置
    const config = watermarkConfig || this.getWatermarkConfig();
    
    console.log('正在为图片添加水印...', config);
    const watermarkedImages = await Promise.all(
      images.map(image => this.addWatermark(image, config))
    );
    
    return {
      contentPages,
      images: watermarkedImages
    };
  }

  /**
   * 根据更新后的内容重新处理分页和图片
   * @param content 更新后的内容
   * @param originalImages 原始图片数组
   * @param watermarkConfig 水印配置（可选，如果不提供则使用应用内配置）
   * @returns 包含更新后的分页内容和图片的对象
   */
  async reprocessContent(
    content: string, 
    originalImages: string[] = [],
    watermarkConfig?: {
      text?: string;
      image?: string;
      opacity?: number;
      position?: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
      fontSize?: number;
      fontColor?: string;
      rotate?: number;
    }
  ): Promise<{contentPages: string[], images: string[]}> {
    // 分页
    const contentPages = this.splitContentIntoPages(content);
    // 重新生成图片
    const images = await this.regenerateImages(contentPages, originalImages);
    
    // 获取水印配置 - 如果没有传入则使用系统默认配置
    const config = watermarkConfig || this.getWatermarkConfig();
    
    console.log('正在为图片添加水印...', config);
    const watermarkedImages = await Promise.all(
      images.map(image => this.addWatermark(image, config))
    );
    
    return {
      contentPages,
      images: watermarkedImages
    };
  }
}

export const documentPaginationService = new DocumentPaginationService(); 