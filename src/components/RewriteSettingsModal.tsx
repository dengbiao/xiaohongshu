import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiX, FiSave, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { useRewriteStore } from "../stores/rewriteStore";

interface RewriteSettingsModalProps {
  onClose: () => void;
}

const RewriteSettingsModal: React.FC<RewriteSettingsModalProps> = ({
  onClose,
}) => {
  const { rewriteSettings, updateSettings } = useRewriteStore();
  const [settings, setSettings] = useState(rewriteSettings);
  const [selectedPreset, setSelectedPreset] = useState("custom");

  const presets = [
    {
      id: "casual",
      name: "轻松口语化",
      description: "使用更多日常用语，风格轻松活泼",
    },
    {
      id: "professional",
      name: "专业正式",
      description: "使用专业术语，风格严谨正式",
    },
    {
      id: "creative",
      name: "创意活泼",
      description: "富有创意和想象力，风格生动活泼",
    },
    { id: "custom", name: "自定义设置", description: "根据需求自定义参数" },
  ];

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);

    // 根据预设更新设置
    if (presetId === "casual") {
      setSettings({
        ...settings,
        style: "casual",
        differenceRate: 40,
        lengthAdjustment: 10,
        batchCount: 1,
      });
    } else if (presetId === "professional") {
      setSettings({
        ...settings,
        style: "professional",
        differenceRate: 30,
        lengthAdjustment: 0,
        batchCount: 1,
      });
    } else if (presetId === "creative") {
      setSettings({
        ...settings,
        style: "creative",
        differenceRate: 60,
        lengthAdjustment: 20,
        batchCount: 1,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "differenceRate" || name === "lengthAdjustment") {
      setSettings({
        ...settings,
        [name]: parseInt(value),
      });
    } else if (name === "batchCount") {
      setSettings({
        ...settings,
        [name]: Math.min(Math.max(parseInt(value) || 1, 1), 10),
      });
    } else {
      setSettings({
        ...settings,
        [name]: value,
      });
    }

    // 当手动修改设置时，切换到自定义
    setSelectedPreset("custom");
  };

  const handleSaveSettings = () => {
    updateSettings(settings);
    onClose();
  };

  const handleKeywordAdd = () => {
    setSettings({
      ...settings,
      keywords: [...settings.keywords, ""],
    });
  };

  const handleKeywordChange = (index: number, value: string) => {
    const updatedKeywords = [...settings.keywords];
    updatedKeywords[index] = value;
    setSettings({
      ...settings,
      keywords: updatedKeywords,
    });
  };

  const handleKeywordDelete = (index: number) => {
    const updatedKeywords = [...settings.keywords];
    updatedKeywords.splice(index, 1);
    setSettings({
      ...settings,
      keywords: updatedKeywords,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">内容改写设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              预设方案
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedPreset === preset.id
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-pink-300"
                  }`}
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  <h4 className="font-medium text-gray-800">{preset.name}</h4>
                  <p className="text-gray-500 text-sm mt-1">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                内容差异度: {settings.differenceRate}%
              </label>
              <input
                type="range"
                name="differenceRate"
                min="20"
                max="80"
                value={settings.differenceRate}
                onChange={handleInputChange}
                className="w-full accent-pink-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>保留原文风格 (20%)</span>
                <span>完全重写 (80%)</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                长度调整: {settings.lengthAdjustment > 0 ? "+" : ""}
                {settings.lengthAdjustment}%
              </label>
              <input
                type="range"
                name="lengthAdjustment"
                min="-50"
                max="50"
                value={settings.lengthAdjustment}
                onChange={handleInputChange}
                className="w-full accent-pink-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>缩短 (-50%)</span>
                <span>保持原长</span>
                <span>延长 (+50%)</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                批量改写数量
              </label>
              <input
                type="number"
                name="batchCount"
                min="1"
                max="10"
                value={settings.batchCount}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                设置需要生成的改写版本数量（1-10篇）
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 font-medium">
                  必要保留关键词
                </label>
                <button
                  onClick={handleKeywordAdd}
                  className="text-pink-600 hover:text-pink-700 flex items-center text-sm"
                >
                  <FiPlusCircle size={16} className="mr-1" />
                  添加关键词
                </button>
              </div>

              {settings.keywords.length > 0 ? (
                <div className="space-y-2">
                  {settings.keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) =>
                          handleKeywordChange(index, e.target.value)
                        }
                        placeholder="输入关键词"
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <button
                        onClick={() => handleKeywordDelete(index)}
                        className="ml-2 p-2 text-red-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-200"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <span className="text-gray-500">
                    暂无关键词，点击"添加关键词"按钮添加
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg mr-3 hover:bg-gray-100 transition-colors duration-200"
          >
            取消
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all duration-300"
          >
            <FiSave size={18} className="inline-block mr-2" />
            保存设置
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RewriteSettingsModal;
