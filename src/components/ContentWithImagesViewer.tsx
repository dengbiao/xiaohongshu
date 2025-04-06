import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCopy,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCw,
  FiScissors,
  FiSave,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import { InlineMath, BlockMath } from "react-katex";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  DocumentPaginationService,
  documentPaginationService,
} from "../services/DocumentPaginationService";

interface ContentWithImagesViewerProps {
  title: string;
  content: string;
  images: string[];
  abstract?: string;
  onRewrite?: () => void;
  onContentChange?: (updatedContent: string, updatedImages: string[]) => void;
}

/**
 * 内容与图片查看器组件
 * 显示改写后的内容和底部的图片网格，支持点击查看大图
 */
const ContentWithImagesViewer: React.FC<ContentWithImagesViewerProps> = ({
  title,
  content,
  images,
  abstract,
  onRewrite,
  onContentChange,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [processingImages, setProcessingImages] = useState(false);
  const [currentImages, setCurrentImages] = useState(images);

  // 当外部content变化时，更新内部状态
  useEffect(() => {
    setEditableContent(content);
    setCurrentImages(images);
  }, [content, images]);

  // 渲染分页符组件
  const renderPageBreak = (key: string | number) => {
    return (
      <div key={`pagebreak-${key}`} className="w-full my-6 relative">
        <div className="relative flex items-center">
          <div className="flex-grow h-0 border-t border-dashed border-gray-300"></div>
          <div className="mx-2 px-2 bg-white text-xs text-pink-400 flex items-center">
            <FiScissors className="mr-1" size={12} />
            <span className="text-gray-500">分页符</span>
          </div>
          <div className="flex-grow h-0 border-t border-dashed border-gray-300"></div>
        </div>
      </div>
    );
  };

  // 格式化内容 - 用于非Markdown内容（兼容旧格式）
  const formatContent = (text: string) => {
    // 将制表符转换为换行符，然后按单个换行符分割
    const processedText = text.replace(/\t/g, "\n");

    // 使用更可靠的方式分割文本和分页符
    const result = [];
    const parts = processedText.split(
      DocumentPaginationService.PAGE_BREAK_MARKER
    );

    // 对每个部分单独处理，并在每个部分之间添加分页符
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        // 添加分页符
        result.push(renderPageBreak(`text-${i}`));
      }

      // 处理文本部分
      const paragraphs = parts[i].split("\n");
      for (const [pIndex, paragraph] of paragraphs.entries()) {
        // 处理链接
        const processLinks = (text: string) => {
          return text.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" class="text-pink-500 hover:text-pink-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
          );
        };

        // 处理标签
        const processTags = (text: string) => {
          return text.replace(
            /#([^#\s]+)/g,
            '<span class="text-pink-500">#$1</span>'
          );
        };

        // 处理@提及
        const processMentions = (text: string) => {
          return text.replace(
            /@([^\s]+)/g,
            '<span class="text-blue-500">@$1</span>'
          );
        };

        // 处理表情符号 - 增加适当的间距
        const processEmoji = (text: string) => {
          return text.replace(
            /([\u{1F300}-\u{1F9FF}])/gu,
            '<span class="inline-block mx-0.5">$1</span>'
          );
        };

        // 应用所有格式化
        let formattedText = paragraph;
        formattedText = processLinks(formattedText);
        formattedText = processTags(formattedText);
        formattedText = processMentions(formattedText);
        formattedText = processEmoji(formattedText);

        result.push(
          <p
            key={`p-${i}-${pIndex}`}
            className="leading-relaxed tracking-wide whitespace-pre-wrap"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              letterSpacing: "0.025em",
              wordSpacing: "0.05em",
              minHeight: "1.5em", // 确保空行也有高度
              marginBottom: "0.5em", // 统一的段落间距
            }}
            dangerouslySetInnerHTML={{ __html: formattedText || " " }} // 空行使用空格
          />
        );
      }
    }

    return result;
  };

  // 检测内容是否为Markdown格式
  const containsMarkdown = (text: string): boolean => {
    // 检查是否包含常见的Markdown语法
    const markdownPatterns = [
      /^#+\s+.+$/m, // 标题
      /\*\*.+?\*\*/, // 粗体
      /\*.+?\*/, // 斜体
      /!\[.+?\]\(.+?\)/, // 图片
      /\[.+?\]\(.+?\)/, // 链接
      /^>\s+.+$/m, // 引用
      /^-\s+.+$/m, // 无序列表
      /^[0-9]+\.\s+.+$/m, // 有序列表
      /^```[\s\S]+?```$/m, // 代码块
      /`[^`]+`/, // 行内代码
      /^\|.+\|.+\|$/m, // 表格
      /^---$/m, // 分隔线
    ];

    return markdownPatterns.some((pattern) => pattern.test(text));
  };

  // 复制内容到剪贴板
  const copyToClipboard = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("已复制内容到剪贴板");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  // 打开图片查看器
  const openImageViewer = (index: number) => {
    setActiveImageIndex(index);
  };

  // 关闭图片查看器
  const closeImageViewer = () => {
    setActiveImageIndex(null);
  };

  // 导航到上一张或下一张图片
  const navigateImage = (direction: "prev" | "next") => {
    if (
      activeImageIndex === null ||
      !currentImages ||
      currentImages.length === 0
    )
      return;

    if (direction === "prev") {
      setActiveImageIndex(
        activeImageIndex === 0 ? currentImages.length - 1 : activeImageIndex - 1
      );
    } else {
      setActiveImageIndex(
        activeImageIndex === currentImages.length - 1 ? 0 : activeImageIndex + 1
      );
    }
  };

  // 键盘导航
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null) return;

      if (e.key === "ArrowLeft") {
        navigateImage("prev");
      } else if (e.key === "ArrowRight") {
        navigateImage("next");
      } else if (e.key === "Escape") {
        closeImageViewer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex]);

  // 插入分页符
  const insertPageBreak = () => {
    // 在编辑模式下，使用textarea的selectionStart和selectionEnd属性
    if (isEditMode) {
      const textarea = document.querySelector(
        "textarea"
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      // 保存当前滚动位置
      const scrollTop = textarea.scrollTop;

      const { selectionStart, selectionEnd } = textarea;
      const beforeText = editableContent.substring(0, selectionStart);
      const afterText = editableContent.substring(selectionEnd);

      // 插入分页符
      const updatedContent =
        beforeText +
        "\n" +
        DocumentPaginationService.PAGE_BREAK_MARKER +
        "\n" +
        afterText;
      setEditableContent(updatedContent);

      // 设置光标到分页符后面并恢复滚动位置
      setTimeout(() => {
        textarea.focus();
        const newCursorPos =
          selectionStart +
          DocumentPaginationService.PAGE_BREAK_MARKER.length +
          2;
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        // 恢复滚动位置
        textarea.scrollTop = scrollTop;
      }, 10);

      toast.success("已插入分页符");
      return;
    }

    // 以下是非编辑模式下的旧逻辑，但实际上在非编辑模式下不应该调用此函数
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // 获取当前选区
    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;

    // 找到光标位置对应的段落
    let paragraphElement = startNode;
    if (startNode.nodeType === Node.TEXT_NODE) {
      paragraphElement = startNode.parentElement;
    }

    // 找到包含段落的父容器
    while (
      paragraphElement &&
      paragraphElement.nodeName !== "P" &&
      paragraphElement.nodeName !== "DIV"
    ) {
      paragraphElement = paragraphElement.parentElement;
    }

    if (!paragraphElement) {
      toast.error("无法确定插入位置，请尝试重新选择");
      return;
    }

    // 在文本中插入分页符
    const caretPosition = range.startOffset;
    const beforeText = editableContent.substring(0, caretPosition);
    const afterText = editableContent.substring(caretPosition);

    // 插入分页符
    const updatedContent =
      beforeText +
      "\n" +
      DocumentPaginationService.PAGE_BREAK_MARKER +
      "\n" +
      afterText;
    setEditableContent(updatedContent);

    toast.success("已插入分页符");
  };

  // 移除分页符
  const handleRemovePageBreak = (index: number) => {
    // 将内容分割为行
    const lines = editableContent.split("\n");

    // 找到并移除分页符
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === DocumentPaginationService.PAGE_BREAK_MARKER) {
        if (index === 0) {
          // 移除这一行
          lines.splice(i, 1);
          break;
        }
        index--;
      }
    }

    // 重新组合内容
    const updatedContent = lines.join("\n");
    setEditableContent(updatedContent);

    toast.success("已移除分页符");
  };

  // 保存更新的内容
  const saveContent = async () => {
    setProcessingImages(true);

    try {
      // 开始处理更新后的内容，重新生成分页和图片
      const result = await documentPaginationService.reprocessContent(
        editableContent,
        currentImages
      );

      setCurrentImages(result.images);

      // 如果有回调函数，通知父组件内容已更新
      if (onContentChange) {
        onContentChange(editableContent, result.images);
      }

      toast.success("内容已更新，图片已重新生成");
      setIsEditMode(false);
    } catch (error) {
      console.error("更新内容时出错:", error);
      toast.error("更新内容时出错，请重试");
    } finally {
      setProcessingImages(false);
    }
  };

  const hasImages = currentImages && currentImages.length > 0;
  const isMarkdown = containsMarkdown(editableContent);

  // 处理Markdown内容，预处理分页符
  const processMarkdownContent = () => {
    if (!editableContent) return editableContent;

    // 分割内容为Markdown部分和分页符部分
    const parts = editableContent.split(
      DocumentPaginationService.PAGE_BREAK_MARKER
    );

    // 如果没有分页符，直接返回原始内容
    if (parts.length === 1) return editableContent;

    // 否则，返回预处理后的内容
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={`md-part-${index}`}>
            {index > 0 && renderPageBreak(`md-${index}`)}
            {part && (
              <ReactMarkdown
                className="markdown-body"
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {part}
              </ReactMarkdown>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 顶部标题区域 */}
      <div className="p-4 border-b">
        <h3
          className="text-xl font-semibold text-gray-800 mb-1"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        {abstract && (
          <p className="text-gray-500 mt-2 mb-2 text-base italic">{abstract}</p>
        )}
        <div className="flex justify-end space-x-2">
          {/* 编辑模式切换按钮 */}
          {!isEditMode ? (
            <>
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm transition-colors"
                title="编辑内容"
              >
                <FiScissors size={14} />
                <span>编辑分页</span>
              </button>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
                title="复制内容"
              >
                {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                <span>{copied ? "已复制" : "复制内容"}</span>
              </button>

              {onRewrite && (
                <button
                  onClick={onRewrite}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
                  title="重新改写"
                >
                  <FiRotateCw size={14} />
                  <span>重新改写</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={insertPageBreak}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm transition-colors"
                title="插入分页符"
                disabled={processingImages}
              >
                <FiScissors size={14} />
                <span>插入分页符</span>
              </button>

              <button
                onClick={saveContent}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm transition-colors"
                title="保存更改"
                disabled={processingImages}
              >
                {processingImages ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span>
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={14} />
                    <span>保存更改</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setEditableContent(content);
                  setIsEditMode(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
                title="取消编辑"
                disabled={processingImages}
              >
                <FiX size={14} />
                <span>取消</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {isEditMode ? (
          <div className="relative">
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full h-[500px] p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none resize-y font-mono text-sm"
              placeholder="在此编辑内容..."
              disabled={processingImages}
              style={{ lineHeight: "1.6" }}
            />
            <div className="mt-3 mb-1 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 flex items-center mb-1">
                <FiScissors className="mr-2" /> 分页符使用指南
              </h4>
              <div className="text-xs text-blue-700">
                <p className="mb-2">
                  • 编辑模式下使用文本{" "}
                  <code className="bg-white px-2 py-0.5 rounded border border-blue-200">
                    {DocumentPaginationService.PAGE_BREAK_MARKER}
                  </code>{" "}
                  表示分页符
                </p>
                <p>
                  • 可以通过点击"插入分页符"按钮或直接在文本中输入来添加分页符
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="text-gray-800 prose max-w-none"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            {isMarkdown ? (
              editableContent.includes(
                DocumentPaginationService.PAGE_BREAK_MARKER
              ) ? (
                processMarkdownContent()
              ) : (
                <ReactMarkdown
                  className="markdown-body"
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                >
                  {editableContent}
                </ReactMarkdown>
              )
            ) : (
              formatContent(editableContent)
            )}
          </div>
        )}
      </div>

      {/* 底部图片网格 */}
      {hasImages && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">内容图片</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentImages.map((image, index) => (
              <div
                key={`img-${index}`}
                className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity duration-200 shadow-md"
                onClick={() => openImageViewer(index)}
              >
                <div className="aspect-[3/4]">
                  <img
                    src={image}
                    alt={`内容图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  第 {index + 1} 页
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图片全屏查看器 */}
      <AnimatePresence>
        {activeImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={(e) => {
              // 只有点击背景时才关闭
              if (e.target === e.currentTarget) {
                closeImageViewer();
              }
            }}
          >
            {/* 关闭按钮 */}
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-gray-800 rounded-full z-50"
              onClick={closeImageViewer}
            >
              <FiX size={24} />
            </button>

            {/* 左箭头 */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-gray-800/50 rounded-full z-50 transition-all duration-200 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage("prev");
              }}
            >
              <FiChevronLeft size={32} />
            </button>

            {/* 右箭头 */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-gray-800/50 rounded-full z-50 transition-all duration-200 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage("next");
              }}
            >
              <FiChevronRight size={32} />
            </button>

            {/* 图片 */}
            <motion.div
              key={activeImageIndex}
              className="relative flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <img
                src={currentImages[activeImageIndex]}
                alt={`全屏图片 ${activeImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain select-none"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>

            {/* 图片计数器 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
              {activeImageIndex + 1} / {currentImages.length}
            </div>

            {/* 键盘快捷键提示 */}
            <div className="absolute bottom-4 right-4 text-white/70 text-sm flex gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded">←</kbd>
                <span>上一张</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded">→</kbd>
                <span>下一张</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd>
                <span>关闭</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentWithImagesViewer;
