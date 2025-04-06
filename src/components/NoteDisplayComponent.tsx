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
import { RewrittenNote } from "../services/RedBookRewriteService";

interface NoteDisplayProps {
  note: ScrapedNote | FetchItem | RewrittenNote;
  showFullContent?: boolean;
}

const NoteDisplayComponent: React.FC<NoteDisplayProps> = ({
  note,
  showFullContent = false,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [videoState, setVideoState] = useState<
    "initial" | "playing" | "paused"
  >("initial");
  const videoRef = useRef<HTMLVideoElement>(null);

  // State to track which type of images we're viewing in lightbox
  const [currentImageType, setCurrentImageType] = useState<
    "regular" | "generated"
  >("regular");

  // Check if the note is a ScrapedNote, FetchItem, or RewrittenNote and normalize the data
  const images = "images" in note ? note.images : [];
  const generatedImages =
    "generatedImages" in note ? note.generatedImages || [] : [];
  const coverImage =
    "coverImage" in note
      ? note.coverImage
      : "images" in note && note.images?.length > 0
      ? note.images[0]
      : "";
  const video = "video" in note ? note.video : undefined;
  const hasVideo = typeof video === "string" && video.length > 0;
  const hasImages = "images" in note && note.images && note.images.length > 0;
  const hasGeneratedImages = generatedImages && generatedImages.length > 0;
  const title = note.title || "";
  const content = note.content || "";
  const abstract = ("abstract" in note && note.abstract) || "";
  const author =
    "authorName" in note
      ? note.authorName
      : "author" in note
      ? note.author
      : "未知作者";
  const publishTime = "publishTime" in note ? note.publishTime : "";
  const likes = "likes" in note ? note.likes : 0;
  const comments = "comments" in note ? note.comments : 0;

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
  const openLightbox = (
    index: number,
    imageType: "regular" | "generated" = "regular"
  ) => {
    // Store the current image type
    setCurrentImageType(imageType);
    setActiveImageIndex(index);
  };

  const closeLightbox = () => {
    setActiveImageIndex(null);
  };

  // Handle video controls
  const handleVideoClick = () => {
    if (!videoRef.current) return;

    switch (videoState) {
      case "initial":
        // 从封面态开始播放
        setVideoState("playing");
        // 确保在状态更新后立即播放视频
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.error("Video playback failed:", error);
              setVideoState("initial");
            });
          }
        }, 0);
        break;
      case "playing":
        // 播放时点击暂停
        videoRef.current.pause();
        setVideoState("paused");
        break;
      case "paused":
        // 暂停时点击继续播放
        videoRef.current.play().catch((error) => {
          console.error("Video playback failed:", error);
          setVideoState("paused");
        });
        setVideoState("playing");
        break;
    }
  };

  const handleVideoEnd = () => {
    // 播放结束回到封面态
    setVideoState("initial");
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoPause = () => {
    // 只有在非初始状态时才更新为暂停状态
    if (videoState !== "initial") {
      setVideoState("paused");
    }
  };

  const handleVideoPlay = () => {
    setVideoState("playing");
  };

  const openVideoFullscreen = () => {
    setIsVideoFullscreen(true);
    setVideoState("playing");
  };

  const closeVideoFullscreen = () => {
    setIsVideoFullscreen(false);
    setVideoState("initial");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // 处理图片导航
  const navigateImage = useCallback(
    (direction: "prev" | "next") => {
      if (activeImageIndex === null) return;

      // Determine which image array to use
      const imageArray =
        currentImageType === "generated" ? generatedImages : images;
      if (!imageArray.length) return;

      let newIndex;
      if (direction === "prev") {
        newIndex = activeImageIndex - 1;
        if (newIndex < 0) newIndex = imageArray.length - 1;
      } else {
        newIndex = activeImageIndex + 1;
        if (newIndex >= imageArray.length) newIndex = 0;
      }
      setActiveImageIndex(newIndex);
    },
    [activeImageIndex, images, generatedImages, currentImageType]
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
        {abstract && (
          <p className="text-gray-500 mt-2 mb-2 text-base italic">{abstract}</p>
        )}
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
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={video}
              controls={videoState !== "initial"}
              poster={coverImage}
              onEnded={handleVideoEnd}
              onPause={handleVideoPause}
              onPlay={handleVideoPlay}
              crossOrigin="anonymous"
              preload="metadata"
              style={{ display: videoState === "initial" ? "none" : "block" }}
            />
            {videoState === "initial" && (
              <>
                <img
                  src={coverImage}
                  alt={title}
                  crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                  onClick={handleVideoClick}
                >
                  <div className="relative p-4">
                    <div className="absolute inset-0 bg-black/40 rounded-full backdrop-blur-[2px] transform transition-all duration-200 group-hover:bg-black/60" />
                    <FiPlay
                      size={36}
                      className="relative text-white transform transition-all duration-200 group-hover:scale-110"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {videoState !== "initial" && (
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={handleVideoClick}
            />
          )}

          {/* 全屏按钮 */}
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
              crossOrigin="anonymous"
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
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Images from Content */}
      {hasGeneratedImages && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">内容图片</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {generatedImages.map((image, index) => (
              <div
                key={`gen-${index}`}
                className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity duration-200 shadow-md"
                onClick={() => {
                  // For generated images, use the 'generated' type
                  openLightbox(index, "generated");
                }}
              >
                <div className="aspect-[3/4]">
                  <img
                    src={image}
                    alt={`内容图片 ${index + 1}`}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
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
                ref={videoRef}
                className="max-w-full max-h-full"
                src={video}
                controls
                autoPlay
                poster={coverImage}
                onEnded={handleVideoEnd}
                onPause={handleVideoPause}
                onPlay={handleVideoPlay}
                crossOrigin="anonymous"
                preload="metadata"
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
                src={
                  currentImageType === "generated"
                    ? generatedImages[activeImageIndex]
                    : images[activeImageIndex]
                }
                alt={`全屏图片 ${activeImageIndex + 1}`}
                crossOrigin="anonymous"
                className="max-w-full max-h-[90vh] object-contain select-none"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>

            {/* 图片计数器 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
              {activeImageIndex + 1} /{" "}
              {currentImageType === "generated"
                ? generatedImages.length
                : images.length}
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
