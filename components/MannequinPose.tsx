
import React, { useRef, useState, useEffect } from 'react';
import { Trash2, RotateCcw, PenTool, Check, Eraser } from 'lucide-react';
import { PoseData } from '../types.ts';

interface HandDrawnPoseProps {
  pose: PoseData;
  onChange: (pose: PoseData) => void;
}

const HandDrawnPose: React.FC<HandDrawnPoseProps> = ({ pose, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 設定畫布大小為容器大小
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // 背景填黑
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#00f2ff'; // 螢光藍筆觸
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00f2ff';
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPointerPos = (e: React.PointerEvent | PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 儲存歷史記錄以便撤銷
    setHistory(prev => [...prev, canvas.toDataURL()]);

    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPointerPos(e);
    ctx.lineWidth = pose.brushSize;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToState();
  };

  const saveToState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onChange({ ...pose, drawingImage: canvas.toDataURL('image/png') });
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveToState();
      setHistory([]);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastState = history[history.length - 1];
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(prev => prev.slice(0, -1));
      saveToState();
    };
    img.src = lastState;
  };

  return (
    <div className="relative flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      <div className="absolute top-6 left-6 z-10 space-y-2">
        <h3 className="text-white font-black text-lg italic tracking-tighter">DRAW POSE</h3>
        <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Sketch the skeleton for AI</p>
      </div>

      <div className="flex-1 relative touch-none cursor-crosshair">
        {/* 參考引導線 */}
        {!pose.drawingImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="w-20 h-20 border-2 border-white rounded-full mb-40" />
            <div className="absolute text-[10px] text-white font-black uppercase mt-4">Head Position Guide</div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full h-full"
        />
      </div>

      <div className="p-8 bg-zinc-900 border-t border-white/5 flex items-center justify-between shrink-0">
        <div className="flex gap-4">
          <button 
            onClick={undo}
            className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 active:text-white border border-white/5"
          >
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={clear}
            className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 active:text-red-400 border border-white/5"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex-1 mx-8">
           <div className="flex justify-between mb-2">
             <span className="text-[8px] font-black text-zinc-500 uppercase">Stroke Weight</span>
             <span className="text-[8px] font-mono text-cyan-500">{pose.brushSize}px</span>
           </div>
           <input 
             type="range" min="2" max="20" 
             value={pose.brushSize} 
             onChange={(e) => onChange({...pose, brushSize: parseInt(e.target.value)})}
             className="w-full accent-cyan-500 bg-zinc-800 h-1 rounded-full appearance-none"
           />
        </div>

        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
          <PenTool size={18} />
        </div>
      </div>
    </div>
  );
};

export default HandDrawnPose;
