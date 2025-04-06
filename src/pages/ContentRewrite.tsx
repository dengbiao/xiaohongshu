import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiCopy,
  FiRotateCw,
  FiCheck,
  FiSettings,
  FiFileText,
  FiImage,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useRewriteStore } from "../stores/rewriteStore";
import { useFetchStore, FetchItem } from "../stores/fetchStore";
import RewriteSettingsModal from "../components/RewriteSettingsModal";
import NoteDisplayComponent from "../components/NoteDisplayComponent";
import ContentWithImagesViewer from "../components/ContentWithImagesViewer";
import { ScrapedNote } from "../services/RedBookScraperService";

const ContentRewrite: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("original");

  const { fetchedItems } = useFetchStore();
  const {
    rewriteContent,
    rewrittenItems,
    updateRewrittenItem,
    getRewrittenItemByOriginalId,
    isItemRewriting,
  } = useRewriteStore();

  // Mock content for demo with proper typing
  const fetchedContent: FetchItem[] =
    fetchedItems.length > 0
      ? fetchedItems
      : [
          {
            id: 1,
            url: "https://www.xiaohongshu.com/explore/sample1",
            status: "success" as const,
            title: "夏日穿搭分享：清凉又时尚的5套搭配",
            content: "今天给大家分享我的5套夏日穿搭，既清凉又不失时尚感...",
            images: [],
            author: "示例作者",
            publishTime: "2023-06-15",
          },
          {
            id: 2,
            url: "https://www.xiaohongshu.com/explore/sample2",
            status: "success" as const,
            title: "家居收纳技巧：告别凌乱小家",
            content: "一个整洁的家能让心情也变好，今天分享我的收纳小技巧...",
            images: [],
            author: "示例作者",
            publishTime: "2023-06-14",
          },
          {
            id: 3,
            url: "https://www.xiaohongshu.com/explore/sample3",
            status: "success" as const,
            title: "健康早餐食谱：15分钟搞定营养早餐",
            content:
              "忙碌生活中，健康早餐不可少，分享几款15分钟就能完成的营养早餐...",
            images: [],
            author: "示例作者",
            publishTime: "2023-06-13",
          },
        ];

  const handleSelectContent = (id: number) => {
    // 设置选中的内容
    setSelectedContent(id);

    // 如果这个ID的内容已经有改写结果，则切换到改写结果标签页
    // 否则切换到原始内容标签页
    const rewrittenItem = getRewrittenItemByOriginalId(id);
    setActiveTab(rewrittenItem ? "rewritten" : "original");
  };

  const handleRewrite = () => {
    if (selectedContent === null) {
      toast.error("请先选择要改写的内容");
      return;
    }

    const contentToRewrite = fetchedContent.find(
      (item) => item.id === selectedContent
    );
    if (!contentToRewrite) return;

    rewriteContent(contentToRewrite);
    toast.success("内容正在改写中...");

    // 添加一个计时器，当改写开始后，等待一小段时间再切换到改写结果标签
    // 这样用户会感觉更流畅，知道改写正在进行
    setTimeout(() => {
      setActiveTab("rewritten");
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  // Find the selected content item
  const selectedItem =
    selectedContent !== null
      ? fetchedContent.find((item) => item.id === selectedContent)
      : null;

  // 检查当前选中的内容是否正在改写中
  const isCurrentItemRewriting =
    selectedContent !== null && isItemRewriting(selectedContent);

  // 获取当前选中内容的改写结果
  const currentRewrittenItem =
    selectedContent !== null
      ? getRewrittenItemByOriginalId(selectedContent)
      : undefined;

  // 组装完整的改写结果项用于显示
  const rewrittenItemToDisplay =
    currentRewrittenItem && selectedItem
      ? ({
          ...currentRewrittenItem,
          url: selectedItem.url,
          status: "success" as const,
          images: selectedItem.images || [],
          author: selectedItem.author || "",
          publishTime: selectedItem.publishTime || "",
        } as FetchItem)
      : null;

  // 处理内容更新
  const handleContentUpdate = (
    updatedContent: string,
    updatedImages: string[]
  ) => {
    if (!currentRewrittenItem) return;

    // 使用store的updateRewrittenItem方法更新内容
    updateRewrittenItem(currentRewrittenItem.id, {
      content: updatedContent,
      generatedImages: updatedImages,
    });

    toast.success("内容和图片已更新");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">内容改写</h1>
            <p className="text-gray-600">
              对抓取的内容进行智能改写，支持多种风格和参数设置
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center shadow-sm hover:bg-gray-50 transition-all duration-200"
          >
            <FiSettings size={18} className="mr-2" />
            改写设置
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 内容选择 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                选择要改写的内容
              </h2>

              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {fetchedContent.map((item) => {
                  // 检查每个item是否有改写结果或正在改写中
                  const hasRewritten = !!getRewrittenItemByOriginalId(item.id);
                  const isRewriting = isItemRewriting(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 relative ${
                        selectedContent === item.id
                          ? "bg-pink-50 border-2 border-pink-500"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                      onClick={() => handleSelectContent(item.id)}
                    >
                      <h3 className="font-medium text-gray-800 mb-1 truncate">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm truncate">
                        {item.content?.substring(0, 60)}...
                      </p>

                      {/* 显示改写状态标记 */}
                      {isRewriting && (
                        <span className="absolute right-2 top-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          改写中...
                        </span>
                      )}
                      {hasRewritten && !isRewriting && (
                        <span className="absolute right-2 top-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          已改写
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleRewrite}
                  disabled={isCurrentItemRewriting || selectedContent === null}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCurrentItemRewriting ? "改写中..." : "开始智能改写"}
                </button>
              </div>
            </div>
          </div>

          {/* 右侧 - 改写结果 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <div className="flex border-b mb-4">
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === "original"
                      ? "text-pink-600 border-b-2 border-pink-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("original")}
                >
                  原始内容
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === "rewritten"
                      ? "text-pink-600 border-b-2 border-pink-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("rewritten")}
                >
                  改写结果
                </button>
              </div>

              {selectedContent !== null ? (
                <div className="relative">
                  {activeTab === "original" && selectedItem && (
                    <div className="relative">
                      <NoteDisplayComponent
                        note={selectedItem}
                        showFullContent={true}
                      />
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={() => {
                            if (selectedItem.content)
                              copyToClipboard(selectedItem.content);
                          }}
                          className="p-2 bg-white rounded-full shadow-md text-gray-500 hover:text-pink-600 transition-colors duration-200"
                          title="复制内容"
                        >
                          <FiCopy size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "rewritten" && (
                    <div className="prose max-w-none">
                      {rewrittenItemToDisplay ? (
                        <div className="relative">
                          {rewrittenItemToDisplay.contentPages &&
                          rewrittenItemToDisplay.generatedImages ? (
                            <ContentWithImagesViewer
                              title={rewrittenItemToDisplay.title}
                              content={rewrittenItemToDisplay.content}
                              images={rewrittenItemToDisplay.generatedImages}
                              abstract={rewrittenItemToDisplay.abstract}
                              onRewrite={handleRewrite}
                              onContentChange={handleContentUpdate}
                            />
                          ) : (
                            <>
                              <NoteDisplayComponent
                                note={rewrittenItemToDisplay}
                                showFullContent={true}
                              />
                              <div className="absolute top-4 right-4 flex space-x-2">
                                <button
                                  onClick={() => {
                                    if (rewrittenItemToDisplay.content)
                                      copyToClipboard(
                                        rewrittenItemToDisplay.content
                                      );
                                  }}
                                  className="p-2 bg-white rounded-full shadow-md text-gray-500 hover:text-pink-600 transition-colors duration-200"
                                  title="复制内容"
                                >
                                  <FiCopy size={18} />
                                </button>
                                <button
                                  onClick={handleRewrite}
                                  disabled={isCurrentItemRewriting}
                                  className="p-2 bg-white rounded-full shadow-md text-gray-500 hover:text-pink-600 transition-colors duration-200"
                                  title="重新改写"
                                >
                                  <FiRotateCw size={18} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <FiEdit size={48} className="mb-4 opacity-30" />
                          <p className="text-center">
                            {isCurrentItemRewriting
                              ? "内容改写中..."
                              : '点击"开始智能改写"生成改写内容'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FiEdit size={48} className="mb-4 opacity-30" />
                  <p className="text-center">请从左侧选择要改写的内容</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {showSettings && (
        <RewriteSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default ContentRewrite;
