
import React, { useState } from 'react';
import { Camera, Layers, Image as ImageIcon, Sparkles, ArrowRight, ArrowLeft, Loader2, Wand2, CheckCircle, RefreshCw } from 'lucide-react';
import { Step, AppState, PoseData } from './types';
import CameraView from './components/CameraView';
import MannequinPose from './components/MannequinPose';
import { generateAIPoseImage } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: Step.SubjectCapture,
    subjectImage: null,
    subjectStyle: 'A futuristic fashion icon, cyberpunk aesthetic, high-detail materials',
    pose: {
      rotation: { x: 0, y: 0, z: 0 },
      perspective: 50,
      bones: {}
    },
    sceneImage: null,
    atmosphere: 'Modern minimalist studio, harsh cinematic lighting, teal and orange highlights',
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
      { id: 2, label: 'Pose', icon: Layers },
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
          <p className="text-[8px] text-cyan-500 uppercase font-black tracking-[0.3em] mt-1.5">v3.0 PRO</p>
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
                  title="Capture Protagonist" 
                  placeholderText="The person you want to re-pose"
                  onCapture={(img) => setState(prev => ({ ...prev, subjectImage: img }))}
                />
              ) : renderCaptureSummary(state.subjectImage, () => setState(prev => ({ ...prev, subjectImage: null })))}
            </div>
            
            {state.subjectImage && (
              <div className="p-8 bg-zinc-950 border-t border-white/5 flex flex-col gap-6 animate-in slide-in-from-bottom-8 shrink-0">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Modified Style (Optional)</label>
                  <textarea 
                    value={state.subjectStyle}
                    onChange={(e) => setState(prev => ({ ...prev, subjectStyle: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none h-20 resize-none transition-all font-medium"
                    placeholder="E.g. Wearing a space suit..."
                  />
                </div>
                <button 
                  onClick={nextStep}
                  className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl"
                >
                  NEXT: ADAPT POSE <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {state.step === Step.PoseAdjustment && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <MannequinPose 
              pose={state.pose} 
              onChange={(pose) => setState(prev => ({ ...prev, pose }))} 
            />
            <div className="p-8 bg-zinc-950 border-t border-white/5 flex gap-4 shrink-0">
              <button 
                onClick={prevStep}
                className="w-20 h-20 bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-white/5 active:bg-zinc-800 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <button 
                onClick={nextStep}
                className="flex-1 h-20 bg-cyan-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                SET ENVIRONMENT <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {state.step === Step.SceneCapture && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {!state.sceneImage ? (
                <CameraView 
                  title="World Context" 
                  placeholderText="Capture an environment or background"
                  onCapture={(img) => setState(prev => ({ ...prev, sceneImage: img }))}
                />
              ) : renderCaptureSummary(state.sceneImage, () => setState(prev => ({ ...prev, sceneImage: null })))}
            </div>
            
            {state.sceneImage && (
              <div className="p-8 bg-zinc-950 border-t border-white/5 flex flex-col gap-6 animate-in slide-in-from-bottom-8 shrink-0">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scene Atmosphere</label>
                  <textarea 
                    value={state.atmosphere}
                    onChange={(e) => setState(prev => ({ ...prev, atmosphere: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none h-20 resize-none transition-all font-medium"
                    placeholder="E.g. Rainy neon street..."
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
                    <Sparkles size={20} /> GENERATE ART
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {state.step === Step.Generating && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-[120px] opacity-20 animate-pulse"></div>
              <div className="w-48 h-48 border-[12px] border-zinc-900 border-t-cyan-500 rounded-full animate-spin flex items-center justify-center shadow-2xl">
                <Wand2 className="text-cyan-400" size={56} />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black italic tracking-tighter">SYNTHESIZING</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Processing 3D Geometry & Light</p>
            </div>
            <div className="w-full max-w-xs bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 animate-[loading_2s_infinite_ease-in-out]" style={{ width: '40%' }}></div>
            </div>
          </div>
        )}

        {state.step === Step.Result && (
          <div className="flex-1 flex flex-col p-6 space-y-8 overflow-y-auto">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-zinc-950 shadow-2xl border border-white/5 relative shrink-0">
              {state.resultImage ? (
                <img src={state.resultImage} alt="Generated Art" className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center">
                  <Loader2 className="animate-spin text-zinc-800 mb-6" size={56} />
                  <p className="text-zinc-600 font-black uppercase tracking-[0.2em] text-[10px]">Render Pipeline Failed</p>
                </div>
              )}
            </div>
            
            <div className="space-y-6 shrink-0 pb-10">
              <div className="p-8 bg-cyan-950/20 border border-cyan-500/20 rounded-[2.5rem] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Sparkles size={60} />
                 </div>
                 <div className="flex items-center gap-3 text-cyan-400 mb-3">
                   <CheckCircle size={16} />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Masterpiece Ready</span>
                 </div>
                 <p className="text-xs text-zinc-400 leading-relaxed font-medium">Identity preserved. Pose geometry locked. Scene atmosphere merged. Your AI creation is ready for display.</p>
              </div>

              <button 
                onClick={() => setState({
                  step: Step.SubjectCapture,
                  subjectImage: null,
                  subjectStyle: 'A futuristic fashion icon, cyberpunk aesthetic',
                  pose: { rotation: { x: 0, y: 0, z: 0 }, perspective: 50, bones: {} },
                  sceneImage: null,
                  atmosphere: 'Modern minimalist studio, harsh cinematic lighting',
                  resultImage: null
                })}
                className="w-full h-20 bg-white text-black font-black rounded-3xl flex items-center justify-center gap-3 text-lg hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
              >
                START NEW SESSION
              </button>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(300%); width: 30%; }
        }
      `}} />
    </div>
  );
};

export default App;
