import React, { useState, useEffect, useRef } from 'react';
import { Objective, FormState, StrategyResult, HistoryItem, PerformanceMetrics } from './types';
import { generateViralStrategy } from './services/geminiService';
import { OutputDashboard } from './components/OutputDashboard';
import { Loader2, AlertCircle, Sparkles, History, Clock, ArrowRight, Trash2, Zap, Activity, Image as ImageIcon, Video, X, UploadCloud } from 'lucide-react';

const HISTORY_KEY = 'viralGrowthHistory';

// New Logo Component
const ViralLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="absolute inset-0 bg-primary-500 rounded-xl rotate-6 opacity-50 blur-sm"></div>
    <div className="absolute inset-0 bg-accent-400 rounded-xl -rotate-6 opacity-50 blur-sm"></div>
    <div className="relative bg-gradient-to-br from-primary-600 to-primary-900 w-full h-full rounded-xl flex items-center justify-center border border-white/10 shadow-xl">
      <Activity className="text-white w-6 h-6" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormState>({
    content: '',
    objective: Objective.ENGAGEMENT
  });

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (form: FormState, res: StrategyResult) => {
    const id = Date.now().toString();
    const newItem: HistoryItem = {
      id,
      timestamp: Date.now(),
      form: { ...form },
      result: res
    };
    const updatedHistory = [newItem, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    setCurrentHistoryId(id);
  };

  const updatePerformance = (metrics: PerformanceMetrics) => {
    if (!currentHistoryId) return;
    const updatedHistory = history.map(item => {
      if (item.id === currentHistoryId) {
        return { ...item, performance: metrics };
      }
      return item;
    });
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.form);
    setResult(item.result);
    setCurrentHistoryId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Limite de 10MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setError("Formato não suportado. Use Imagem ou Vídeo.");
        return;
      }

      setFormData(prev => ({
        ...prev,
        media: {
          data: base64,
          mimeType: file.type,
          type: isImage ? 'image' : 'video'
        }
      }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeMedia = () => {
    setFormData(prev => ({ ...prev, media: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!formData.content.trim() && !formData.media) {
      setError("Por favor, insira uma descrição ou faça upload de um arquivo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const strategy = await generateViralStrategy(formData, history);
      setResult(strategy);
      saveToHistory(formData, strategy);
    } catch (err) {
      setError("Falha ao gerar estratégia. Verifique sua chave API ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(new Date(ts));
  };

  const getCurrentPerformance = () => {
    if (!currentHistoryId) return undefined;
    const item = history.find(h => h.id === currentHistoryId);
    return item?.performance;
  };

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-400/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-hot-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setResult(null)}>
            <ViralLogo />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                Viral<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Growth</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">Intelligence Protocol</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-mono">
                Engine: Gemini 2.5
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {!result ? (
          <div className="max-w-3xl mx-auto animate-fade-in">
            
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3 h-3" /> Nova Geração de Crescimento Orgânico
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-white">
                Viralize com <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-hot-400 to-accent-400">
                  Inteligência Artificial
                </span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
                A única plataforma que une dados históricos, psicologia comportamental e análise de algoritmos para criar conteúdo inevitável.
              </p>
            </div>

            {/* Main Form Card */}
            <div className="glass rounded-3xl p-1 md:p-2 shadow-2xl shadow-primary-900/20 relative z-10">
              <div className="bg-surface/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
                <div className="space-y-8">
                  
                  {/* Objective Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                     {Object.values(Objective).map((obj) => (
                       <button
                         key={obj}
                         onClick={() => setFormData({ ...formData, objective: obj as Objective })}
                         className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                           formData.objective === obj 
                             ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20' 
                             : 'text-slate-400 hover:text-white hover:bg-white/5'
                         }`}
                       >
                         {obj.split(' ')[0]}
                       </button>
                     ))}
                  </div>

                  {/* Content Composer */}
                  <div>
                    <div className="flex justify-between mb-3">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent-400" /> Contexto & Upload
                        </label>
                        <span className="text-xs text-slate-500">Descreva ou faça upload para análise</span>
                    </div>
                    
                    <div 
                        className={`relative group transition-all duration-300 ${dragActive ? 'ring-2 ring-primary-500 bg-primary-500/5' : ''}`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                        <div className="glass-input rounded-xl overflow-hidden border border-white/10 focus-within:border-primary-500/50 transition-colors">
                            {/* Text Area */}
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Descreva sua ideia, cole um rascunho ou faça upload para análise visual..."
                                className="w-full h-40 bg-transparent px-5 py-4 text-slate-100 placeholder-slate-600 outline-none resize-none text-base leading-relaxed font-mono"
                            />
                            
                            {/* Media Preview */}
                            {formData.media && (
                                <div className="px-5 pb-4">
                                    <div className="relative inline-block group/media">
                                        <div className="h-20 w-auto min-w-[100px] rounded-lg overflow-hidden border border-white/10 bg-black/50 flex items-center justify-center">
                                            {formData.media.type === 'image' ? (
                                                <img src={`data:${formData.media.mimeType};base64,${formData.media.data}`} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 p-2">
                                                    <Video className="w-5 h-5 text-slate-300" />
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Vídeo</span>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={removeMedia}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover/media:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Toolbar */}
                            <div className="px-3 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*" />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors flex items-center gap-2 text-xs font-bold"
                                    >
                                        <ImageIcon className="w-4 h-4" /> Adicionar Imagem
                                    </button>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors flex items-center gap-2 text-xs font-bold"
                                    >
                                        <Video className="w-4 h-4" /> Adicionar Vídeo
                                    </button>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold">
                                    <UploadCloud className="w-3 h-3" /> Arraste e solte
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-300">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 p-[1px] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] transition-all hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)]"
                  >
                    <div className="relative w-full h-full bg-surface/20 backdrop-blur-sm hover:bg-transparent transition-all duration-300 rounded-xl py-4 flex items-center justify-center gap-3">
                        {loading ? (
                            <>
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                            <span className="font-bold text-white tracking-wide">Decodificando Algoritmo...</span>
                            </>
                        ) : (
                            <>
                            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out blur-md"></span>
                            <Sparkles className="w-5 h-5 text-white" />
                            <span className="font-bold text-white tracking-wide text-lg">Gerar Estratégia Viral</span>
                            </>
                        )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent History */}
            {history.length > 0 && (
              <div className="mt-16">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4" /> Memória Estratégica
                  </h3>
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] uppercase tracking-wider font-bold text-slate-600 hover:text-hot-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar
                  </button>
                </div>
                
                <div className="grid gap-3">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="group relative overflow-hidden bg-white/5 border border-white/5 hover:border-primary-500/30 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.performance ? 'bg-green-500/20 text-green-400' : 'bg-primary-500/20 text-primary-400'}`}>
                              {item.performance ? <Activity className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                           </div>
                           <div className="min-w-0">
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-1">
                                    <span>{formatDate(item.timestamp)}</span>
                                    {item.form.media && <span className="text-[9px] px-1 rounded bg-white/10">MÍDIA</span>}
                                </div>
                                <p className="text-slate-200 text-sm font-medium truncate">
                                    {item.form.content || "Análise de Mídia Enviada"}
                                </p>
                           </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <OutputDashboard 
            data={result} 
            onReset={() => setResult(null)} 
            onSavePerformance={updatePerformance}
            initialPerformance={getCurrentPerformance()}
          />
        )}
      </main>
    </div>
  );
};

export default App;