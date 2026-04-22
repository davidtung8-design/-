import React, { useState } from 'react';
import { DTIcon } from './DTIcon';
import { ThemeConfig } from '../types';
import { Calendar, Zap, Download, Upload, RefreshCw, Send, FileText, Mail, LogIn, LogOut, User as UserIcon, HelpCircle, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { User } from 'firebase/auth';

interface HeaderProps {
  theme: ThemeConfig;
  syncId: string;
  onSyncIdChange: (id: string) => void;
  isSyncing: boolean;
  onOpenCalendar: () => void;
  onQuickAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onSyncIcal: () => void;
  onExportAll: () => void;
  onSyncGoogle: () => void;
  onExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  syncId,
  onSyncIdChange,
  isSyncing,
  onOpenCalendar,
  onQuickAdd,
  onExport,
  onImport,
  onSyncIcal,
  onExportAll,
  onSyncGoogle,
  onExportReport
}) => {
  const currentDate = new Date();
  const [showSyncEdit, setShowSyncEdit] = useState(!syncId);
  
  const currentDomain = window.location.hostname;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4 mt-4 relative">
      {showHelp && (
        <div className="absolute top-full right-0 mt-4 z-[2000] w-80 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Firebase 登录报错解决方法</h4>
            <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-white">
              <LogIn size={14} className="rotate-45" />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 mb-4 leading-relaxed">
            如果您看到 "The requested action is invalid"，是因为域名未授权。请将下方域名添加到 Firebase 控制台的 <strong>Authorized domains</strong> 列表中：
          </p>
          <div className="bg-black/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between mb-6 group cursor-pointer" onClick={copyToClipboard}>
            <code className="text-[10px] text-emerald-400 font-mono truncate mr-2">{currentDomain}</code>
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-500 group-hover:text-blue-400" />}
          </div>
          <ol className="text-[9px] text-slate-400 space-y-2 list-decimal ml-3">
            <li>进入 Firebase Console &rarr; Build &rarr; Authentication。</li>
            <li>点击 <strong>Settings</strong> &rarr; <strong>Authorized domains</strong>。</li>
            <li>点击 <strong>Add domain</strong> 并粘贴上方域名。</li>
            <li>确保 <strong>Sign-in method</strong> 中的 Google 已开启。</li>
          </ol>
          <button 
            onClick={() => setShowHelp(false)}
            className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-xl transition-colors"
          >
            知道了
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3">
          <DTIcon theme={theme} size={32} />
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            时间管理大师 <span className="text-accent text-[10px] font-mono align-top ml-2 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 uppercase">2026 Elite</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-1 ml-11">Personal Intelligence & Performance Dashboard</p>
      </div>
      
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-100">{format(currentDate, 'EEEE, MMMM dd')}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{format(currentDate, 'hh:mm a')} · Global Performance</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700 min-w-[140px]">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                isSyncing ? "bg-blue-500/20 text-blue-500 animate-pulse" : "bg-slate-700 text-slate-400"
              )}>
                {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <UserIcon size={16} />}
              </div>
              <div className="flex flex-col flex-1">
                {showSyncEdit ? (
                  <input 
                    autoFocus
                    className="bg-transparent text-[10px] text-white font-bold outline-none border-b border-blue-500/50 w-full placeholder:text-slate-600"
                    placeholder="Enter Sync ID"
                    onBlur={() => syncId && setShowSyncEdit(false)}
                    value={syncId}
                    onChange={(e) => onSyncIdChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && syncId && setShowSyncEdit(false)}
                  />
                ) : (
                  <span 
                    onClick={() => setShowSyncEdit(true)}
                    className="text-[10px] text-slate-300 font-bold truncate max-w-[80px] cursor-pointer hover:text-blue-400"
                  >
                    {syncId || 'Anonymous'}
                  </span>
                )}
                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
                  {isSyncing ? 'Synchronizing...' : 'Cloud Master Sync'}
                </span>
              </div>
            </div>

            <button 
             onClick={onSyncIcal}
             className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/20 group"
             title="一键同步 Apple 日历 (Sync Apple Calendar)"
           >
              <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
           </button>
           <button 
             onClick={onExportReport}
             className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-900/20 group"
             title="导出周报 (Export Weekly Report)"
           >
              <FileText size={20} className="group-hover:scale-110 transition-transform" />
           </button>
           <button 
             onClick={onQuickAdd}
             className="w-10 h-10 rounded-2xl bg-accent/20 text-accent flex items-center justify-center border border-accent/20 hover:bg-accent hover:text-white transition-all shadow-lg shadow-accent/20 group"
             title="快速添加"
           >
              <Zap size={20} className="group-hover:scale-110 transition-transform" />
           </button>
           <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-bold border border-slate-700 text-slate-100 text-sm">
             2026
           </div>
        </div>
      </div>
    </header>
  );
};
