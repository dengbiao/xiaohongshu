import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiCheck,
  FiFile,
  FiImage,
  FiPackage,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { RewrittenItem, useRewriteStore } from "../stores/rewriteStore";
import { useFetchStore } from "../stores/fetchStore";
import JSZip from "jszip";

// 为了解决 mock 数据的类型问题，定义一个拓展类型
interface MockExportItem {
  id: number;
  title: string;
  content: string;
  imageCount: number;
}

// 使用 RewrittenItem 类型或我们的 mock 类型
type ExportableItem = RewrittenItem | MockExportItem;

const ExportContent: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // 导出设置选项
  const [exportSettings, setExportSettings] = useState({
    includeOriginal: true, // 是否包含原文内容
    includeRewritten: true, // 是否包含改写内容
    includeImages: true, // 是否包含图片
    createFolders: true, // 是否为每篇文章创建独立文件夹
  });

  const { rewrittenItems } = useRewriteStore();
  const { fetchedItems } = useFetchStore();

  // Mock content for demo
  const exportableContent: ExportableItem[] =
    rewrittenItems.length > 0
      ? rewrittenItems
      : [
          {
            id: 1,
            title: "夏日穿搭分享：清凉又时尚的5套搭配 (改写版本)",
            content:
              "炎炎夏日，想要保持清爽又不失时尚感，确实是个挑战。我精心准备了5套夏季穿搭，既能让你在高温中保持凉爽，又能彰显你的时尚品味...",
            imageCount: 5,
          },
          {
            id: 2,
            title: "家居收纳技巧：打造整洁舒适的小窝 (改写版本)",
            content:
              "家，是我们放松身心的港湾。一个整洁有序的家不仅看起来舒适，也能让我们的心情更加愉悦。今天我想分享一些实用的收纳小技巧...",
            imageCount: 3,
          },
          {
            id: 3,
            title: "15分钟快手营养早餐，开启元气满满一天 (改写版本)",
            content:
              "早餐是一天中最重要的一餐，但在忙碌的生活中，我们常常忽略它的重要性。今天分享几款只需15分钟就能完成的营养早餐，让你元气满满地开始新的一天...",
            imageCount: 4,
          },
        ];

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === exportableContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(exportableContent.map((item) => item.id));
    }
  };

  // 获取项目的图片数量
  const getImageCount = (item: ExportableItem): number => {
    // 如果是 MockExportItem，直接返回其 imageCount
    if ("imageCount" in item) {
      return item.imageCount;
    }
    // 如果是 RewrittenItem，使用 generatedImages 的长度
    return item.generatedImages?.length || 0;
  };

  // 创建一个 mock 图片的 blob
  const createMockImageBlob = (): Blob => {
    // 一个 1x1 像素的透明 PNG 图片的 base64 编码
    const base64Data =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: "image/png" });
  };

  // 获取原文内容
  const getOriginalContent = (
    item: ExportableItem
  ): { title: string; content: string } | null => {
    // 如果是 RewrittenItem，通过 originalItemId 找到对应的原文
    if ("originalItemId" in item) {
      const originalItem = fetchedItems.find(
        (fetchItem) => fetchItem.id === item.originalItemId
      );
      if (originalItem && originalItem.title && originalItem.content) {
        return {
          title: originalItem.title,
          content: originalItem.content,
        };
      }
    }

    // 如果是 mock 数据或找不到原文，返回一个模拟的原文
    if ("imageCount" in item) {
      return {
        title: item.title.replace(" (改写版本)", ""),
        content: `这是 ${item.title.replace(" (改写版本)", "")} 的原文内容。`,
      };
    }

    return null;
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      toast.error("请先选择要导出的内容");
      return;
    }

    // 检查至少选择了一种内容类型
    if (
      !exportSettings.includeOriginal &&
      !exportSettings.includeRewritten &&
      !exportSettings.includeImages
    ) {
      toast.error("请至少选择一种导出内容类型");
      return;
    }

    setIsExporting(true);

    try {
      // 获取选中的内容
      const selectedContent = exportableContent.filter((item) =>
        selectedItems.includes(item.id)
      );

      // 创建新的 ZIP 实例
      const zip = new JSZip();

      // 处理每个选中的内容
      for (const item of selectedContent) {
        let folder: JSZip | null = zip;

        // 如果需要为每篇内容创建独立文件夹
        if (exportSettings.createFolders) {
          folder = zip.folder(`${item.id}-${item.title.substring(0, 20)}`);
          if (!folder) continue;
        }

        // 添加改写后的文本内容
        if (exportSettings.includeRewritten) {
          const fileName = exportSettings.createFolders
            ? "content-rewritten.txt"
            : `${item.id}-${item.title.substring(0, 20)}-rewritten.txt`;

          folder.file(fileName, `# ${item.title}\n\n${item.content}`);
        }

        // 添加原文内容
        if (exportSettings.includeOriginal) {
          const originalContent = getOriginalContent(item);
          if (originalContent) {
            const fileName = exportSettings.createFolders
              ? "content-original.txt"
              : `${item.id}-${item.title.substring(0, 20)}-original.txt`;

            folder.file(
              fileName,
              `# ${originalContent.title}\n\n${originalContent.content}`
            );
          }
        }

        // 添加图片
        if (exportSettings.includeImages) {
          const imageCount = getImageCount(item);

          // 如果是已有的 RewrittenItem 且有 generatedImages
          if (
            "generatedImages" in item &&
            item.generatedImages &&
            item.generatedImages.length > 0
          ) {
            // 真实的 RewrittenItem 图片处理
            for (let i = 0; i < item.generatedImages.length; i++) {
              try {
                const imageUrl = item.generatedImages[i];
                const response = await fetch(imageUrl);
                const blob = await response.blob();

                const fileName = exportSettings.createFolders
                  ? `image-${i + 1}.jpg`
                  : `${item.id}-image-${i + 1}.jpg`;

                folder.file(fileName, blob);
              } catch (error) {
                console.error(`获取图片 ${i + 1} 失败:`, error);
                // 添加一个替代图片
                const fileName = exportSettings.createFolders
                  ? `image-${i + 1}.jpg`
                  : `${item.id}-image-${i + 1}.jpg`;

                folder.file(fileName, createMockImageBlob());
              }
            }
          } else {
            // 对于 mock 数据，添加 mock 图片
            for (let i = 0; i < imageCount; i++) {
              const fileName = exportSettings.createFolders
                ? `image-${i + 1}.jpg`
                : `${item.id}-image-${i + 1}.jpg`;

              folder.file(fileName, createMockImageBlob());
            }
          }
        }
      }

      // 生成 ZIP 文件并下载
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `导出内容-${Date.now()}.zip`;

      // 添加到文档并点击
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setExportComplete(true);
      toast.success("内容导出成功");

      // 重置导出完成状态
      setTimeout(() => {
        setExportComplete(false);
      }, 3000);
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败，请重试");
      setIsExporting(false);
    }
  };

  // 更新导出设置
  const toggleExportSetting = (setting: keyof typeof exportSettings) => {
    setExportSettings({
      ...exportSettings,
      [setting]: !exportSettings[setting],
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">导出管理</h1>
        <p className="text-gray-600 mb-8">将改写的内容打包导出，方便您的使用</p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">可导出内容</h2>
            <div className="flex items-center">
              <button
                onClick={handleSelectAll}
                className="text-pink-600 hover:text-pink-700 mr-4"
              >
                {selectedItems.length === exportableContent.length
                  ? "取消全选"
                  : "全选"}
              </button>
              <span className="text-gray-500">
                已选择{" "}
                <span className="font-semibold text-pink-600">
                  {selectedItems.length}
                </span>{" "}
                项
              </span>
            </div>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto">
            {exportableContent.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedItems.includes(item.id)
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 hover:border-pink-300"
                }`}
                onClick={() => handleSelectItem(item.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-800 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {item.content}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <div className="flex items-center mr-4">
                        <FiFile className="mr-1" />
                        文字内容
                      </div>
                      <div className="flex items-center">
                        <FiImage className="mr-1" />
                        {getImageCount(item)} 张图片
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedItems.includes(item.id)
                          ? "bg-pink-500"
                          : "border-2 border-gray-300"
                      }`}
                    >
                      {selectedItems.includes(item.id) && (
                        <FiCheck className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">导出设置</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                导出内容
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeRewritten"
                    checked={exportSettings.includeRewritten}
                    onChange={() => toggleExportSetting("includeRewritten")}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label
                    htmlFor="includeRewritten"
                    className="ml-2 text-gray-700"
                  >
                    包含改写内容 (TXT格式)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeOriginal"
                    checked={exportSettings.includeOriginal}
                    onChange={() => toggleExportSetting("includeOriginal")}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label
                    htmlFor="includeOriginal"
                    className="ml-2 text-gray-700"
                  >
                    包含原文内容 (TXT格式)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeImages"
                    checked={exportSettings.includeImages}
                    onChange={() => toggleExportSetting("includeImages")}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor="includeImages" className="ml-2 text-gray-700">
                    包含图片 (JPG格式)
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                文件组织
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="createFolders"
                    checked={exportSettings.createFolders}
                    onChange={() => toggleExportSetting("createFolders")}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor="createFolders" className="ml-2 text-gray-700">
                    为每篇内容创建独立文件夹
                  </label>
                </div>
                <div className="flex items-center pt-2">
                  <span className="text-xs text-gray-500 italic">
                    所有内容将打包为ZIP文件
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleExport}
              disabled={isExporting || selectedItems.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                  导出中...
                </>
              ) : exportComplete ? (
                <>
                  <FiCheckCircle size={20} className="mr-2" />
                  导出完成
                </>
              ) : (
                <>
                  <FiPackage size={20} className="mr-2" />
                  导出选中内容
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportContent;
