import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, MapPin, Phone, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTriggerSos, useListContacts } from "@workspace/api-client-react";

export default function Sos() {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [locationStr, setLocationStr] = useState("Fetching location...");
  const [sosResult, setSosResult] = useState<any>(null);

  const { toast } = useToast();
  const triggerSosMutation = useTriggerSos();
  const { data: contacts } = useListContacts();

  useEffect(() => {
    // Attempt to get location early for display
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocationStr(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setLocationStr("Location unavailable")
      );
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !isSent && !triggerSosMutation.isPending) {
      executeSos();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const initiateSos = () => {
    setCountdown(5);
  };

  const cancelSos = () => {
    setCountdown(null);
  };

  const executeSos = async () => {
    setCountdown(null);
    try {
      let lat = 0;
      let lng = 0;
      
      // Get fresh coordinates
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      }).catch(() => null);

      if (pos) {
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        toast({ title: "Warning", description: "Sending SOS without precise location", variant: "destructive" });
      }

      const res = await triggerSosMutation.mutateAsync({
        data: { latitude: lat, longitude: lng }
      });
      
      setSosResult(res);
      setIsSent(true);
    } catch (error: any) {
      toast({ title: "SOS Failed", description: error.message || "Could not send emergency alert", variant: "destructive" });
    }
  };

  if (isSent) {
    return (
      <div className="min-h-[100dvh] bg-red-50 p-6 flex flex-col pt-12 animate-in fade-in duration-500">
        <div className="text-center space-y-6 flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-red-900">SOS Sent!</h1>
          <p className="text-xl text-red-700">
            Alert sent to {sosResult?.contactsNotified || 0} emergency contacts with your location.
          </p>
          
          <Card className="w-full mt-8 border-red-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 text-left">Quick Call Numbers:</h3>
              <div className="space-y-3">
                <a href="tel:102" className="flex items-center justify-between p-4 bg-slate-100 rounded-xl active:bg-slate-200">
                  <div className="flex items-center"><Phone className="w-6 h-6 mr-3 text-slate-600" /> <span className="text-xl font-bold">Ambulance</span></div>
                  <span className="text-xl font-black text-primary">102</span>
                </a>
                <a href="tel:108" className="flex items-center justify-between p-4 bg-slate-100 rounded-xl active:bg-slate-200">
                  <div className="flex items-center"><Phone className="w-6 h-6 mr-3 text-slate-600" /> <span className="text-xl font-bold">Emergency</span></div>
                  <span className="text-xl font-black text-primary">108</span>
                </a>
                {contacts?.slice(0,2).map(c => (
                  <a key={c._id} href={`tel:${c.phone}`} className="flex items-center justify-between p-4 bg-slate-100 rounded-xl active:bg-slate-200">
                    <div className="flex items-center"><Phone className="w-6 h-6 mr-3 text-slate-600" /> <span className="text-xl font-bold">{c.name}</span></div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Link href="/home">
          <Button variant="outline" className="w-full h-16 text-xl border-red-200 text-red-700 bg-white">
            <ArrowLeft className="w-6 h-6 mr-2" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-white p-6 flex flex-col pt-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <Link href="/home" className="text-slate-400 hover:text-white p-2 -ml-2 rounded-full active:bg-white/10">
          <ArrowLeft className="w-8 h-8" />
        </Link>
        <div className="flex items-center text-slate-300 bg-slate-800 px-4 py-2 rounded-full text-sm font-medium">
          <MapPin className="w-4 h-4 mr-2" /> {locationStr}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12 pb-20">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black text-white tracking-wider">EMERGENCY</h1>
          <p className="text-xl text-slate-400">Tap the button to call for help</p>
        </div>

        <div className="relative">
          {/* Ripple rings */}
          {countdown === null && (
            <>
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute -inset-4 bg-red-500/10 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
            </>
          )}

          <button
            onClick={countdown === null ? initiateSos : cancelSos}
            disabled={triggerSosMutation.isPending}
            className={`relative z-10 w-64 h-64 rounded-full flex flex-col items-center justify-center border-8 shadow-[0_0_50px_rgba(220,38,38,0.5)] transition-all duration-300 active:scale-95 ${
              countdown !== null 
                ? 'bg-slate-800 border-slate-600 text-white' 
                : 'bg-red-600 border-red-500 text-white hover:bg-red-500'
            }`}
          >
            {triggerSosMutation.isPending ? (
              <Loader2 className="w-20 h-20 animate-spin text-white" />
            ) : countdown !== null ? (
              <>
                <span className="text-7xl font-black">{countdown}</span>
                <span className="text-lg font-bold mt-2 uppercase tracking-widest">Tap to Cancel</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-20 h-20 mb-2" />
                <span className="text-3xl font-black uppercase tracking-widest">SOS</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-slate-400 max-w-[280px]">
          Sending SOS will immediately alert your family members and share your live location.
        </div>
      </div>
    </div>
  );
}
