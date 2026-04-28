import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Camera, FileText, Activity, X, ArrowRight, Loader2, Upload, Image as ImageIcon, CheckCircle, Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateScan } from "@workspace/api-client-react";
import { useT } from "@/hooks/use-t";
import { speak, stopSpeaking } from "@/lib/speak";

type ScanType = "medicine" | "prescription" | "report";

export default function Scan() {
  const { t } = useT();
  const [scanType, setScanType] = useState<ScanType | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingScanType = useRef<ScanType | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createScanMutation = useCreateScan();

  const SCAN_OPTIONS = [
    { type: "medicine" as ScanType, label: t("scan.medicine"), desc: t("scan.medicineDesc"), icon: Camera, bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-500" },
    { type: "prescription" as ScanType, label: t("scan.prescription"), desc: t("scan.prescriptionDesc"), icon: FileText, bg: "bg-green-50", border: "border-green-200", iconBg: "bg-green-500" },
    { type: "report" as ScanType, label: t("scan.report"), desc: t("scan.reportDesc"), icon: Activity, bg: "bg-purple-50", border: "border-purple-200", iconBg: "bg-purple-500" },
  ];

  const startCamera = async (type: ScanType) => {
    setScanType(type);
    setPickerOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setIsCapturing(true);
      setTimeout(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
      }, 50);
    } catch {
      toast({ title: "Camera not available", description: "Please use Upload Image instead.", variant: "destructive" });
      setScanType(null);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCapturing(false);
  };

  useEffect(() => () => { stopCamera(); stopSpeaking(); }, []);

  const triggerUpload = (type: ScanType) => {
    pendingScanType.current = type;
    setPickerOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-picked
    const type = pendingScanType.current;
    if (!file || !type) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image smaller than 10MB.", variant: "destructive" });
      return;
    }

    setScanType(type);

    if (file.type === "application/pdf") {
      toast({ title: "Note", description: "For PDF files, please take a photo of the page for best results." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Unsupported file", description: "Please upload a JPG or PNG image.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      // Compress large images via canvas before sending
      const compressed = await compressImage(base64);
      setImage(compressed);
      await submitScan(compressed, type);
    };
    reader.onerror = () => {
      toast({ title: "Error", description: "Could not read file", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = (h / w) * maxDim; w = maxDim; }
          else { w = (w / h) * maxDim; h = maxDim; }
        }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(base64);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !scanType) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    setImage(base64);
    stopCamera();
    await submitScan(base64, scanType);
  };

  const submitScan = async (base64: string, type: ScanType) => {
    try {
      const response = await createScanMutation.mutateAsync({ data: { type, imageBase64: base64 } });
      setResult(response);
    } catch (error: any) {
      console.error("Scan error:", error);
      toast({
        title: "Analysis Failed",
        description: error?.response?.data?.error || error?.message || "Could not analyze image. Please try again.",
        variant: "destructive"
      });
      setImage(null);
      setScanType(null);
    }
  };

  const handleListen = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speak(result.aiInsight, () => setIsSpeaking(false));
    }
  };

  // RESULT SCREEN
  if (result) {
    return (
      <div className="space-y-5 animate-in fade-in duration-500 pt-2 pb-24">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">{t("scan.aiResult")}</h2>
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100" onClick={() => { stopSpeaking(); setIsSpeaking(false); setResult(null); setImage(null); setScanType(null); }}>
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-primary">{t("scan.whatAiFound")}</h3>
              <Button
                size="sm"
                variant={isSpeaking ? "destructive" : "default"}
                className="gap-1.5 rounded-full"
                onClick={handleListen}
              >
                {isSpeaking ? <><Square className="w-4 h-4" /> {t("scan.stop")}</> : <><Volume2 className="w-4 h-4" /> {t("scan.listen")}</>}
              </Button>
            </div>
            <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-base">
              {result.aiInsight}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-14 text-base rounded-xl" onClick={() => { stopSpeaking(); setIsSpeaking(false); setResult(null); setImage(null); setScanType(null); }}>
            {t("scan.scanAgain")}
          </Button>
          {(result.type === "medicine" || result.type === "prescription") && (
            <Button className="flex-1 h-14 text-base rounded-xl gap-2 shadow-sm" onClick={() => {
              const med = result.summary?.replace(/^(Medicine|दवा|औषध):\s*/i, "").split(/[\s.,]/)[0] || "";
              setLocation(`/reminders?add=${encodeURIComponent(med)}`);
            }}>
              {t("scan.addReminder")} <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // CAMERA VIEW
  if (isCapturing) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col max-w-[390px] mx-auto">
        <div className="w-full p-4 flex justify-between items-center text-white absolute top-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-xl font-bold capitalize">Scan {scanType}</span>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => { stopCamera(); setScanType(null); }}>
            <X className="w-8 h-8" />
          </Button>
        </div>
        <div className="flex-1 w-full relative overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/70 rounded-2xl w-4/5 h-3/5" />
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm px-4">{t("scan.centerDoc")}</p>
        </div>
        <div className="p-8 pb-12 flex justify-center bg-black">
          <Button onClick={takePhoto} className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 hover:bg-slate-100">
            <Camera className="w-9 h-9 text-primary" />
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // LOADING
  if (createScanMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="text-center px-6">
          <h2 className="text-2xl font-bold text-slate-800">{t("scan.analyzing")}</h2>
          <p className="text-slate-500 mt-2 text-lg">{t("scan.wait")}</p>
        </div>
      </div>
    );
  }

  // PICKER (camera vs upload)
  if (pickerOpen && scanType) {
    return (
      <>
        <div className="space-y-5 pt-2 pb-24 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 capitalize">Scan {scanType}</h2>
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-100" onClick={() => { setPickerOpen(false); setScanType(null); }}>
              <X className="w-6 h-6" />
            </Button>
          </div>
          <p className="text-slate-500 text-base">{t("scan.howToAdd")}</p>

          <div className="space-y-4 mt-4">
            <button
              onClick={() => startCamera(scanType)}
              className="w-full p-6 bg-primary/5 border-2 border-primary/20 rounded-2xl flex items-center gap-5 hover:bg-primary/10 transition-colors text-left"
            >
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{t("scan.useCamera")}</p>
                <p className="text-slate-500 text-base">{t("scan.takePhoto")}</p>
              </div>
            </button>

            <button
              onClick={() => triggerUpload(scanType)}
              className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center gap-5 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{t("scan.uploadImage")}</p>
                <p className="text-slate-500 text-base">{t("scan.fromGallery")}</p>
              </div>
            </button>
          </div>
        </div>
        {/* file input always rendered globally below */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </>
    );
  }

  // MAIN: scan type selection
  return (
    <div className="space-y-5 pt-2 pb-24 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("scan.title")}</h1>
        <p className="text-slate-500 text-base mt-1">{t("scan.what")}</p>
      </div>

      <div className="space-y-4">
        {SCAN_OPTIONS.map(opt => (
          <button
            key={opt.type}
            className={`w-full ${opt.bg} ${opt.border} border-2 hover:brightness-95 rounded-2xl p-5 flex items-center gap-5 transition-all active:scale-[0.98] shadow-sm text-left`}
            onClick={() => { setScanType(opt.type); setPickerOpen(true); }}
          >
            <div className={`${opt.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner`}>
              <opt.icon className="w-9 h-9 text-white" />
            </div>
            <div className="flex-1">
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
            AI will explain results in your selected language with simple words. Tap Listen on results to hear it.
          </p>
        </CardContent>
      </Card>

      {/* Globally-mounted hidden file input so click() always works */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
