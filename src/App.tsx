/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, CalendarEvent, TodoItem, DailyData, 
  MonthlyRecord, TeamMember, Prospect, RecruitCandidate, 
  Milestone, PerfData, ThemeKey, ThemeConfig 
} from './types';
import { Header } from './components/Header';
import { Home, Target, ClipboardList, Zap, Settings, Plus, Trash2, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Edit3, Award, Calendar, CalendarPlus, History, X, BookOpen, PieChart as PieChartIcon, ListTodo } from 'lucide-react';
import { THEMES, ACTIVITIES, ENCOURAGEMENTS, GROUP_CONFIG } from './constants';
import { formatNumber, cn } from './lib/utils';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { PerformancePage } from './pages/PerformancePage';
import { ListPage } from './pages/ListPage';
import { ActionPage3v6R } from './pages/ActionPage3v6R';
import { SettingsPage } from './pages/SettingsPage';

// --- Default States ---
const DEFAULT_MONTHLY: MonthlyRecord[] = [
  "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"
].map(m => ({
  month: m, target: 50000, actual: 0, noc: 0, anp: 0, recruitTarget: (m === "12月" ? 2 : 1), recruitActual: 0
}));

const INITIAL_PERF: PerfData = {
  personalQ: 0, teamQ: 0, recruitCount: 0, totalNOC: 0, totalANP: 0,
  annualTargetGSPC: 450000,
  annualTargetTeam: 10,
  monthlyRecords: DEFAULT_MONTHLY,
  prospectList: Array(25).fill(null).map(() => ({ name: "", job: "", plan: "", note: "" })),
  recruitList: Array(25).fill(null).map(() => ({ name: "", job: "", interest: "", followup: "" })),
  teamMembers: [],
  weekActs: { OF: 0, P: 0, F: 0, C: 0 },
  weekRecruitActs: { RO: 0, RP: 0, RF: 0, RS: 0 },
  dailyMission: "", dailyGoal: "", todayQ: 0, todayNOC: 0, todayANP: 0,
  dailyActivities: { of: 0, p: 0, f: 0, c: 0, ro: 0, rp: 0, rf: 0, rs: 0 },
  nightMessage: "",
  milestones: [
    { name: "🔥 个人100K QFYLP", achieved: false, category: "sales" as const },
    { name: "⚡ 个人200K QFYLP", achieved: false, category: "sales" as const },
    { name: "🏆 个人300K QFYLP", achieved: false, category: "sales" as const },
    { name: "👑 个人450K GSPC", achieved: false, category: "sales" as const },
    { name: "🤝 招募第1位战将", achieved: false, category: "recruit" as const },
    { name: "🌟 招募第5位战将", achieved: false, category: "recruit" as const },
    { name: "💎 招募第10位精英", achieved: false, category: "recruit" as const },
    { name: "🛡️ 团队活跃4人组", achieved: false, category: "recruit" as const }
  ].map(m => ({ ...m })),
  wishingStatement: "",
  dailyActivitiesLog: {}
};

export default function App() {
  // --- Navigation ---
  const [currentPage, setCurrentPage] = useState<'home' | 'perf' | 'list' | '3v6r' | 'settings'>('home');
  const [themeKey, setThemeKey] = useState<ThemeKey>('default');
  const theme = THEMES[themeKey] || THEMES.default;

  // --- Data States ---
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todoItems, setTodoItems] = useState<Record<string, TodoItem[]>>({});
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});
  const [perfData, setPerfData] = useState<PerfData>(INITIAL_PERF);
  const [viewOffset, setViewOffset] = useState(0);
  const [encouragement, setEncouragement] = useState("");
  const [baseDate, setBaseDate] = useState(new Date());

  // --- UI States ---
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number, hour: number, offset: number } | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isReflectionArchiveOpen, setIsReflectionArchiveOpen] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);

  // --- Load Data ---
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dt_dark_mode');
    if (savedDarkMode !== null) setIsDarkMode(savedDarkMode === 'true');

    const savedEvents = localStorage.getItem('dt_events');
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    const savedPerf = localStorage.getItem('dt_perf');
    if (savedPerf) setPerfData(JSON.parse(savedPerf));

    const savedTodos = localStorage.getItem('dt_todos');
    if (savedTodos) setTodoItems(JSON.parse(savedTodos));

    const savedDaily = localStorage.getItem('dt_daily');
    if (savedDaily) setDailyData(JSON.parse(savedDaily));

    const savedTheme = localStorage.getItem('dt_theme') as ThemeKey;
    if (savedTheme) setThemeKey(savedTheme);

    const savedFocus = localStorage.getItem('dt_focus');
    if (savedFocus) setIsFocusMode(savedFocus === 'true');

    const savedSound = localStorage.getItem('dt_sound');
    if (savedSound) setAmbientSound(savedSound === 'true');

    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  }, []);

  // --- Save Data ---
  useEffect(() => {
    localStorage.setItem('dt_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('dt_perf', JSON.stringify(perfData));
  }, [perfData]);

  useEffect(() => {
    localStorage.setItem('dt_todos', JSON.stringify(todoItems));
  }, [todoItems]);

  useEffect(() => {
    localStorage.setItem('dt_dark_mode', isDarkMode.toString());
    const body = document.body;
    if (isDarkMode) {
      body.classList.remove('light-mode');
      body.style.setProperty('--card-bg', 'rgba(15, 15, 20, 0.5)');
      body.style.backgroundColor = theme.bg;
    } else {
      body.classList.add('light-mode');
      body.style.setProperty('--card-bg', '#ffffff');
      body.style.backgroundColor = '#f8fafc'; // Premium Soft White/Gray
    }
  }, [isDarkMode, theme]);

  useEffect(() => {
    const body = document.body;
    body.style.setProperty('--bg-color', isDarkMode ? theme.bg : '#f8fafc');
    body.style.setProperty('--accent-color', theme.accent);
    body.style.setProperty('--border-color', theme.border);
  }, [theme, isDarkMode]);

  useEffect(() => {
    localStorage.setItem('dt_daily', JSON.stringify(dailyData));
  }, [dailyData]);

  useEffect(() => {
    localStorage.setItem('dt_theme', themeKey);
  }, [themeKey]);

  useEffect(() => {
    localStorage.setItem('dt_focus', isFocusMode.toString());
  }, [isFocusMode]);

  useEffect(() => {
    localStorage.setItem('dt_sound', ambientSound.toString());
  }, [ambientSound]);

  // --- Helpers ---
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const currentTodos = todoItems[todayKey] || [];
  const currentDaily = dailyData[todayKey] || { r: "", g: "", sixTasks: ["", "", "", "", "", ""] };
  const safeSixTasks = currentDaily.sixTasks || ["", "", "", "", "", ""];

  const currentMonday = useMemo(() => {
    const start = startOfWeek(baseDate, { weekStartsOn: 1 });
    if (viewOffset !== 0) {
      return viewOffset > 0 ? addWeeks(start, viewOffset) : subWeeks(start, Math.abs(viewOffset));
    }
    return start;
  }, [baseDate, viewOffset]);

  const timeAllocationData = useMemo(() => {
    const weekEvents = events.filter(e => e.weekOffset === viewOffset);
    const totals: Record<string, number> = {
      green: 0, yellow: 0, orange: 0, blue: 0, red: 0
    };
    
    weekEvents.forEach(e => {
      const act = ACTIVITIES.find(a => a.id === e.activityId);
      if (act && totals[act.group] !== undefined) {
        totals[act.group] += (e.endHour - e.startHour);
      }
    });

    return Object.entries(GROUP_CONFIG).map(([key, config]) => ({
      name: config.name,
      value: totals[key] || 0,
      color: config.color
    })).filter(d => d.value > 0);
  }, [events, viewOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentMonday, i));
  }, [currentMonday]);

  // --- Handlers ---
  const handleAddEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
    setIsEventModalOpen(false);
  }, []);

  const handleUpdateEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    setIsEventModalOpen(false);
    setEditingEvent(null);
  }, []);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleExport = () => {
    const data = { events, perfData, todoItems, dailyData, themeKey };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `david_tung_backup_${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (re) => {
        const data = JSON.parse(re.target?.result as string);
        if (data.events) setEvents(data.events);
        if (data.perfData) setPerfData(data.perfData);
        if (data.todoItems) setTodoItems(data.todoItems);
        if (data.dailyData) setDailyData(data.dailyData);
        if (data.themeKey) setThemeKey(data.themeKey);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportReport = () => {
    // Current week's events
    const weekEvents = events.filter(e => e.weekOffset === viewOffset);
    
    // Group and sum durations
    const reportData: Record<string, { duration: number, items: string[] }> = {};
    
    weekEvents.forEach(e => {
      const act = ACTIVITIES.find(a => a.id === e.activityId);
      const groupName = act ? (GROUP_CONFIG[act.group as keyof typeof GROUP_CONFIG]?.name || 'Other') : 'Other';
      const duration = e.endHour - e.startHour;
      
      if (!reportData[groupName]) {
        reportData[groupName] = { duration: 0, items: [] };
      }
      reportData[groupName].duration += duration;
      reportData[groupName].items.push(`"${e.title || act?.name || 'Untitled'}" (${duration}h)`);
    });

    // Generate CSV content
    const csvRows = ['Category,Total Hours,Details'];
    Object.entries(reportData).forEach(([cat, data]) => {
      csvRows.push(`${cat},${data.duration},"${data.items.join('; ')}"`);
    });
    
    // Summary line
    const totalHours = Object.values(reportData).reduce((sum, d) => sum + d.duration, 0);
    csvRows.push('');
    csvRows.push(`Total Weekly Hours,${totalHours},`);

    // Force download
    const csvContent = "\ufeff" + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const startStr = format(currentMonday, 'yyyyMMdd');
    link.setAttribute('download', `weekly_tactical_report_${startStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncAppleCalendar = useCallback(() => {
    // Generate RFC 5545 iCalendar content
    const icsContent: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//David Tung//Time Matrix//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:David Tung Time Matrix',
      'X-WR-TIMEZONE:UTC'
    ];

    events.forEach(event => {
      const activity = ACTIVITIES.find(a => a.id === event.activityId);
      const groupInfo = activity ? GROUP_CONFIG[activity.group as keyof typeof GROUP_CONFIG] : null;
      
      // Calculate the specific date for this event instance
      const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
      const weekMonday = addWeeks(monday, event.weekOffset);
      const eventDate = addDays(weekMonday, event.weekday === 0 ? 6 : event.weekday - 1);
      
      const start = new Date(eventDate);
      start.setHours(event.startHour, 0, 0, 0);
      
      const end = new Date(eventDate);
      end.setHours(event.endHour, 0, 0, 0);

      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${event.id}@david-tung-core.run`);
      icsContent.push(`DTSTAMP:${formatICSDate(new Date())}`);
      icsContent.push(`DTSTART:${formatICSDate(start)}`);
      icsContent.push(`DTEND:${formatICSDate(end)}`);
      icsContent.push(`SUMMARY:${activity?.icon || '📅'} ${event.title || activity?.name || 'Scheduled Slot'}`);
      icsContent.push(`DESCRIPTION:Activity: ${activity?.name || 'General'}\\nGroup: ${groupInfo?.name || 'Matrix'}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'david_tung_matrix.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [events, baseDate]);

  // --- Rendering ---
  return (
    <div className="min-h-screen pb-24 transition-all duration-500" 
      style={{ 
        fontFamily: '-apple-system, sans-serif' 
      } as React.CSSProperties}>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-24">
        <Header 
          theme={theme}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onQuickAdd={() => {
            setSelectedSlot({ day: new Date().getDay(), hour: 9, offset: 0 });
            setIsEventModalOpen(true);
          }}
          onExport={handleExport}
          onImport={handleImport}
          onSyncIcal={handleSyncAppleCalendar}
          onExportAll={() => {}}
          onSyncGoogle={() => {}}
          onExportReport={handleExportReport}
        />

        {currentPage === 'home' && (
          <div className="bento-grid">
            {/* Goal Tracking - Large Bento Card */}
            <div className="bento-card md:col-span-8 p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Target size={200} />
              </div>
              <div className="relative z-10">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-500/20">Annual Strategic Focus</span>
                
                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">💰 GSPC Performance</h2>
                      <input 
                        type="number"
                        className="w-20 bg-transparent text-right text-xs font-mono text-slate-500 outline-none border-b border-transparent focus:border-blue-500/50"
                        value={perfData.annualTargetGSPC}
                        onChange={(e) => setPerfData(prev => ({ ...prev, annualTargetGSPC: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-5xl font-light text-white">{formatNumber(perfData.personalQ)}</div>
                      <div className="text-sm text-slate-500">/ {formatNumber(perfData.annualTargetGSPC)}</div>
                    </div>
                    <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${Math.min(100, (perfData.personalQ / (perfData.annualTargetGSPC || 1)) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">👥 Team Recruitment</h2>
                      <input 
                        type="number"
                        className="w-16 bg-transparent text-right text-xs font-mono text-slate-500 outline-none border-b border-transparent focus:border-emerald-500/50"
                        value={perfData.annualTargetTeam}
                        onChange={(e) => setPerfData(prev => ({ ...prev, annualTargetTeam: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <input 
                        type="number"
                        className="text-5xl font-light text-white bg-transparent border-none outline-none w-24 p-0"
                        value={perfData.recruitCount}
                        onChange={(e) => setPerfData(prev => ({ ...prev, recruitCount: parseInt(e.target.value) || 0 }))}
                      />
                      <div className="text-sm text-slate-500">/ {perfData.annualTargetTeam} Players</div>
                    </div>
                    <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                        style={{ width: `${Math.min(100, (perfData.recruitCount / (perfData.annualTargetTeam || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap gap-4 items-center">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-white outline-none focus:border-blue-500"
                      placeholder="Update Current Performance Pts..."
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPerfData(prev => ({ ...prev, personalQ: val }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wishing Statement (许愿文) */}
            <div className={cn(
              "bento-card md:col-span-4 md:row-span-2 p-6 flex flex-col justify-between overflow-hidden relative transition-colors duration-300",
              isDarkMode ? "bg-slate-900/40" : "bg-white border-slate-200"
            )}>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <Target size={100} className="text-amber-500" />
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">许愿文 · Manifestation</span>
                <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Target size={14} />
                </div>
              </div>
              <textarea 
                className={cn(
                  "flex-1 w-full bg-transparent text-sm font-medium leading-relaxed italic border-none outline-none resize-none custom-scrollbar min-h-[150px]",
                  isDarkMode ? "text-slate-100 placeholder:text-slate-700" : "text-slate-800 placeholder:text-slate-300"
                )}
                placeholder="在此写下您的许愿文，让宇宙能量为您加持..."
                value={perfData.wishingStatement || ""}
                onChange={(e) => setPerfData(prev => ({ ...prev, wishingStatement: e.target.value }))}
              />
              <p className="text-[9px] text-slate-500 mt-4 uppercase font-mono italic">Universe Attraction active...</p>
            </div>

            {/* Encouragement Card (Inspiration Node) */}
            <div 
              onClick={() => setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)])}
              className={cn(
                "bento-card md:col-span-8 p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 group",
                isDarkMode ? "hover:bg-slate-800/30" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
              )}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Inspiration Node</span>
                <RefreshCw size={14} className="text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div className="mt-4">
                <p className={cn(
                  "text-xl font-medium leading-relaxed italic transition-colors",
                  isDarkMode ? "text-slate-100 group-hover:text-white" : "text-slate-800 group-hover:text-blue-600"
                )}>"{encouragement || 'Preparing insight...'}"</p>
                <p className="text-[10px] text-slate-500 mt-4 uppercase font-mono">Status: {isFocusMode ? 'Matrix Resonance High' : 'Awaiting Operations'}</p>
              </div>
            </div>

            {/* Time Allocation Chart */}
            <div className={cn(
              "bento-card md:col-span-6 p-8 flex flex-col items-center",
              isDarkMode ? "bg-slate-900/40" : "bg-white border-slate-200"
            )}>
              <div className="w-full flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <PieChartIcon size={16} className="text-blue-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Time Allocation</h3>
                </div>
                <span className="text-[9px] text-slate-500 uppercase font-mono">Matrix Week {viewOffset === 0 ? 'Current' : viewOffset > 0 ? `+${viewOffset}` : viewOffset}</span>
              </div>
              
              <div className="w-full h-[220px]">
                {timeAllocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {timeAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                          border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-center items-center justify-center text-slate-500 italic text-xs">
                    No matrix activity data available for this week.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full px-4">
                {timeAllocationData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{d.value}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reflection Bento Sections */}
            <div className={cn("bento-card md:col-span-6 p-8", !isDarkMode && "bg-white border-slate-200")}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Tactical Reflection</h3>
                </div>
                <button 
                  onClick={() => setIsReflectionArchiveOpen(true)}
                  className={cn(
                    "p-2 rounded-xl transition-all border",
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-600" 
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm"
                  )}
                  title="View Matrix Archive"
                >
                  <History size={14} />
                </button>
              </div>
              <textarea 
                className={cn(
                  "w-full rounded-2xl border p-4 text-sm outline-none transition-all min-h-[120px]",
                  isDarkMode 
                    ? "border-slate-800 bg-slate-900/50 text-slate-200 focus:border-blue-500" 
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500"
                )}
                placeholder="Analyze deviations & achievements..."
                value={currentDaily.r}
                onChange={(e) => {
                  const val = e.target.value;
                  setDailyData(prev => ({ ...prev, [todayKey]: { ...currentDaily, r: val } }));
                }}
              />
            </div>

            <div className={cn("bento-card md:col-span-6 p-8", !isDarkMode && "bg-white border-slate-200")}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Gratitude Synthesis</h3>
                </div>
                <button 
                  onClick={() => setIsReflectionArchiveOpen(true)}
                  className={cn(
                    "p-2 rounded-xl transition-all border",
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-600" 
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm"
                  )}
                  title="View Matrix Archive"
                >
                  <History size={14} />
                </button>
              </div>
              <textarea 
                className={cn(
                  "w-full rounded-2xl border p-4 text-sm outline-none transition-all min-h-[120px]",
                  isDarkMode 
                    ? "border-slate-800 bg-slate-900/50 text-slate-200 focus:border-emerald-500" 
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                )}
                placeholder="Log internal wins & appreciation..."
                value={currentDaily.g}
                onChange={(e) => {
                  const val = e.target.value;
                  setDailyData(prev => ({ ...prev, [todayKey]: { ...currentDaily, g: val } }));
                }}
              />
            </div>

            {/* 6 Most Important Things (6大要事) */}
            <div className={cn("bento-card md:col-span-6 p-8", !isDarkMode && "bg-white border-slate-200")}>
              <div className="flex items-center gap-2 mb-6">
                <ListTodo size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">6大要事 · Critical 6</h3>
              </div>
              <div className="grid gap-3">
                {safeSixTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}.</span>
                    <input 
                      type="text"
                      className={cn(
                        "flex-1 bg-transparent border-b text-sm py-1 outline-none transition-colors",
                        isDarkMode ? "border-slate-800 focus:border-blue-500 text-slate-200" : "border-slate-200 focus:border-blue-500 text-slate-900"
                      )}
                      placeholder={`Important task ${idx + 1}...`}
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...safeSixTasks];
                        newTasks[idx] = e.target.value;
                        setDailyData(prev => ({ ...prev, [todayKey]: { ...currentDaily, sixTasks: newTasks } }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline View - Full Width Wide Bento Card */}
            <div className={cn("bento-card md:col-span-12 p-8 transition-colors duration-300", !isDarkMode && "bg-white border-slate-200 shadow-slate-100")}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Time Matrix</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar size={14} />
                    <span>{format(currentMonday, 'MMM dd')} — {format(addDays(currentMonday, 6), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={handleSyncAppleCalendar}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest border",
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600" 
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm"
                    )}
                  >
                    <CalendarPlus size={14} /> 一键同步 Apple 日历 (Sync Apple)
                  </button>
                  <div className={cn(
                    "flex p-1 rounded-2xl transition-colors duration-300",
                    isDarkMode ? "bg-slate-800/50" : "bg-slate-200/50"
                  )}>
                  {[-1, 0, 1].map(off => (
                    <button 
                      key={off}
                      onClick={() => setViewOffset(off)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                        viewOffset === off 
                          ? (isDarkMode ? "bg-white text-black shadow-lg" : "bg-slate-900 text-white shadow-lg")
                          : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                      )}
                    >
                      {off === 0 ? 'Current' : off === -1 ? 'Previous' : 'Upcoming'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[800px] border-collapse text-[10px]">
                  <thead>
                    <tr>
                      <th className={cn(
                        "sticky left-0 z-10 w-24 border-r p-4 font-bold text-slate-500 uppercase tracking-tighter transition-colors",
                        isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"
                      )}>Timeline</th>
                      {weekDays.map((day, i) => (
                        <th key={i} className={cn(
                          "p-4 border-b font-medium transition-colors",
                          isDarkMode ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-200"
                        )}>
                          {format(day, 'EEE')} <br />
                          <span className={cn(
                            "text-sm font-light",
                            isDarkMode ? "text-white" : "text-slate-900"
                          )}>{format(day, 'dd')}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(hour => (
                      <tr key={hour} className={cn("border-b transition-colors", isDarkMode ? "border-slate-800/30" : "border-slate-200")}>
                        <td className={cn(
                          "sticky left-0 z-10 border-r p-2 text-center text-slate-500 font-mono transition-colors",
                          isDarkMode ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-slate-50/80 backdrop-blur-sm"
                        )}>
                           {hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour-12}:00 PM`}
                        </td>
                        {Array.from({ length: 7 }).map((_, dayIdx) => {
                          const weekday = dayIdx === 6 ? 0 : dayIdx + 1;
                          const cellEvents = events.filter(e => 
                            e.weekOffset === viewOffset && 
                            e.weekday === weekday && 
                            hour >= e.startHour && hour < e.endHour
                          );

                          return (
                            <td key={dayIdx} className={cn(
                              "group relative min-h-[64px] cursor-pointer bg-transparent p-1 transition-colors",
                              isDarkMode ? "hover:bg-white/5" : "hover:bg-blue-500/5"
                            )}
                              onClick={() => {
                                setSelectedSlot({ day: weekday, hour, offset: viewOffset });
                                setIsEventModalOpen(true);
                              }}>
                              {cellEvents.map(ev => {
                                const act = ACTIVITIES.find(a => a.id === ev.activityId);
                                return (
                                  <div 
                                    key={ev.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEvent(ev);
                                      setIsEventModalOpen(true);
                                    }}
                                    className="mb-1 flex items-center justify-between gap-1 rounded-xl p-2 text-[10px] font-semibold border transition-transform hover:scale-[1.02]"
                                    style={{ 
                                      backgroundColor: `${GROUP_CONFIG[act?.group as keyof typeof GROUP_CONFIG]?.color || '#333'}20`, 
                                      color: GROUP_CONFIG[act?.group as keyof typeof GROUP_CONFIG]?.color || '#fff',
                                      borderColor: `${GROUP_CONFIG[act?.group as keyof typeof GROUP_CONFIG]?.color || '#333'}40`
                                    }}
                                  >
                                    <span className="truncate">{act?.icon} {ev.title}</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEvent(ev.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 hover:text-white"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'perf' && <PerformancePage perfData={perfData} setPerfData={setPerfData} theme={theme} />}
        {currentPage === 'list' && <ListPage perfData={perfData} setPerfData={setPerfData} isDarkMode={isDarkMode} />}
        {currentPage === '3v6r' && <ActionPage3v6R perfData={perfData} setPerfData={setPerfData} theme={theme} />}
        {currentPage === 'settings' && <SettingsPage 
          themeKey={themeKey} 
          setThemeKey={setThemeKey} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          isFocusMode={isFocusMode}
          setIsFocusMode={setIsFocusMode}
          ambientSound={ambientSound}
          setAmbientSound={setAmbientSound}
          onClearData={() => {
            localStorage.clear();
            window.location.reload();
          }} 
        />}
      </div>
      
      {/* Footer System Status Bar */}
      <footer className={cn(
        "fixed bottom-0 left-0 right-0 backdrop-blur-md px-12 py-3 flex justify-between items-center text-[9px] uppercase tracking-[0.2em] border-t z-[60] transition-colors duration-300",
        isDarkMode ? "bg-slate-950/80 text-slate-600 border-slate-800" : "bg-white/80 text-slate-400 border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          System status: <span className="text-emerald-500 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Nominal</span>
        </div>
        <div className="flex gap-6">
          <span>Storage: Unified</span>
          <span>Security: DT-RSA-4096</span>
          <span className="hidden sm:inline">Engine: David Tung 2026 Core</span>
        </div>
      </footer>

      {/* Navigation - Minimalist Bento Style */}
      <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] border p-2 rounded-[2rem] shadow-2xl backdrop-blur-xl transition-all duration-300",
        isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200 shadow-slate-200/50"
      )}>
        <div className="flex gap-2">
          {[
            { id: 'home', icon: <Home size={20} />, label: 'Nodes' },
            { id: 'perf', icon: <Target size={20} />, label: 'Core' },
            { id: 'list', icon: <ClipboardList size={20} />, label: 'Matrix' },
            { id: '3v6r', icon: <Zap size={20} />, label: 'Pulse' },
            { id: 'settings', icon: <Settings size={20} />, label: 'Configs' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[1.5rem] px-5 py-3 transition-all active:scale-95",
                currentPage === item.id 
                  ? (isDarkMode ? "bg-white text-black shadow-lg" : "bg-slate-900 text-white shadow-lg")
                  : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
              )}
            >
              {item.icon}
              <span className="text-[8px] font-bold uppercase tracking-widest leading-none mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Reflection Archive Modal */}
      <AnimatePresence>
        {isReflectionArchiveOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] border overflow-hidden flex flex-col transition-colors duration-300 shadow-2xl",
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="p-8 border-b border-slate-800/20 flex justify-between items-center bg-gradient-to-r from-blue-500/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-bold uppercase tracking-[0.2em]", isDarkMode ? "text-white" : "text-slate-900")}>Matrix Archive</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Reviewing past reflections & growth nodes</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReflectionArchiveOpen(false)}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {Object.keys(dailyData).length === 0 || !Object.values(dailyData as Record<string, DailyData>).some((d: DailyData) => d.r || d.g) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic font-light">
                    <BookOpen size={40} className="mb-4 opacity-20" />
                    <p>No historical archives found in the matrix.</p>
                  </div>
                ) : (
                  Object.entries(dailyData as Record<string, DailyData>)
                    .filter(([, data]) => data.r || data.g)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([date, data]) => (
                      <div key={date} className={cn(
                        "group p-6 rounded-3xl border transition-all hover:scale-[1.01]",
                        isDarkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                      )}>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full uppercase">
                            {format(new Date(date), 'MMMM dd, yyyy')}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Edit3 size={12} /> Tactical Reflection
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl text-sm leading-relaxed italic border min-h-[60px]",
                              isDarkMode ? "bg-black/20 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                            )}>
                              {(data as DailyData).r || "No reflection recorded for this cycle."}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Award size={12} /> Gratitude Synthesis
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl text-sm leading-relaxed italic border min-h-[60px]",
                              isDarkMode ? "bg-black/20 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                            )}>
                              {(data as DailyData).g || "No gratitude recorded for this cycle."}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Modal - Bento Upgrade */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-lg rounded-[2.5rem] border p-8 shadow-2xl transition-colors duration-300",
                isDarkMode ? "bg-slate-950 border-slate-800 shadow-blue-500/10" : "bg-white border-slate-200 shadow-slate-200"
              )}
            >
              <div className="flex items-center gap-4 mb-8 p-4 rounded-[2rem] border transition-colors duration-300" 
                style={{ 
                  backgroundColor: isDarkMode ? `${theme.accent}15` : `${theme.accent}08`, 
                  borderColor: isDarkMode ? `${theme.accent}30` : `${theme.accent}20` 
                }}>
                <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.accent}30`, color: theme.accent }}><Plus size={20} /></div>
                <div>
                  <h3 className={cn("text-lg font-bold uppercase tracking-widest leading-tight transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>Tactical Insertion</h3>
                  <p className={cn("text-[9px] uppercase tracking-tighter italic font-medium leading-tight transition-colors", isDarkMode ? "text-slate-500" : "text-slate-400")}>"Precision in schedule leads to dominance in execution."</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">📌 具体事项 (Objective)</label>
                  <input 
                    id="modal-title" 
                    className={cn(
                      "w-full rounded-2xl border p-4 text-sm outline-none transition-all focus:border-blue-500",
                      isDarkMode ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                    )}
                    placeholder="Enter objective name..." 
                    defaultValue={editingEvent?.title || ''}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">🕒 开始时间 (Start)</label>
                    <select 
                      id="modal-start"
                      className={cn(
                        "w-full rounded-2xl border p-4 text-sm outline-none appearance-none transition-all focus:border-blue-500",
                        isDarkMode ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                      )}
                      defaultValue={editingEvent?.startHour || selectedSlot?.hour || 9}
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h} className={isDarkMode ? "bg-slate-900" : "bg-white"}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">🕒 结束时间 (End)</label>
                    <select 
                      id="modal-end"
                      className={cn(
                        "w-full rounded-2xl border p-4 text-sm outline-none appearance-none transition-all focus:border-blue-500",
                        isDarkMode ? "border-slate-800 bg-slate-900/50 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                      )}
                      defaultValue={editingEvent?.endHour || (selectedSlot?.hour ? selectedSlot.hour + 1 : 10)}
                    >
                      {Array.from({ length: 25 }).map((_, h) => (
                        <option key={h} value={h} className={isDarkMode ? "bg-slate-900" : "bg-white"}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">🎨 活动类别 (Frequency Module)</label>
                  <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar p-1">
                    {ACTIVITIES.map(a => {
                      const isSelected = (editingEvent?.activityId === a.id);
                      const groupColor = GROUP_CONFIG[a.group as keyof typeof GROUP_CONFIG]?.color || '#333';
                      
                      return (
                        <button 
                          key={a.id} 
                          onClick={() => {
                            if (editingEvent) setEditingEvent({ ...editingEvent, activityId: a.id });
                            else {
                               const selector = document.getElementById('activity-selector');
                               if (selector) {
                                 selector.setAttribute('data-selected', a.id.toString());
                                 const btns = document.querySelectorAll('[data-activity-btn]');
                                 btns.forEach(b => b.classList.remove('ring-4', 'ring-blue-500/50', 'shadow-[0_0_15px_rgba(59,130,246,0.5)]'));
                                 const current = document.querySelector(`[data-id="${a.id}"]`);
                                 current?.classList.add('ring-4', 'ring-blue-500/50', 'shadow-[0_0_15px_rgba(59,130,246,0.5)]');
                               }
                            }
                          }}
                          data-id={a.id}
                          data-activity-btn
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-2xl p-3 text-[9px] transition-all hover:scale-110 border border-transparent",
                            isSelected && "ring-4 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
                          )}
                          style={{ 
                            backgroundColor: isDarkMode ? `${groupColor}20` : `${groupColor}15`,
                            borderColor: `${groupColor}40`,
                          }}
                        >
                          <span className="text-xl" style={{ textShadow: isDarkMode ? `0 0 10px ${groupColor}40` : 'none' }}>{a.icon}</span>
                          <span className="text-center leading-tight font-bold" style={{ color: groupColor }}>{a.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div id="activity-selector" className="hidden" data-selected={editingEvent?.activityId || 1}></div>
                </div>

                <div className="mt-10 flex gap-4">
                   <button 
                    onClick={() => {
                      setIsEventModalOpen(false);
                      setEditingEvent(null);
                    }} 
                    className={cn(
                      "flex-1 rounded-2xl py-4 font-bold transition-all uppercase text-[10px] tracking-widest border",
                      isDarkMode 
                       ? "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800" 
                       : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                    )}
                   >
                    Abort
                   </button>
                   <button 
                      onClick={() => {
                        const title = (document.getElementById('modal-title') as HTMLInputElement).value;
                        const sH = parseInt((document.getElementById('modal-start') as HTMLSelectElement).value);
                        const eH = parseInt((document.getElementById('modal-end') as HTMLSelectElement).value);
                        const actId = parseInt(document.getElementById('activity-selector')?.getAttribute('data-selected') || '1');

                        if (!title) return;
                        
                        if (editingEvent) {
                          handleUpdateEvent({ ...editingEvent, title, startHour: sH, endHour: eH, activityId: actId });
                        } else if (selectedSlot) {
                          handleAddEvent({
                            id: Math.random().toString(36).substr(2, 9),
                            title,
                            startHour: sH,
                            endHour: eH,
                            weekday: selectedSlot.day,
                            weekOffset: selectedSlot.offset,
                            activityId: actId
                          });
                        }
                        setIsEventModalOpen(false);
                        setEditingEvent(null);
                      }}
                      className={cn(
                        "flex-1 rounded-2xl py-4 font-bold transition-all active:scale-95 uppercase text-[10px] tracking-widest shadow-lg",
                        isDarkMode 
                         ? "bg-white text-black shadow-white/5 hover:bg-slate-100" 
                         : "bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800"
                      )}
                    >
                      Commit
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
