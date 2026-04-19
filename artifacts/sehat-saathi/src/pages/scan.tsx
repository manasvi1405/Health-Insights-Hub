import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Camera, FileText, Activity, X, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateScan } from "@workspace/api-client-react";

export default function Scan() {
  const [scanType, setScanType] = useState<"medicine" | "prescription" | "report" | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createScanMutation = useCreateScan();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCapturing(true);
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Could not access the camera. Please check permissions.",
        variant: "destructive"
      });
      setScanType(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const handleScanSelect = (type: "medicine" | "prescription" | "report") => {
    setScanType(type);
    startCamera();
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !scanType) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);
    setImage(base64Image);
    stopCamera();
    
    try {
      const response = await createScanMutation.mutateAsync({
        data: {
          type: scanType,
          imageBase64: base64Image
        }
      });
      setResult(response);
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image",
        variant: "destructive"
      });
      setImage(null);
      setScanType(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (result) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Analysis Result</h2>
          <Button variant="ghost" size="icon" onClick={() => { setResult(null); setImage(null); setScanType(null); }}>
            <X className="w-8 h-8" />
          </Button>
        </div>
        
        {image && (
          <div className="rounded-xl overflow-hidden border-4 border-primary/20 shadow-md">
            <img src={image} alt="Scanned" className="w-full h-auto" />
          </div>
        )}
        
        <Card className="border-2 border-primary shadow-md bg-blue-50/50">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-primary border-b border-primary/20 pb-2">
              {result.summary || "AI Insight"}
            </h3>
            <div className="text-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
              {result.aiInsight}
            </div>
          </CardContent>
        </Card>
        
        {(scanType === "medicine" || scanType === "prescription") && (
          <Button 
            className="w-full h-16 text-xl rounded-xl shadow-lg mt-8"
            onClick={() => {
              // Extract a likely medicine name from summary or just set a default
              const medName = result.summary ? encodeURIComponent(result.summary.split(' ')[0]) : "";
              setLocation(`/reminders?add=${medName}`);
            }}
          >
            Add Auto Reminder <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        )}
      </div>
    );
  }

  if (isCapturing) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center max-w-[390px] mx-auto">
        <div className="w-full p-4 flex justify-between items-center text-white absolute top-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
          <span className="text-xl font-bold capitalize">Scan {scanType}</span>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => { stopCamera(); setScanType(null); }}>
            <X className="w-8 h-8" />
          </Button>
        </div>
        
        <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute min-w-full min-h-full object-cover"
          />
          <div className="absolute inset-0 border-[3px] border-white/40 m-8 rounded-2xl"></div>
        </div>
        
        <div className="w-full p-8 pb-12 flex justify-center bg-black">
          <Button 
            onClick={takePhoto}
            className="w-20 h-20 rounded-full bg-white text-primary hover:bg-slate-200 border-4 border-slate-300"
          >
            <Camera className="w-10 h-10" />
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (createScanMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <Loader2 className="w-20 h-20 text-primary animate-spin" />
        <h2 className="text-2xl font-bold text-slate-800 text-center">AI is analyzing...<br/>Please wait</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">AI Scanner</h1>
        <p className="text-lg text-slate-500 mt-2">What would you like to scan today?</p>
      </header>

      <div className="space-y-5">
        <Card 
          className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors shadow-sm"
          onClick={() => handleScanSelect("medicine")}
        >
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-inner">
              <Camera className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Scan Medicine</h2>
              <p className="text-slate-600 text-lg mt-1">Know what this pill is for</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors shadow-sm"
          onClick={() => handleScanSelect("prescription")}
        >
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-green-500 text-white rounded-2xl shadow-inner">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Scan Prescription</h2>
              <p className="text-slate-600 text-lg mt-1">Read doctor's handwriting</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors shadow-sm"
          onClick={() => handleScanSelect("report")}
        >
          <CardContent className="p-6 flex items-center gap-6">
            <div className="p-4 bg-purple-500 text-white rounded-2xl shadow-inner">
              <Activity className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Scan Report</h2>
              <p className="text-slate-600 text-lg mt-1">Understand lab results easily</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
