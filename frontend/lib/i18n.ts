import { create } from "zustand";

export type Language = "en" | "si" | "ta";

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "si", label: "Sinhala", nativeLabel: "සිංහල" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
];

export const DICTIONARIES = {
  en: {
    appTitle: "WildX",
    reportTitle: "Report Wildlife Conflict",
    reportSubtitle: "Quick report for Udawalawe villagers. No sign in required.",
    reportType: "Incident type",
    sighting: "Elephant sighting",
    cropDamage: "Crop damage",
    other: "Other emergency",
    animalCount: "Number of animals",
    location: "Location",
    useGps: "Use my current GPS location",
    gpsAcquiring: "Acquiring GPS…",
    gpsSuccess: "GPS location acquired",
    gpsError: "Could not get GPS. Choose a landmark instead.",
    orChooseLandmark: "Or select a nearby landmark",
    selectLandmark: "Select landmark",
    notes: "Notes or details (optional)",
    notesPlaceholder: "e.g. 2 elephants moving towards paddy fields near the canal",
    photo: "Take or upload photo (optional)",
    photoSelected: "Photo selected",
    changePhoto: "Change photo",
    phone: "Your mobile number",
    phonePlaceholder: "07X XXXXXXX",
    phoneHint: "Required. We use this to notify you when rangers respond.",
    submit: "Send report",
    submitting: "Sending report…",
    reportSuccess: "Report received",
    referenceLabel: "Reference code",
    successNotice: "Rangers have been notified. Keep this code to track progress.",
    trackReport: "Track report status",
    submitAnother: "Submit another report",
    statusTitle: "Report Status",
    statusSubtitle: "Track resolution of your community conflict report",
    searchPlaceholder: "Enter reference code (e.g. R-1042)",
    checkStatus: "Check status",
    statusNew: "Report received · Waiting for review",
    statusNeedsLocation: "Location clarification needed",
    statusValidated: "Validated · Queued for ranger response",
    statusDispatched: "Rangers dispatched to the area",
    statusClosed: "Resolved · Action completed",
    statusInvalid: "Invalidated",
    statusDuplicate: "Duplicate of existing report",
    outcomeLabel: "Outcome & notes",
    reportedOn: "Reported",
    landmarkLabel: "Landmark",
    animalsLabel: "Animals seen",
    notFound: "No report found with this reference code.",
    loading: "Loading…",
    errorSubmitting: "Could not submit report. Check your details and try again.",
    backToHome: "Back to report",
    haveReferenceCode: "Already submitted a report?",
    trackExisting: "Track status",
  },
  si: {
    appTitle: "WildX",
    reportTitle: "වනජීවී ගැටුමක් වාර්තා කරන්න",
    reportSubtitle: "උඩවලව ගම්වාසීන් සඳහා ඉක්මන් වාර්තාවක්. ලොග් වීම අවශ්‍ය නොවේ.",
    reportType: "සිද්ධි වර්ගය",
    sighting: "අලි දැකීම",
    cropDamage: "වගා හානි",
    other: "වෙනත් හදිසි අවස්ථාවක්",
    animalCount: "සතුන් ගණන",
    location: "ස්ථානය",
    useGps: "මගේ වත්මන් GPS ස්ථානය ගන්න",
    gpsAcquiring: "GPS ස්ථානය ලබාගනිමින් පවතී…",
    gpsSuccess: "GPS ස්ථානය සාර්ථකව ලබාගන්නා ලදී",
    gpsError: "GPS ලබාගත නොහැකි විය. ආසන්න සලකුණක් තෝරන්න.",
    orChooseLandmark: "නැතහොත් ආසන්න සලකුණක් තෝරන්න",
    selectLandmark: "සලකුණ තෝරන්න",
    notes: "විස්තර හෝ සටහන් (විකල්ප)",
    notesPlaceholder: "උදා. ඇළ අසල කුඹුර දෙසට අලි 2ක් ගමන් කරයි",
    photo: "ඡායාරූපයක් ගන්න හෝ එක් කරන්න (විකල්ප)",
    photoSelected: "ඡායාරූපය තෝරාගෙන ඇත",
    changePhoto: "වෙනස් කරන්න",
    phone: "ඔබගේ දුරකථන අංකය",
    phonePlaceholder: "07X XXXXXXX",
    phoneHint: "අනිවාර්යයි. නිලධාරීන් ක්‍රියාමාර්ග ගත් විට ඔබට දැනුම් දීමට මෙය යොදා ගනී.",
    submit: "වාර්තාව යවන්න",
    submitting: "වාර්තාව යවමින් පවතී…",
    reportSuccess: "වාර්තාව සාර්ථකව ලැබුණි",
    referenceLabel: "යොමු අංකය",
    successNotice: "වනජීවී නිලධාරීන්ට දැනුම් දෙන ලදී. ප්‍රගතිය බැලීමට මෙම අංකය තබා ගන්න.",
    trackReport: "තත්ත්වය බලන්න",
    submitAnother: "තවත් වාර්තාවක් යවන්න",
    statusTitle: "වාර්තාවේ තත්ත්වය",
    statusSubtitle: "ඔබ ඉදිරිපත් කළ වාර්තාවේ ප්‍රගතිය මෙතැනින් පරීක්ෂා කරන්න",
    searchPlaceholder: "යොමු අංකය ඇතුළත් කරන්න (උදා: R-1042)",
    checkStatus: "පරීක්ෂා කරන්න",
    statusNew: "වාර්තාව ලැබුණි · සමාලෝචනය අපේක්ෂාවෙන්",
    statusNeedsLocation: "ස්ථානය තහවුරු කරගත යුතුව ඇත",
    statusValidated: "තහවුරු කරන ලදී · නිලධාරීන් යැවීමට සූදානම්",
    statusDispatched: "නිලධාරීන් එම ප්‍රදේශයට පිටත් කර ඇත",
    statusClosed: "විසඳන ලදී · ක්‍රියාමාර්ග අවසන්",
    statusInvalid: "වලංගු නොවේ",
    statusDuplicate: "දැනටමත් ලැබුණු වාර්තාවක අනුපිටපතකි",
    outcomeLabel: "ප්‍රතිඵලය සහ සටහන්",
    reportedOn: "වාර්තා කළ දිනය",
    landmarkLabel: "සලකුණ",
    animalsLabel: "දැක ඇති සතුන් ගණන",
    notFound: "මෙම යොමු අංකයට අදාළ වාර්තාවක් හමු නොවීය.",
    loading: "පූරණය වෙමින් පවතී…",
    errorSubmitting: "වාර්තාව යැවීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
    backToHome: "ආපසු මුල් පිටුවට",
    haveReferenceCode: "කලින් වාර්තාවක් ඉදිරිපත් කළාද?",
    trackExisting: "තත්ත්වය බලන්න",
  },
  ta: {
    appTitle: "WildX",
    reportTitle: "வனவிலங்கு மோதலைப் புகாரளிக்கவும்",
    reportSubtitle: "உடவலவ கிராமவாசிகளுக்கான விரைவான அறிக்கை. உள்நுழைய தேவையில்லை.",
    reportType: "நிகழ்வு வகை",
    sighting: "யானை பார்த்தல்",
    cropDamage: "பயிர் சேதம்",
    other: "பிற அவசர நிலை",
    animalCount: "விலங்குகளின் எண்ணிக்கை",
    location: "இடம்",
    useGps: "எனது தற்போதைய GPS இருப்பிடத்தைப் பெறவும்",
    gpsAcquiring: "GPS இருப்பிடம் பெறப்படுகிறது…",
    gpsSuccess: "GPS இருப்பிடம் பெறப்பட்டது",
    gpsError: "GPS பெற முடியவில்லை. அடையாளத்தைத் தேர்ந்தெடுக்கவும்.",
    orChooseLandmark: "அல்லது அருகிலுள்ள அடையாளத்தைத் தேர்ந்தெடுக்கவும்",
    selectLandmark: "அடையாளத்தைத் தேர்ந்தெடுக்கவும்",
    notes: "குறிப்புகள் அல்லது விவரங்கள் (விருப்பத்தேர்வு)",
    notesPlaceholder: "எ.கா. கால்வாய் அருகே வயல்வெளி நோக்கி 2 யானைகள் செல்கின்றன",
    photo: "புகைப்படம் எடுக்கவும் அல்லது பதிவேற்றவும் (விருப்பத்தேர்வு)",
    photoSelected: "புகைப்படம் தேர்ந்தெடுக்கப்பட்டது",
    changePhoto: "மாற்றவும்",
    phone: "உங்கள் தொலைபேசி எண்",
    phonePlaceholder: "07X XXXXXXX",
    phoneHint: "கட்டாயம். வனத்துறையினர் நடவடிக்கை எடுக்கும்போது தெரிவிக்க இது பயன்படுகிறது.",
    submit: "புகாரை அனுப்பவும்",
    submitting: "அனுப்பப்படுகிறது…",
    reportSuccess: "அறிக்கை பெறப்பட்டது",
    referenceLabel: "குறிப்பு குறியீடு",
    successNotice: "வனத்துறையினருக்கு அறிவிக்கப்பட்டுள்ளது. நிலையை அறிய இந்த குறியீட்டை வைத்திருக்கவும்.",
    trackReport: "நிலையைக் கண்காணிக்கவும்",
    submitAnother: "மற்றொரு புகாரை அனுப்பவும்",
    statusTitle: "அறிக்கை நிலை",
    statusSubtitle: "உங்கள் அறிக்கையின் முன்னேற்றத்தை இங்கே கண்காணிக்கவும்",
    searchPlaceholder: "குறிப்பு குறியீட்டை உள்ளிடவும் (எ.கா: R-1042)",
    checkStatus: "சரிபார்க்கவும்",
    statusNew: "அறிக்கை பெறப்பட்டது · பரிசீலனையில் உள்ளது",
    statusNeedsLocation: "இருப்பிட தெளிவு தேவைப்படுகிறது",
    statusValidated: "உறுதிப்படுத்தப்பட்டது · பதிலளிக்க தயாராக உள்ளது",
    statusDispatched: "வனத்துறையினர் அப்பகுதிக்கு அனுப்பப்பட்டுள்ளனர்",
    statusClosed: "தீர்க்கப்பட்டது · நடவடிக்கை முடிந்தது",
    statusInvalid: "செல்லாதது",
    statusDuplicate: "ஏற்கனவே உள்ள அறிக்கையின் நகல்",
    outcomeLabel: "முடிவு மற்றும் குறிப்புகள்",
    reportedOn: "புகாரளிக்கப்பட்ட நேரம்",
    landmarkLabel: "அடையாளம்",
    animalsLabel: "கண்ட விலங்குகள் எண்ணிக்கை",
    notFound: "இந்தக் குறிப்புக் குறியீட்டில் எந்த அறிக்கையும் காணப்படவில்லை.",
    loading: "ஏற்றப்படுகிறது…",
    errorSubmitting: "அறிக்கையை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    backToHome: "முகப்புக்குத் திரும்பு",
    haveReferenceCode: "ஏற்கனவே அறிக்கை சமர்ப்பிக்கப்பட்டதா?",
    trackExisting: "நிலையைக் காண்க",
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARIES.en;

interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
}

const STORAGE_KEY = "wildx_language";

export const useI18nStore = create<I18nState>((set) => ({
  language: (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Language)) || "en",
  setLanguage: (language: Language) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language);
    }
    set({ language });
  },
}));

export function useT() {
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);
  const dictionary = DICTIONARIES[language] || DICTIONARIES.en;

  const t = (key: TranslationKey): string => {
    return dictionary[key] || DICTIONARIES.en[key] || key;
  };

  return { language, setLanguage, t };
}
