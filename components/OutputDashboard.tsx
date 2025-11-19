
import React, { useState } from 'react';
import { StrategyResult, PerformanceMetrics } from '../types';
import { RadarScoreChart } from './RadarScoreChart';
import { PlatformCard } from './PlatformCard';
import { ContentValidator } from './ContentValidator';
import { generateViralThumbnail, generateConceptVideo, generateScriptAudio } from '../services/geminiService';
import { Copy, Check, Clock, TrendingUp, Save, Hash, Target, Image as ImageIcon, Video, Mic, Play, Loader2, Search, Palette } from 'lucide-react';

interface Props {
  data: StrategyResult;
  onReset: () => void;
  onSavePerformance?: (metrics: PerformanceMetrics) => void;
  initialPerformance?: PerformanceMetrics;
}

export const OutputDashboard: React.FC<Props> = ({ data, onReset, onSavePerformance, initialPerformance }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>(initialPerformance || {
    reach: 0, likes: 0, comments: 0, shares: 0, saves: 0
  });
  const [performanceSaved, setPerformanceSaved] = useState(false);

  // Brand Colors
  const [brandColors, setBrandColors] = useState({ primary: '#a855f7', secondary: '#22d3ee' });

  // Generation States
  const [genThumbnail, setGenThumbnail] = useState<string | null>(null);
  const [loadingThumb, setLoadingThumb] = useState(false);
  
  const [genVideo, setGenVideo] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const [genAudio, setGenAudio] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveMetrics = () => {
    if (onSavePerformance) {
      onSavePerformance(metrics);
      setPerformanceSaved(true);
      setTimeout(() => setPerformanceSaved(false), 3000);
    }
  };

  const handleGenerateThumbnail = async () => {
    setLoadingThumb(true);
    try {
        const url = await generateViralThumbnail(data.optimization.hookVariations[0], data.analysis.valueProposition, brandColors);
        setGenThumbnail(url);
    } catch (e) { alert("Erro ao gerar imagem. Verifique se a chave API suporta Imagen 4."); }
    setLoadingThumb(false);
  };

  const handleGenerateVideo = async () => {
    setLoadingVideo(true);
    try {
        const url = await generateConceptVideo(data.optimization.hookVariations[0], data.analysis.valueProposition, brandColors);
        setGenVideo(url);
    } catch (e) { 
        console.error(e);
        alert("Erro ao gerar vídeo (Veo). Pode ser que sua chave API não tenha acesso ao modelo 'veo-3.1-fast-generate-preview' ou houve timeout."); 
    }
    setLoadingVideo(false);
  };

  const getAudioScript = () => {
      return `Attention! ${data.optimization.hookVariations[0]}. Here is the deal: ${data.analysis.valueProposition}. So, ${data.optimization.optimizedCTA}`;
  };

  const handleGenerateAudio = async () => {
    setLoadingAudio(true);
    const script = getAudioScript();
    try {
        // Try Gemini TTS first
        const base64 = await generateScriptAudio(script);
        setGenAudio(base64);
    } catch (e) { 
        console.warn("Gemini TTS failed, falling back to Native Browser TTS", e);
        // Fallback to native browser TTS
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(script);
            utterance.lang = 'en-US'; // Or detect language
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
            alert("API indisponível. Reproduzindo via Sintetizador do Navegador (Fallback).");
        } else {
            alert("Erro ao gerar áudio e navegador não suporta TTS.");
        }
    }
    setLoadingAudio(false);
  };

  // Helper to play base64 audio
  const playAudio = () => {
      if (!genAudio) return;
      const snd = new Audio("data:audio/wav;base64," + genAudio);
      snd.play();
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      
      {/* Top Actions */}
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={onReset}
            className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
        >
            ← Nova Estratégia
        </button>
        <div className="px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-widest">
            AI Powerhouse Active
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 1. Viral Score Radar (Col-span-4) */}
        <div className="md:col-span-4 glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-400" /> Score Viral
            </h3>
            <div className="h-64 -ml-6">
                <RadarScoreChart scores={data.analysis.scores} />
            </div>
        </div>

        {/* 2. Main Diagnosis (Col-span-8) */}
        <div className="md:col-span-8 glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
                <div>
                    <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-bold text-2xl mb-2">Diagnóstico Estratégico</h3>
                    <p className="text-slate-300 text-base leading-relaxed border-l-2 border-primary-500 pl-4">
                        {data.analysis.valueProposition}
                    </p>
                </div>
                
                {/* Trend Context from Search Grounding */}
                {data.analysis.trendContext && (
                     <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-xs uppercase tracking-wide">
                            <Search className="w-3 h-3" /> Google Search Trends
                        </div>
                        <p className="text-sm text-blue-100/80 leading-relaxed">
                            {data.analysis.trendContext}
                        </p>
                     </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-yellow-500/50 transition-colors group">
                        <span className="block text-[10px] text-yellow-500 font-bold uppercase mb-2 tracking-wider">Análise do Hook</span>
                        <p className="text-sm text-slate-300 group-hover:text-white transition-colors">{data.analysis.hookAssessment}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/50 transition-colors group">
                        <span className="block text-[10px] text-purple-500 font-bold uppercase mb-2 tracking-wider">Originalidade</span>
                        <p className="text-sm text-slate-300 group-hover:text-white transition-colors">{data.analysis.originalityTrend}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. CREATIVE STUDIO (Generative AI Tools) */}
        <div className="md:col-span-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Video className="w-6 h-6 text-hot-500" /> Estúdio Criativo (Generative AI)
                </h2>
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400 font-bold uppercase">Marca:</span>
                    </div>
                    <input 
                        type="color" 
                        value={brandColors.primary}
                        onChange={(e) => setBrandColors({...brandColors, primary: e.target.value})}
                        className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-none p-0" 
                        title="Cor Primária"
                    />
                    <input 
                        type="color" 
                        value={brandColors.secondary}
                        onChange={(e) => setBrandColors({...brandColors, secondary: e.target.value})}
                        className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-none p-0" 
                        title="Cor Secundária"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Imagen 4 Thumbnail */}
                <div className="glass-card p-6 rounded-3xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-white flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary-400"/> Thumbnail (9:16)</h4>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-white/5 min-h-[200px]">
                        {loadingThumb ? <Loader2 className="animate-spin text-primary-500"/> : 
                         genThumbnail ? <img src={genThumbnail} className="w-full h-full object-cover" alt="Generated Thumbnail" /> :
                         <span className="text-xs text-slate-600">Aguardando Geração</span>
                        }
                    </div>
                    <button onClick={handleGenerateThumbnail} disabled={loadingThumb} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                        {loadingThumb ? 'Criando...' : 'Gerar Thumbnail'}
                    </button>
                </div>

                {/* Veo Video Concept */}
                <div className="glass-card p-6 rounded-3xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-white flex items-center gap-2"><Video className="w-4 h-4 text-hot-400"/> Veo Video (9:16)</h4>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-white/5 min-h-[200px]">
                        {loadingVideo ? <Loader2 className="animate-spin text-hot-500"/> : 
                         genVideo ? <video src={genVideo} controls autoPlay loop className="w-full h-full object-cover" /> :
                         <span className="text-xs text-slate-600 text-center px-4">Aguardando Geração.<br/><span className="text-[10px] opacity-50">(Pode demorar ~1min)</span></span>
                        }
                    </div>
                    <button onClick={handleGenerateVideo} disabled={loadingVideo} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                        {loadingVideo ? 'Renderizando (Veo)...' : 'Gerar Vídeo'}
                    </button>
                </div>

                {/* TTS Audio */}
                <div className="glass-card p-6 rounded-3xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-white flex items-center gap-2"><Mic className="w-4 h-4 text-accent-400"/> Narrativa (Auto)</h4>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-xl mb-4 flex flex-col items-center justify-center border border-white/5 min-h-[200px] gap-3">
                        {loadingAudio ? <Loader2 className="animate-spin text-accent-500"/> : 
                         genAudio ? (
                             <>
                                <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center animate-pulse">
                                    <Mic className="w-8 h-8 text-accent-400"/>
                                </div>
                                <span className="text-xs text-green-400">Áudio Pronto</span>
                             </>
                         ) :
                         <span className="text-xs text-slate-600">Aguardando Geração</span>
                        }
                    </div>
                    <button onClick={genAudio ? playAudio : handleGenerateAudio} disabled={loadingAudio} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                        {loadingAudio ? 'Sintetizando...' : genAudio ? <><Play className="w-3 h-3"/> Tocar Preview</> : 'Gerar Áudio (Script)'}
                    </button>
                </div>

            </div>
        </div>

        {/* 4. Hooks Generator (Col-span-12 for flow) */}
        <div className="md:col-span-12 glass-card rounded-3xl p-6 border-t-4 border-t-hot-500">
             {/* Existing Hook Content */}
             <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-hot-500/20 rounded-lg text-hot-500">
                    <div className="w-5 h-5"><Hash /></div>
                </div>
                <h2 className="text-lg font-bold text-white">Hooks de Alta Retenção</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.optimization.hookVariations.map((hook, idx) => (
                    <div key={idx} className="group relative flex items-start gap-4 bg-black/30 border border-white/5 hover:border-hot-500/50 rounded-xl p-4 transition-all">
                        <span className="text-hot-500 font-mono text-xl font-bold opacity-50 group-hover:opacity-100 transition-opacity">0{idx + 1}</span>
                        <p className="text-slate-200 text-sm flex-1 pt-1 leading-relaxed">{hook}</p>
                        <button 
                            onClick={() => copyToClipboard(hook, idx)}
                            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* 5. CTA & Timing (Col-span-12) */}
        <div className="md:col-span-6 glass-card rounded-3xl p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Call to Action (Viral)</h3>
            <div className="bg-gradient-to-br from-primary-900/40 to-black border border-primary-500/30 rounded-xl p-5 text-primary-100 italic text-sm leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                "{data.optimization.optimizedCTA}"
            </div>
        </div>

        <div className="md:col-span-6 glass-card rounded-3xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4 text-accent-400">
                <Clock className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">Timing de Ouro</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white mb-2">{data.distribution.timing}</div>
            <div className="flex flex-wrap gap-2 mt-2">
                {data.distribution.initialTrigger.map((trigger, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">
                        {trigger}
                    </span>
                ))}
            </div>
        </div>
      </div>

      {/* PLATFORMS SECTION */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Hash className="w-6 h-6 text-accent-500" /> Estratégia Multicanal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.platforms.map((platform, idx) => (
                <PlatformCard key={idx} platform={platform} />
            ))}
        </div>
      </div>

      {/* CONTENT VALIDATOR */}
      <ContentValidator strategy={data} />

      {/* PERFORMANCE LOOP HUD */}
      <div className="mt-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-accent-600/10 blur-3xl -z-10"></div>
        <div className="glass-card border border-primary-500/30 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-hot-500"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    Feedback Loop (Recalibragem)
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                    Alimente o sistema com dados reais para aprimorar o algoritmo da próxima geração.
                    </p>
                </div>
                {performanceSaved && (
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-fade-in shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                    <Check className="w-4 h-4" /> Dados Sincronizados
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="group">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block group-hover:text-primary-400 transition-colors">
                            {key}
                        </label>
                        <input 
                        type="number" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                        placeholder="0"
                        value={value || ''}
                        onChange={(e) => setMetrics({...metrics, [key]: Number(e.target.value)})}
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSaveMetrics}
                    className="bg-white text-black hover:bg-primary-400 hover:text-white transition-all duration-300 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg"
                >
                    <Save className="w-4 h-4" /> Calibrar Inteligência
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
