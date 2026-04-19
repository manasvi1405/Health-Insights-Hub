import { useEffect } from "react";
import { useLocation } from "wouter";

const languages = [
  { code: "English", native: "English", flag: "🇬🇧" },
  { code: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "Bengali", native: "বাংলা", flag: "🇮🇳" },
];

export default function LanguageSelect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (localStorage.getItem("sehat_lang")) {
      setLocation("/login");
    }
  }, [setLocation]);

  const selectLanguage = (code: string) => {
    localStorage.setItem("sehat_lang", code);
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-[390px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-3">
          <div className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-5xl font-bold text-white">S</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900">SehatSaathi</h1>
          <p className="text-xl text-slate-500">Choose your language / भाषा चुनें</p>
        </div>

        <div className="space-y-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className="w-full h-16 text-xl flex items-center gap-4 px-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary hover:bg-blue-50 transition-all shadow-sm font-semibold text-slate-800 active:scale-[0.98]"
              onClick={() => selectLanguage(lang.code)}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span>{lang.native}</span>
              {lang.code !== lang.native && (
                <span className="text-slate-400 text-base ml-auto font-normal">{lang.code}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
