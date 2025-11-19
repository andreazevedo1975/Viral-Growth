import React, { useState, useRef } from 'react';
import { StrategyResult, ContentAnalysisResult } from '../types';
import { analyzeContent } from '../services/geminiService';
import { FileText, Image as ImageIcon, Video, Mic, Loader2, CheckCircle, AlertTriangle, Wand2, RefreshCw, MousePointerClick, Eye, Palette, Zap, Layers } from 'lucide-react';

interface Props {
  strategy: StrategyResult;
}

export const ContentValidator: React.FC<Props> = ({ strategy }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ data: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if ((activeTab === 'image' && !isImage) || (activeTab === 'video' && !isVideo) || (activeTab === 'audio' && !isAudio)) {
      alert(`Formato inválido para ${activeTab}.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Limite de 10MB excedido.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.split(',')[1];
      setSelectedMedia({ data: base64Data, mimeType: file.type });
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (activeTab === 'text' && !textContent.trim()) return;
    if (activeTab !== 'text' && !selectedMedia) return;

    setLoading(true);
    try {
      const context = `Objetivo: ${strategy.analysis.valueProposition}. Hooks: ${strategy.optimization.hookVariations.join(', ')}. Formato: ${strategy.optimization.formatRecommendation}`;
      const analysis = await analyzeContent(context, textContent, activeTab, selectedMedia ? { data: selectedMedia.data, mimeType: selectedMedia.mimeType } : undefined);
      setResult(analysis);
    } catch (error) {
      alert('Erro na análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-400';
    if (score >= 50) return 'bg-gradient-to-r from-yellow-500 to-orange-400';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  };

  const renderTabButton = (type: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => { setActiveTab(type); setResult(null); setSelectedMedia(null); }}
      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 ${
        activeTab === type 
          ? 'bg-white text-black shadow-lg shadow-white/10' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="mt-12 glass-card rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-400" />
            Validar Criativo
          </h3>
          <p className="text-xs text-slate-400 mt-1">Análise técnica de ativos antes da publicação.</p>
        </div>
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
          {renderTabButton('text', <FileText className="w-3 h-3" />, 'Copy')}
          {renderTabButton('image', <ImageIcon className="w-3 h-3" />, 'Visual')}
          {renderTabButton('video', <Video className="w-3 h-3" />, 'Vídeo')}
          {renderTabButton('audio', <Mic className="w-3 h-3" />, 'Áudio')}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Input Area */}
        <div className="space-y-6">
          {activeTab === 'text' ? (
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="// Insira sua legenda ou roteiro aqui..."
              className="w-full h-80 glass-input rounded-2xl p-6 text-slate-200 focus:border-primary-500 outline-none resize-none font-mono text-sm leading-relaxed"
            />
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`w-full h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
                dragActive ? 'border-primary-400 bg-primary-500/10' : selectedMedia ? 'border-transparent bg-black/40' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept={activeTab === 'image' ? "image/*" : activeTab === 'video' ? "video/*" : "audio/*"} onChange={handleFileUpload} />
              
              {selectedMedia ? (
                activeTab === 'image' ? (
                  <img src={`data:${selectedMedia.mimeType};base64,${selectedMedia.data}`} alt="Preview" className="h-full w-full object-contain z-10" />
                ) : activeTab === 'video' ? (
                   <video controls className="h-full w-full object-contain z-10" src={`data:${selectedMedia.mimeType};base64,${selectedMedia.data}`} />
                ) : (
                   <div className="flex flex-col items-center justify-center z-10 text-primary-400">
                      <Mic className="w-12 h-12 mb-4" />
                      <span className="text-xs font-mono">Áudio Carregado</span>
                   </div>
                )
              ) : (
                <div className="text-center pointer-events-none">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${dragActive ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <p className="text-slate-300 text-sm font-medium">Arraste ou clique</p>
                  <p className="text-slate-600 text-xs mt-1 uppercase tracking-wider">Max 10MB</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || (activeTab === 'text' ? !textContent : !selectedMedia)}
            className="w-full bg-white text-black hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4 fill-black" />}
            {loading ? 'Processando...' : 'Executar Análise'}
          </button>
        </div>

        {/* Result Area */}
        <div className="bg-black/30 rounded-2xl border border-white/5 p-1 relative min-h-[350px]">
           <div className="h-full w-full bg-grid-pattern rounded-xl p-6 overflow-y-auto custom-scrollbar">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <MousePointerClick className="w-8 h-8 mb-4" />
                  <p className="text-xs uppercase tracking-widest">Aguardando Input</p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resultado da IA</span>
                    <div className={`px-3 py-1 rounded-full border text-xs font-bold ${getScoreColor(result.score)}`}>
                      Score: {result.score}
                    </div>
                  </div>

                  {/* Visual Metrics */}
                  {activeTab === 'image' && result.visualAnalysis && (
                    <div className="grid grid-cols-1 gap-4">
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-end mb-2">
                             <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold">
                                <Zap className="w-3 h-3 text-primary-400" /> Stopping Power
                             </div>
                             <div className="text-xl font-mono font-bold text-white">{result.visualAnalysis.stoppingPowerScore}<span className="text-xs text-slate-500">/100</span></div>
                          </div>
                          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full ${getProgressBarColor(result.visualAnalysis.stoppingPowerScore)} transition-all duration-1000`}
                                style={{ width: `${result.visualAnalysis.stoppingPowerScore}%` }}
                             ></div>
                          </div>
                       </div>

                       <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/5 rounded-lg text-accent-400">
                                <Eye className="w-4 h-4" />
                             </div>
                             <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Tempo de Fixação</div>
                                <div className="text-xs text-slate-400">Estimativa Neural</div>
                             </div>
                          </div>
                          <div className="text-right">
                              <div className="text-lg font-mono font-bold text-white">{result.visualAnalysis.estimatedFixationTime.split(' ')[0]}</div>
                              <div className="text-[10px] text-slate-500 uppercase font-medium">{result.visualAnalysis.estimatedFixationTime.split(' ').slice(1).join(' ')}</div>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="space-y-4">
                     <div className="p-4 bg-white/5 rounded-xl border-l-2 border-white/20">
                        <p className="text-sm text-slate-300 leading-relaxed italic">"{result.feedback}"</p>
                     </div>

                     {result.visualAnalysis?.colorPalette && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                           {result.visualAnalysis.colorPalette.map((c, i) => (
                              <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                                 <div className="w-8 h-8 rounded-md shadow-sm border border-white/10" style={{ backgroundColor: c.hex }}></div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-slate-400">{c.hex}</span>
                                    <span className="text-[8px] text-slate-500 max-w-[70px] truncate" title={c.psychology}>{c.psychology}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}

                     <div>
                        <h5 className="text-[10px] uppercase text-slate-500 font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Melhorias Obrigatórias</h5>
                        <ul className="space-y-2">
                           {result.improvements.map((imp, i) => (
                              <li key={i} className="text-xs text-slate-300 flex gap-3 items-start bg-white/5 p-2 rounded-lg border border-white/5">
                                 <span className="text-primary-500 font-bold mt-0.5">•</span> {imp}
                              </li>
                           ))}
                        </ul>
                     </div>

                     <div className="bg-primary-900/10 border border-primary-500/20 rounded-xl p-5">
                        <h5 className="text-[10px] uppercase text-primary-400 font-bold mb-3 flex items-center gap-2"><Wand2 className="w-3 h-3" /> Otimização</h5>
                        <div className="text-sm text-slate-200 font-mono whitespace-pre-wrap">{result.rewrittenContent}</div>
                     </div>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};