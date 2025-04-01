import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiCheck, FiFile, FiImage, FiPackage, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useRewriteStore } from '../stores/rewriteStore';

const ExportContent: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const { rewrittenItems } = useRewriteStore();
  
  // Mock content for demo
  const exportableContent = rewrittenItems.length > 0 ? rewrittenItems : [
    { id: 1, title: '夏日穿搭分享：清凉又时尚的5套搭配 (改写版本)', content: '炎炎夏日，想要保持清爽又不失时尚感，确实是个挑战。我精心准备了5套夏季穿搭，既能让你在高温中保持凉爽，又能彰显你的时尚品味...', imageCount: 5 },
    { id: 2, title: '家居收纳技巧：打造整洁舒适的小窝 (改写版本)', content: '家，是我们放松身心的港湾。一个整洁有序的家不仅看起来舒适，也能让我们的心情更加愉悦。今天我想分享一些实用的收纳小技巧...', imageCount: 3 },
    { id: 3, title: '15分钟快手营养早餐，开启元气满满一天 (改写版本)', content: '早餐是一天中最重要的一餐，但在忙碌的生活中，我们常常忽略它的重要性。今天分享几款只需15分钟就能完成的营养早餐，让你元气满满地开始新的一天...', imageCount: 4 },
  ];

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === exportableContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(exportableContent.map(item => item.id));
    }
  };

  const handleExport = () => {
    if (selectedItems.length === 0) {
      toast.error('请先选择要导出的内容');
      return;
    }
    
    setIsExporting(true);
    
    // 模拟导出过程
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      toast.success('内容导出成功');
      
      // 重置导出完成状态
      setTimeout(() => {
        setExportComplete(false);
      }, 3000);
    }, 2000);
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
                {selectedItems.length === exportableContent.length ? '取消全选' : '全选'}
              </button>
              <span className="text-gray-500">
                已选择 <span className="font-semibold text-pink-600">{selectedItems.length}</span> 项
              </span>
            </div>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto">
            {exportableContent.map(item => (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedItems.includes(item.id) 
                    ? 'border-pink-500 bg-pink-50' 
                    : 'border-gray-200 hover:border-pink-300'
                }`}
                onClick={() => handleSelectItem(item.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-800 mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{item.content}</p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <div className="flex items-center mr-4">
                        <FiFile className="mr-1" />
                        文字内容
                      </div>
                      <div className="flex items-center">
                        <FiImage className="mr-1" />
                        {item.imageCount} 张图片
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedItems.includes(item.id) 
                        ? 'bg-pink-500' 
                        : 'border-2 border-gray-300'
                    }`}>
                      {selectedItems.includes(item.id) && <FiCheck className="text-white" />}
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
              <label className="block text-gray-700 font-medium mb-2">导出格式</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exportText"
                    checked={true}
                    readOnly
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor="exportText" className="ml-2 text-gray-700">文字内容 (TXT格式)</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exportImage"
                    checked={true}
                    readOnly
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor="exportImage" className="ml-2 text-gray-700">图片 (JPG格式)</label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">导出选项</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="createFolder"
                    checked={true}
                    readOnly
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor="createFolder" className="ml-2 text-gray-700">为每篇内容创建独立文件夹</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="zipArchive"
                    checked={true}
                    readOnly
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor="zipArchive" className="ml-2 text-gray-700">打包为ZIP压缩文件</label>
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
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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