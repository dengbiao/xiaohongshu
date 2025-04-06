import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import styles from "./DocumentPageViewer.module.css";

interface DocumentPageViewerProps {
  pages: string[];
  images: string[];
  title?: string;
}

/**
 * 文档页面查看器组件
 * 显示文档样式的内容页面和对应生成的图片
 */
const DocumentPageViewer: React.FC<DocumentPageViewerProps> = ({
  pages,
  images,
  title,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<"document" | "image">("document");
  const [copied, setCopied] = useState(false);

  const totalPages = pages?.length || 0;

  // 没有页面时显示提示
  if (!pages || pages.length === 0) {
    return <div className={styles.emptyState}>暂无文档内容</div>;
  }

  // 切换到上一页
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 切换到下一页
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 将文本内容的换行符转换为HTML换行标签
  const formatContent = (content: string) => {
    if (!content) return "";

    // 处理Markdown和特殊格式
    return content
      .replace(/\n/g, "<br/>")
      .replace(/### (.*?)$/gm, "<h3>$1</h3>")
      .replace(/#### (.*?)$/gm, "<h4>$1</h4>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  };

  // 复制当前页内容到剪贴板
  const copyCurrentPage = () => {
    if (pages[currentPage]) {
      navigator.clipboard.writeText(pages[currentPage]);
      setCopied(true);
      toast.success("已复制当前页内容到剪贴板");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  // 复制全部内容到剪贴板
  const copyAllContent = () => {
    if (pages && pages.length > 0) {
      const allContent = pages.join("\n\n----- 分页 -----\n\n");
      navigator.clipboard.writeText(allContent);
      setCopied(true);
      toast.success("已复制全部内容到剪贴板");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.controls}>
          <button
            className={`${styles.viewToggle} ${
              viewMode === "document" ? styles.activeToggle : ""
            }`}
            onClick={() => setViewMode("document")}
          >
            查看文档
          </button>
          <button
            className={`${styles.viewToggle} ${
              viewMode === "image" ? styles.activeToggle : ""
            }`}
            onClick={() => setViewMode("image")}
          >
            查看图片
          </button>
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={goToPrevPage}
              disabled={currentPage === 0}
            >
              上一页
            </button>
            <span className={styles.pageInfo}>
              {currentPage + 1} / {totalPages}
            </span>
            <button
              className={styles.pageButton}
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {viewMode === "document" ? (
          <div className={styles.documentPage}>
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={copyCurrentPage}
                title="复制当前页内容"
              >
                {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                <span className={styles.actionText}>复制当前页</span>
              </button>
              <button
                className={styles.actionButton}
                onClick={copyAllContent}
                title="复制全部内容"
              >
                <FiCopy size={16} />
                <span className={styles.actionText}>复制全部</span>
              </button>
            </div>
            <div
              className={styles.pageContent}
              dangerouslySetInnerHTML={{
                __html: formatContent(pages[currentPage]),
              }}
            />
          </div>
        ) : (
          <div className={styles.imagePage}>
            {images && images.length > 0 && images[currentPage] ? (
              <img
                src={images[currentPage]}
                alt={`页面 ${currentPage + 1}`}
                className={styles.pageImage}
                loading="lazy"
                onError={(e) => {
                  console.error("图片加载失败", e);
                  // 设置一个默认图片
                  (e.target as HTMLImageElement).src =
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                  (e.target as HTMLImageElement).alt = "图片加载失败";
                  (e.target as HTMLImageElement).style.border =
                    "1px solid #ddd";
                  (e.target as HTMLImageElement).style.padding = "20px";
                }}
              />
            ) : (
              <div className={styles.noImage}>
                <div className={styles.errorMessage}>
                  <p>无法显示图片，请切换到文档视图查看内容</p>
                  <button
                    className={styles.switchButton}
                    onClick={() => setViewMode("document")}
                  >
                    切换到文档视图
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPageViewer;
