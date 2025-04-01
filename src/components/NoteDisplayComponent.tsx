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

  // Format content with paragraphs
  const formattedContent = content.split("\n").map((paragraph, index) => (
    <p key={index} className="mb-3">
      {paragraph}
    </p>
  ));

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
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
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
      <div className="p-4">
        <div className="text-gray-700 prose max-w-none">
          {showFullContent ? (
            formattedContent
          ) : (
            <>
              {content.length > 200 ? (
                <>
                  {formattedContent.slice(0, 2)}{" "}
                  <span className="text-pink-500">...</span>
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
        <div className="p-4 pt-0">
          <h4 className="text-sm font-medium text-gray-700 mb-2">笔记图片</h4>
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
