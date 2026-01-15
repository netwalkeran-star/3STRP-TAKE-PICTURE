
import React, { useState } from 'react';
import { Camera, Layers, Image as ImageIcon, Sparkles, ArrowRight, ArrowLeft, Loader2, Wand2, CheckCircle, RefreshCw, PenTool } from 'lucide-react';
import { Step, AppState } from './types.ts';
import CameraView from './components/CameraView.tsx';
import HandDrawnPose from './components/MannequinPose.tsx'; // 雖然檔名沒改，但內容已更新為手繪
import { generateAIPoseImage } from './services/geminiService.ts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: Step.SubjectCapture,
    subjectImage: null,
    subjectStyle: 'A futuristic fashion icon, cyberpunk aesthetic, detailed high-end couture',
    pose: {
      drawingImage: null,
      brushSize: 8
    },
    sceneImage: null,
    atmosphere: 'Modern minimalist studio, harsh cinematic lighting, teal highlights',
    resultImage: null
  });

  const [loading, setLoading] = useState(false);

  const nextStep = () => {
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, step: prev.step - 1 }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setState(prev => ({ ...prev, step: Step.Generating }));
    const result = await generateAIPoseImage(state);
    setState(prev => ({ ...prev, resultImage: result, step: Step.Result }));
    setLoading(false);
  };

  const renderHeader = () => {
    const steps = [
      { id: 1, label: 'Hero', icon: Camera },
      { id: 2, label: 'Action', icon: PenTool },
      { id: 3, label: 'World', icon: ImageIcon }
    ];

    return (
      <div className="px-6 pt-10 pb-6 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-2xl z-20 sticky top-0 shrink-0">
        <div className="flex gap-5 items-center">
          {steps.map((s) => (
            <div 
              key={s.id} 
              className={`flex flex-col items-center gap-1.5 ${state.step === s.id ? 'text-white' : state.step > s.id ? 'text-zinc-500' : 'text-zinc-800'}`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${state.step === s.id ? 'border-cyan-500 bg-cyan-500/10' : state.step > s.id ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-900'}`}>
                <s.icon size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-end">
          <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">POSEGEN</h1>
          <p className="text-[8px] text-cyan-500 uppercase font-black tracking-[0.3em] mt-1.5">v4.0 SKETCH</p>
        </div>
      </div>
    );
  };

  const renderCaptureSummary = (image: string, onReset: () => void) => (
    <div className="flex-1 flex flex-col p-6 space-y-4 animate-in zoom-in-95 duration-500 overflow-hidden">
      <div className="flex-1 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 relative bg-zinc-950">
        <img src={image} className="w-full h-full object-contain bg-black" alt="Captured" />
        <div className="absolute top-6 right-6">
          <div className="bg-cyan-600 p-2.5 rounded-2xl shadow-lg border border-white/20">
            <CheckCircle size={20} className="text-white" />
          </div>
        </div>
      </div>
      <button 
        onClick={onReset}
        className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors py-2 shrink-0"
      >
        <RefreshCw size={12} /> Replace Capture
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black text-white relative font-sans overflow-hidden">
      {state.step < Step.Generating && renderHeader()}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {state.step === Step.SubjectCapture && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {!state.subjectImage ? (
                <CameraView 
                  title="Protagonist Identity" 
                  placeholderText="Capture the person to transform"
                  onCapture={(img) => setState(prev => ({ ...prev, subjectImage: img }))}
                />
              ) : renderCaptureSummary(state.subjectImage, () => setState(prev => ({ ...prev, subjectImage: null })))}
            </div>
            
            {state.subjectImage && (
              <div className="p-8 bg-zinc-950 border-t border-white/5 flex flex-col gap-6 animate-in slide-in-from-bottom-8 shrink-0">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protagonist Style</label>
                  <textarea 
                    value={state.subjectStyle}
                    onChange={(e) => setState(prev => ({ ...prev, subjectStyle: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none h-20 resize-none transition-all font-medium"
                  />
                </div>
                <button 
                  onClick={nextStep}
                  className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl"
                >
                  NEXT: SKETCH POSE <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {state.step === Step.PoseAdjustment && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <HandDrawnPose 
              pose={state.pose} 
              onChange={(pose) => setState(prev => ({ ...prev, pose }))} 
            />
            <div className="p-8 bg-zinc-950 border-t border-white/5 flex gap-4 shrink-0">
              <button 
                onClick={prevStep}
                className="w-20 h-20 bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-white/5"
              >
                <ArrowLeft size={24} />
              </button>
              <button 
                onClick={nextStep}
                disabled={!state.pose.drawingImage}
                className={`flex-1 h-20 font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all ${state.pose.drawingImage ? 'bg-cyan-600 text-white active:scale-95' : 'bg-zinc-800 text-zinc-600'}`}
              >
                CONFIRM ACTION <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {state.step === Step.SceneCapture && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {!state.sceneImage ? (
                <CameraView 
                  title="World Atmosphere" 
                  placeholderText="Capture your environment"
                  onCapture={(img) => setState(prev => ({ ...prev, sceneImage: img }))}
                />
              ) : renderCaptureSummary(state.sceneImage, () => setState(prev => ({ ...prev, sceneImage: null })))}
            </div>
            
            {state.sceneImage && (
              <div className="p-8 bg-zinc-950 border-t border-white/5 flex flex-col gap-6 animate-in slide-in-from-bottom-8 shrink-0">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Atmosphere Keywords</label>
                  <textarea 
                    value={state.atmosphere}
                    onChange={(e) => setState(prev => ({ ...prev, atmosphere: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none h-20 resize-none transition-all font-medium"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={prevStep}
                    className="w-20 h-20 bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-white/5"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="flex-1 h-20 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
                  >
                    <Sparkles size={20} /> SYNTHESIZE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {state.step === Step.Generating && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12 bg-black">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-[120px] opacity-30 animate-pulse"></div>
              <div className="w-48 h-48 border-[12px] border-zinc-900 border-t-cyan-500 rounded-full animate-spin flex items-center justify-center shadow-2xl">
                <Wand2 className="text-cyan-400" size={56} />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black italic tracking-tighter">SYNTHESIZING</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Merging Sketched Pose & Reality</p>
            </div>
          </div>
        )}

        {state.step === Step.Result && (
          <div className="flex-1 flex flex-col p-6 space-y-8 overflow-y-auto">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-zinc-950 shadow-2xl border border-white/5 relative shrink-0">
              {state.resultImage ? (
                <img src={state.resultImage} alt="Result" className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800">Render Failed</div>
              )}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full h-20 bg-white text-black font-black rounded-3xl flex items-center justify-center gap-3 text-lg"
            >
              NEW MASTERPIECE
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
