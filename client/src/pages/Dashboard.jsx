import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import SourceViewer from '../components/SourceViewer';
import { repoService } from '../services/api';

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

  const handleRepoAdded = () => {
      setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        repos={repos} 
        selectedRepo={selectedRepo} 
        onSelect={setSelectedRepo} 
        onRepoAdded={handleRepoAdded}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 transition-all duration-500 ${activeSource ? 'w-1/2' : 'w-full'}`}>
          <ChatWindow 
            selectedRepo={selectedRepo} 
            onViewSource={setActiveSource} 
            activeSourceId={activeSource?.file_path}
          />
        </div>
        
        {activeSource && (
          <div className="w-1/2 border-l border-white/10 bg-surface/50 overflow-hidden">
            <SourceViewer 
              source={activeSource} 
              onClose={() => setActiveSource(null)} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
