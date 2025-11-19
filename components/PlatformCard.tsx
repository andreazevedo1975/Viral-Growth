import React from 'react';
import { PlatformStrategy } from '../types';
import { Instagram, Linkedin, Facebook, Video, ExternalLink, Twitter, Youtube } from 'lucide-react';

interface Props {
  platform: PlatformStrategy;
}

export const PlatformCard: React.FC<Props> = ({ platform }) => {
  const getPlatformConfig = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('instagram')) return { icon: <Instagram className="w-5 h-5" />, color: 'text-pink-500', border: 'hover:border-pink-500/50', bg: 'hover:shadow-pink-500/20', url: 'https://www.instagram.com' };
    if (n.includes('linkedin')) return { icon: <Linkedin className="w-5 h-5" />, color: 'text-blue-500', border: 'hover:border-blue-500/50', bg: 'hover:shadow-blue-500/20', url: 'https://www.linkedin.com' };
    if (n.includes('facebook')) return { icon: <Facebook className="w-5 h-5" />, color: 'text-blue-600', border: 'hover:border-blue-600/50', bg: 'hover:shadow-blue-600/20', url: 'https://www.facebook.com' };
    if (n.includes('twitter') || n.includes('x')) return { icon: <Twitter className="w-5 h-5" />, color: 'text-gray-100', border: 'hover:border-gray-500/50', bg: 'hover:shadow-gray-500/20', url: 'https://x.com' };
    if (n.includes('youtube')) return { icon: <Youtube className="w-5 h-5" />, color: 'text-red-500', border: 'hover:border-red-500/50', bg: 'hover:shadow-red-500/20', url: 'https://www.youtube.com' };
    return { icon: <Video className="w-5 h-5" />, color: 'text-purple-500', border: 'hover:border-purple-500/50', bg: 'hover:shadow-purple-500/20', url: 'https://www.tiktok.com' }; // Default TikTok
  };

  const config = getPlatformConfig(platform.name);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-500 group hover:-translate-y-1 ${config.border} hover:shadow-xl ${config.bg} flex flex-col h-full relative overflow-hidden`}>
      
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${config.color.replace('text-', 'bg-')}/10 rounded-full blur-2xl -mr-6 -mt-6 transition-opacity opacity-0 group-hover:opacity-100`}></div>

      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-black/40 ${config.color}`}>
             {config.icon}
          </div>
          <h3 className="font-bold text-sm text-white tracking-wide">{platform.name}</h3>
        </div>
        <a 
          href={config.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 flex items-center gap-1"
          title={`Abrir ${platform.name} em nova aba`}
          aria-label={`Visitar ${platform.name}`}
        >
          <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Abrir</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      
      <div className="space-y-4 flex-1 relative z-10">
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Tática Principal</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">{platform.tactics}</p>
        </div>
        
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Elementos Chave</h4>
          <ul className="space-y-1.5">
            {platform.keyElements.map((elem, i) => (
              <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                <span className={`mt-1 w-1 h-1 rounded-full ${config.color.replace('text-', 'bg-')}`}></span>
                {elem}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};