import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Clock, Plus, CheckCircle, AlertTriangle, X, Loader2, Pill, Bell, BellOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListReminders, useCreateReminder, useMarkReminderTaken, useDeleteReminder, getListRemindersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useT } from "@/hooks/use-t";

export default function Reminders() {
  const { t } = useT();
  const [showAddForm, setShowAddForm] = useState(false);
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reminders, isLoading } = useListReminders();
  const markTakenMutation = useMarkReminderTaken();
  const deleteMutation = useDeleteReminder();
  const createReminderMutation = useCreateReminder();

  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<"once" | "twice" | "thrice">("once");
  const [times, setTimes] = useState<string[]>(["09:00"]);
  const [stockCount, setStockCount] = useState("30");
  const [autoReminder, setAutoReminder] = useState(true);

  // Alarm checker
  useEffect(() => {
    const checkAlarms = setInterval(() => {
      if (!reminders) return;
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (now.getSeconds() > 5) return; // Only trigger in first 5 seconds of each minute

      reminders.forEach(reminder => {
        if (!reminder.autoReminder) return;
        if (reminder.times.includes(currentTime)) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.type = "sine";
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1.5);
          } catch (e) {}

          if ("speechSynthesis" in window) {
            const lang = localStorage.getItem("sehat_lang") || "English";
            let msg = `Time to take your medicine, ${reminder.medName}`;
            if (lang === "Hindi") msg = `${reminder.medName} लेने का समय हो गया है`;
            else if (lang === "Marathi") msg = `${reminder.medName} घेण्याची वेळ झाली`;
            const utt = new SpeechSynthesisUtterance(msg);
            window.speechSynthesis.speak(utt);
          }

          toast({
            title: "Medicine Time!",
            description: `Take ${reminder.medName} — ${reminder.dosage}`,
          });
        }
      });
    }, 1000);
    return () => clearInterval(checkAlarms);
  }, [reminders, toast]);

  // Pre-fill from scan page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addMed = params.get("add");
    if (addMed) {
      setShowAddForm(true);
      setMedName(decodeURIComponent(addMed));
    }
  }, []);

  const handleFrequencyChange = (val: "once" | "twice" | "thrice") => {
    setFrequency(val);
    if (val === "once") setTimes(["09:00"]);
    if (val === "twice") setTimes(["09:00", "21:00"]);
    if (val === "thrice") setTimes(["08:00", "14:00", "20:00"]);
  };

  const handleAddSubmit = async () => {
    if (!medName.trim() || !dosage.trim()) {
      toast({ title: "Please fill all fields", description: "Medicine name and dosage are required", variant: "destructive" });
      return;
    }
    try {
      await createReminderMutation.mutateAsync({
        data: { medName, dosage, frequency, times, stockCount: parseInt(stockCount, 10) || 30, autoReminder }
      });
      toast({ title: "Reminder added!", description: `${medName} reminder is set` });
      queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      setShowAddForm(false);
      setMedName(""); setDosage(""); setStockCount("30"); setFrequency("once"); setTimes(["09:00"]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save reminder", variant: "destructive" });
    }
  };

  const handleTakeNow = async (id: string, name: string) => {
    try {
      const res = await markTakenMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      if (res.stockAlert === "OUT_OF_STOCK") {
        toast({ title: "Out of stock!", description: `${name} is finished. Please restock immediately.`, variant: "destructive" });
      } else if (res.stockAlert === "RUNNING_LOW") {
        toast({ title: "Running low!", description: `Only ${res.stockCount} pills of ${name} left. Buy more soon.`, variant: "destructive" });
      } else {
        toast({ title: "Taken!", description: `Good job taking ${name}. ${res.stockCount} pills left.` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      toast({ title: "Reminder deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  // Add form
  if (showAddForm) {
    return (
      <div className="space-y-5 pt-2 pb-24 animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Add Medicine</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="rounded-full bg-slate-100">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-bold">Medicine Name</Label>
              <Input className="h-14 text-lg" value={medName} onChange={e => setMedName(e.target.value)} placeholder="e.g. Metformin, Paracetamol" />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-bold">Dosage</Label>
              <Input className="h-14 text-lg" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg, 1 tablet" />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-bold">Frequency</Label>
              <Select value={frequency} onValueChange={(val: any) => handleFrequencyChange(val)}>
                <SelectTrigger className="h-14 text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once" className="text-base py-3">Once a day</SelectItem>
                  <SelectItem value="twice" className="text-base py-3">Twice a day</SelectItem>
                  <SelectItem value="thrice" className="text-base py-3">Three times a day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-base font-bold">Reminder Times</Label>
              {times.map((time, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm w-16 font-medium">
                    {idx === 0 ? "Morning" : idx === 1 ? "Afternoon" : "Evening"}
                  </span>
                  <Input type="time" className="h-14 text-lg flex-1" value={time} onChange={e => {
                    const t = [...times]; t[idx] = e.target.value; setTimes(t);
                  }} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-base font-bold">Current Stock (pills remaining)</Label>
              <Input type="number" className="h-14 text-lg" value={stockCount} onChange={e => setStockCount(e.target.value)} placeholder="e.g. 30" />
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <p className="font-bold text-slate-900 text-base">Auto Reminder</p>
                <p className="text-slate-500 text-sm">App will ring and speak when it's time</p>
              </div>
              <Switch checked={autoReminder} onCheckedChange={setAutoReminder} />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full h-16 text-xl rounded-xl shadow-md" onClick={handleAddSubmit} disabled={createReminderMutation.isPending}>
          {createReminderMutation.isPending ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
          Save Reminder
        </Button>
      </div>
    );
  }

  // Reminder list
  return (
    <div className="space-y-5 pt-2 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("rem.title")}</h1>
          <p className="text-slate-500 text-base mt-1">{reminders?.length || 0} {t("rem.tracked")}</p>
        </div>
      </div>

      <Button className="w-full h-16 text-xl rounded-xl gap-3 shadow-sm" onClick={() => setShowAddForm(true)}>
        <Plus className="w-6 h-6" /> {t("rem.addNew")}
      </Button>

      {reminders && reminders.length > 0 ? (
        <div className="space-y-4">
          {reminders.map(reminder => {
            const isLowStock = (reminder.stockCount ?? 30) <= 5;
            const isOutOfStock = (reminder.stockCount ?? 30) === 0;
            return (
              <Card key={reminder._id} className={`shadow-sm border-2 ${isOutOfStock ? "border-red-400 bg-red-50/30" : isLowStock ? "border-orange-300 bg-orange-50/30" : "border-slate-200 bg-white"}`}>
                <CardContent className="p-5">
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isOutOfStock ? "bg-red-100" : isLowStock ? "bg-orange-100" : "bg-blue-100"}`}>
                        <Pill className={`w-6 h-6 ${isOutOfStock ? "text-red-500" : isLowStock ? "text-orange-500" : "text-primary"}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{reminder.medName}</h3>
                        <p className="text-slate-600 text-base">{reminder.dosage}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(reminder._id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 -mr-1 -mt-1">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Time badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {reminder.times.map((t, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {t}
                      </span>
                    ))}
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium capitalize">
                      {reminder.frequency === "once" ? "1x daily" : reminder.frequency === "twice" ? "2x daily" : "3x daily"}
                    </span>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      {isOutOfStock ? (
                        <Badge variant="destructive" className="text-sm px-3 py-1 gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
                        </Badge>
                      ) : isLowStock ? (
                        <Badge className="text-sm px-3 py-1 gap-1 bg-orange-500 hover:bg-orange-500">
                          <AlertTriangle className="w-3.5 h-3.5" /> Only {reminder.stockCount} left
                        </Badge>
                      ) : (
                        <span className="text-green-700 bg-green-100 px-3 py-1.5 rounded-lg text-sm font-semibold">
                          {reminder.stockCount} pills left
                        </span>
                      )}
                    </div>
                    <Button
                      className="h-12 px-6 text-base font-bold rounded-xl shadow-sm gap-2 bg-primary hover:bg-primary/90"
                      onClick={() => handleTakeNow(reminder._id, reminder.medName)}
                      disabled={markTakenMutation.isPending || isOutOfStock}
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isOutOfStock ? "Restocked?" : t("rem.takeNow")}
                    </Button>
                  </div>

                  {/* Auto reminder indicator */}
                  <div className="mt-3 flex items-center gap-1.5 text-slate-400 text-xs">
                    {reminder.autoReminder ? <Bell className="w-3.5 h-3.5 text-primary" /> : <BellOff className="w-3.5 h-3.5" />}
                    {reminder.autoReminder ? "Auto reminder is on" : "Auto reminder is off"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">{t("rem.empty")}</h3>
          <p className="text-slate-500 mt-2 text-base">Tap the button above to add your medicines and get timely reminders.</p>
        </div>
      )}
    </div>
  );
}
