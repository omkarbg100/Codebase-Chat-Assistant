import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import SourceViewer from '../components/SourceViewer';
import { repoService } from '../services/api';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

const Dashboard = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [activeSource, setActiveSource] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await repoService.list();
        setRepos(res.data);
        if (res.data.length > 0 && !selectedRepo) {
          setSelectedRepo(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch repos', err);
      }
    };
    fetchRepos();
  }, [refreshTrigger]);

  const handleRepoAdded = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'var(--bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    }}>
      {/* Sidebar */}
      <Sidebar
        repos={repos}
        selectedRepo={selectedRepo}
        onSelect={(repo) => { setSelectedRepo(repo); setActiveSource(null); }}
        onRepoAdded={handleRepoAdded}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Chat */}
        <div style={{
          flex: activeSource ? '0 0 55%' : '1',
          overflow: 'hidden',
          transition: 'flex 0.3s ease',
          borderRight: activeSource ? '3px solid var(--border)' : 'none',
        }}>
          <ChatWindow
            selectedRepo={selectedRepo}
            onViewSource={setActiveSource}
            activeSourceId={activeSource?.file_path}
          />
        </div>

        {/* Source Viewer panel */}
        <AnimatePresence>
          {activeSource && (
            <motion.div
              key="source-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '45%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden', flexShrink: 0 }}
            >
              <SourceViewer
                source={activeSource}
                onClose={() => setActiveSource(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
