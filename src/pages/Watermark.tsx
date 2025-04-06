import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiImage,
  FiSave,
  FiDownload,
  FiPlusCircle,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiEdit,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useWatermarkStore } from "../stores/watermarkStore";
import { useFetchStore } from "../stores/fetchStore";
import * as htmlToImage from "html-to-image";

const Watermark: React.FC = () => {
  const imagePreviewRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [showAppliedMessage, setShowAppliedMessage] = useState<number | null>(
    null
  );
  const [showSavedMessage, setShowSavedMessage] = useState<number | null>(null);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [hasChanged, setHasChanged] = useState(false);

  const { fetchedItems } = useFetchStore();
  const {
    watermarkSettings,
    updateSettings,
    savedWatermarks,
    addWatermark,
    deleteWatermark,
  } = useWatermarkStore();

  // Mock images for demo
  const images = [
    { id: 1, src: "https://picsum.photos/id/231/800/600", alt: "图片1" },
    { id: 2, src: "https://picsum.photos/id/232/800/600", alt: "图片2" },
    { id: 3, src: "https://picsum.photos/id/233/800/600", alt: "图片3" },
  ];

  // 查找与当前设置匹配的预设
  const findMatchingPreset = () => {
    if (!savedWatermarks || savedWatermarks.length === 0) return null;

    // 对比当前水印设置和所有预设，查找匹配的预设
    const matchingPreset = savedWatermarks.find((preset) => {
      const settings = preset.settings;
      return (
        settings.text === watermarkSettings.text &&
        settings.font === watermarkSettings.font &&
        settings.color === watermarkSettings.color &&
        settings.opacity === watermarkSettings.opacity &&
        settings.size === watermarkSettings.size &&
        settings.density === watermarkSettings.density
      );
    });

    return matchingPreset ? matchingPreset.id : null;
  };

  // 初始化时保存当前设置作为比较基准并查找匹配的预设
  useEffect(() => {
    if (!initialSettings) {
      setInitialSettings({ ...watermarkSettings });

      // 查找并选中与当前设置匹配的预设
      const matchingPresetId = findMatchingPreset();
      if (matchingPresetId) {
        setActivePreset(matchingPresetId);
        console.log("自动选中预设:", matchingPresetId);
      } else {
        // 如果没有匹配的预设，默认选中第一个预设
        if (savedWatermarks.length > 0) {
          setActivePreset(savedWatermarks[0].id);
          console.log("未找到匹配预设，默认选中第一个预设");
        }
      }
    }
  }, []);

  // 当水印列表或当前设置变化时，重新检查匹配的预设
  useEffect(() => {
    // 仅在应用预设或加载页面时触发，手动修改设置时不自动切换
    if (!hasChanged) {
      const matchingPresetId = findMatchingPreset();
      if (matchingPresetId && matchingPresetId !== activePreset) {
        setActivePreset(matchingPresetId);
        console.log("设置变化，自动选中匹配的预设:", matchingPresetId);
      }
    }
  }, [savedWatermarks, watermarkSettings]);

  // 检测设置是否有变化
  useEffect(() => {
    if (initialSettings) {
      const changed =
        initialSettings.text !== watermarkSettings.text ||
        initialSettings.font !== watermarkSettings.font ||
        initialSettings.color !== watermarkSettings.color ||
        initialSettings.opacity !== watermarkSettings.opacity ||
        initialSettings.size !== watermarkSettings.size ||
        initialSettings.density !== watermarkSettings.density;

      setHasChanged(changed);
    }
  }, [watermarkSettings, initialSettings]);

  // 预设应用提示自动消失
  useEffect(() => {
    if (showAppliedMessage !== null) {
      const timer = setTimeout(() => {
        setShowAppliedMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showAppliedMessage]);

  // 保存提示自动消失
  useEffect(() => {
    if (showSavedMessage !== null) {
      const timer = setTimeout(() => {
        setShowSavedMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSavedMessage]);

  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "opacity" || name === "size" || name === "density") {
      updateSettings({
        ...watermarkSettings,
        [name]: parseInt(value),
      });
    } else {
      updateSettings({
        ...watermarkSettings,
        [name]: value,
      });
    }

    // 不再清除当前激活的预设，只是标记发生了变化
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({
      ...watermarkSettings,
      color: e.target.value,
    });

    // 不再清除当前激活的预设，只是标记发生了变化
  };

  // 新增配置
  const addNewWatermarkPreset = () => {
    if (!watermarkSettings.text.trim()) {
      toast.error("请输入水印文字");
      return;
    }

    const preset = {
      id: Date.now(),
      name: `水印 ${savedWatermarks.length + 1}`,
      settings: { ...watermarkSettings },
    };

    addWatermark(preset);
    setActivePreset(preset.id);
    setInitialSettings({ ...watermarkSettings });
    setHasChanged(false);
    toast.success("新的水印方案已保存");
  };

  // 更新当前选中的预设
  const updateCurrentPreset = () => {
    if (activePreset === null) {
      toast.error("请先选择一个预设");
      return;
    }

    if (!watermarkSettings.text.trim()) {
      toast.error("请输入水印文字");
      return;
    }

    // 找到当前选中的预设
    const currentPreset = savedWatermarks.find(
      (preset) => preset.id === activePreset
    );
    if (!currentPreset) {
      toast.error("找不到选中的预设");
      return;
    }

    // 使用新的 updateWatermark 方法直接更新预设，保持列表顺序不变
    useWatermarkStore.getState().updateWatermark(activePreset, {
      settings: { ...watermarkSettings },
    });

    setInitialSettings({ ...watermarkSettings });
    setHasChanged(false);
    setShowSavedMessage(activePreset);
    toast.success(`预设 "${currentPreset.name}" 已更新`);
  };

  const applyWatermarkPreset = (preset: (typeof savedWatermarks)[0]) => {
    updateSettings(preset.settings);
    setActivePreset(preset.id);
    setShowAppliedMessage(preset.id);
    setInitialSettings({ ...preset.settings });
    setHasChanged(false);
    toast.success(`已应用水印方案: ${preset.name}`);
  };

  const downloadImage = async () => {
    if (!imagePreviewRef.current || selectedImage === null) {
      toast.error("请先选择图片");
      return;
    }

    try {
      const dataUrl = await htmlToImage.toPng(imagePreviewRef.current);
      const link = document.createElement("a");
      link.download = `watermarked-image-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("图片已下载");
    } catch (error) {
      toast.error("下载失败，请重试");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">水印处理</h1>
        <p className="text-gray-600 mb-8">
          为图片添加自定义水印，保护您的内容版权
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 图片选择 */}
          <div className={`lg:col-span-1 ${previewMode ? "hidden" : "block"}`}>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                选择图片
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative rounded-lg cursor-pointer overflow-hidden transition-all duration-200 ${
                      selectedImage === image.id
                        ? "ring-2 ring-pink-500"
                        : "hover:opacity-90"
                    }`}
                    onClick={() => setSelectedImage(image.id)}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-32 object-cover"
                    />
                    {selectedImage === image.id && (
                      <div className="absolute inset-0 bg-pink-500 bg-opacity-20 flex items-center justify-center">
                        <FiEdit2 className="text-white text-2xl drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 水印预设 */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  水印预设
                </h2>
                <button
                  onClick={addNewWatermarkPreset}
                  className="text-sm flex items-center text-pink-600 hover:text-pink-700"
                >
                  <FiPlusCircle size={16} className="mr-1" />
                  新增配置
                </button>
              </div>

              <div className="space-y-3">
                {savedWatermarks.length > 0 ? (
                  savedWatermarks.map((preset) => (
                    <div
                      key={preset.id}
                      className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        activePreset === preset.id
                          ? "bg-pink-100 border border-pink-300"
                          : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                      }`}
                      onClick={() => applyWatermarkPreset(preset)}
                    >
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-800">
                          {preset.name}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {preset.settings.text}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {showAppliedMessage === preset.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-green-500 text-xs flex items-center mr-2"
                          >
                            <FiCheckCircle className="mr-1" /> 已应用
                          </motion.span>
                        )}
                        {showSavedMessage === preset.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-blue-500 text-xs flex items-center mr-2"
                          >
                            <FiCheckCircle className="mr-1" /> 已保存
                          </motion.span>
                        )}
                        {activePreset === preset.id &&
                          !showAppliedMessage &&
                          !showSavedMessage && (
                            <span className="flex-shrink-0 w-3 h-3 rounded-full bg-pink-500 mr-2"></span>
                          )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWatermark(preset.id);
                            if (activePreset === preset.id) {
                              setActivePreset(null);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                          title="删除预设"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">暂无保存的水印预设</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 中间 - 水印配置 */}
          <div className={`${previewMode ? "lg:col-span-1" : "lg:col-span-1"}`}>
            <div
              className={`bg-white rounded-xl shadow-lg p-6 ${
                previewMode ? "hidden" : "block"
              }`}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                水印设置
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    水印文字
                  </label>
                  <input
                    type="text"
                    name="text"
                    value={watermarkSettings.text}
                    onChange={handleSettingsChange}
                    placeholder="输入水印文字"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    字体
                  </label>
                  <select
                    name="font"
                    value={watermarkSettings.font}
                    onChange={handleSettingsChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="sans-serif">无衬线字体</option>
                    <option value="serif">衬线字体</option>
                    <option value="monospace">等宽字体</option>
                    <option value="cursive">手写字体</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    文字颜色
                  </label>
                  <input
                    type="color"
                    value={watermarkSettings.color}
                    onChange={handleColorChange}
                    className="w-full h-10 p-1 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    不透明度: {watermarkSettings.opacity}%
                  </label>
                  <input
                    type="range"
                    name="opacity"
                    min="10"
                    max="100"
                    value={watermarkSettings.opacity}
                    onChange={handleSettingsChange}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    字体大小: {watermarkSettings.size}
                  </label>
                  <input
                    type="range"
                    name="size"
                    min="10"
                    max="40"
                    value={watermarkSettings.size}
                    onChange={handleSettingsChange}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    水印密度: {watermarkSettings.density}
                  </label>
                  <input
                    type="range"
                    name="density"
                    min="1"
                    max="5"
                    value={watermarkSettings.density}
                    onChange={handleSettingsChange}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>

              {/* 更新预设按钮 */}
              <div className="mt-6">
                <button
                  onClick={updateCurrentPreset}
                  disabled={!activePreset || !hasChanged}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
                    activePreset && hasChanged
                      ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow hover:shadow-lg"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  } transition-all duration-300`}
                >
                  <FiSave className="mr-2" />
                  {activePreset
                    ? `更新"${
                        savedWatermarks.find((p) => p.id === activePreset)
                          ?.name || "当前"
                      }"预设`
                    : "请先选择预设"}
                </button>
              </div>
            </div>
          </div>

          {/* 右侧 - 预览 */}
          <motion.div
            className={`${previewMode ? "lg:col-span-2" : "lg:col-span-1"}`}
            layout
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {previewMode ? "全屏预览" : "水印预览"}
                {activePreset !== null && (
                  <span className="text-sm font-normal text-pink-600 ml-2">
                    (使用预设:{" "}
                    {savedWatermarks.find((p) => p.id === activePreset)?.name})
                  </span>
                )}
              </h2>

              {selectedImage !== null ? (
                <div>
                  <div
                    ref={imagePreviewRef}
                    className={`relative rounded-lg overflow-hidden ${
                      previewMode ? "h-[calc(100vh-320px)]" : ""
                    }`}
                  >
                    <img
                      src={images.find((img) => img.id === selectedImage)?.src}
                      alt="预览图片"
                      className={`w-full ${
                        previewMode ? "h-full object-contain" : "h-auto"
                      }`}
                    />

                    {/* 水印层 */}
                    <div className="absolute inset-0 flex flex-wrap pointer-events-none">
                      {Array.from({
                        length: watermarkSettings.density * 5,
                      }).map((_, index) => (
                        <div
                          key={index}
                          className="inline-block p-4"
                          style={{
                            opacity: watermarkSettings.opacity / 100,
                            transform: "rotate(-30deg)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: watermarkSettings.font,
                              color: watermarkSettings.color,
                              fontSize: `${watermarkSettings.size}px`,
                            }}
                          >
                            {watermarkSettings.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 移动到这里: 预览模式和下载按钮 */}
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center"
                    >
                      {previewMode ? (
                        <>
                          <FiEdit className="mr-2" />
                          编辑模式
                        </>
                      ) : (
                        <>
                          <FiEye className="mr-2" />
                          预览模式
                        </>
                      )}
                    </button>

                    <button
                      onClick={downloadImage}
                      disabled={selectedImage === null}
                      className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiDownload size={18} className="inline-block mr-2" />
                      下载图片
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FiImage size={48} className="mb-4 opacity-30" />
                  <p className="text-center">请从左侧选择一张图片</p>
                </div>
              )}

              {previewMode && selectedImage && (
                <div className="mt-4 text-center text-gray-500 text-sm">
                  <p>
                    预览模式下，您可以更清晰地查看水印效果。点击"编辑模式"可返回设置界面。
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Watermark;
