import { CozeAPI } from '@coze/api';
import { ScrapedNote } from './RedBookScraperService';
import * as htmlToImage from 'html-to-image';
import { documentPaginationService } from './DocumentPaginationService';

// 定义改写后的笔记接口
export interface RewrittenNote {
  title: string;
  abstract: string;
  content: string;
  code: number;
  contentPages?: string[];  // 分页内容数组
  generatedImages?: string[]; // 从内容生成的图片URLs
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

// 定义改写API的输入格式
interface RewriteAPIInput {
  input: {
    content: string;
    images: string[];
    imagesText: Array<{code: number, text: string}>;
    title: string;
  }
}

class RedBookRewriteService {
  private apiEndpoint: string;
  private token: string;
  private workflowId: string;
  private appId: string;

  constructor() {
    // 配置API端点和token
    this.apiEndpoint = 'https://api.coze.cn/api/workflow/runs/stream';
    this.token = 'pat_UYwhd7p59aWQUJj76JQ3fv1KsylZ6QltwYI03RM77mU36zBEw4SAY0kkufKa2OL5';
    this.workflowId = '7488562216497692687'; // 改写服务的workflow_id
    this.appId = '7488290964172341302';
  }

  /**
   * 将文本内容分割成多个页面
   * 尝试按段落分割，确保每页内容不会过长
   * @param content 要分割的文本
   * @param charsPerPage 每页字符上限（默认800）
   * @returns 分页后的内容数组
   */
  private splitContentIntoPages(content: string, charsPerPage: number = 800): string[] {
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
   * 根据文本内容生成图片
   * 每页文本内容生成一张图片
   * @param contentPages 分页的文本内容
   * @returns 生成的图片URLs数组
   */
  private async generateImagesFromText(contentPages: string[]): Promise<string[]> {
    if (!contentPages || contentPages.length === 0) {
      return [];
    }

    try {
      // 创建一个画布元素，用于生成图片
      const createTextImage = async (text: string, index: number): Promise<string> => {
        return new Promise((resolve, reject) => {
          try {
            // 创建一个临时的div元素作为绘制内容的容器
            const tempElement = document.createElement('div');
            // 设置样式确保可见并正确渲染
            tempElement.style.width = '390px';
            tempElement.style.height = '520px';
            tempElement.style.position = 'absolute';
            tempElement.style.left = '0'; // Changed from -9999px to make visible during rendering
            tempElement.style.top = '0';
            tempElement.style.backgroundColor = '#ffffff';
            tempElement.style.border = '1px solid #ddd';
            tempElement.style.borderRadius = '8px';
            tempElement.style.overflow = 'hidden';
            tempElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            tempElement.style.zIndex = '-1'; // Put behind other elements but still renderable
            
            // 处理文本，确保字符串转义问题
            let formattedText = text;
            try {
              // 修复转义字符问题
              formattedText = text
                .replace(/\\n/g, '<br/>') // 正确处理换行符
                .replace(/#([^#\s]+)/g, '<span style="color:#FF2442; font-weight:bold;">#$1</span>')
                .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
            } catch (error) {
              console.warn('文本格式化失败，使用原始文本:', error);
            }
            
            // 使用简化的HTML结构
            tempElement.innerHTML = `
              <div style="display:flex; flex-direction:column; height:100%; width:100%; font-family:system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #FF2442, #FF8A8A); padding: 12px; color: white; text-align: center;">
                  <div style="font-size: 16px; font-weight: bold;">小红书内容 - 第 ${index + 1} 页</div>
                </div>
                <div style="flex: 1; padding: 16px; overflow-y: auto; color: black; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">
                  ${formattedText}
                </div>
                <div style="background-color: #f7f7f7; padding: 8px; text-align: center; font-size: 12px; color: #666;">
                  总 ${contentPages.length} 页
                </div>
              </div>
            `;
            
            document.body.appendChild(tempElement);
            
            // 确保DOM已经完全渲染
            setTimeout(() => {
              console.log(`正在生成第${index + 1}页图片，内容长度: ${text.length}字符`);
              
              // 使用更稳定的方法捕获可能的错误
              htmlToImage.toPng(tempElement, {
                quality: 0.9,
                pixelRatio: 1.5,
                backgroundColor: '#ffffff',
                skipAutoScale: false, // 允许自动缩放
                cacheBust: true,
                canvasWidth: 390,
                canvasHeight: 520,
              })
              .then((dataUrl) => {
                // 清理临时元素
                if (document.body.contains(tempElement)) {
                  document.body.removeChild(tempElement);
                }
                console.log(`第${index + 1}页图片生成成功`);
                resolve(dataUrl);
              })
              .catch((error) => {
                console.error('生成图片失败:', error);
                // 生成失败时，创建一个简单的备用图片
                const canvas = document.createElement('canvas');
                canvas.width = 390;
                canvas.height = 520;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  // 绘制简单背景
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  // 绘制标题栏
                  ctx.fillStyle = '#FF2442';
                  ctx.fillRect(0, 0, canvas.width, 50);
                  
                  // 绘制文字
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 16px sans-serif';
                  ctx.fillText(`第 ${index + 1} 页 / 共 ${contentPages.length} 页`, 20, 30);
                  
                  // 绘制内容预览
                  ctx.fillStyle = '#333333';
                  ctx.font = '14px sans-serif';
                  
                  // 分割预览文本到多行并绘制
                  const previewText = text.substring(0, 200) + '...';
                  const words = previewText.split(' ');
                  let line = '';
                  let y = 80;
                  
                  for (const word of words) {
                    const testLine = line + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    
                    if (testWidth > canvas.width - 40 && line !== '') {
                      ctx.fillText(line, 20, y);
                      line = word + ' ';
                      y += 20;
                      
                      // 最多显示5行
                      if (y > 180) break;
                    } else {
                      line = testLine;
                    }
                  }
                  
                  // 绘制最后一行
                  if (line !== '') {
                    ctx.fillText(line, 20, y);
                  }
                }
                
                // 返回备用图片
                if (document.body.contains(tempElement)) {
                  document.body.removeChild(tempElement);
                }
                
                resolve(canvas.toDataURL('image/png'));
              });
            }, 500); // 增加延迟，确保DOM完全渲染
          } catch (error) {
            console.error('创建图片元素时出错:', error);
            reject(error);
          }
        });
      };

      // 为每页内容生成图片
      console.log(`开始为${contentPages.length}页内容生成图片...`);
      const result: string[] = [];
      
      // 串行处理图片生成以提高稳定性
      for (let i = 0; i < contentPages.length; i++) {
        try {
          const image = await createTextImage(contentPages[i], i);
          result.push(image);
          console.log(`成功生成第${i+1}/${contentPages.length}页图片`);
        } catch (e) {
          console.error(`生成第${i+1}页图片失败:`, e);
          // 创建一个简单的失败标记图片
          const canvas = document.createElement('canvas');
          canvas.width = 390;
          canvas.height = 520;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FF2442';
            ctx.fillRect(0, 0, canvas.width, 50);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`第 ${i + 1} 页 / 共 ${contentPages.length} 页`, 20, 30);
            ctx.fillStyle = '#333333';
            ctx.font = '14px sans-serif';
            ctx.fillText('图片生成失败', 20, 80);
          }
          result.push(canvas.toDataURL('image/png'));
        }
      }
      
      return result;
    } catch (error) {
      console.error('文本转图片过程出错:', error);
      return [];
    }
  }

  /**
   * 使用Coze API改写小红书笔记
   * @param note 小红书笔记数据
   */
  async rewriteNote(note: ScrapedNote): Promise<RewrittenNote> {
    try {
      // 构建输入数据
      const inputData: RewriteAPIInput = {
        input: {
          content: note.content,
          images: note.images,
          imagesText: note.imagesText || [],
          title: note.title
        }
      };

      const apiClient = new CozeAPI({
        token: this.token,
        baseURL: 'https://api.coze.cn',
        allowPersonalAccessTokenInBrowser: true,
      });
      
      // 调用改写API
      const res = await apiClient.workflows.runs.create({
        workflow_id: this.workflowId,
        app_id: this.appId,
        is_async: false,
        parameters: {
          input: JSON.stringify(inputData.input),
        },
      }) as unknown as CozeAPIResponse;

      if (res.code !== 0) {
        throw new Error(`API调用失败: ${res.msg}`);
      }
      // 解析JSON字符串数据
      const parsedData = JSON.parse(res.data).output as RewrittenNote;

      // const res = '{"output":{"abstract":"5000字+，约10分钟剧情。惊喜度⭐⭐⭐⭐ 演绎度⭐⭐⭐ 欢乐度⭐⭐⭐⭐ 属于小孩梦穿成长剧情，觉得不完善的宝子们自行发挥 不关我不赞我不给你 #写剧本  #短视频剧本创作  #喜剧  #高中生  #短剧  #超爆小故事  #原创剧本","code":0,"content":"5000字+，大概10分钟的剧情。\\n惊喜度⭐⭐⭐⭐ \\n演绎度⭐⭐⭐ \\n欢乐度⭐⭐⭐⭐ \\n\\n属于小孩梦穿成长剧情，觉得不完善的宝子们自行发挥 不关我不赞我不给你 \\n\\n#写剧本  #短视频剧本创作  #喜剧  #高中生  #短剧  #超爆小故事  #原创剧本\\n\\n### 片名:《梦中的蜕变》\\n#### 剧情梗概:\\n在一个狂风呼啸的夜晚，15岁的晓妍坐在自己的房间里，望着窗外肆虐的狂风，既恐惧又好奇。楼下，父母正为家庭琐事激烈争吵，声音一阵高过一阵，让本就忐忑的晓妍更加心慌意乱，她觉得自己仿佛是个被遗忘的存在，满心都是不被理解的委屈与孤独。\\n\\n这样的情绪促使晓妍做了个决定。她轻轻下床，拿起一支笔和一本爸爸送的笔记本，在最后一页写下一个或许会改变一切的愿望：“我希望能成为大人，这样就能主宰自己的生活，不再受约束。”她的字迹微微颤抖，每个字都饱含着憧憬与激动。\\n\\n随着狂风声渐渐压过父母的争吵，晓妍的眼皮越来越沉，一道道闪电划破夜空，伴着隆隆雷声，仿佛是对她愿望的神秘回应。晓妍眼前一黑，竟变成了一位25岁的成年人。\\n\\n晓妍醒来，发现自己身处一个繁华都市的精致公寓，有一个极具格调的家，还有一份看似不错的工作。\\n\\n晓妍正玩着曾经被限制的手机游戏，突然接到电话，通知她去参加重要会议。她凭借对妈妈的印象，穿上一套利落的职业装，拿着文件，匆匆赶往目的地。到了公司，只见同事们忙忙碌碌，键盘敲击声、电话铃声交织一片。晓妍既兴奋又紧张，深吸一口气，走进会议室。\\n\\n会议中，上司谈论着公司的季度业绩与未来市场规划，晓妍却发现自己根本听不懂那些复杂的商业词汇和数据。她想记笔记，写下的却全是诸如“会议室的灯光好亮”“对面同事的耳环好特别”之类的无关内容。\\n\\n会议结束，晓妍打算尝试“大人”的工作。她坐在电脑前，打开一个看似重要的文档，却完全不知从何下手。她试着点击各种按钮，结果不小心关闭了文档，所有工作内容瞬间消失。晓妍惊慌失措，又不敢向同事求助，只能硬着头皮重新打开文档，装作若无其事。\\n\\n起初，这突如其来的自由让晓妍欣喜若狂。她尝试各种成人活动，独自逛街购物，学着化妆，还去酒吧跳舞。但没过多久，她就发觉成人世界的复杂和责任远超想象。\\n\\n几天后，工作上的压力让晓妍倍感无助。这时，公司市场部的陈宇出现了。陈宇身着笔挺西装，脸上挂着自信的笑容。他来到晓妍办公桌前，轻声询问是否需要帮忙。晓妍看着陈宇，心中莫名一动。陈宇不仅外表帅气，还十分睿智，给晓妍的工作提了不少有用建议。\\n\\n随着时间推移，晓妍和陈宇的关系愈发亲密。陈宇常邀晓妍共进午餐，他们一起探讨工作，分享梦想与计划。然而，晓妍渐渐注意到陈宇的一些行为让她不太舒服。陈宇总想掌控晓妍的工作和生活，不喜欢她和其他同事往来，甚至晓妍想去参加朋友聚会，他都会不高兴。\\n\\n晓妍开始觉得压抑，意识到这段关系并不健康。她反思自己对陈宇的感情，发现自己只是被他的外表和甜言蜜语迷惑，忽略了他的真实性格。\\n\\n一次糟糕的晚餐后，晓妍在公寓彻底崩溃，大哭起来。因为陈宇频繁邀请她参加各种商务晚宴和社交活动，晓妍起初以为这是对她的重视。\\n\\n### 角色分析\\n- **陈宇**\\n    - **年龄**: 梦中设定约27岁\\n    - **性格特点**: 表面上魅力十足、自信且事业有成，实则控制欲强、以自我为中心。他对晓妍最初的关心与帮助，让晓妍误以为他是理想伴侣。\\n    - **发展轨迹**: 随着剧情推进，陈宇逐渐暴露真实面目。他的行为让晓妍感到压抑不适，尤其是试图控制晓妍的社交与职业发展时。最终，他的行为促使晓妍意识到关系的不健康，加深了晓妍对独立和自我价值的认知。\\n- **晓妍的父母**\\n    - **角色关系**: 晓妍的直接监护人和生活中至关重要的角色。\\n    - **性格特点**: 在晓妍眼中，父母或许有些过于严厉、保护过度，但他们的行为源于对晓妍深深的爱和对她未来的关切。\\n    - **发展轨迹**: 在晓妍的梦中，她逐渐理解父母的立场与保护的意义。醒来后，晓妍与父母的关系更加紧密，她愈发感激父母给予的爱与支持。\\n\\n### 分镜头剧本\\n01: **晓妍的房间·夜晚·狂风呼啸**\\n - **画面**: 晓妍坐在窗前，双臂环抱膝盖，眼睛紧盯着窗外狂风中摇曳的树枝，表情复杂。\\n - **台词**：晓妍(小声嘀咕)：“好吓人……可又好刺激……”\\n - **音效**：狂风呼啸声，偶尔夹杂树枝晃动的声音，楼下传来隐隐约约的争吵声。\\n\\n02: **楼下的客厅·夜·内**\\n - **画面**: 父母站在客厅中央，面对面激烈争吵。父亲满脸通红，母亲泪流满面。\\n - **台词**：\\n    - 父亲(愤怒)：“你怎么就不明白我的苦心！”\\n    - 母亲(带着哭腔)：“我为这个家付出这么多，你还不满意？”\\n - **音效**：争吵声，偶尔家具碰撞的声音。\\n\\n03: **晓妍的房间·夜·内**\\n - **画面**: 晓妍从窗前起身，走到床边，钻进被窝蜷缩成一团，眼泪默默流淌。\\n - **台词**：晓妍(心里想)：“为什么他们总是这样，就不能多关心关心我……”\\n - **音效**：狂风声逐渐掩盖争吵声，晓妍轻轻的抽泣声。\\n\\n04: **晓妍的新房间·日·内**\\n - **画面**: 晓妍醒来，躺在一张陌生却豪华的床上。她睁眼环顾四周，一脸惊讶。\\n - **台词**：晓妍(惊讶)：“这是哪儿？”随后看到镜子中的自己，伸手摸脸，震惊道：“我……我真的变成大人了！”\\n - **音效**：轻柔的晨起音乐，房间里安静的氛围音效。\\n\\n05: **日·内·公寓**\\n - **画面**: 晓妍在公寓里四处打量，眼中满是好奇与困惑。\\n - **台词**：晓妍(疑惑自语)：“这是哪儿？我怎么会在这儿？哇，这难道是我的家，也太漂亮了！”\\n - **音效**：轻微的脚步声，家具物品的环境音效。\\n\\n06: **日·内·客厅**\\n - **画面**: 晓妍走到客厅，看到桌上的工作文件和职业装，手机铃声响起，她看到未接来电和短信提醒。\\n - **台词**：晓妍(惊讶)：“这好像是工作服，这梦也太真实了……看来我有重要会议要参加。”\\n - **音效**：手机铃声，短信提示音。\\n\\n07: **日·内·浴室**\\n - **画面**: 晓妍快速洗漱，穿上职业装，对着镜子给自己加油打气。\\n - **台词**：晓妍(微笑着对镜中的自己)：“加油，晓妍，你可以的！”\\n - **音效**：水流声，衣服摩擦声。\\n\\n08: **日·外·公司大楼**\\n - **画面**: 晓妍匆忙赶到公司，同事们来来往往，十分忙碌。\\n - **台词**：\\n    - 同事A(友好)：“早上好，林总。”\\n    - 晓妍(林总)(微笑)：“早上好。” 然后转身偷笑。\\n - **音效**：公司里嘈杂的办公音效，人们的交谈声。\\n\\n09: **日·内·会议室**\\n - **画面**: 晓妍站在会议室门外，深吸一口气后走进，里面同事们都穿着职业装。上司开始讲话。\\n - **台词**：\\n    - 男人(开始会议)：“今天我们探讨公司的季度业绩和未来市场策略。”\\n    - 晓妍(心里想)：“这些人的领带都没我爸的好看。”眼神在同事们身上游离。\\n    - 晓妍OS：“那个姐姐的口红颜色好鲜艳，不知道好不好用。”\\n - **音效**：会议室里的讲话声，偶尔的咳嗽声。\\n\\n10: **日·内·办公区**\\n - **画面**: 会议结束，晓妍回到办公室，打开电脑尝试工作，却不小心关闭文档。\\n - **台词**：晓妍(惊慌失措)：“糟糕！这可怎么办？”\\n - **音效**：电脑操作音效，晓妍紧张的呼吸声。\\n\\n11: **日·内·办公室**\\n - **画面**: 晓妍看到其他同事忙碌，犹豫后向同事求助。\\n - **台词**：晓妍(小声)：“请问，你能帮我看看这个文档吗？”\\n - **音效**：办公室环境音效，轻微的交谈声。\\n\\n12: **日·内·办公室**\\n - **画面**: 在同事帮助下晓妍重新打开文档，继续工作。\\n - **台词**：\\n    - 晓妍(感激)：“谢谢你，我还在适应这份工作。”\\n    - 同事B(尴尬笑着)：“没关系，刚开始都这样。”\\n - **音效**：电脑操作音效，同事间轻声交流声。\\n\\n13: **夜·内·公寓**\\n - **画面**: 晓妍回到家，躺在沙发上，拿起手机翻看社交媒体。\\n - **台词**：晓妍(自言自语)：“今天好累，但也挺充实。或许，这样的生活也不错。”看到手机里一些照片，忍不住多看几眼。\\n - **音效**：轻柔的音乐，手机屏幕滑动音效。\\n\\n14: **日·内·公寓**\\n - **画面**: 晓妍第二天醒来，精神饱满准备出门。\\n - **台词**：晓妍(自信)：“新的挑战，新的开始！既然在做梦，那就出去玩！”穿上漂亮衣服，拿起钱包出门。\\n - **音效**：欢快的音乐，换衣服声音，关门声。\\n\\n15: **日·内·购物中心**\\n - **画面**: 晓妍在购物中心好奇地四处张望，在化妆品店前停下，犹豫后走进。\\n - **台词**：晓妍(自言自语)：“今天我要试试这些化妆品，看看能不能更漂亮。”\\n - **音效**：商场背景音乐，人群嘈杂声。\\n\\n16: **日·内·化妆品店**\\n - **画面**: 店员热情推荐产品，晓妍试用眼影，露出满意笑容。\\n - **台词**：\\n    - 店员：“这款眼影很适合您，能让您眼睛更明亮有神。”\\n    - 晓妍(兴奋)：“真的吗？那我试试这个。”\\n - **音效**：化妆品试用音效，店员介绍声。\\n\\n17: **夜·内·酒吧**\\n - **画面**: 酒吧灯光闪烁，音乐震耳，晓妍穿着时尚站在舞池边，观察一阵后走进舞池跳舞，起初有些拘谨，后来逐渐放松，时间久了，露出一丝不安。\\n - **台词**：晓妍(心里独白)：“这感觉太棒了，所有烦恼都没了。可怎么总觉得哪里不对劲呢？”\\n - **音效**：强烈的音乐声，人群欢呼声，舞池嘈杂声。\\n\\n18: **夜·内·酒吧角落**\\n - **画面**: 晓妍走到角落坐下，翻看手机消息，脸色凝重。\\n - **台词**：晓妍(心里独白)：“成人世界真的美好吗？为什么我觉得很迷茫？”看着周围热闹人群，听着卫生间传来的不明声音，心中满是疑惑。\\n - **音效**：酒吧音乐声变小，手机提示音。\\n\\n19: **夜·内·晓妍的家**\\n - **画面**: 晓妍回到家，坐在沙发上叹气，看着镜子反思。\\n - **台词**：晓妍(自言自语)：“这段时间到底怎么了？我真的喜欢这样吗？”\\n - **音效**：安静的家居环境音效，晓妍的叹息声。\\n\\n20: **办公室内 - 日**\\n - **画面**: 晓妍坐在办公桌前，疲惫地盯着电脑，陈宇微笑着走近。\\n - **台词**：\\n    - 陈宇(微笑着，走近晓妍)：“晓妍，你今天看起来很累，需要帮忙吗？”\\n    - 晓妍(略显迟疑)：“我……其实不太明白这些数据分析。”\\n    - 陈宇(温柔)：“没关系，我教你，我们看看这些数据。”\\n - **音效**：办公室环境音效，轻微的脚步声。\\n\\n21: **咖啡厅内 - 午**\\n - **画面**: 晓妍和陈宇在咖啡厅愉快交谈，面前放着咖啡。\\n - **台词**：\\n    - 晓妍(微笑)：“没想到你对市场分析这么厉害，怎么做到的？”\\n    - 陈宇(自信地笑)：“多年经验和点直觉，最重要是热爱这份工作。”\\n - **音效**：咖啡厅背景音乐，餐具碰撞声。\\n\\n22: **办公室内 - 日**\\n - **画面**: 晓妍坐在办公桌前，陈宇走过来，一脸不悦。\\n - **台词**：\\n    - 陈宇(皱眉)：“晓妍，你最近和其他同事走太近了，应该多专注工作。”\\n    - 晓妍(困惑)：“我只是聊工作，没想到会这样。”\\n    - 陈宇(严厉)：“工作才是重点，你要明白。”\\n - **音效**：办公室安静下来，只有陈宇讲话声。\\n\\n23: **公寓内 - 夜**\\n - **画面**: 晓妍独自在沙发上哭泣，拿着手机不知打给谁。\\n - **台词**：晓妍(自言自语)：“我真的要继续这样吗？”\\n - **音效**：晓妍的哭泣声，寂静的环境音效。\\n\\n24: **公寓门口 - 夜**\\n - **画面**: 陈宇站在门口，微笑但眼神紧张，晓妍迟疑后开门。\\n - **台词**：\\n    - 陈宇(微笑)：“晓妍，我来看看你。”\\n    - 晓妍(勉强笑着)：“进来吧。”\\n - **音效**：门铃声音，开门声。\\n\\n25: **公寓内 - 夜**\\n - **画面**: 晓妍和陈宇坐在沙发上，气氛尴尬，陈宇突然靠近晓妍想亲吻她，晓妍惊恐推开。\\n - **台词**：\\n    - 陈宇(突然靠近晓妍)：“晓妍，我想告诉你……”\\n    - 晓妍(惊恐)：“陈宇，别这样！”\\n    - 陈宇(愤怒站起来)：“你在干嘛？你不是喜欢我吗？”\\n    - 晓妍(坚定指向门口)：“请你离开，我不想看到你。”\\n - **音效**：沙发挪动声，陈宇激动的呼吸声。\\n\\n26: **公寓门口 - 夜**\\n - **画面**: 陈宇在门口气急败坏拍门喊叫，晓妍在门内背靠门哭泣。\\n - **台词**：\\n    - 陈宇(大喊)：“晓妍，你会后悔拒绝我的！”\\n    - 晓妍(哭泣)：“为什么会这样……”\\n - **音效**：拍门声，陈宇喊叫声，晓妍哭泣声。\\n\\n27: **公寓内 - 夜**\\n - **画面**: 晓妍坐在床边，回忆童年，想念父母。\\n - **台词**：晓妍(自言自语)：“爸爸妈妈，我好想你们。”然后躺下入睡。\\n - **音效**：轻柔的回忆音乐，晓妍平缓的呼吸声。\\n\\n28: **晓妍的梦境 - 日**\\n - **画面**: 晓妍在梦中回到童年，和父母快乐相处，醒来看到父母在床边。\\n - **台词**：\\n    - 晓妍(梦中)：“我好想回到这里……”\\n    - 晓妍母亲(擦汗)：“晓妍，你终于醒了。”\\n - **音效**：温馨的音乐，父母关切的询问声。\\n\\n29: **公寓内 - 日**\\n - **画面**: 晓妍感激看着父母，起身准备新一天。\\n - **台词**：晓妍(微笑)：“这才是我真正的新开始，新的生活。”\\n - **音效**：轻快的音乐，预示新开始的音效。","title":"高中生盼的一瞬变大人✨剧本来啦"}}'
      // // 解析JSON字符串数据
      // const parsedData = JSON.parse(res).output as RewrittenNote;
      
      // 检查响应状态
      if (parsedData.code !== 0) {
        throw new Error(`改写处理失败: code=${parsedData.code}`);
      }
      
      try {
        // 使用DocumentPaginationService处理内容，生成文档风格的分页及图片
        console.log(`开始处理文档分页及图片生成...`);
        const processResult = await documentPaginationService.processContent(parsedData.content);
        
        // 保存分页内容和生成的图片到结果中
        parsedData.contentPages = processResult.contentPages;
        parsedData.generatedImages = processResult.images;
        
        console.log(`处理完成，共生成${processResult.contentPages.length}页内容和${processResult.images.length}张图片`);
      } catch (error) {
        console.error('生成文档图片时出错:', error);
        // 出错时不影响整体流程，继续返回已有内容
        // 使用原有方法进行简单分页（不生成图片）
        parsedData.contentPages = this.splitContentIntoPages(parsedData.content);
      }
      
      return parsedData;
    } catch (error) {
      console.error('改写笔记时出错:', error);
      throw error;
    }
  }

  /**
   * 批量改写小红书笔记
   * @param notes 小红书笔记数据数组
   */
  async rewriteMultipleNotes(notes: ScrapedNote[]): Promise<(RewrittenNote | null)[]> {
    try {
      // 同时发起多个请求，提高效率
      // 由于图片生成可能比较消耗资源，这里改为串行处理，避免浏览器崩溃
      const results: (RewrittenNote | null)[] = [];
      
      for (const note of notes) {
        try {
          console.log(`正在处理笔记: ${note.title}`);
          const rewritten = await this.rewriteNote(note);
          results.push(rewritten);
        } catch (error) {
          console.error(`处理笔记失败: ${note.title}`, error);
          results.push(null);
        }
      }
      
      return results;
    } catch (error) {
      console.error('批量改写笔记时出错:', error);
      throw error;
    }
  }
}

export const redBookRewriteService = new RedBookRewriteService(); 