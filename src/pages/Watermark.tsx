import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [selectedImage, setSelectedImage] = useState<number | null>(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [showAppliedMessage, setShowAppliedMessage] = useState<number | null>(
    null
  );
  const [showSavedMessage, setShowSavedMessage] = useState<number | null>(null);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [hasChanged, setHasChanged] = useState(false);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [watermarkGrid, setWatermarkGrid] = useState({
    cols: 0,
    rows: 0,
    spacingX: 0,
    spacingY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [scaleFactor, setScaleFactor] = useState(1);

  const { fetchedItems } = useFetchStore();
  const {
    watermarkSettings,
    updateSettings,
    savedWatermarks,
    addWatermark,
    deleteWatermark,
  } = useWatermarkStore();

  // 示例图片 - 更新为更优质的示例
  const images = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?q=80&w=800&auto=format&fit=crop",
      alt: "自然风景",
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop",
      alt: "宠物",
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
      alt: "花卉特写",
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop",
      alt: "美食",
    },
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
      // 确保下载前设置了跨域配置
      const options = {
        cacheBust: true,
        imagePlaceholder:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };
      const dataUrl = await htmlToImage.toPng(imagePreviewRef.current, options);
      const link = document.createElement("a");
      link.download = `watermarked-image-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("图片已下载");
    } catch (error) {
      console.error("下载图片时出错:", error);
      toast.error("下载失败，请重试");
    }
  };

  // 计算水印网格布局
  const calculateWatermarkGrid = useCallback(() => {
    // 如果引用不存在或组件未挂载，则退出
    if (!imagePreviewRef.current) {
      console.log("预览区域DOM引用不存在，稍后重试");
      return;
    }

    const containerWidth = imagePreviewRef.current.clientWidth;
    const containerHeight = imagePreviewRef.current.clientHeight;

    // 如果尺寸为0，可能是DOM还未完全渲染
    if (containerWidth === 0 || containerHeight === 0) {
      console.log("预览区域尺寸为0，可能DOM未完全渲染，延迟计算");
      return;
    }

    // 保存当前预览尺寸
    setPreviewDimensions({ width: containerWidth, height: containerHeight });

    // 计算缩放比例，用于调整水印大小以匹配最终文档效果
    // 使用A4纸尺寸(794x1123)作为基准
    const calculatedScaleFactor = Math.min(
      containerWidth / 794,
      containerHeight / 1123
    );
    // 设置合理的缩放范围
    const adjustedScaleFactor = Math.max(
      0.5,
      Math.min(calculatedScaleFactor, 1.2)
    );
    setScaleFactor(adjustedScaleFactor);
    console.log(`预览缩放比例: ${adjustedScaleFactor.toFixed(2)}`);

    // 使用与DocumentPaginationService.ts完全相同的计算方式
    const baseSpacingX = 300;
    const baseSpacingY = 200;

    // 密度因子计算 - 与文档生成服务使用完全一致的公式
    const densityFactor = 1 - (watermarkSettings.density - 1) / 10; // 1->1, 3->0.8, 5->0.6

    // 计算最终间距 - 基于缩放比例调整
    const spacingX = baseSpacingX * densityFactor * adjustedScaleFactor;
    const spacingY = baseSpacingY * densityFactor * adjustedScaleFactor;

    // 计算列数和行数 - 确保完全覆盖
    const cols = Math.ceil(containerWidth / spacingX) + 2; // 加2确保边缘覆盖
    const rows = Math.ceil(containerHeight / spacingY) + 2;

    // 使用与服务完全相同的起始偏移
    const offsetX = spacingX / 2;
    const offsetY = spacingY / 2;

    console.log(
      `预览计算 - 密度:${
        watermarkSettings.density
      }, 系数:${densityFactor.toFixed(2)}, 间距:${spacingX.toFixed(
        0
      )}x${spacingY.toFixed(
        0
      )}, 网格:${cols}x${rows}, 尺寸:${containerWidth}x${containerHeight}`
    );

    setWatermarkGrid({
      cols,
      rows,
      spacingX,
      spacingY,
      offsetX,
      offsetY,
    });
  }, [watermarkSettings.density]);

  // 计算调整后的水印大小
  const getAdjustedFontSize = useCallback(() => {
    // 基于缩放因子调整字体大小
    const fontSize = Math.round(watermarkSettings.size * scaleFactor);
    // 限制大小范围，避免过大或过小
    return Math.max(10, Math.min(fontSize, 36));
  }, [watermarkSettings.size, scaleFactor]);

  // 在组件挂载、水印设置变化、预览模式切换和图片选择变化时重新计算水印布局
  useEffect(() => {
    if (selectedImage !== null) {
      // 使用setTimeout确保DOM已更新
      const timer = setTimeout(() => {
        calculateWatermarkGrid();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [calculateWatermarkGrid, selectedImage, previewMode, watermarkSettings]);

  // 添加窗口大小变化监听，以便调整水印布局
  useEffect(() => {
    const handleResize = () => {
      if (selectedImage !== null) {
        calculateWatermarkGrid();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [calculateWatermarkGrid, selectedImage]);

  // 初始化时确保水印网格计算 - 添加依赖数组包含calculateWatermarkGrid
  useEffect(() => {
    // 短延迟确保DOM已渲染
    const timer = setTimeout(() => {
      if (selectedImage !== null && imagePreviewRef.current) {
        console.log("初始化计算水印网格");
        calculateWatermarkGrid();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [calculateWatermarkGrid, selectedImage]);

  // 在预览区域加载完成后计算水印网格
  const handleImageLoad = useCallback(() => {
    console.log("图片加载完成，计算水印网格");
    calculateWatermarkGrid();
  }, [calculateWatermarkGrid]);

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
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiImage className="mr-2 text-pink-500" />
                选择图片
              </h2>

              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto px-1 pb-1 pt-1">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative rounded-lg cursor-pointer overflow-hidden transition-all duration-300 group ${
                      selectedImage === image.id
                        ? "ring-2 ring-pink-500 shadow-lg transform scale-[1.01]"
                        : "hover:shadow-md hover:transform hover:scale-[1.01] border border-gray-100"
                    }`}
                    onClick={() => setSelectedImage(image.id)}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.alt}
                        crossOrigin="anonymous"
                        className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                          selectedImage === image.id
                            ? "bg-gradient-to-tr from-pink-500/40 to-purple-500/20"
                            : "bg-gradient-to-tr from-gray-900/0 to-gray-900/0 group-hover:from-gray-900/10 group-hover:to-gray-900/5"
                        }`}
                      >
                        {selectedImage === image.id && (
                          <div className="px-3 py-1.5 rounded-full bg-white shadow-md text-pink-600 font-medium text-xs tracking-wide transform -rotate-6 scale-110 flex items-center">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5"></span>
                            已选择
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`p-3 transition-all duration-300 ${
                        selectedImage === image.id
                          ? "bg-gradient-to-r from-pink-50 to-white"
                          : "bg-white group-hover:bg-gray-50/50"
                      }`}
                    >
                      <h3
                        className={`font-medium text-sm transition-colors duration-300 ${
                          selectedImage === image.id
                            ? "text-pink-700"
                            : "text-gray-700 group-hover:text-gray-900"
                        }`}
                      >
                        {image.alt}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 水印预设 */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FiSave className="mr-2 text-pink-500" />
                  水印预设
                </h2>
                <button
                  onClick={addNewWatermarkPreset}
                  className="text-sm flex items-center text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-2.5 py-1.5 rounded-md transition-colors duration-200"
                >
                  <FiPlusCircle size={16} className="mr-1.5" />
                  新增配置
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {savedWatermarks.length > 0 ? (
                  savedWatermarks.map((preset) => (
                    <div
                      key={preset.id}
                      className={`flex justify-between items-center p-3.5 rounded-lg transition-all duration-300 cursor-pointer group ${
                        activePreset === preset.id
                          ? "bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 shadow-sm"
                          : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200"
                      }`}
                      onClick={() => applyWatermarkPreset(preset)}
                    >
                      <div className="flex-grow">
                        <h3
                          className={`font-medium ${
                            activePreset === preset.id
                              ? "text-pink-700"
                              : "text-gray-800 group-hover:text-gray-900"
                          }`}
                        >
                          {preset.name}
                        </h3>
                        <p
                          className={`text-sm mt-0.5 ${
                            activePreset === preset.id
                              ? "text-pink-500"
                              : "text-gray-500 group-hover:text-gray-600"
                          }`}
                        >
                          {preset.settings.text}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {showAppliedMessage === preset.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-green-500 text-xs flex items-center mr-2 bg-green-50 px-2 py-1 rounded-full"
                          >
                            <FiCheckCircle className="mr-1" /> 已应用
                          </motion.span>
                        )}
                        {showSavedMessage === preset.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-blue-500 text-xs flex items-center mr-2 bg-blue-50 px-2 py-1 rounded-full"
                          >
                            <FiCheckCircle className="mr-1" /> 已保存
                          </motion.span>
                        )}
                        {activePreset === preset.id &&
                          !showAppliedMessage &&
                          !showSavedMessage && (
                            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-pink-500 mr-2.5"></span>
                          )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWatermark(preset.id);
                            if (activePreset === preset.id) {
                              setActivePreset(null);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                          title="删除预设"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-full bg-gray-50">
                      <FiSave size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500">暂无保存的水印预设</p>
                    <p className="text-gray-400 text-sm mt-1">
                      点击"新增配置"按钮创建一个预设
                    </p>
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiEdit2 className="mr-2 text-pink-500" />
                水印设置
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 flex items-center text-sm">
                    水印文字
                    <span className="ml-1 text-xs text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="text"
                    value={watermarkSettings.text}
                    onChange={handleSettingsChange}
                    placeholder="输入水印文字"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    字体
                  </label>
                  <select
                    name="font"
                    value={watermarkSettings.font}
                    onChange={handleSettingsChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="sans-serif">无衬线字体</option>
                    <option value="serif">衬线字体</option>
                    <option value="monospace">等宽字体</option>
                    <option value="cursive">手写字体</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    文字颜色
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={watermarkSettings.color}
                      onChange={handleColorChange}
                      className="w-12 h-10 p-1 border-0 rounded-lg cursor-pointer"
                    />
                    <div
                      className="flex-1 py-2 px-3 border border-gray-200 rounded-lg bg-white font-mono text-sm"
                      style={{ color: watermarkSettings.color }}
                    >
                      {watermarkSettings.color}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm flex justify-between">
                    <span>不透明度</span>
                    <span className="font-normal text-pink-500">
                      {watermarkSettings.opacity}%
                    </span>
                  </label>
                  <input
                    type="range"
                    name="opacity"
                    min="10"
                    max="100"
                    value={watermarkSettings.opacity}
                    onChange={handleSettingsChange}
                    className="w-full accent-pink-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm flex justify-between">
                    <span>字体大小</span>
                    <span className="font-normal text-pink-500">
                      {watermarkSettings.size}px
                    </span>
                  </label>
                  <input
                    type="range"
                    name="size"
                    min="10"
                    max="40"
                    value={watermarkSettings.size}
                    onChange={handleSettingsChange}
                    className="w-full accent-pink-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10px</span>
                    <span>40px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm flex justify-between">
                    <span>水印密度</span>
                    <span className="font-normal text-pink-500">
                      {
                        ["极低", "低", "中等", "高", "极高"][
                          watermarkSettings.density - 1
                        ]
                      }
                    </span>
                  </label>
                  <input
                    type="range"
                    name="density"
                    min="1"
                    max="5"
                    value={watermarkSettings.density}
                    onChange={handleSettingsChange}
                    className="w-full accent-pink-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>极低</span>
                    <span>极高</span>
                  </div>
                </div>
              </div>

              {/* 更新预设按钮 */}
              <div className="mt-6">
                <button
                  onClick={updateCurrentPreset}
                  disabled={!activePreset || !hasChanged}
                  className={`w-full px-4 py-3 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    activePreset && hasChanged
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:from-pink-600 hover:to-purple-600"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FiSave className="mr-2" size={18} />
                  {activePreset
                    ? `更新"${
                        savedWatermarks.find((p) => p.id === activePreset)
                          ?.name || "当前"
                      }"预设`
                    : "请先选择预设"}
                </button>
                {hasChanged && activePreset && (
                  <p className="text-xs text-pink-500 mt-2 text-center">
                    已修改，点击保存更新当前预设
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 右侧 - 预览 */}
          <motion.div
            className={`${previewMode ? "lg:col-span-2" : "lg:col-span-1"}`}
            layout
            transition={{ duration: 0.3 }}
            onLayoutAnimationComplete={calculateWatermarkGrid}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiEye className="mr-2 text-pink-500" />
                {previewMode ? "全屏预览" : "水印预览"}
                {activePreset !== null && (
                  <span className="text-sm font-normal text-pink-600 ml-2 bg-pink-50 px-2 py-0.5 rounded-full">
                    {savedWatermarks.find((p) => p.id === activePreset)?.name}
                  </span>
                )}
              </h2>

              {selectedImage !== null ? (
                <div>
                  <div
                    ref={imagePreviewRef}
                    className={`relative rounded-lg overflow-hidden border border-gray-100 shadow-sm ${
                      previewMode ? "h-[calc(100vh-320px)]" : "h-[400px]"
                    }`}
                  >
                    <img
                      src={images.find((img) => img.id === selectedImage)?.src}
                      alt="预览图片"
                      className={`w-full h-full object-cover`}
                      crossOrigin="anonymous"
                      onLoad={handleImageLoad}
                    />

                    {/* 水印层 - 使用绝对定位覆盖整个容器 */}
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden"
                      style={{
                        opacity: watermarkSettings.opacity / 100,
                        // 添加一个微妙的背景效果，使其看起来更像生成的文档
                        backgroundImage: previewMode
                          ? "linear-gradient(rgba(255,255,255,0.02), rgba(255,255,255,0.02))"
                          : "none",
                      }}
                    >
                      {/* 动态渲染水印 */}
                      {(() => {
                        if (watermarkGrid.cols === 0 || !selectedImage)
                          return null;

                        const {
                          cols,
                          rows,
                          spacingX,
                          spacingY,
                          offsetX,
                          offsetY,
                        } = watermarkGrid;
                        const watermarks = [];

                        const adjustedFontSize = getAdjustedFontSize();

                        // 生成水印网格 - 使用相同的布局逻辑
                        for (let row = 0; row < rows; row++) {
                          for (let col = 0; col < cols; col++) {
                            const x = offsetX + col * spacingX;
                            const y = offsetY + row * spacingY;

                            watermarks.push(
                              <div
                                key={`wm-${row}-${col}`}
                                className="absolute"
                                style={{
                                  left: `${x}px`,
                                  top: `${y}px`,
                                  transform: `translate(-50%, -50%) rotate(-30deg)`,
                                  textAlign: "center",
                                  // 使用调整后的字体大小
                                  fontSize: `${adjustedFontSize}px`,
                                  fontFamily: watermarkSettings.font,
                                  color: watermarkSettings.color,
                                  whiteSpace: "nowrap",
                                  // 添加字体抗锯齿，使其更接近生成效果
                                  textRendering: "optimizeLegibility",
                                  WebkitFontSmoothing: "antialiased",
                                  MozOsxFontSmoothing: "grayscale",
                                  // 添加轻微的文字描边，提高可见度
                                  textShadow: "0 0 1px rgba(255,255,255,0.1)",
                                }}
                              >
                                {watermarkSettings.text}
                              </div>
                            );
                          }
                        }

                        return watermarks;
                      })()}
                    </div>
                  </div>

                  {/* 预览控制和下载按钮 */}
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 flex items-center text-gray-700"
                    >
                      {previewMode ? (
                        <>
                          <FiEdit className="mr-2 text-pink-500" />
                          编辑模式
                        </>
                      ) : (
                        <>
                          <FiEye className="mr-2 text-pink-500" />
                          全屏预览
                        </>
                      )}
                    </button>

                    <button
                      onClick={downloadImage}
                      disabled={selectedImage === null}
                      className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow hover:shadow-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <FiDownload size={18} className="mr-2" />
                      下载图片
                    </button>
                  </div>

                  {/* 水印预览信息条 */}
                  <div className="mt-3 px-3 py-2 text-xs text-gray-500 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-center">
                    <div>
                      尺寸: {previewDimensions.width.toFixed(0)}x
                      {previewDimensions.height.toFixed(0)}
                    </div>
                    <div>
                      字体: {getAdjustedFontSize()}px | 缩放比:{" "}
                      {scaleFactor.toFixed(2)}
                    </div>
                    <div>
                      密度:{" "}
                      {
                        ["极低", "低", "中等", "高", "极高"][
                          watermarkSettings.density - 1
                        ]
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-8 bg-gray-50 rounded-lg border border-gray-100">
                  <FiImage size={48} className="mb-4 text-gray-300" />
                  <p className="text-center text-gray-500 mb-2">
                    请从左侧选择一张图片
                  </p>
                  <p className="text-center text-gray-400 text-sm">
                    使用水印预览功能，查看和调整水印效果
                  </p>
                </div>
              )}

              {previewMode && selectedImage && (
                <div className="mt-4 text-center text-gray-500 text-sm">
                  <p className="bg-pink-50 text-pink-700 px-4 py-2 rounded-lg inline-block">
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
