import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLink, FiUpload, FiCheckCircle, FiAlertCircle, FiArrowRight, FiEdit, FiThumbsUp, FiMessageSquare, FiUser, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useFetchStore } from '../stores/fetchStore';
import { useNavigate } from 'react-router-dom';
import { redBookScraperService, ScrapedNote } from '../services/RedBookScraperService';

const ContentFetch: React.FC = () => {
  const [linkInput, setLinkInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { addLink, fetchLinks, isFetching, fetchedItems, updateFetchedItem } = useFetchStore();
  const navigate = useNavigate();

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkInput.trim()) {
      toast.error('请输入有效的小红书链接');
      return;
    }
    
    if (!linkInput.includes('xiaohongshu.com') && !linkInput.includes('xhslink.com')) {
      toast.error('请输入有效的小红书链接');
      return;
    }
    
    addLink(linkInput);
    setLinkInput('');
    toast.success('链接添加成功');
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // 读取文本文件
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const links = text.split('\n')
        .map(link => link.trim())
        .filter(link => link && (link.includes('xiaohongshu.com') || link.includes('xhslink.com')));
      
      if (links.length === 0) {
        toast.error('未找到有效的小红书链接');
        setIsUploading(false);
        return;
      }
      
      links.forEach(link => addLink(link));
      setIsUploading(false);
      toast.success(`成功导入 ${links.length} 个链接`);
    };
    
    reader.onerror = () => {
      toast.error('文件读取失败');
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };

  const handleFetchContent = async () => {
    if (fetchedItems.length === 0) {
      toast.error('请先添加小红书链接');
      return;
    }
    
    // 开始抓取
    const pendingItems = fetchedItems.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      toast.info('所有链接已抓取');
      return;
    }
    
    toast.loading('正在抓取内容...', { id: 'fetching' });
    
    try {
      // 遍历待处理的链接进行抓取
      for (const item of pendingItems) {
        try {
          // 更新状态为抓取中
          updateFetchedItem(item.id, { status: 'fetching' });
          
          // 调用 Coze API 抓取服务
          const scrapedData = await redBookScraperService.scrapeNote(item.url);
          
          if (scrapedData) {
            // 抓取成功，更新数据
            updateFetchedItem(item.id, {
              status: 'success',
              title: scrapedData.title,
              content: scrapedData.content,
              images: scrapedData.images,
              likes: scrapedData.likes,
              comments: scrapedData.comments,
              author: scrapedData.authorName,
              publishTime: scrapedData.publishTime,
              commentList: scrapedData.commentList
            });
          } else {
            // 抓取失败
            updateFetchedItem(item.id, { status: 'error' });
          }
        } catch (error) {
          console.error(`抓取链接时出错: ${item.url}`, error);
          updateFetchedItem(item.id, { status: 'error' });
        }
      }
      
      toast.success('内容抓取完成', { id: 'fetching' });
    } catch (error) {
      console.error('抓取过程中出错:', error);
      toast.error('抓取过程中出错', { id: 'fetching' });
    }
  };

  // 处理跳转到改写页面
  const handleGoToRewrite = (itemId?: number) => {
    navigate('/rewrite');
    toast.success('请在左侧选择要改写的内容');
  };

  // 计算成功抓取的项目数量
  const successCount = fetchedItems.filter(item => item.status === 'success').length;
  const fetchingCount = fetchedItems.filter(item => item.status === 'fetching').length;

  const handleUploadClick = () => {
    // 触发隐藏的文件输入
    const fileInput = document.getElementById('batchFileInput');
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">内容抓取</h1>
        <p className="text-gray-600 mb-8">从小红书抓取笔记内容，支持单个链接或批量导入</p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">输入小红书链接</h2>
          
          <form onSubmit={handleLinkSubmit} className="mb-6">
            <div className="flex items-center">
              <div className="flex-grow relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FiLink size={18} />
                </span>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="粘贴小红书笔记链接..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="ml-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all duration-300"
              >
                添加链接
              </button>
            </div>
          </form>

          <input
            type="file"
            id="batchFileInput"
            accept=".txt"
            onChange={handleBatchUpload}
            className="hidden"
          />
          <div 
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200" 
            onClick={handleUploadClick}
          >
            <div className="text-center">
              <FiUpload size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 font-medium">批量导入链接</p>
              <p className="text-gray-400 text-sm mt-1">支持TXT文件，每行一个链接</p>
              {isUploading && <p className="text-blue-500 mt-2">正在导入...</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">链接列表</h2>
            <div className="text-gray-500 text-sm">
              已添加 <span className="font-semibold text-pink-600">{fetchedItems.length}</span> 个链接
            </div>
          </div>

          <div className="mb-6 max-h-96 overflow-y-auto">
            {fetchedItems.length > 0 ? (
              <ul className="space-y-2">
                {fetchedItems.map((item, index) => (
                  <li 
                    key={index} 
                    className={`p-3 ${
                      item.status === 'success' 
                        ? 'bg-green-50 hover:bg-green-100 cursor-pointer' 
                        : item.status === 'fetching'
                          ? 'bg-blue-50'
                          : item.status === 'error'
                            ? 'bg-red-50'
                            : 'bg-gray-50'
                    } rounded-lg flex items-center transition-all duration-200`}
                    onClick={() => item.status === 'success' && handleGoToRewrite(item.id)}
                  >
                    <div className="w-6 h-6 flex-shrink-0 mr-3 flex items-center justify-center">
                      {item.status === 'success' ? (
                        <FiCheckCircle className="text-green-500" size={18} />
                      ) : item.status === 'error' ? (
                        <FiAlertCircle className="text-red-500" size={18} />
                      ) : item.status === 'fetching' ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      ) : (
                        <span className="text-gray-400">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-grow truncate">
                      <div className="text-gray-800 truncate">{item.url}</div>
                      {item.status === 'success' && (
                        <div className="mt-1">
                          <p className="text-sm text-gray-600 font-medium truncate">{item.title}</p>
                          {item.author && (
                            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                              <span className="flex items-center">
                                <FiUser className="mr-1" /> {item.author}
                              </span>
                              {item.publishTime && (
                                <span className="flex items-center">
                                  <FiClock className="mr-1" /> {item.publishTime}
                                </span>
                              )}
                              {item.likes !== undefined && (
                                <span className="flex items-center">
                                  <FiThumbsUp className="mr-1" /> {item.likes}
                                </span>
                              )}
                              {item.comments !== undefined && (
                                <span className="flex items-center">
                                  <FiMessageSquare className="mr-1" /> {item.comments}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 text-sm flex items-center">
                      {item.status === 'success' && (
                        <>
                          <span className="text-green-500 mr-2">抓取成功</span>
                          <FiArrowRight className="text-pink-500" />
                        </>
                      )}
                      {item.status === 'error' && <span className="text-red-500">抓取失败</span>}
                      {item.status === 'fetching' && <span className="text-blue-500">抓取中...</span>}
                      {item.status === 'pending' && <span className="text-gray-400">等待抓取</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiLink size={32} className="mx-auto mb-3 opacity-50" />
                <p>暂无链接，请添加小红书笔记链接</p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleFetchContent}
              disabled={isFetching || fetchingCount > 0 || fetchedItems.length === 0}
            >
              {fetchingCount > 0 ? '抓取中...' : '开始抓取内容'}
            </button>
            
            {/* 显示进入改写页面的按钮 */}
            {successCount > 0 && (
              <button
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all duration-300 flex items-center"
                onClick={() => handleGoToRewrite()}
              >
                <FiEdit className="mr-2" />
                进入改写
              </button>
            )}
          </div>
          
          {/* 成功抓取后的提示 */}
          {successCount > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800">
              <p className="flex items-center">
                <FiCheckCircle className="mr-2" />
                已成功抓取 {successCount} 个内容，点击绿色条目或"进入改写"按钮继续
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ContentFetch;
