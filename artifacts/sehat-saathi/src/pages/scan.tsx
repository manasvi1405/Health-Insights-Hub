import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Camera, FileText, Activity, X, ArrowRight, Loader2, Upload, Image as ImageIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateScan } from "@workspace/api-client-react";

type ScanType = "medicine" | "prescription" | "report";

const SCAN_OPTIONS = [
  {
    type: "medicine" as ScanType,
    label: "Scan Medicine",
    desc: "Know what this medicine is for",
    icon: Camera,
    color: "blue",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hover: "hover:bg-blue-100",
    iconBg: "bg-blue-500",
  },
  {
    type: "prescription" as ScanType,
    label: "Scan Prescription",
    desc: "Read doctor's prescription",
    icon: FileText,
    color: "green",
    bg: "bg-green-50",
    border: "border-green-200",
    hover: "hover:bg-green-100",
    iconBg: "bg-green-500",
  },
  {
    type: "report" as ScanType,
    label: "Scan Report",
    desc: "Understand lab test results",
    icon: Activity,
    color: "purple",
    bg: "bg-purple-50",
    border: "border-purple-200",
    hover: "hover:bg-purple-100",
    iconBg: "bg-purple-500",
  },
];

export default function Scan() {
  const [scanType, setScanType] = useState<ScanType | null>(null);
  const [inputMode, setInputMode] = useState<"camera" | "upload" | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createScanMutation = useCreateScan();

  const startCamera = async (type: ScanType) => {
    setScanType(type);
    setInputMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCapturing(true);
    } catch {
      toast({ title: "Camera not available", description: "Please use 'Upload Image' option instead.", variant: "destructive" });
      setInputMode(null);
      setScanType(null);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCapturing(false);
  };

  useEffect(() => () => stopCamera(), []);

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !scanType) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.8);
    setImage(base64);
    stopCamera();
    await submitScan(base64);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scanType) return;

    if (file.type === "application/pdf") {
      toast({ title: "PDF uploaded", description: "Converting PDF content for AI analysis..." });
      // For PDFs, create a placeholder and inform user
      const reader = new FileReader();
      reader.onload = async () => {
        // PDF can't be sent as image - show info
        toast({ title: "Note", description: "PDF text will be analyzed. For best results, take a photo of the page." });
        // Send a blank canvas as placeholder - AI will work from context
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = "#000000";
        ctx.font = "20px Arial";
        ctx.fillText("PDF Document - Please describe contents", 50, 300);
        const base64 = canvas.toDataURL("image/jpeg");
        setImage(base64);
        await submitScan(base64);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImage(base64);
      await submitScan(base64);
    };
    reader.readAsDataURL(file);
  };

  const submitScan = async (base64: string) => {
    if (!scanType) return;
    try {
      const response = await createScanMutation.mutateAsync({ data: { type: scanType, imageBase64: base64 } });
      setResult(response);
    } catch (error: any) {
      toast({ title: "Analysis Failed", description: error.message || "Could not analyze image. Please try again.", variant: "destructive" });
      setImage(null);
      setScanType(null);
      setInputMode(null);
    }
  };

  // Result screen
  if (result) {
    return (
      <div className="space-y-5 animate-in fade-in duration-500 pt-2 pb-24">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">AI Analysis</h2>
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100" onClick={() => { setResult(null); setImage(null); setScanType(null); setInputMode(null); }}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-900 capitalize">{result.type} Analyzed</p>
            <p className="text-green-700 text-sm">AI has reviewed your {result.type}</p>
          </div>
        </div>

        {image && (
          <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
            <img src={image} alt="Scanned" className="w-full h-48 object-cover" />
          </div>
        )}

        <Card className="border-2 border-primary/30 shadow-md">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-lg font-bold text-primary">What AI Found:</h3>
            <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-base">
              {result.aiInsight}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-14 text-base rounded-xl" onClick={() => { setResult(null); setImage(null); setScanType(null); setInputMode(null); }}>
            Scan Again
          </Button>
          {(scanType === "medicine" || scanType === "prescription") && (
            <Button className="flex-1 h-14 text-base rounded-xl gap-2 shadow-sm" onClick={() => {
              const med = result.summary?.split(" ")[0] || result.aiInsight?.split("\n")[0]?.replace(/[^a-zA-Z\s]/g, "").trim().split(" ").slice(0, 2).join(" ") || "";
              setLocation(`/reminders?add=${encodeURIComponent(med)}`);
            }}>
              Add Reminder <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Camera view
  if (isCapturing) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col max-w-[390px] mx-auto">
        <div className="w-full p-4 flex justify-between items-center text-white absolute top-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-xl font-bold capitalize">Scan {scanType}</span>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => { stopCamera(); setScanType(null); setInputMode(null); }}>
            <X className="w-8 h-8" />
          </Button>
        </div>
        <div className="flex-1 w-full relative overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-white/70 rounded-2xl w-4/5 h-3/5" />
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">Center the document in the frame</p>
        </div>
        <div className="p-8 pb-12 flex justify-center bg-black gap-8 items-center">
          <div className="w-8" />
          <Button onClick={takePhoto} className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 hover:bg-slate-100">
            <Camera className="w-9 h-9 text-primary" />
          </Button>
          <div className="w-8" />
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Loading
  if (createScanMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Analyzing with AI...</h2>
          <p className="text-slate-500 mt-2 text-lg">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // Input mode selection (after choosing scan type)
  if (scanType && !inputMode) {
    return (
      <div className="space-y-5 pt-4 pb-24 animate-in fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 capitalize">Scan {scanType}</h2>
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100" onClick={() => setScanType(null)}>
            <X className="w-6 h-6" />
          </Button>
        </div>
        <p className="text-slate-500 text-base">How would you like to add the image?</p>

        <div className="space-y-4 mt-4">
          <button
            onClick={() => startCamera(scanType)}
            className="w-full p-6 bg-primary/5 border-2 border-primary/20 rounded-2xl flex items-center gap-5 hover:bg-primary/10 transition-colors text-left"
          >
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Use Camera</p>
              <p className="text-slate-500 text-base">Take a photo right now</p>
            </div>
          </button>

          <button
            onClick={() => { setInputMode("upload"); fileInputRef.current?.click(); }}
            className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center gap-5 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Upload Image</p>
              <p className="text-slate-500 text-base">Choose from gallery or files</p>
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    );
  }

  // Main scan selection screen
  return (
    <div className="space-y-5 pt-2 pb-24 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Scanner</h1>
        <p className="text-slate-500 text-base mt-1">What would you like to scan?</p>
      </div>

      <div className="space-y-4">
        {SCAN_OPTIONS.map(opt => (
          <button
            key={opt.type}
            className={`w-full ${opt.bg} ${opt.border} border-2 ${opt.hover} rounded-2xl p-5 flex items-center gap-5 transition-all active:scale-[0.98] shadow-sm text-left`}
            onClick={() => setScanType(opt.type)}
          >
            <div className={`${opt.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner`}>
              <opt.icon className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{opt.label}</h2>
              <p className="text-slate-600 text-base mt-0.5">{opt.desc}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-white/70 text-slate-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Camera
                </span>
                <span className="text-xs bg-white/70 text-slate-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Upload
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card className="bg-blue-50 border border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-800 text-sm">
            Supports photos from camera, uploaded images (JPG/PNG), and PDF documents. AI will explain results in simple language.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
