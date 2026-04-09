import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, MessageSquare, Zap, GitBranch, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Code2 className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            CodebaseChat
          </span>
        </div>
        <Link to="/login" className="btn-primary">
          Get Started
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-20 lg:py-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
              Talk to your <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent italic">
                codebase
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              The AI-powered assistant that understands your entire repository. 
              Ask questions, find bugs, and explain logic in seconds using RAG.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="btn-primary flex items-center gap-2 group">
                Try for Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#" className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all">
                <GitBranch className="w-5 h-5" />
                View on GitHub
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 group relative"
          >
             <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="glass rounded-3xl p-4 lg:p-8 relative">
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                   <div className="lg:col-span-1 text-left space-y-4">
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                         <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Selected Repository</p>
                         <div className="flex items-center gap-2 text-sm">
                            <GitBranch className="w-4 h-4" />
                            facebook/react
                         </div>
                      </div>
                      <img src="/hero.png" alt="Codebase Analysis" className="w-full h-32 object-cover rounded-xl border border-white/10 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="space-y-2">
                         <div className="w-full h-8 bg-white/5 rounded" />
                         <div className="w-[80%] h-8 bg-white/5 rounded" />
                         <div className="w-full h-8 bg-white/5 rounded" />
                      </div>
                   </div>
                   <div className="lg:col-span-3 text-left">
                      <div className="space-y-4">
                         <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">UI</div>
                            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 text-sm">
                               How does the reconciliation algorithm work?
                            </div>
                         </div>
                         <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">AI</div>
                            <div className="bg-primary/10 p-4 rounded-2xl rounded-tl-none border border-primary/20 text-sm max-w-[85%]">
                               React's reconciliation process uses a "Diffing" algorithm based on two key assumptions...
                               <div className="mt-3 p-2 bg-black/40 rounded-lg text-xs font-mono border border-white/5">
                                  // react-reconciler/src/ReactChildFiber.js
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </main>

      <section className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {[
          { icon: Zap, title: "Lightning Fast", desc: "Instant retrieval of code chunks across massive repositories." },
          { icon: MessageSquare, title: "Context Aware", desc: "Maintains chat history to understand follow-up questions." },
          { icon: Code2, title: "Multi Language", desc: "First-class support for JS, TS, Python, Java, Go and more." }
        ].map((feat, i) => (
          <div key={i} className="glass p-8 rounded-2xl glass-hover group">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <feat.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-white/5 py-12 text-center text-gray-500 text-sm">
        &copy; 2026 CodebaseChat. Built for developers by developers.
      </footer>
    </div>
  );
};

export default Home;
