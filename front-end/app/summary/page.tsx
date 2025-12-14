'use client';

import { useState, useEffect, useCallback } from 'react';
// Sparkles ถูกเอาออกแล้วเพราะ footer ถูกลบ
import { User, ChevronLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,BarChart, Bar, Cell, LabelList, ScatterChart, Scatter, LineChart, Line } from 'recharts';

// Interface ข้อมูล API (normalized)
interface SummaryData {
  avg_score_today: number;
  avg_score_all: number;
  today_skip: number;
  word_per_day: Record<string, number>;
  score_per_day: { date: string, value: number }[];
  avg_score_level: { level: string, score: number }[];
  scatter_data: { x: number, y: number }[];
  score_count_data: { score: number, count: number, difficulty: string }[];
}

export default function SummaryPage() {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // helper: last N ISO dates
  const getLastNDates = (n = 7) => {
    const arr: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  };

  const formatWordCountForChart = (wordPerDayObj?: Record<string, number>) => {
    const dates = getLastNDates(7);
    return dates.map(d => ({
      name: (new Date(d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: Number(wordPerDayObj?.[d] ?? 0)
    }));
  };

  const formatScoreForChart = (arr?: { date: string, value: number }[]) => {
    const dates = getLastNDates(7);
    if (!arr || arr.length === 0) return dates.map(d => ({ name: (new Date(d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: 0 }));
    const map = new Map<string, number>();
    arr.forEach(p => map.set((p.date || '').slice(0, 10), Number(p.value ?? 0)));
    return dates.map(d => ({ name: (new Date(d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: map.get(d) ?? 0 }));
  };

  const levelColorMap: Record<string, string> = {
    'beginner': '#34D399',
    'intermediate': '#FBBF24',
    'advanced': '#FB7185',
  };

  const levelDisplayNameMap: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
  };

  const levelData = data?.avg_score_level && Array.isArray(data.avg_score_level) ? data.avg_score_level.map((item: any) => ({
    name: levelDisplayNameMap[item.level] || item.level,
    value: Number(item.score || 0),
    color: levelColorMap[item.level] || '#9CA3AF',
  })) : [];

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { router.push('/'); return; }

      const res = await fetch("https://api.hogword.site/api/summary", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
        }
        throw new Error("Failed to load summary");
      }

      const result = await res.json();
      let normalizedWordPerDay: Record<string, number> = {};

      if (result?.word_per_day) {
        if (typeof result.word_per_day === 'object' && !Array.isArray(result.word_per_day)) {
          Object.keys(result.word_per_day).forEach(k => {
            normalizedWordPerDay[k.slice(0, 10)] = Number(result.word_per_day[k] ?? 0);
          });
        } else if (Array.isArray(result.word_per_day)) {
          const arr = result.word_per_day;
          if (arr.length > 0 && typeof arr[0] === 'object' && 'words' in arr[0]) {
            arr.forEach((p: any) => {
              const iso = (p.date || '').slice(0, 10);
              if (!iso) return;
              const total = Object.values(p.words || {}).reduce((a: number, c: any) => a + Number(c || 0), 0);
              normalizedWordPerDay[iso] = Number(total || 0);
            });
          }
          else if (arr.length > 0 && typeof arr[0] === 'object' && ('date' in arr[0] || 'day' in arr[0])) {
            arr.forEach((p: any) => {
              const iso = (p.date || p.day || '').slice(0, 10);
              if (iso) normalizedWordPerDay[iso] = Number(p.count ?? p.value ?? 0);
            });
          }
        }
      }

      getLastNDates(7).forEach(d => { if (!(d in normalizedWordPerDay)) normalizedWordPerDay[d] = 0; });

      let normalizedScoreLevel: { level: string, score: number }[] = [];
      if (Array.isArray(result?.avg_score_level)) {
        if (result.avg_score_level.length > 0 && typeof result.avg_score_level[0] === 'object' && 'level' in result.avg_score_level[0]) {
          normalizedScoreLevel = result.avg_score_level.map((item: any) => ({
            level: String(item.level || '').toLowerCase(),
            score: Number(item.score ?? 0),
          }));
        } else {
          const levels = ['beginner', 'intermediate', 'advanced'];
          normalizedScoreLevel = result.avg_score_level.map((score: any, idx: number) => ({
            level: levels[idx] || `level_${idx}`,
            score: Number(score ?? 0),
          }));
        }
      }

      const normalized: SummaryData = {
        avg_score_today: Number(result?.avg_score_today ?? 0),
        avg_score_all: Number(result?.avg_score_all ?? 0),
        today_skip: Number(result?.today_skip ?? 0),
        word_per_day: normalizedWordPerDay,
        score_per_day: Array.isArray(result?.score_per_day) ? result.score_per_day.map((p: any) => ({ date: (p.date || '').slice(0, 10), value: Number(p.value ?? p.score ?? 0) })) : [],
        avg_score_level: normalizedScoreLevel,
        scatter_data: Array.isArray(result?.scatter_data) ? result.scatter_data.map((p: any) => ({ x: Number(p.x ?? 0), y: Number(p.y ?? 0) })) : [],
        score_count_data: Array.isArray(result?.score_count_data) ? result.score_count_data.map((p: any) => ({ score: Number(p.score ?? 0), count: Number(p.count ?? 0), difficulty: String(p.difficulty || '').toLowerCase() })) : [],
      };

      setData(normalized);
    } catch (error) {
      console.error("[fetchSummary] error:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const mail = localStorage.getItem("user_email");
    if (mail) setUserEmail(mail);

    fetchSummary();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'challenge:summary-refresh' && e.newValue === '1') {
        fetchSummary();
        localStorage.removeItem('challenge:summary-refresh');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fetchSummary]);

  const wordCountChartData = formatWordCountForChart(data?.word_per_day);
  const scoreChartData = formatScoreForChart(data?.score_per_day);

  const maxPlay = Math.max(1, ...wordCountChartData.map(d => Number(d.value || 0)));
  const yDomainTopPlay = Math.ceil(maxPlay * 1.15);
  const maxScore = Math.max(1, ...scoreChartData.map(d => Number(d.value || 0)));
  const yDomainTopScore = Math.ceil(maxScore * 1.15);

  const ScoreCountTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload.find((it: any) => it && it.payload && (it.payload.score !== undefined || it.payload.count !== undefined)) || payload[0];
    const p = item.payload || {};
    return (
      <div className="bg-white p-2 rounded shadow text-sm">
        <div className="font-semibold text-slate-700">{item.name}</div>
        <div className="text-slate-600">Score: {p.score}</div>
        <div className="text-slate-600">Count: {p.count}</div>
      </div>
    );
  };


  return (
    <div className="min-h-screen w-full font-sans text-slate-800 relative"
      style={{ background: 'linear-gradient(135deg, #F0FAFF 0%, #FFF7FB 50%, #FFF6EA 100%)' }}>

      {/* Navbar */}
      <nav className="flex items-center px-6 md:px-10 py-5 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-white/30">

        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer select-none mr-auto" onClick={() => router.push('/')}>
          <svg width="32" height="32" viewBox="0 0 24 24" className="shrink-0">
            <path d="M12 2.5 L14.7 8.5 L21 11.2 L14.7 13.9 L12 19.9 L9.3 13.9 L3 11.2 L9.3 8.5 Z" fill="#5B2588" />
            <circle cx="5" cy="19" r="2.5" fill="#5B2588" />
            <path d="M19 3V7 M17 5 H21" stroke="#5B2588" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-2xl font-black tracking-wide uppercase text-[#5B2588]">HOGWORD</span>
        </div>

        {/* MENU */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-sm tracking-wider mr-8">
          <button onClick={() => router.push('/challenge')} className="text-gray-500 hover:text-[#5B2588]">CHALLENGE</button>
          <button className="text-[#5B2588] border-b-2 border-[#5B2588] pb-1">SUMMARY</button>
        </div>

        {/* PROFILE BUTTON */}
        <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full bg-[#5B2588] text-white flex items-center justify-center shadow-md">
          <User size={20} />
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10 mt-6 space-y-6">
        {loading ? (
          <div className="w-full h-[60vh] flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 size={48} className="animate-spin text-[#5B2588]" />
            <p>Analyzing your magic skills...</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col justify-center">
                <div className="text-sm text-gray-400 mb-2">Daily Average Score</div>
                <div className="flex items-end gap-3">
                  <div className="text-5xl font-extrabold text-gray-900">{Math.round(data.avg_score_today)}</div>
                  <div className="text-sm text-black-600">/10</div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Keep practising to improve</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col justify-center">
                <div className="text-sm text-gray-400 mb-2">Total Average Score</div>
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-extrabold text-gray-900">{Math.round(data.avg_score_all)}</div>
                  <div className="text-sm text-black-600">/10</div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Overall performance</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col justify-center">
                <div className="text-sm text-gray-400 mb-2">Daily Skips</div>
                <div className="flex items-baseline gap-3">
                  <div className="text-5xl font-extrabold text-gray-900">{data.today_skip ?? 0}</div>
                  <div className="text-sm text-black-600">Times</div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Try to reduce skips for better learning</div>
              </div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-md h-80">
                <h3 className="text-gray-500 font-medium mb-4">Performance Trend (last 7 days)</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={scoreChartData}>
                    <defs>
                      <linearGradient id="gradScore" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#5B2588" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#5B2588" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, yDomainTopScore]} />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), 'Score']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="value" stroke="#5B2588" strokeWidth={3} fill="url(#gradScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md h-80">
                <h3 className="text-gray-500 font-medium mb-4">Play Frequency (last 7 days)</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={wordCountChartData}>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, yDomainTopPlay]} />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), 'Count']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="value" stroke="#9333EA" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-md h-80">
                <h3 className="text-gray-500 font-medium mb-4">Practice Level Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={levelData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 10]} />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), 'Score']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {levelData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      <LabelList dataKey="value" formatter={(v: any) => Number(v).toFixed(2)} position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md h-80">
                <h3 className="text-gray-500 font-medium mb-4">Score vs Count by Difficulty</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="6 6" stroke="#f3f4f6" />
                    <XAxis type="number" dataKey="score" name="Score" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 10]} label={{ value: 'Score (คะแนน)', position: 'insideBottom', offset: -6 }} />
                    <YAxis type="number" dataKey="count" name="Count" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} label={{ value: 'Count (จำนวน)', angle: -90, position: 'insideLeft', offset: 0 }} />
                    <Tooltip content={ScoreCountTooltip} cursor={false} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }} />
                    <Legend verticalAlign="top" align="right" height={28} wrapperStyle={{ top: -18 }} />
                    <Scatter name="Beginner" data={data.score_count_data?.filter((d: any) => d.difficulty === 'beginner') || []} fill="#34D399" isAnimationActive={false} />
                    <Scatter name="Intermediate" data={data.score_count_data?.filter((d: any) => d.difficulty === 'intermediate') || []} fill="#FBBF24" isAnimationActive={false} />
                    <Scatter name="Advanced" data={data.score_count_data?.filter((d: any) => d.difficulty === 'advanced') || []} fill="#FB7185" isAnimationActive={false} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-400 pt-20">Unable to load analytics data</div>
        )}
      </main>

      {/* -------------------- PROFILE SIDEBAR (เลื่อนออกมาจากด้านข้าง) -------------------- */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 pb-4">
              <button onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 text-[#5B2588] font-black text-xl hover:opacity-70 transition-opacity uppercase tracking-tighter">
                <ChevronLeft size={28} strokeWidth={3} />
                <span>PROFILE</span>
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center pt-10 px-8">
              <div className="w-32 h-32 rounded-full bg-[#5B2588] flex items-center justify-center text-white shadow-lg mb-6">
                <User size={64} strokeWidth={1.5} />
              </div>

              {/* แสดงอีเมลจริง */}
              <div className="text-gray-800 font-bold text-lg mb-10 tracking-tight break-all text-center">
                {userEmail || "Wizard Student"}
              </div>

              <button
                onClick={() => {
                  localStorage.clear();
                  router.push('/');
                }}
                className="w-full bg-[#5B2588] hover:bg-[#4a1d70] text-white font-bold py-3.5 rounded-xl transition-all shadow-md uppercase tracking-widest text-sm"
              >
                Log Out
              </button>
            </div>
            {/* footer removed (HOGWORD ACADEMY removed) */}
          </div>
        </div>
      )}
    </div>
  );
}
