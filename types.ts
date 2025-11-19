
export enum Objective {
  ENGAGEMENT = 'Engajamento (Comentários/Likes)',
  TRAFFIC = 'Tráfego (Cliques no Link)',
  AUTHORITY = 'Autoridade (Posicionamento)',
  CONVERSION = 'Conversão (Vendas/Leads)',
  AWARENESS = 'Brand Awareness (Alcance)',
}

export interface ViralMetrics {
  watchTime: number;
  shareability: number;
  saveability: number;
  commentVelocity: number;
}

export interface PlatformStrategy {
  name: string;
  tactics: string;
  keyElements: string[];
}

export interface StrategyResult {
  analysis: {
    hookAssessment: string;
    valueProposition: string;
    originalityTrend: string;
    scores: ViralMetrics;
    trendContext?: string; // New: Real-time trend context from Search
  };
  optimization: {
    formatRecommendation: string;
    hookVariations: string[];
    optimizedCTA: string;
  };
  platforms: PlatformStrategy[];
  distribution: {
    timing: string;
    initialTrigger: string[];
  };
}

export interface VisualAnalysisData {
  estimatedFixationTime: string;
  stoppingPowerScore: number;
  colorPalette: {
    hex: string;
    usage: string;
    psychology: string;
  }[];
}

export interface ContentAnalysisResult {
  score: number;
  feedback: string;
  improvements: string[];
  rewrittenContent: string; // Text rewrite or Image edit instructions
  visualAnalysis?: VisualAnalysisData; // Optional, specific for image analysis
}

export interface FormState {
  content: string;
  objective: Objective;
  media?: {
    data: string;
    mimeType: string;
    type: 'image' | 'video';
  };
}

export interface PerformanceMetrics {
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  form: FormState;
  result: StrategyResult;
  performance?: PerformanceMetrics;
}

// New Interface for Generated Assets
export interface GeneratedAssets {
  thumbnailUrl?: string;
  videoUrl?: string;
  audioData?: string; // Base64
}
