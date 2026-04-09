import React, { useState } from 'react';
import { Plus, GitBranch, Search, Database, LogOut, Loader2, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { repoService } from '../services/api';

const Sidebar = ({ repos, selectedRepo, onSelect, onRepoAdded }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const { logout, user } = useAuth();

  const handleAddRepo = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await repoService.upload(repoUrl);
      setRepoUrl('');
      setShowAdd(false);
      onRepoAdded();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add repository');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="w-80 border-r border-white/10 flex flex-col bg-surface/30 backdrop-blur-md">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Code2 className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg">CodebaseChat</span>
        </div>

        <button 
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Repository
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {repos.map(repo => (
          <button
            key={repo.repoId}
            onClick={() => onSelect(repo)}
            className={`w-full text-left p-4 rounded-xl transition-all border ${
              selectedRepo?.repoId === repo.repoId 
              ? 'bg-primary/10 border-primary/30 text-white shadow-lg shadow-primary/5' 
              : 'border-transparent text-gray-400 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <GitBranch className="w-4 h-4" />
              <span className="font-semibold truncate">{repo.name || 'Repository'}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${repo.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                {repo.status}
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-4">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.username || 'User'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
           </div>
           <button onClick={logout} className="p-2 text-gray-500 hover:text-red-400">
              <LogOut className="w-4 h-4" />
           </button>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="glass w-full max-w-md p-8 rounded-3xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-bold mb-6">New Repository</h3>
            <form onSubmit={handleAddRepo} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-sm text-gray-400 ml-1">GitHub Repo URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/author/repo"
                    className="input-field"
                    required
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                  />
               </div>
               <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={adding}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingest Codebase'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
