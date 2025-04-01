import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiCopy, FiRotateCw, FiCheck, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useRewriteStore } from '../stores/rewriteStore';
import { useFetchStore } from '../stores/fetchStore';
import RewriteSettingsModal from '../components/RewriteSettingsModal';

const ContentRewrite: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('original');
  
  const { fetchedItems } = useFetchStore();
  const { rewriteContent, rewrittenItems, isRewriting } = useRewriteStore();

  // Mock content for demo
  const fetchedContent = fetchedItems.length > 0 ? fetchedItems : [
    { id: 1, url: 'https://www.xiaohongshu.com/explore/sample1', status: 'success', title: '夏日穿搭分享：清凉又时尚的5套搭配', content: '今天给大家分享我的5套夏日穿搭，既清凉又不失时尚感...' },
    { id: 2, url: 'https://www.xiaohongshu.com/explore/sample2', status: 'success', title: '家居收纳技巧：告别凌乱小家', content: '一个整洁的家能让心情也变好，今天分享我的收纳小技巧...' },
    { id: 3, url: 'https://www.xiaohongshu.com/explore/sample3', status: 'success', title: '健康早餐食谱：15分钟搞定营养早餐', content: '忙碌生活中，健康早餐不可少，分享几款15分钟就能完成的营养早餐...' },
  ];

  const handleRewrite = () => {
    if (selectedContent === null) {
      toast.error('请先选择要改写的内容');
      return;
    }
    
    const contentToRewrite = fetchedContent.find(item => item.id === selectedContent);
    if (!contentToRewrite) return;
    
    rewriteContent(contentToRewrite);
    toast.success('内容正在改写中...');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
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
            <p className="text-gray-600">对抓取的内容进行智能改写，支持多种风格和参数设置</p>
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">选择要改写的内容</h2>
              
              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {fetchedContent.map(item => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedContent === item.id 
                        ? 'bg-pink-50 border-2 border-pink-500' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => setSelectedContent(item.id)}
                  >
                    <h3 className="font-medium text-gray-800 mb-1 truncate">{item.title}</h3>
                    <p className="text-gray-500 text-sm truncate">{item.content.substring(0, 60)}...</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleRewrite}
                  disabled={isRewriting || selectedContent === null}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRewriting ? '改写中...' : '开始智能改写'}
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
                    activeTab === 'original'
                      ? 'text-pink-600 border-b-2 border-pink-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('original')}
                >
                  原始内容
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === 'rewritten'
                      ? 'text-pink-600 border-b-2 border-pink-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('rewritten')}
                >
                  改写结果
                </button>
              </div>

              {selectedContent !== null ? (
                <div className="relative">
                  {activeTab === 'original' && (
                    <div className="prose max-w-none">
                      <h3 className="text-xl font-semibold mb-3">
                        {fetchedContent.find(item => item.id === selectedContent)?.title}
                      </h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {fetchedContent.find(item => item.id === selectedContent)?.content}
                      </p>
                      <div className="absolute top-0 right-0">
                        <button
                          onClick={() => {
                            const content = fetchedContent.find(item => item.id === selectedContent);
                            if (content) copyToClipboard(content.content);
                          }}
                          className="p-2 text-gray-500 hover:text-pink-600 transition-colors duration-200"
                          title="复制内容"
                        >
                          <FiCopy size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'rewritten' && (
                    <div className="prose max-w-none">
                      {rewrittenItems.length > 0 ? (
                        <>
                          <h3 className="text-xl font-semibold mb-3">
                            {rewrittenItems[0].title} (改写版本)
                          </h3>
                          <p className="text-gray-700 whitespace-pre-line">
                            {rewrittenItems[0].content}
                          </p>
                          <div className="absolute top-0 right-0 flex">
                            <button
                              onClick={() => {
                                if (rewrittenItems[0]) copyToClipboard(rewrittenItems[0].content);
                              }}
                              className="p-2 text-gray-500 hover:text-pink-600 transition-colors duration-200"
                              title="复制内容"
                            >
                              <FiCopy size={18} />
                            </button>
                            <button
                              onClick={handleRewrite}
                              disabled={isRewriting}
                              className="p-2 text-gray-500 hover:text-pink-600 transition-colors duration-200"
                              title="重新改写"
                            >
                              <FiRotateCw size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <FiEdit size={48} className="mb-4 opacity-30" />
                          <p className="text-center">
                            {isRewriting ? '内容改写中...' : '点击"开始智能改写"生成改写内容'}
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