import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCopy,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCw,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface ContentWithImagesViewerProps {
  title: string;
  content: string;
  images: string[];
  abstract?: string;
  onRewrite?: () => void;
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
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // 格式化内容
  const formatContent = (text: string) => {
    // 将制表符转换为换行符，然后按单个换行符分割
    const processedText = text.replace(/\t/g, "\n");
    // 使用单个换行符分割，这样可以保留所有空行
    const paragraphs = processedText.split("\n");

    return paragraphs.map((paragraph, index) => {
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

      return (
        <p
          key={index}
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
    });
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
    if (activeImageIndex === null || !images || images.length === 0) return;

    if (direction === "prev") {
      setActiveImageIndex(
        activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1
      );
    } else {
      setActiveImageIndex(
        activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1
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

  const hasImages = images && images.length > 0;

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
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        <div
          className="text-gray-800 prose max-w-none"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {formatContent(content)}
        </div>
      </div>

      {/* 底部图片网格 */}
      {hasImages && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">内容图片</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image, index) => (
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
                src={images[activeImageIndex]}
                alt={`全屏图片 ${activeImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain select-none"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>

            {/* 图片计数器 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
              {activeImageIndex + 1} / {images.length}
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
