import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSendOtp, useVerifyOtp } from "@workspace/api-client-react";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isNewUser, setIsNewUser] = useState(false);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
      return;
    }
    try {
      await sendOtpMutation.mutateAsync({ data: { phone } });
      setStep("otp");
      // Basic heuristic to ask for name, since API doesn't tell us if new user beforehand without a specific endpoint. We'll ask anyway and send it if provided.
      setIsNewUser(true); 
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    try {
      const res = await verifyOtpMutation.mutateAsync({ data: { phone, otp, name: name || undefined } });
      login(res.token);
      toast({ title: "Login Successful", description: "Welcome to SehatSaathi" });
      setLocation("/home");
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message || "Invalid OTP", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full justify-center p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-10">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">SehatSaathi</h1>
        <p className="text-lg text-slate-600">Your digital health companion</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
        <p className="text-sm text-blue-800 font-medium">Dev Test Account:</p>
        <p className="text-lg text-blue-900 font-bold tracking-wider">8446530525 / 123456</p>
      </div>

      {step === "phone" ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-lg font-medium">Mobile Number</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500 font-medium">+91</span>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Enter 10-digit number" 
                className="h-16 pl-14 text-xl border-2 focus-visible:ring-primary"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
          </div>
          <Button 
            className="w-full h-16 text-xl rounded-xl shadow-md"
            onClick={handleSendOtp}
            disabled={sendOtpMutation.isPending}
          >
            {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          {isNewUser && (
            <div className="space-y-3">
              <Label htmlFor="name" className="text-lg font-medium">Your Name (Optional)</Label>
              <Input 
                id="name" 
                placeholder="What should we call you?" 
                className="h-16 text-xl border-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="space-y-3">
            <Label className="text-lg font-medium">Enter 6-digit OTP</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2">
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl border-2 rounded-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-center text-sm text-slate-500 mt-2">
              Sent to +91 {phone} <button onClick={() => setStep("phone")} className="text-primary font-semibold ml-2">Edit</button>
            </p>
          </div>

          <Button 
            className="w-full h-16 text-xl rounded-xl shadow-md"
            onClick={handleVerifyOtp}
            disabled={verifyOtpMutation.isPending || otp.length !== 6}
          >
            {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Login"}
          </Button>
        </div>
      )}
    </div>
  );
}
