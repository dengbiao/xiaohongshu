import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ContentFetch from './pages/ContentFetch';
import ContentRewrite from './pages/ContentRewrite';
import Watermark from './pages/Watermark';
import ExportContent from './pages/ExportContent';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-center" />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fetch" element={<ContentFetch />} />
          <Route path="/rewrite" element={<ContentRewrite />} />
          <Route path="/watermark" element={<Watermark />} />
          <Route path="/export" element={<ExportContent />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;