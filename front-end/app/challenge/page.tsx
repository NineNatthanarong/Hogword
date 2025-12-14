'use client';

import { useState, useEffect } from 'react';
import { User, Send, Star, ChevronLeft, Sparkles, CheckCircle, SkipForward, Loader2, AlertCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Interfaces ---
interface WordData {
  word: string;
  difficulty: string;
  log_id?: string;
  play: number;
}

interface HistoryItem {
  datetime: string;
  word: string;
  user_sentence: string;
  score: number;
  suggestion: string;
  corrected_sentence?: string;
}
interface ReportData {
  score: number;
  feedback: string;
  corrected_sentence?: string;
}

export default function ChallengePage() {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // --- States ---
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sentence, setSentence] = useState('');
  const [hasPlayed, setHasPlayed] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // overlay + report modal
  const [showOverlay, setShowOverlay] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // --- HELPER: score color mapping ---
  const getScoreColor = (score: number) => {
    if (score >= 7) return '#10B981';
    if (score >= 4) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 7) return 'Very Effective!';
    if (score >= 4) return 'Good!';
    return 'Needs Improvement';
  };

  const formatTime = (isoString: string) => {
    try {
      if (!isoString) return "-";
      const date = new Date(isoString);
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  // fetch single word
  const fetchWord = async (mode: 'fetch' | 'gen' = 'fetch') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/'); return; }

      const res = await fetch(`https://api.hogword.site/api/word?state=${mode}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem('token'); router.push('/'); }
        throw new Error('Failed to fetch word');
      }

      const result = await res.json();
      const playFlag = Number(result.play) || 0;
      const seenInHistory = Array.isArray(history) && history.some(h => String(h.word).toLowerCase() === String(result.word).toLowerCase());
      setHasPlayed(playFlag !== 0 || seenInHistory);
      setWordData(result);
      setSentence('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // fetch history (today-log) from server and setHistory (authoritative)
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch("https://api.hogword.site/api/today-log", {
        method: "GET",
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        // unauthorized -> logout
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
        }
        throw new Error('Failed to fetch logs');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        // sort by datetime desc if available, newest first
        const sorted = data.slice().sort((a: HistoryItem, b: HistoryItem) => {
          const ta = new Date(a.datetime).getTime();
          const tb = new Date(b.datetime).getTime();
          return tb - ta;
        });
        setHistory(sorted);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      // keep whatever history we had (do not clear), but ensure UI stable
    }
  };

  const closeReport = () => {
    setShowReportModal(false);
    setReport(null);
    setShowOverlay(false);
  };

  const handleSendSentence = async () => {
    if (!sentence.trim() || !wordData) return;
    setSubmitting(true);
    setShowOverlay(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch("https://api.hogword.site/api/validate-sentence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          word: wordData.word,
          user_sentence: sentence
        })
      });

      if (!res.ok) throw new Error("Validation Failed");
      setHasPlayed(true);
      const result = await res.json();

      const newItem: HistoryItem = {
        datetime: new Date().toISOString(),
        word: wordData.word,
        user_sentence: sentence,
        score: result.score,
        suggestion: result.suggestion,
        corrected_sentence: result.corrected_sentence
      };

      // optimistic prepend so user sees immediate result
      setHistory((prev) => [newItem, ...prev]);

      const rep: ReportData = {
        score: result.score,
        feedback: result.suggestion || 'No feedback provided.',
        corrected_sentence: result.corrected_sentence
      };
      setReport(rep);
      setShowOverlay(false);
      setShowReportModal(true);
      setHasPlayed(true);
      setSentence('');

      // --- authoritative refresh: re-fetch history from server to include old records ---
      // If server saves the log, this will ensure all previous logs (and server timestamps/ids) appear.
      try {
        await fetchLogs();
      } catch (e) {
        console.warn('Could not refresh logs after submit', e);
      }

    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการส่งตรวจ");
      setShowOverlay(false);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
    // initial load
    fetchWord('fetch');
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextWord = () => {
    setHasPlayed(true);
    closeReport();
    fetchWord('gen');
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-800 relative"
      style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #FFFFFF 50%, #FFEDD5 100%)' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-white/20">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => router.push('/')}>
           <svg width="32" height="32" viewBox="0 0 24 24" className="shrink-0">
             <path d="M12 2.5 L14.7 8.5 L21 11.2 L14.7 13.9 L12 19.9 L9.3 13.9 L3 11.2 L9.3 8.5 Z" fill="#5B2588" />
             <circle cx="5" cy="19" r="2.5" fill="#5B2588" />
             <path d="M19 3V7 M17 5 H21" stroke="#5B2588" strokeWidth="2.5" strokeLinecap="round" />
           </svg>
           <span className="text-2xl font-black tracking-wide uppercase text-[#5B2588]">HOGWORD</span>
        </div>

        {/* Right group: nav items + profile */}
        <div className="flex items-center gap-6">
          {/* Navigation labels (always visible, styled responsively) */}
          <div className="flex items-center gap-6 font-bold text-sm tracking-widest text-[#5B2588]">
            <span className="pb-1 cursor-pointer"
                  onClick={() => router.push('/challenge')}
                  style={{ borderBottom: '2px solid #5B2588', paddingBottom: '0.25rem' }}>
              CHALLENGE
            </span>
            <span onClick={() => router.push('/summary')} className="text-gray-400 hover:text-[#5B2588] cursor-pointer transition">
              SUMMARY
            </span>
          </div>

          {/* Profile button */}
          <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full bg-[#5B2588] text-white flex items-center justify-center shadow-md">
            <User size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 mt-4">

        <div className="bg-white rounded-[2rem] shadow-sm p-10 md:p-14 flex flex-col items-center justify-center relative text-center min-h-[250px] border border-white/60">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-400 animate-pulse">
              <Loader2 size={40} className="animate-spin text-[#5B2588]" />
              <span>Summoning word...</span>
            </div>
          ) : wordData ? (
            <>
              <div className={`absolute top-8 left-8 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase shadow-sm
                        ${wordData.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                  wordData.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'}`}>
                {wordData.difficulty}
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-[#5B2588] mb-4 drop-shadow-sm tracking-tight italic animate-in fade-in">
                "{wordData.word}"
              </h1>
            </>
          ) : null}

          <button
            onClick={handleNextWord}
            disabled={loading || submitting}
            className={`absolute top-8 right-8 px-6 py-2 rounded-full font-bold text-xs tracking-wider transition-all shadow-md flex items-center gap-2 hover:scale-105
                    ${hasPlayed ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? '...' : (hasPlayed ? <><CheckCircle size={16} /> CONTINUE</> : <><SkipForward size={16} /> SKIP</>)}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-3 pl-8 flex items-center relative h-24 border border-white/60">
          <input
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSendSentence()}
            placeholder={hasPlayed ? "Practice more with this word or click COMPLETE..." : "Enter your sentence..."}
            disabled={loading || submitting}
            className="w-full h-full text-xl outline-none text-gray-700 bg-transparent disabled:text-gray-400"
          />
          <button
            onClick={handleSendSentence}
            disabled={loading || submitting || !sentence.trim()}
            className="h-16 w-16 bg-white hover:bg-purple-50 rounded-xl flex items-center justify-center shadow-sm transition-colors"
          >
            {submitting ? <Loader2 className="animate-spin text-[#5B2588]" /> : <Send size={28} className="text-[#5B2588]" />}
          </button>
        </div>

        {/* TABLE: ตารางประวัติ */}
        {Array.isArray(history) && history.length > 0 && (
          <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-10 border border-white/60 animate-in slide-in-from-bottom-5">
            <h3 className="text-[#5B2588] font-black text-xl mb-8 uppercase tracking-widest">Today's Session</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] border-b border-gray-50">
                    <th className="pb-6 px-4 w-1/6">Word</th>
                    <th className="pb-6 px-4 w-1/3">Sentence</th>
                    <th className="pb-6 px-4 w-1/3">Feedback</th>
                    <th className="pb-6 px-4 w-1/6 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((item, index) => (
                    <tr key={index} className="group hover:bg-purple-50/20 transition-colors">
                      <td className="py-7 px-4 align-top">
                        <div className="font-bold text-gray-800 text-base">{item.word}</div>
                        <div className="text-[10px] text-gray-300 font-bold mt-1.5">{formatTime(item.datetime)}</div>
                      </td>
                      <td className="py-7 px-4 text-gray-500 text-[15px] italic leading-relaxed align-top">
                        "{item.user_sentence}"
                      </td>
                      <td className="py-7 px-4 align-top">
                        <div className="text-gray-400 text-[13px] leading-snug flex gap-2.5 items-start">
                          <AlertCircle size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                          <span>{item.suggestion || "No suggestion provided for this sentence."}</span>
                        </div>
                      </td>
                      <td className="py-7 px-4 align-top">
                        
                        {/* --- ส่วนแสดงดาว--- */}
                        <div className="flex justify-center gap-1 mb-1.5">
                          {[...Array(5)].map((_, i) => {
                            const rating = item.score / 2; 
                            const fillPercentage = Math.max(0, Math.min(1, rating - i)) * 100;

                            return (
                              <div key={i} className="relative inline-block w-[15px] h-[15px]">
                                <Star size={15} className="text-gray-100 fill-gray-100 absolute top-0 left-0" /> 
                                <div className="absolute top-0 left-0 overflow-hidden h-full" style={{ width: `${fillPercentage}%` }}>
                                  <Star size={15} className="text-[#5B2588] fill-[#5B2588]" />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-center text-[11px] font-black text-gray-300 tracking-tighter">{item.score}/10</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Profile Sidebar */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsProfileOpen(false)}></div>
          <div className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 pb-4">
              <button onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 text-[#5B2588] font-black text-xl hover:opacity-70 transition-opacity uppercase tracking-tighter">
                <ChevronLeft size={28} strokeWidth={3} /> <span>PROFILE</span>
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center pt-10 px-8">
              <div className="w-32 h-32 rounded-full bg-[#5B2588] flex items-center justify-center text-white shadow-lg mb-6">
                <User size={64} strokeWidth={1.5} />
              </div>
              <div className="text-gray-800 font-bold text-lg mb-10 tracking-tight break-all text-center">
                {userEmail || "Wizard User"}
              </div>
              <button
                onClick={() => { localStorage.clear(); router.push('/'); }}
                className="w-full bg-[#5B2588] hover:bg-[#4a1d70] text-white font-bold py-3.5 rounded-xl transition-all shadow-md uppercase tracking-widest text-sm"
              >
                Log Out
              </button>
            </div>
            {/* HOGWORD ACADEMY removed */}
          </div>
        </div>
      )}

      {/* Waiting Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[#5B2588]" size={34} />
            <h3 className="text-lg font-semibold">Please wait ...</h3>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && report && (
        <div className="fixed inset-0 z-70 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeReport} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 md:p-8 z-80 animate-in zoom-in-95">
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ border: `6px solid ${getScoreColor(Number(report.score) || 0)}` }}>
                <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
                  <div className="text-2xl font-extrabold" style={{ color: getScoreColor(Number(report.score) || 0) }}>
                    {report.score}/10
                  </div>
                </div>
              </div>
              <div className="w-full text-left text-sm text-gray-700">
                <h4 className="font-bold text-gray-400 uppercase mb-2">Feedback</h4>
                <p>{report.feedback}</p>
              </div>
              <div className="w-full flex justify-end gap-3 mt-4">
                <button onClick={closeReport} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-bold">Close</button>
                <button onClick={handleNextWord} className="px-4 py-2 rounded-md bg-[#5B2588] text-white font-bold">Next Word</button>
              </div>
            </div>
            <button onClick={closeReport} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"><X size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
