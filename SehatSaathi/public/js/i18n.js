// i18n - translations for English / Hindi / Marathi / Tamil / Bengali
// Use t("key") to get the translated string for the user's selected language.

const TRANSLATIONS = {
  // Bottom nav
  "nav.home":      { English: "Home",      Hindi: "होम",        Marathi: "होम",       Tamil: "முகப்பு",   Bengali: "হোম" },
  "nav.scan":      { English: "Scan",      Hindi: "स्कैन",       Marathi: "स्कॅन",     Tamil: "ஸ்கேன்",    Bengali: "স্ক্যান" },
  "nav.reminders": { English: "Reminders", Hindi: "रिमाइंडर",   Marathi: "स्मरणपत्र", Tamil: "நினைவூட்டல்", Bengali: "রিমাইন্ডার" },
  "nav.profile":   { English: "Profile",   Hindi: "प्रोफ़ाइल",  Marathi: "प्रोफाइल",  Tamil: "சுயவிவரம்",  Bengali: "প্রোফাইল" },

  // Home
  "home.summary":     { English: "Here is your daily health summary", Hindi: "यह आपका दैनिक स्वास्थ्य सारांश है", Marathi: "हा तुमचा दैनिक आरोग्य सारांश आहे", Tamil: "இது உங்கள் தினசரி சுகாதார சுருக்கம்", Bengali: "এটি আপনার দৈনিক স্বাস্থ্য সারাংশ" },
  "home.dueMeds":     { English: "Due Medications", Hindi: "दवा का समय", Marathi: "औषधाची वेळ", Tamil: "மருந்து நேரம்", Bengali: "ওষুধের সময়" },
  "home.viewAll":     { English: "View All", Hindi: "सभी देखें", Marathi: "सर्व पहा", Tamil: "எல்லாம்", Bengali: "সব দেখুন" },
  "home.noMeds":      { English: "No medications added yet.", Hindi: "अभी कोई दवा नहीं जोड़ी गई।", Marathi: "अद्याप कोणतीही औषधे जोडलेली नाहीत.", Tamil: "மருந்துகள் சேர்க்கப்படவில்லை.", Bengali: "কোনো ওষুধ যোগ করা হয়নি।" },
  "home.lowStock":    { English: "Low Stock Alerts", Hindi: "कम स्टॉक चेतावनी", Marathi: "कमी स्टॉक सूचना", Tamil: "குறைந்த இருப்பு", Bengali: "কম স্টক সতর্কতা" },
  "home.recentScans": { English: "Recent Scans", Hindi: "हाल के स्कैन", Marathi: "अलीकडील स्कॅन", Tamil: "சமீபத்திய ஸ்கேன்", Bengali: "সাম্প্রতিক স্ক্যান" },
  "home.noScans":     { English: "No recent scans.", Hindi: "कोई स्कैन नहीं।", Marathi: "अलीकडील स्कॅन नाहीत.", Tamil: "சமீபத்திய ஸ்கேன் இல்லை.", Bengali: "সাম্প্রতিক স্ক্যান নেই।" },
  "home.take":        { English: "Take", Hindi: "लें", Marathi: "घ्या", Tamil: "எடு", Bengali: "নিন" },

  // Scan
  "scan.title":       { English: "AI Scanner", Hindi: "AI स्कैनर", Marathi: "AI स्कॅनर", Tamil: "AI ஸ்கேனர்", Bengali: "AI স্ক্যানার" },
  "scan.what":        { English: "What would you like to scan?", Hindi: "आप क्या स्कैन करना चाहेंगे?", Marathi: "तुम्हाला काय स्कॅन करायचे आहे?", Tamil: "என்ன ஸ்கேன் செய்ய வேண்டும்?", Bengali: "আপনি কী স্ক্যান করতে চান?" },
  "scan.medicine":    { English: "Scan Medicine", Hindi: "दवा स्कैन करें", Marathi: "औषध स्कॅन करा", Tamil: "மருந்து ஸ்கேன்", Bengali: "ওষুধ স্ক্যান" },
  "scan.medDesc":     { English: "Know what this medicine is for", Hindi: "जानें यह दवा किसके लिए है", Marathi: "हे औषध कशासाठी आहे ते जाणून घ्या", Tamil: "இந்த மருந்து எதற்கு என்று தெரிந்துகொள்ளுங்கள்", Bengali: "এই ওষুধ কীসের জন্য জানুন" },
  "scan.prescription":{ English: "Scan Prescription", Hindi: "पर्ची स्कैन करें", Marathi: "प्रिस्क्रिप्शन स्कॅन करा", Tamil: "மருந்து சீட்டு ஸ்கேன்", Bengali: "প্রেসক্রিপশন স্ক্যান" },
  "scan.presDesc":    { English: "Read doctor's prescription", Hindi: "डॉक्टर की पर्ची पढ़ें", Marathi: "डॉक्टरांची प्रिस्क्रिप्शन वाचा", Tamil: "மருத்துவர் சீட்டை படிக்க", Bengali: "ডাক্তারের প্রেসক্রিপশন পড়ুন" },
  "scan.report":      { English: "Scan Report", Hindi: "रिपोर्ट स्कैन करें", Marathi: "अहवाल स्कॅन करा", Tamil: "அறிக்கை ஸ்கேன்", Bengali: "রিপোর্ট স্ক্যান" },
  "scan.reportDesc":  { English: "Understand lab test results", Hindi: "लैब टेस्ट परिणाम समझें", Marathi: "लॅब चाचणी निकाल समजून घ्या", Tamil: "ஆய்வக முடிவுகளை புரிந்துகொள்", Bengali: "ল্যাব টেস্ট ফলাফল বুঝুন" },
  "scan.useCamera":   { English: "Use Camera", Hindi: "कैमरा उपयोग करें", Marathi: "कॅमेरा वापरा", Tamil: "கேமராவைப் பயன்படுத்து", Bengali: "ক্যামেরা ব্যবহার" },
  "scan.upload":      { English: "Upload Image", Hindi: "छवि अपलोड करें", Marathi: "प्रतिमा अपलोड करा", Tamil: "படத்தை பதிவேற்று", Bengali: "ছবি আপলোড" },
  "scan.howAdd":      { English: "How would you like to add the image?", Hindi: "आप छवि कैसे जोड़ना चाहेंगे?", Marathi: "तुम्हाला प्रतिमा कशी जोडायची आहे?", Tamil: "படத்தை எவ்வாறு சேர்க்க விரும்புகிறீர்கள்?", Bengali: "ছবিটি কীভাবে যোগ করতে চান?" },
  "scan.analyzing":   { English: "Analyzing with AI...", Hindi: "AI विश्लेषण कर रहा है...", Marathi: "AI विश्लेषण करत आहे...", Tamil: "AI பகுப்பாய்வு செய்கிறது...", Bengali: "AI বিশ্লেষণ করছে..." },
  "scan.wait":        { English: "This may take a few seconds", Hindi: "इसमें कुछ सेकंड लग सकते हैं", Marathi: "यास काही सेकंद लागू शकतात", Tamil: "சில வினாடிகள் ஆகலாம்", Bengali: "কয়েক সেকেন্ড সময় লাগতে পারে" },
  "scan.aiResult":    { English: "AI Analysis", Hindi: "AI विश्लेषण", Marathi: "AI विश्लेषण", Tamil: "AI பகுப்பாய்வு", Bengali: "AI বিশ্লেষণ" },
  "scan.whatFound":   { English: "What AI Found:", Hindi: "AI ने क्या पाया:", Marathi: "AI ला काय सापडले:", Tamil: "AI கண்டறிந்தது:", Bengali: "AI যা পেয়েছে:" },
  "scan.again":       { English: "Scan Again", Hindi: "फिर से स्कैन", Marathi: "पुन्हा स्कॅन", Tamil: "மீண்டும் ஸ்கேன்", Bengali: "আবার স্ক্যান" },
  "scan.listen":      { English: "Listen", Hindi: "सुनें", Marathi: "ऐका", Tamil: "கேள்", Bengali: "শুনুন" },
  "scan.stop":        { English: "Stop", Hindi: "रुकें", Marathi: "थांबा", Tamil: "நிறுத்து", Bengali: "থামুন" },

  // Reminders
  "rem.title":        { English: "Reminders", Hindi: "रिमाइंडर", Marathi: "स्मरणपत्र", Tamil: "நினைவூட்டல்", Bengali: "রিমাইন্ডার" },
  "rem.tracked":      { English: "medicines tracked", Hindi: "दवाएं ट्रैक की गई", Marathi: "औषधे ट्रॅक केली", Tamil: "மருந்துகள்", Bengali: "ওষুধ ট্র্যাক" },
  "rem.addNew":       { English: "Add New Medicine", Hindi: "नई दवा जोड़ें", Marathi: "नवीन औषध जोडा", Tamil: "புதிய மருந்து சேர்", Bengali: "নতুন ওষুধ যোগ" },
  "rem.takeNow":      { English: "Take Now", Hindi: "अभी लें", Marathi: "आता घ्या", Tamil: "இப்போது எடு", Bengali: "এখনই নিন" },
  "rem.delete":       { English: "Delete", Hindi: "हटाएं", Marathi: "हटवा", Tamil: "நீக்கு", Bengali: "মুছুন" },
  "rem.empty":        { English: "No medicines added yet", Hindi: "अभी कोई दवा नहीं", Marathi: "अद्याप औषधे नाहीत", Tamil: "மருந்துகள் இல்லை", Bengali: "এখনো ওষুধ নেই" },
  "rem.medName":      { English: "Medicine Name", Hindi: "दवा का नाम", Marathi: "औषधाचे नाव", Tamil: "மருந்தின் பெயர்", Bengali: "ওষুধের নাম" },
  "rem.dosage":       { English: "Dosage", Hindi: "खुराक", Marathi: "डोस", Tamil: "மருந்தளவு", Bengali: "ডোজ" },
  "rem.frequency":    { English: "Frequency", Hindi: "कितनी बार", Marathi: "किती वेळा", Tamil: "எத்தனை முறை", Bengali: "কতবার" },
  "rem.stock":        { English: "Stock count", Hindi: "स्टॉक संख्या", Marathi: "स्टॉक संख्या", Tamil: "இருப்பு", Bengali: "স্টক" },

  // Profile
  "profile.title":    { English: "Profile", Hindi: "प्रोफ़ाइल", Marathi: "प्रोफाइल", Tamil: "சுயவிவரம்", Bengali: "প্রোফাইল" },
  "profile.edit":     { English: "Edit", Hindi: "संपादित करें", Marathi: "संपादित करा", Tamil: "திருத்து", Bengali: "সম্পাদনা" },
  "profile.save":     { English: "Save Changes", Hindi: "बदलाव सहेजें", Marathi: "बदल जतन करा", Tamil: "மாற்றங்களை சேமி", Bengali: "পরিবর্তন সংরক্ষণ" },
  "profile.cancel":   { English: "Cancel", Hindi: "रद्द करें", Marathi: "रद्द करा", Tamil: "ரத்து", Bengali: "বাতিল" },
  "profile.logout":   { English: "Logout", Hindi: "लॉग आउट", Marathi: "लॉग आउट", Tamil: "வெளியேறு", Bengali: "লগআউট" },
  "profile.lang":     { English: "App Language", Hindi: "ऐप भाषा", Marathi: "अॅप भाषा", Tamil: "ஆப் மொழி", Bengali: "অ্যাপ ভাষা" },
  "profile.contacts": { English: "Emergency Contacts", Hindi: "आपातकालीन संपर्क", Marathi: "आपत्कालीन संपर्क", Tamil: "அவசர தொடர்புகள்", Bengali: "জরুরি যোগাযোগ" },
  "profile.add":      { English: "Add", Hindi: "जोड़ें", Marathi: "जोडा", Tamil: "சேர்", Bengali: "যোগ" },
  "profile.name":     { English: "Name", Hindi: "नाम", Marathi: "नाव", Tamil: "பெயர்", Bengali: "নাম" },
  "profile.age":      { English: "Age", Hindi: "उम्र", Marathi: "वय", Tamil: "வயது", Bengali: "বয়স" },
  "profile.blood":    { English: "Blood Group", Hindi: "रक्त समूह", Marathi: "रक्तगट", Tamil: "இரத்தக்குழு", Bengali: "রক্তের গ্রুপ" },
  "profile.address":  { English: "Address", Hindi: "पता", Marathi: "पत्ता", Tamil: "முகவரி", Bengali: "ঠিকানা" },

  // SOS
  "sos.title":        { English: "Emergency SOS", Hindi: "आपातकालीन SOS", Marathi: "आपत्कालीन SOS", Tamil: "அவசர SOS", Bengali: "জরুরি SOS" },
  "sos.help":         { English: "Tap the button to alert your emergency contacts with your live location.", Hindi: "अपने आपातकालीन संपर्कों को अपने स्थान के साथ सूचित करने के लिए बटन दबाएं।", Marathi: "तुमच्या आपत्कालीन संपर्कांना तुमच्या स्थानासह सूचित करण्यासाठी बटण दाबा.", Tamil: "உங்கள் அவசர தொடர்புகளுக்கு உங்கள் இருப்பிடத்துடன் எச்சரிக்கை செய்ய பொத்தானை அழுத்தவும்.", Bengali: "আপনার অবস্থান সহ আপনার জরুরি যোগাযোগে সতর্ক করতে বোতাম টিপুন।" },
  "sos.send":         { English: "SEND SOS NOW", Hindi: "अभी SOS भेजें", Marathi: "आता SOS पाठवा", Tamil: "இப்போது SOS அனுப்பு", Bengali: "এখনই SOS পাঠান" },
};

const LANG_EVENT = "sehat_lang_change";
const VALID = ["English", "Hindi", "Marathi", "Tamil", "Bengali"];

function getAppLanguage() {
  const stored = localStorage.getItem("sehat_lang") || "English";
  if (VALID.includes(stored)) return stored;
  // Backward compat for short codes
  if (stored === "en") return "English";
  if (stored === "hi") return "Hindi";
  if (stored === "mr") return "Marathi";
  if (stored === "ta") return "Tamil";
  if (stored === "bn") return "Bengali";
  return "English";
}

function setAppLanguage(lang) {
  localStorage.setItem("sehat_lang", lang);
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
}

function t(key, fallback) {
  const lang = getAppLanguage();
  const entry = TRANSLATIONS[key];
  if (!entry) return fallback || key;
  return entry[lang] || entry.English || fallback || key;
}

// Auto-translate any element with [data-i18n="key"]
function applyTranslations(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
}

window.addEventListener(LANG_EVENT, () => applyTranslations());
window.addEventListener("storage", (e) => {
  if (e.key === "sehat_lang") applyTranslations();
});
