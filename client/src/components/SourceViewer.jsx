import React from 'react';
import { X, Copy, ExternalLink, Code2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SourceViewer = ({ source, onClose }) => {
  if (!source) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(source.content);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold truncate">{source.file_path.split('/').pop()}</h4>
            <p className="text-[10px] text-gray-400 truncate">{source.file_path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={copyCode}
             className="p-2 text-gray-500 hover:text-white transition-colors"
             title="Copy Code"
           >
              <Copy className="w-4 h-4" />
           </button>
           <button 
             onClick={onClose}
             className="p-2 text-gray-500 hover:text-red-400 transition-colors"
           >
              <X className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#1e1e1e] custom-scrollbar">
        <SyntaxHighlighter
          language={source.language || 'javascript'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '2rem',
            fontSize: '13px',
            backgroundColor: 'transparent',
            lineHeight: '1.6'
          }}
          showLineNumbers
          lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#555' }}
        >
          {source.content}
        </SyntaxHighlighter>
      </div>

      <div className="p-4 border-t border-white/10 bg-surface/40 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
         <span>Language: {source.language}</span>
         <span>Semantic Match: Context Provided</span>
      </div>
    </div>
  );
};

export default SourceViewer;
