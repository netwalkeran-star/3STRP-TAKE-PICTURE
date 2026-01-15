
import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

interface CameraViewProps {
  onCapture: (image: string) => void;
  title: string;
  placeholderText: string;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, title, placeholderText }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async (retryWithGeneric = false) => {
    setError(null);
    try {
      // 第一次嘗試使用環境（後置）鏡頭，失敗則嘗試通用鏡頭
      const constraints: MediaStreamConstraints = retryWithGeneric 
        ? { video: true, audio: false }
        : { video: { facingMode: 'environment' }, audio: false };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      if (!retryWithGeneric) {
        // 如果後置鏡頭失敗，嘗試請求任何可用的鏡頭
        startCamera(true);
      } else {
        setError("Unable to access camera. Please check permissions or use image upload.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        stopCamera();
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
      <div className="p-4 text-center shrink-0">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{placeholderText}</p>
      </div>

      {!capturedImage ? (
        <div className="flex-1 relative overflow-hidden rounded-[2.5rem] mx-4 bg-zinc-900 border border-white/5 shadow-2xl">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <AlertCircle size={40} className="text-red-500 opacity-50" />
              <p className="text-sm text-zinc-400 font-medium">{error}</p>
              <button onClick={() => startCamera()} className="px-6 py-2 bg-zinc-800 rounded-xl text-xs font-bold uppercase">Try Again</button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          
          <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
          
          <div className="absolute bottom-10 left-0 right-0 flex items-center justify-around px-10">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
            >
              <ImageIcon size={24} className="text-white" />
            </button>

            <button
              onClick={capture}
              className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm active:scale-90 transition-all"
            >
              <div className="w-18 h-18 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]"></div>
            </button>

            <button
              onClick={() => startCamera(true)}
              className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 active:rotate-180 transition-all"
            >
              <RefreshCw size={24} className="text-white" />
            </button>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col mx-4 overflow-hidden">
          <div className="flex-1 relative rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 animate-in fade-in zoom-in-95 duration-500">
            <img src={capturedImage} className="w-full h-full object-contain bg-black" alt="Preview" />
          </div>
          
          <div className="py-8 flex gap-4 shrink-0">
            <button
              onClick={reset}
              className="flex-1 py-5 bg-zinc-900 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest border border-white/5"
            >
              <X size={18} /> Retake
            </button>
            <button
              onClick={() => onCapture(capturedImage)}
              className="flex-1 py-5 bg-white text-black rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              <CheckCircle size={18} /> Confirm Hero
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <div className="h-6 shrink-0"></div>
    </div>
  );
};

export default CameraView;
