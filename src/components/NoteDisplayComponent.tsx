import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiUser,
  FiClock,
  FiThumbsUp,
  FiMessageSquare,
  FiMaximize2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMaximize,
  FiPlay,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ScrapedNote } from "../services/RedBookScraperService";
import { FetchItem } from "../stores/fetchStore";

interface NoteDisplayProps {
  note: ScrapedNote | FetchItem;
  showFullContent?: boolean;
}

const NoteDisplayComponent: React.FC<NoteDisplayProps> = ({
  note,
  showFullContent = false,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if the note is a ScrapedNote or FetchItem and normalize the data
  const images = "images" in note ? note.images : [];
  const coverImage =
    "coverImage" in note ? note.coverImage : note.images?.[0] || "";
  const video = "video" in note ? note.video : undefined;
  const hasVideo = typeof video === "string" && video.length > 0;
  const hasImages = images && images.length > 0;
  const title = note.title || "";
  const content = note.content || "";
  const author =
    "authorName" in note ? note.authorName : note.author || "未知作者";
  const publishTime =
    "publishTime" in note ? note.publishTime : note.publishTime || "";
  const likes = "likes" in note ? note.likes : note.likes || 0;
  const comments = "comments" in note ? note.comments : note.comments || 0;

  // Format content with enhanced text processing
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

  const formattedContent = formatContent(content);

  // Handle lightbox open and close
  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
  };

  const closeLightbox = () => {
    setActiveImageIndex(null);
  };

  // Handle video controls
  const toggleVideo = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const openVideoFullscreen = () => {
    setIsVideoFullscreen(true);
    setIsVideoPlaying(true);
  };

  const closeVideoFullscreen = () => {
    setIsVideoFullscreen(false);
    setIsVideoPlaying(false);
  };

  // 处理图片导航
  const navigateImage = useCallback(
    (direction: "prev" | "next") => {
      if (activeImageIndex === null || !images.length) return;

      let newIndex;
      if (direction === "prev") {
        newIndex =
          activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1;
      } else {
        newIndex =
          activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1;
      }
      setActiveImageIndex(newIndex);
    },
    [activeImageIndex, images.length]
  );

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          navigateImage("prev");
          break;
        case "ArrowRight":
          e.preventDefault();
          navigateImage("next");
          break;
        case "Escape":
          e.preventDefault();
          closeLightbox();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, navigateImage, closeLightbox]);

  // Add ESC key handler for video fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVideoFullscreen && e.key === "Escape") {
        e.preventDefault();
        closeVideoFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVideoFullscreen]);

  // 处理视频加载
  const handleVideoLoad = useCallback((videoElement: HTMLVideoElement) => {
    if (!videoElement) return;

    // 设置视频请求头
    const originalFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (
        typeof input === "string" &&
        (input.includes("xhscdn.com") || input.includes("xiaohongshu.com"))
      ) {
        const headers = {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "cache-control": "max-age=0",
          "if-modified-since": new Date().toUTCString(),
          priority: "u=0, i",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        };

        return originalFetch(input, {
          ...init,
          headers: {
            ...headers,
            ...(init?.headers || {}),
          },
          referrerPolicy: "no-referrer",
          mode: "navigate",
          credentials: "omit",
        });
      }
      return originalFetch(input, init);
    };

    // 清理函数
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // 在组件挂载时设置视频元素
  useEffect(() => {
    if (videoRef.current) {
      const cleanup = handleVideoLoad(videoRef.current);
      return () => {
        cleanup?.();
      };
    }
  }, [handleVideoLoad]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Note Header */}
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
        <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
          <span className="flex items-center">
            <FiUser className="mr-1" /> {author}
          </span>
          {publishTime && (
            <span className="flex items-center">
              <FiClock className="mr-1" /> {publishTime}
            </span>
          )}
          <span className="flex items-center">
            <FiThumbsUp className="mr-1" /> {likes}
          </span>
          <span className="flex items-center">
            <FiMessageSquare className="mr-1" /> {comments}
          </span>
        </div>
      </div>

      {/* Cover Image or Video */}
      {hasVideo ? (
        <div className="relative w-full pt-[56.25%] bg-gray-100 group">
          {isVideoPlaying ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain"
              src={video}
              controls
              autoPlay
              poster={coverImage}
              onEnded={() => setIsVideoPlaying(false)}
              onPause={() => setIsVideoPlaying(false)}
              onPlay={() => setIsVideoPlaying(true)}
              crossOrigin="anonymous"
              preload="metadata"
            />
          ) : (
            <>
              <img
                src={coverImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={toggleVideo}
              >
                <div className="relative p-4">
                  {/* 半透明黑色圆圈背景 */}
                  <div className="absolute inset-0 bg-black/40 rounded-full backdrop-blur-[2px] transform transition-all duration-200 group-hover:bg-black/60" />
                  {/* 播放图标 */}
                  <FiPlay
                    size={36}
                    className="relative text-white transform transition-all duration-200 group-hover:scale-110"
                    strokeWidth={2.5}
                  />
                </div>
              </div>
            </>
          )}

          <button
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
            onClick={openVideoFullscreen}
          >
            <FiMaximize size={20} />
          </button>
        </div>
      ) : (
        hasImages && (
          <div className="relative w-full overflow-hidden bg-gray-100 flex justify-center">
            <img
              src={coverImage}
              alt={title}
              className="w-full object-contain max-h-[400px]"
            />
          </div>
        )
      )}

      {/* Content */}
      <div className="p-6">
        <div
          className="text-gray-800 prose max-w-none"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {showFullContent ? (
            formattedContent
          ) : (
            <>
              {content.length > 200 ? (
                <>
                  {formattedContent.slice(0, 2)}
                  <p className="text-pink-500 mt-2">...</p>
                </>
              ) : (
                formattedContent
              )}
            </>
          )}
        </div>
      </div>

      {/* Additional Images (Grid Display) */}
      {hasImages && images.length > 1 && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">笔记图片</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-200"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Fullscreen */}
      <AnimatePresence>
        {isVideoFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-gray-800 rounded-full z-50"
              onClick={closeVideoFullscreen}
            >
              <FiX size={24} />
            </button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex items-center justify-center p-4"
            >
              <video
                className="max-w-full max-h-full"
                src={video}
                controls
                autoPlay
                poster={coverImage}
                onEnded={() => setIsVideoPlaying(false)}
                onPause={() => setIsVideoPlaying(false)}
                onPlay={() => setIsVideoPlaying(true)}
              />
            </motion.div>

            {/* 键盘快捷键提示 */}
            <div className="absolute bottom-4 right-4 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd>
                <span>关闭</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
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
                closeLightbox();
              }
            }}
          >
            {/* 关闭按钮 */}
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-gray-800 rounded-full z-50"
              onClick={closeLightbox}
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

export default NoteDisplayComponent;
