import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Clock, Plus, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListReminders, useCreateReminder, useMarkReminderTaken, useDeleteReminder } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListRemindersQueryKey } from "@workspace/api-client-react";

export default function Reminders() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reminders, isLoading } = useListReminders();
  const markTakenMutation = useMarkReminderTaken();
  const deleteMutation = useDeleteReminder();

  // Form states
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<"once" | "twice" | "thrice">("once");
  const [times, setTimes] = useState<string[]>(["09:00"]);
  const [stockCount, setStockCount] = useState("10");
  const [autoReminder, setAutoReminder] = useState(true);

  const createReminderMutation = useCreateReminder();

  useEffect(() => {
    // Setup alarm checker
    const checkAlarms = setInterval(() => {
      if (!reminders) return;
      
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      reminders.forEach(reminder => {
        if (reminder.times.includes(currentTime) && now.getSeconds() === 0) {
          // Play beep
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            oscillator.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1);
          } catch(e) {}
          
          // Speak
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Time to take your medicine, ${reminder.medName}`);
            window.speechSynthesis.speak(utterance);
          }
          
          toast({
            title: "Medicine Time!",
            description: `Please take ${reminder.medName} (${reminder.dosage}) now.`,
            variant: "default",
          });
        }
      });
    }, 1000);
    
    return () => clearInterval(checkAlarms);
  }, [reminders, toast]);

  // Check URL query params for pre-filled medicine name from Scan page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addMed = params.get("add");
    if (addMed) {
      setShowAddForm(true);
      setMedName(addMed);
    }
  }, []);

  const handleFrequencyChange = (val: "once" | "twice" | "thrice") => {
    setFrequency(val);
    if (val === "once") setTimes(["09:00"]);
    if (val === "twice") setTimes(["09:00", "21:00"]);
    if (val === "thrice") setTimes(["09:00", "14:00", "21:00"]);
  };

  const handleTimeChange = (index: number, val: string) => {
    const newTimes = [...times];
    newTimes[index] = val;
    setTimes(newTimes);
  };

  const handleAddSubmit = async () => {
    if (!medName || !dosage) {
      toast({ title: "Incomplete Form", description: "Please fill medicine name and dosage", variant: "destructive" });
      return;
    }
    
    try {
      await createReminderMutation.mutateAsync({
        data: {
          medName,
          dosage,
          frequency,
          times,
          stockCount: parseInt(stockCount, 10) || 0,
          autoReminder
        }
      });
      
      toast({ title: "Added", description: "Reminder saved successfully!" });
      queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      setShowAddForm(false);
      
      // Reset form
      setMedName("");
      setDosage("");
      setStockCount("10");
      setFrequency("once");
      setTimes(["09:00"]);
      
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save reminder", variant: "destructive" });
    }
  };

  const handleTakeNow = async (id: string) => {
    try {
      const res = await markTakenMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      
      if (res.stockAlert) {
        toast({ title: "Stock Low!", description: res.stockAlert, variant: "destructive" });
      } else {
        toast({ title: "Marked as Taken", description: "Good job!" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
      toast({ title: "Deleted", description: "Reminder removed." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Add Reminder</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
            <X className="w-8 h-8" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-lg">Medicine Name</Label>
            <Input className="h-14 text-xl" value={medName} onChange={e => setMedName(e.target.value)} placeholder="e.g. Paracetamol" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-lg">Dosage</Label>
            <Input className="h-14 text-xl" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg or 1 pill" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-lg">Frequency</Label>
            <Select value={frequency} onValueChange={(val: any) => handleFrequencyChange(val)}>
              <SelectTrigger className="h-14 text-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once" className="text-lg py-3">Once a day</SelectItem>
                <SelectItem value="twice" className="text-lg py-3">Twice a day</SelectItem>
                <SelectItem value="thrice" className="text-lg py-3">Three times a day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-lg">Reminder Times</Label>
            {times.map((time, idx) => (
              <Input 
                key={idx} 
                type="time" 
                className="h-14 text-xl" 
                value={time} 
                onChange={e => handleTimeChange(idx, e.target.value)} 
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-lg">Current Stock (Pills left)</Label>
            <Input type="number" className="h-14 text-xl" value={stockCount} onChange={e => setStockCount(e.target.value)} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
            <div className="space-y-0.5">
              <Label className="text-lg font-bold">Auto Reminders</Label>
              <p className="text-slate-500 text-sm">App will ring when it's time</p>
            </div>
            <Switch checked={autoReminder} onCheckedChange={setAutoReminder} className="scale-125" />
          </div>

          <Button 
            className="w-full h-16 text-xl rounded-xl mt-6 shadow-md"
            onClick={handleAddSubmit}
            disabled={createReminderMutation.isPending}
          >
            {createReminderMutation.isPending ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
            Save Reminder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reminders</h1>
          <p className="text-lg text-slate-500 mt-1">Your medicine schedule</p>
        </div>
      </header>

      <Button 
        className="w-full h-16 text-xl rounded-xl shadow-md bg-blue-50 text-primary border-2 border-primary/20 hover:bg-blue-100 mb-6"
        onClick={() => setShowAddForm(true)}
      >
        <Plus className="w-6 h-6 mr-2" /> Add New Medicine
      </Button>

      {reminders && reminders.length > 0 ? (
        <div className="space-y-4">
          {reminders.map(reminder => {
            const isLowStock = reminder.stockCount <= 5;
            return (
              <Card key={reminder._id} className={`border-2 shadow-sm ${isLowStock ? 'border-destructive/40' : 'border-slate-200'}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{reminder.medName}</h3>
                      <p className="text-lg text-slate-600">{reminder.dosage} • {reminder.frequency}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-destructive" onClick={() => handleDelete(reminder._id)}>
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {reminder.times.map((t, i) => (
                      <div key={i} className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-1.5 text-primary" /> {t}
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className={`font-medium flex items-center px-3 py-1.5 rounded-full text-sm ${isLowStock ? 'bg-destructive/10 text-destructive' : 'bg-green-50 text-green-700'}`}>
                      {isLowStock ? <AlertCircle className="w-4 h-4 mr-1.5" /> : null}
                      Stock: {reminder.stockCount} left
                    </div>
                    
                    <Button 
                      className="h-12 px-6 font-bold rounded-lg shadow-sm"
                      onClick={() => handleTakeNow(reminder._id)}
                      disabled={markTakenMutation.isPending}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" /> Take Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No Reminders Yet</h3>
          <p className="text-slate-500 mt-2">Add your medicines here to get timely alerts and manage stock.</p>
        </div>
      )}
    </div>
  );
}
