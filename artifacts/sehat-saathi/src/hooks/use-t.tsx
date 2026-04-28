import { useEffect, useState } from "react";

type LangCode = "English" | "Hindi" | "Marathi" | "Tamil" | "Bengali";

const TRANSLATIONS: Record<string, Record<LangCode, string>> = {
  // Nav
  "nav.home": { English: "Home", Hindi: "होम", Marathi: "होम", Tamil: "முகப்பு", Bengali: "হোম" },
  "nav.scan": { English: "Scan", Hindi: "स्कैन", Marathi: "स्कॅन", Tamil: "ஸ்கேன்", Bengali: "স্ক্যান" },
  "nav.reminders": { English: "Reminders", Hindi: "रिमाइंडर", Marathi: "स्मरणपत्र", Tamil: "நினைவூட்டல்கள்", Bengali: "রিমাইন্ডার" },
  "nav.profile": { English: "Profile", Hindi: "प्रोफ़ाइल", Marathi: "प्रोफाइल", Tamil: "சுயவிவரம்", Bengali: "প্রোফাইল" },

  // Home
  "home.dueMeds": { English: "Due Medications", Hindi: "दवा का समय", Marathi: "औषधाची वेळ", Tamil: "மருந்து நேரம்", Bengali: "ওষুধের সময়" },
  "home.viewAll": { English: "View All", Hindi: "सभी देखें", Marathi: "सर्व पहा", Tamil: "எல்லாம் பார்", Bengali: "সব দেখুন" },
  "home.noMeds": { English: "No medications added yet.", Hindi: "अभी कोई दवा नहीं जोड़ी गई।", Marathi: "अद्याप कोणतीही औषधे जोडलेली नाहीत.", Tamil: "இன்னும் மருந்துகள் சேர்க்கப்படவில்லை.", Bengali: "এখনো কোনো ওষুধ যোগ করা হয়নি।" },
  "home.lowStock": { English: "Low Stock Alerts", Hindi: "कम स्टॉक चेतावनी", Marathi: "कमी स्टॉक सूचना", Tamil: "குறைந்த இருப்பு", Bengali: "কম স্টক সতর্কতা" },
  "home.recentScans": { English: "Recent Scans", Hindi: "हाल के स्कैन", Marathi: "अलीकडील स्कॅन", Tamil: "சமீபத்திய ஸ்கேன்", Bengali: "সাম্প্রতিক স্ক্যান" },
  "home.noScans": { English: "No recent scans.", Hindi: "कोई स्कैन नहीं।", Marathi: "अलीकडील स्कॅन नाहीत.", Tamil: "சமீபத்திய ஸ்கேன் இல்லை.", Bengali: "সাম্প্রতিক স্ক্যান নেই।" },
  "home.summary": { English: "Here is your daily health summary", Hindi: "यह आपका दैनिक स्वास्थ्य सारांश है", Marathi: "हा तुमचा दैनिक आरोग्य सारांश आहे", Tamil: "இது உங்கள் தினசரி சுகாதார சுருக்கம்", Bengali: "এটি আপনার দৈনিক স্বাস্থ্য সারাংশ" },
  "home.take": { English: "Take", Hindi: "लें", Marathi: "घ्या", Tamil: "எடு", Bengali: "নিন" },

  // Scan
  "scan.title": { English: "AI Scanner", Hindi: "AI स्कैनर", Marathi: "AI स्कॅनर", Tamil: "AI ஸ்கேனர்", Bengali: "AI স্ক্যানার" },
  "scan.what": { English: "What would you like to scan?", Hindi: "आप क्या स्कैन करना चाहेंगे?", Marathi: "तुम्हाला काय स्कॅन करायचे आहे?", Tamil: "என்ன ஸ்கேன் செய்ய விரும்புகிறீர்கள்?", Bengali: "আপনি কী স্ক্যান করতে চান?" },
  "scan.medicine": { English: "Scan Medicine", Hindi: "दवा स्कैन करें", Marathi: "औषध स्कॅन करा", Tamil: "மருந்து ஸ்கேன்", Bengali: "ওষুধ স্ক্যান" },
  "scan.medicineDesc": { English: "Know what this medicine is for", Hindi: "जानें यह दवा किसके लिए है", Marathi: "हे औषध कशासाठी आहे ते जाणून घ्या", Tamil: "இந்த மருந்து எதற்கு என்று தெரிந்துகொள்ளுங்கள்", Bengali: "এই ওষুধ কীসের জন্য জানুন" },
  "scan.prescription": { English: "Scan Prescription", Hindi: "पर्ची स्कैन करें", Marathi: "प्रिस्क्रिप्शन स्कॅन करा", Tamil: "மருந்து சீட்டு ஸ்கேன்", Bengali: "প্রেসক্রিপশন স্ক্যান" },
  "scan.prescriptionDesc": { English: "Read doctor's prescription", Hindi: "डॉक्टर की पर्ची पढ़ें", Marathi: "डॉक्टरांची प्रिस्क्रिप्शन वाचा", Tamil: "மருத்துவர் சீட்டை படிக்க", Bengali: "ডাক্তারের প্রেসক্রিপশন পড়ুন" },
  "scan.report": { English: "Scan Report", Hindi: "रिपोर्ट स्कैन करें", Marathi: "अहवाल स्कॅन करा", Tamil: "அறிக்கை ஸ்கேன்", Bengali: "রিপোর্ট স্ক্যান" },
  "scan.reportDesc": { English: "Understand lab test results", Hindi: "लैब टेस्ट परिणाम समझें", Marathi: "लॅब चाचणी निकाल समजून घ्या", Tamil: "ஆய்வக முடிவுகளைப் புரிந்துகொள்", Bengali: "ল্যাব টেস্ট ফলাফল বুঝুন" },
  "scan.useCamera": { English: "Use Camera", Hindi: "कैमरा उपयोग करें", Marathi: "कॅमेरा वापरा", Tamil: "கேமராவைப் பயன்படுத்து", Bengali: "ক্যামেরা ব্যবহার" },
  "scan.takePhoto": { English: "Take a photo right now", Hindi: "अभी फोटो लें", Marathi: "आत्ता फोटो घ्या", Tamil: "இப்போது புகைப்படம் எடு", Bengali: "এখনই ছবি তুলুন" },
  "scan.uploadImage": { English: "Upload Image", Hindi: "छवि अपलोड करें", Marathi: "प्रतिमा अपलोड करा", Tamil: "படத்தைப் பதிவேற்று", Bengali: "ছবি আপলোড" },
  "scan.fromGallery": { English: "Choose from gallery or files", Hindi: "गैलरी या फ़ाइलों से चुनें", Marathi: "गॅलरी किंवा फायलींमधून निवडा", Tamil: "கேலரி/கோப்புகளில் இருந்து தேர்ந்தெடு", Bengali: "গ্যালারি বা ফাইল থেকে বেছে নিন" },
  "scan.howToAdd": { English: "How would you like to add the image?", Hindi: "आप छवि कैसे जोड़ना चाहेंगे?", Marathi: "तुम्हाला प्रतिमा कशी जोडायची आहे?", Tamil: "படத்தை எவ்வாறு சேர்க்க விரும்புகிறீர்கள்?", Bengali: "ছবিটি কীভাবে যোগ করতে চান?" },
  "scan.analyzing": { English: "Analyzing with AI...", Hindi: "AI विश्लेषण कर रहा है...", Marathi: "AI विश्लेषण करत आहे...", Tamil: "AI பகுப்பாய்வு செய்கிறது...", Bengali: "AI বিশ্লেষণ করছে..." },
  "scan.wait": { English: "This may take a few seconds", Hindi: "इसमें कुछ सेकंड लग सकते हैं", Marathi: "यास काही सेकंद लागू शकतात", Tamil: "சில வினாடிகள் ஆகலாம்", Bengali: "কয়েক সেকেন্ড সময় লাগতে পারে" },
  "scan.aiResult": { English: "AI Analysis", Hindi: "AI विश्लेषण", Marathi: "AI विश्लेषण", Tamil: "AI பகுப்பாய்வு", Bengali: "AI বিশ্লেষণ" },
  "scan.whatAiFound": { English: "What AI Found:", Hindi: "AI ने क्या पाया:", Marathi: "AI ला काय सापडले:", Tamil: "AI கண்டறிந்தது:", Bengali: "AI যা পেয়েছে:" },
  "scan.scanAgain": { English: "Scan Again", Hindi: "फिर से स्कैन करें", Marathi: "पुन्हा स्कॅन करा", Tamil: "மீண்டும் ஸ்கேன்", Bengali: "আবার স্ক্যান" },
  "scan.addReminder": { English: "Add Reminder", Hindi: "रिमाइंडर जोड़ें", Marathi: "स्मरण जोडा", Tamil: "நினைவூட்டல் சேர்க்க", Bengali: "রিমাইন্ডার যোগ" },
  "scan.listen": { English: "Listen", Hindi: "सुनें", Marathi: "ऐका", Tamil: "கேள்", Bengali: "শুনুন" },
  "scan.stop": { English: "Stop", Hindi: "रुकें", Marathi: "थांबा", Tamil: "நிறுத்து", Bengali: "থামুন" },
  "scan.centerDoc": { English: "Center the document in the frame", Hindi: "दस्तावेज़ को फ्रेम के बीच रखें", Marathi: "कागदपत्र फ्रेममध्ये केंद्रस्थानी ठेवा", Tamil: "ஆவணத்தை சட்டத்தின் மையத்தில் வை", Bengali: "ফ্রেমের মাঝে নথিটি রাখুন" },

  // Reminders
  "rem.title": { English: "Reminders", Hindi: "रिमाइंडर", Marathi: "स्मरणपत्र", Tamil: "நினைவூட்டல்கள்", Bengali: "রিমাইন্ডার" },
  "rem.tracked": { English: "medicines tracked", Hindi: "दवाएं ट्रैक की गई", Marathi: "औषधे ट्रॅक केली", Tamil: "மருந்துகள் கண்காணிக்கப்பட்டன", Bengali: "ওষুধ ট্র্যাক করা" },
  "rem.addNew": { English: "Add New Medicine", Hindi: "नई दवा जोड़ें", Marathi: "नवीन औषध जोडा", Tamil: "புதிய மருந்து சேர்", Bengali: "নতুন ওষুধ যোগ" },
  "rem.takeNow": { English: "Take Now", Hindi: "अभी लें", Marathi: "आता घ्या", Tamil: "இப்போது எடு", Bengali: "এখনই নিন" },
  "rem.empty": { English: "No medicines added yet", Hindi: "अभी कोई दवा नहीं", Marathi: "अद्याप कोणतीही औषधे नाहीत", Tamil: "மருந்துகள் சேர்க்கப்படவில்லை", Bengali: "এখনো ওষুধ নেই" },

  // Profile
  "profile.title": { English: "Profile", Hindi: "प्रोफ़ाइल", Marathi: "प्रोफाइल", Tamil: "சுயவிவரம்", Bengali: "প্রোফাইল" },
  "profile.logout": { English: "Logout", Hindi: "लॉग आउट", Marathi: "लॉग आउट", Tamil: "வெளியேறு", Bengali: "লগআউট" },
  "profile.edit": { English: "Edit", Hindi: "संपादित करें", Marathi: "संपादित करा", Tamil: "திருத்து", Bengali: "সম্পাদনা" },
  "profile.save": { English: "Save Changes", Hindi: "बदलाव सहेजें", Marathi: "बदल जतन करा", Tamil: "மாற்றங்களை சேமி", Bengali: "পরিবর্তন সংরক্ষণ" },
  "profile.cancel": { English: "Cancel", Hindi: "रद्द करें", Marathi: "रद्द करा", Tamil: "ரத்து", Bengali: "বাতিল" },
  "profile.appLanguage": { English: "App Language", Hindi: "ऐप भाषा", Marathi: "अॅप भाषा", Tamil: "ஆப் மொழி", Bengali: "অ্যাপ ভাষা" },
  "profile.contacts": { English: "Emergency Contacts", Hindi: "आपातकालीन संपर्क", Marathi: "आपत्कालीन संपर्क", Tamil: "அவசர தொடர்புகள்", Bengali: "জরুরি যোগাযোগ" },
  "profile.add": { English: "Add", Hindi: "जोड़ें", Marathi: "जोडा", Tamil: "சேர்", Bengali: "যোগ" },

  // Common
  "common.greeting.morning": { English: "Good morning", Hindi: "शुभ प्रभात", Marathi: "शुभ सकाळ", Tamil: "காலை வணக்கம்", Bengali: "সুপ্রভাত" },
  "common.greeting.afternoon": { English: "Good afternoon", Hindi: "नमस्ते", Marathi: "नमस्कार", Tamil: "மதிய வணக்கம்", Bengali: "শুভ অপরাহ্ণ" },
  "common.greeting.evening": { English: "Good evening", Hindi: "शुभ संध्या", Marathi: "शुभ संध्याकाळ", Tamil: "மாலை வணக்கம்", Bengali: "শুভ সন্ধ্যা" },
};

const LANG_EVENT = "sehat_lang_change";

export function setAppLanguage(lang: string) {
  localStorage.setItem("sehat_lang", lang);
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
}

export function getAppLanguage(): LangCode {
  const stored = localStorage.getItem("sehat_lang") || "English";
  if (["English", "Hindi", "Marathi", "Tamil", "Bengali"].includes(stored)) {
    return stored as LangCode;
  }
  // Backward compat for old codes
  if (stored === "en") return "English";
  if (stored === "hi") return "Hindi";
  if (stored === "mr") return "Marathi";
  if (stored === "ta") return "Tamil";
  if (stored === "bn") return "Bengali";
  return "English";
}

export function useT() {
  const [lang, setLang] = useState<LangCode>(() => getAppLanguage());

  useEffect(() => {
    const handler = () => setLang(getAppLanguage());
    window.addEventListener(LANG_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(LANG_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const t = (key: string, fallback?: string): string => {
    const entry = TRANSLATIONS[key];
    if (!entry) return fallback || key;
    return entry[lang] || entry.English || fallback || key;
  };

  return { t, lang };
}

// Speech synthesis language code mapping
export function getSpeechLangCode(lang: LangCode): string {
  switch (lang) {
    case "Hindi": return "hi-IN";
    case "Marathi": return "mr-IN";
    case "Tamil": return "ta-IN";
    case "Bengali": return "bn-IN";
    default: return "en-IN";
  }
}
