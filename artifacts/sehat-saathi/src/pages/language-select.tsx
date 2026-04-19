import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी" },
  { code: "mr", name: "मराठी" },
  { code: "ta", name: "தமிழ்" },
  { code: "bn", name: "বাংলা" },
];

export default function LanguageSelect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If language is already selected, go to login
    if (localStorage.getItem("sehat_lang")) {
      setLocation("/login");
    }
  }, [setLocation]);

  const selectLanguage = (code: string) => {
    localStorage.setItem("sehat_lang", code);
    setLocation("/login");
  };

  return (
    <div className="flex flex-col h-full justify-center p-6 space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-6">
          <span className="text-4xl font-bold text-primary">S</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Choose Language</h1>
        <p className="text-lg text-slate-600">Please select your preferred language</p>
      </div>

      <div className="space-y-4">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant="outline"
            className="w-full h-16 text-xl justify-between px-6 bg-white hover:bg-primary/5 hover:text-primary hover:border-primary transition-all border-2"
            onClick={() => selectLanguage(lang.code)}
          >
            <span>{lang.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
