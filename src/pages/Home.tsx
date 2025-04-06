import React from "react";
import { Link } from "react-router-dom";
import { FiLink, FiEdit, FiImage, FiDownload } from "react-icons/fi";
import { motion } from "framer-motion";

const featureCards = [
  {
    icon: <FiLink size={24} />,
    title: "内容抓取",
    description: "支持单条和批量抓取小红书笔记内容，快速获取创作素材",
    path: "/fetch",
    color: "from-pink-500 to-red-500",
  },
  {
    icon: <FiEdit size={24} />,
    title: "内容改写",
    description: "智能改写内容，支持多种风格和参数设置，让您的创作更高效",
    path: "/rewrite",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: <FiImage size={24} />,
    title: "水印处理",
    description: "为图片添加自定义水印，保护您的内容版权",
    path: "/watermark",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: <FiDownload size={24} />,
    title: "导出管理",
    description: "一键导出改写后的内容，支持多种格式",
    path: "/export",
    color: "from-green-500 to-teal-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

const Home: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          小红书内容智能改写助手
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          为内容创作者提供高效的内容改写工具，提高创作效率，保持内容的质量和风格一致性
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {featureCards.map((card, index) => (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ scale: 1.03 }}
            className="relative bg-white rounded-xl shadow-lg overflow-hidden group"
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`}
            ></div>
            <Link to={card.path} className="block p-6">
              <div className="mb-4 text-white p-3 rounded-full inline-block bg-gradient-to-r w-14 h-14 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110">
                <div
                  className={`bg-gradient-to-r ${card.color} rounded-full p-2`}
                >
                  {card.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600">{card.description}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-16 p-6 bg-white rounded-xl shadow-lg text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          开始您的高效创作之旅
        </h2>
        <p className="text-gray-600 mb-6">
          点击上方任意功能卡片，开始使用小红书内容智能改写助手
        </p>
        <Link
          to="/fetch"
          className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          立即开始
        </Link>
      </motion.div>
    </div>
  );
};

export default Home;
