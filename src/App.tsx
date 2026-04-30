/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  Terminal as TerminalIcon, 
  Zap, 
  Shield, 
  Play, 
  Square, 
  ChevronRight,
  TrendingUp,
  BookOpen,
  Wifi,
  Cpu,
  Search,
  CheckCircle2,
  AlertCircle,
  Clipboard,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AnalysisResult {
  questionText: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [points, setPoints] = useState(1240);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timer, setTimer] = useState(0);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Add log
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    addLog('EBA Assistant System Booting...', 'info');
    addLog('AI Vision Layer: READY', 'success');
    addLog('Paste detection active (Ctrl+V)', 'info');
    
    if (!process.env.GEMINI_API_KEY) {
      addLog('WARNING: No Gemini API Key found in environment.', 'warning');
    }
  }, [addLog]);

  // Gemini API Logic
  const analyzeImage = useCallback(async (base64Image: string) => {
    if (!process.env.GEMINI_API_KEY) {
      addLog('API Key missing. Please configure GEMINI_API_KEY in Secrets.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    addLog('AI Neural Net connecting...', 'info');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = base64Image.split(',')[1];
      
      const prompt = `Görüntüdeki sınav sorusunu analiz et. 
                     Sorunun metnini, şıkları ve doğru cevabı belirle. 
                     Lütfen şu JSON formatında cevap ver:
                     {
                       "questionText": "soru buraya",
                       "options": [{"label": "A", "text": "şık metni"}, {"label": "B", "text": "..."}],
                       "correctAnswer": "A",
                       "explanation": "Neden bu şık doğru olduğunun kısa açıklaması"
                     }
                     Sadece JSON döndür. Başka metin ekleme.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/png", data: base64Data } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      
      const data = JSON.parse(text) as AnalysisResult;
      setResult(data);
      setPoints(p => p + 50);
      addLog('Analysis Complete. Result rendered.', 'success');
    } catch (error) {
      console.error(error);
      addLog('Neural Link Error: Analysis failed. ' + (error instanceof Error ? error.message : ''), 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [addLog]);

  // Clipboard Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isActive) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setPastedImage(base64);
              addLog('Image detected from clipboard. Processing...', 'warning');
              analyzeImage(base64);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isActive, addLog, analyzeImage]);

  // Timer & Auto-logging logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
        
        const rand = Math.random();
        if (rand > 0.99) {
          addLog('Neural sync pattern detected.', 'info');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, addLog]);

  const handleToggleBot = () => {
    if (!isActive) {
      setIsActive(true);
      addLog('ADAPTIVE ENGINE STARTING...', 'warning');
      addLog('Vision module: ONLINE', 'success');
    } else {
      setIsActive(false);
      setPastedImage(null);
      setResult(null);
      addLog('ENGINE STOPPED.', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col md:flex-row p-4 gap-4 bg-[var(--color-bot-dark)]">
      <div className="scanline" />
      
      {/* Sidebar / Left Column */}
      <aside className="w-full md:w-80 flex flex-col gap-4 z-10 shrink-0">
        <div className="bot-border p-4 bg-black/40 backdrop-blur-md rounded-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="text-[var(--color-bot-green)] w-8 h-8" />
            <div>
              <h1 className="terminal-text text-xl uppercase">EBA AI EXPERT</h1>
              <p className="text-[10px] opacity-60 text-[var(--color-bot-green)] font-mono tracking-widest">VISION_AGENT_X</p>
            </div>
          </div>

          <div className="space-y-4">
            <a 
              href="https://www.eba.gov.tr" 
              target="_blank" 
              rel="noreferrer"
              className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-eba-blue/20 border border-eba-blue text-eba-blue hover:bg-eba-blue/30 font-mono text-sm transition-all rounded-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>EBA RESMİ SİTEYE GİT</span>
            </a>

            <div className="p-3 bg-[var(--color-bot-green)]/10 bot-border rounded-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="terminal-text text-xs opacity-70">RANK POINTS</span>
                <TrendingUp className="w-3 h-3 text-[var(--color-bot-green)]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--color-bot-green)]">
                {points.toLocaleString()} <span className="text-xs font-normal">XP</span>
              </div>
            </div>

            <div className="p-3 bg-black/60 bot-border rounded-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="terminal-text text-xs opacity-70">UPTIME</span>
                <Activity className="w-3 h-3 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-400">
                {formatTime(timer)}
              </div>
            </div>

            <button 
              onClick={handleToggleBot}
              className={`w-full py-4 px-4 flex items-center justify-center gap-3 font-mono font-bold uppercase transition-all duration-300 relative group overflow-hidden ${
                isActive 
                ? 'bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-[var(--color-bot-green)]/20 border border-[var(--color-bot-green)] text-[var(--color-bot-green)] hover:bg-[var(--color-bot-green)]/30 shadow-[0_0_15px_rgba(0,255,65,0.2)]'
              }`}
            >
              {isActive ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              <span className="tracking-widest">{isActive ? 'HALT PROCESS' : 'START'}</span>
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="bot-border flex-1 p-4 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col rounded-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-[var(--color-bot-green)]/20 pb-2">
            <TerminalIcon className="w-4 h-4 text-[var(--color-bot-green)]" />
            <span className="terminal-text text-xs tracking-widest">NEURAL_MONITOR.LOG</span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar pr-2">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 leading-relaxed"
                >
                  <span className="opacity-30">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'success' ? 'text-green-400 font-bold' :
                    log.type === 'error' ? 'text-red-400 font-bold' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-[var(--color-bot-green)] opacity-80'
                  }>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
          {/* SCAN AREA */}
          <section className="bot-border p-6 bg-black/40 backdrop-blur-md flex flex-col rounded-sm h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <Search className="text-[var(--color-bot-green)] w-6 h-6" />
                <h2 className="terminal-text text-lg">VISION SCANNER</h2>
              </div>
              <div className="text-[10px] terminal-text opacity-40">CAPTURE_DEVICE_01</div>
            </div>

            <div className={`flex-1 bot-border bg-black/50 relative flex flex-col items-center justify-center p-4 transition-all overflow-hidden ${!isActive ? 'opacity-20 pointer-events-none' : ''}`}>
              {!pastedImage ? (
                <div className="text-center group p-8 border-2 border-dashed border-[var(--color-bot-green)]/20 rounded-lg max-w-sm w-full">
                  <div className="w-20 h-20 bg-[var(--color-bot-green)]/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[var(--color-bot-green)]/10 transition-all">
                    <Clipboard className="w-10 h-10 text-[var(--color-bot-green)] animate-pulse" />
                  </div>
                  <p className="terminal-text text-sm mb-3 tracking-widest">AWAITING INPUT</p>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-[var(--color-bot-green)] opacity-70">
                      GÖRÜRTÜYÜ KOPYALAYIN VE 
                    </p>
                    <p className="text-xs font-mono font-bold text-[var(--color-bot-green)]">
                      CTRL + V
                    </p>
                    <p className="text-[10px] font-mono text-[var(--color-bot-green)] opacity-70">
                      YAPARAK YÜKLEYİN
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col gap-4 overflow-hidden">
                  <div className="flex-1 min-h-0 bot-border overflow-hidden relative group bg-black/80">
                    <img src={pastedImage} alt="Captured Question" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bot-green)]/5 to-transparent pointer-events-none opacity-50" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Loader2 className="w-16 h-16 text-[var(--color-bot-green)] animate-spin mb-6" />
                        </motion.div>
                        <p className="terminal-text text-sm animate-pulse tracking-[0.2em]">ANALYZING_PATTERNS...</p>
                        <div className="w-48 h-1 bg-black mt-6 bot-border overflow-hidden">
                          <motion.div 
                            animate={{ x: [-200, 200] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full bg-[var(--color-bot-green)] shadow-[0_0_10px_var(--color-bot-green)]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                        setPastedImage(null);
                        setResult(null);
                    }}
                    className="py-2.5 px-4 border border-red-500/50 text-red-500 font-mono text-[10px] hover:bg-red-500/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Clear Visual Data</span>
                  </button>
                </div>
              )}

              {/* Decorative components for capture area */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[var(--color-bot-green)]/40" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[var(--color-bot-green)]/40" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[var(--color-bot-green)]/40" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[var(--color-bot-green)]/40" />
            </div>
          </section>

          {/* ANSWER AREA */}
          <section className="bot-border p-6 bg-black/40 backdrop-blur-md flex flex-col rounded-sm h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <Cpu className="text-[var(--color-bot-green)] w-6 h-6" />
                <h2 className="terminal-text text-lg">AI ANALYSIS ENGINE</h2>
              </div>
              <div className="text-[10px] terminal-text opacity-40">GEMINI_3_FLASH</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-3">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <div className="relative mb-6">
                    <AlertCircle className="w-20 h-20" />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-[var(--color-bot-green)] rounded-full blur-2xl"
                    />
                  </div>
                  <p className="terminal-text text-sm tracking-widest">AWAITING NEURAL PAYLOAD</p>
                  <p className="text-[10px] mt-2 font-mono italic">Start engine and paste image to begin</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Soru */}
                  <div className="p-5 bg-[var(--color-bot-green)]/5 bot-border relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-10">
                        <BookOpen className="w-8 h-8" />
                     </div>
                    <span className="text-[10px] terminal-text opacity-50 block mb-3 underline decoration-dotted">DETECTED_QUERY</span>
                    <p className="text-sm font-medium leading-relaxed text-white/90">
                        {result.questionText}
                    </p>
                  </div>

                  {/* Şıklar */}
                  <div className="space-y-3">
                     <span className="text-[10px] terminal-text opacity-50 block mb-1">CANDIDATE_OPTIONS</span>
                    {result.options.map((opt) => (
                      <div 
                        key={opt.label}
                        className={`p-4 bot-border flex gap-4 items-center transition-all ${
                            opt.label === result.correctAnswer 
                            ? 'bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                            : 'bg-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}
                      >
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-bold font-mono border-2 ${
                            opt.label === result.correctAnswer 
                            ? 'border-green-500 text-green-400 bg-green-500/20' 
                            : 'border-white/10'}`}>
                          {opt.label}
                        </div>
                        <div className="text-xs flex-1">{opt.text}</div>
                        {opt.label === result.correctAnswer && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            >
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </motion.div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="p-5 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 p-4 opacity-5">
                        <Zap className="w-24 h-24 text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-1.5 bg-yellow-500 rounded-sm">
                        <Zap className="w-4 h-4 text-black" />
                      </div>
                      <span className="terminal-text text-sm text-yellow-500 font-bold tracking-widest">
                        DECISION: {result.correctAnswer}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed font-mono">
                      <span className="text-yellow-500/60 mr-2">{'>'}</span>{result.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Status */}
            <div className="mt-6 flex items-center justify-between border-t border-[var(--color-bot-green)]/10 pt-4 shrink-0">
              <div className="flex items-center gap-6 text-[9px] font-mono opacity-40">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>UPLANE_STABLE_400MB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>LOAD: {(Math.random() * 15).toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--color-bot-green)] animate-pulse shadow-[0_0_5px_var(--color-bot-green)]' : 'bg-red-500'}`} />
                 <span className="text-[var(--color-bot-green)] font-mono text-[10px] tracking-widest">
                    {isActive ? 'READY_TO_SOLVE' : 'STANDBY'}
                 </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Frame Decorations */}
      <div className="fixed top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[var(--color-bot-green)]/20 m-2 pointer-events-none" />
      <div className="fixed top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[var(--color-bot-green)]/20 m-2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[var(--color-bot-green)]/20 m-2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-12 h-12 border-b-4 border-r-2 border-[var(--color-bot-green)]/10 m-2 pointer-events-none" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 65, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 65, 0.4);
        }
        ::selection {
            background: rgba(0, 255, 65, 0.3);
            color: white;
        }
      `}</style>
    </div>
  );
}
