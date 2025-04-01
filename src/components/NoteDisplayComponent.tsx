import React, { useState } from "react";
import {
  FiUser,
  FiClock,
  FiThumbsUp,
  FiMessageSquare,
  FiMaximize2,
  FiX,
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

  // Check if the note is a ScrapedNote or FetchItem and normalize the data
  const images = "images" in note ? note.images : [];
  const coverImage =
    "coverImage" in note ? note.coverImage : note.images?.[0] || "";
  const video = "video" in note ? note.video : undefined;
  const hasVideo = !!video;
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
        <div className="relative w-full pt-[56.25%] bg-gray-100">
          <video
            className="absolute inset-0 w-full h-full object-contain"
            src={video}
            controls
            poster={coverImage}
          />
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

      {/* Image Lightbox */}
      <AnimatePresence>
        {activeImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-gray-800 rounded-full"
              onClick={closeLightbox}
            >
              <FiX size={24} />
            </button>

            <img
              src={images[activeImageIndex]}
              alt={`全屏图片 ${activeImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {activeImageIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoteDisplayComponent;
