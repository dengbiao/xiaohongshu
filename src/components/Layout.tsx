import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome, FiLink, FiEdit, FiImage, FiDownload } from "react-icons/fi";
import { motion } from "framer-motion";
import classNames from "classnames";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: <FiHome size={20} />, title: "首页" },
    { path: "/fetch", icon: <FiLink size={20} />, title: "内容抓取" },
    { path: "/rewrite", icon: <FiEdit size={20} />, title: "内容改写" },
    { path: "/watermark", icon: <FiImage size={20} />, title: "水印处理" },
    { path: "/export", icon: <FiDownload size={20} />, title: "导出管理" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* 侧边导航栏 */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 h-16 flex items-center border-b">
          <h1 className="text-xl font-bold text-pink-600">小红书内容助手</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={classNames(
                    "flex items-center p-3 rounded-lg transition-all duration-200",
                    location.pathname === item.path
                      ? "bg-pink-100 text-pink-600"
                      : "hover:bg-pink-50 text-gray-600 hover:text-pink-600"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                  {location.pathname === item.path && (
                    <motion.div
                      className="absolute left-0 w-1 h-8 bg-pink-600 rounded-r-md"
                      layoutId="activeNav"
                      initial={false}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
};

export default Layout;
