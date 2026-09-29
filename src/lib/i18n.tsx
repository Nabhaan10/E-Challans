import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ml" | "hi";

const dict = {
  en: {
    dashboard: "Dashboard", challans: "Challans", vehicles: "Vehicles", rules: "Traffic Rules",
    appeals: "Appeals", notifications: "Notifications", search: "Search", issue: "Issue Challan",
    users: "Users & Officers", analytics: "Analytics", map: "Hotspot Map", audit: "Audit Log",
    payments: "Payments", settings: "Settings", assistant: "Data Assistant", signout: "Sign out",
    outstanding: "Outstanding Fine", pending: "Pending Challans", paid: "Paid Challans",
    activeAppeals: "Active Appeals", recent: "Recent Challans", myVehicles: "My Vehicles",
    payFine: "Pay Fine", why: "Why did I receive this fine?", dispute: "Dispute Challan",
    searchPh: "Search challan, vehicle, violation…", verify: "Verify Challan",
  },
  ml: {
    dashboard: "ഡാഷ്ബോർഡ്", challans: "ചലാനുകൾ", vehicles: "വാഹനങ്ങൾ", rules: "ഗതാഗത നിയമങ്ങൾ",
    appeals: "അപ്പീലുകൾ", notifications: "അറിയിപ്പുകൾ", search: "തിരയുക", issue: "ചലാൻ നൽകുക",
    users: "ഉപയോക്താക്കൾ", analytics: "വിശകലനം", map: "ഹോട്ട്സ്പോട്ട് മാപ്പ്", audit: "ഓഡിറ്റ് ലോഗ്",
    payments: "പേയ്മെന്റുകൾ", settings: "ക്രമീകരണങ്ങൾ", assistant: "ഡാറ്റ സഹായി", signout: "പുറത്തുകടക്കുക",
    outstanding: "അടയ്ക്കാനുള്ള പിഴ", pending: "തീർപ്പാകാത്ത ചലാനുകൾ", paid: "അടച്ച ചലാനുകൾ",
    activeAppeals: "സജീവ അപ്പീലുകൾ", recent: "സമീപകാല ചലാനുകൾ", myVehicles: "എന്റെ വാഹനങ്ങൾ",
    payFine: "പിഴ അടയ്ക്കുക", why: "എനിക്ക് ഈ പിഴ എന്തുകൊണ്ട്?", dispute: "ചലാൻ ചോദ്യം ചെയ്യുക",
    searchPh: "ചലാൻ, വാഹനം, നിയമലംഘനം തിരയുക…", verify: "ചലാൻ പരിശോധിക്കുക",
  },
  hi: {
    dashboard: "डैशबोर्ड", challans: "चालान", vehicles: "वाहन", rules: "यातायात नियम",
    appeals: "अपील", notifications: "सूचनाएँ", search: "खोजें", issue: "चालान जारी करें",
    users: "उपयोगकर्ता", analytics: "विश्लेषण", map: "हॉटस्पॉट मानचित्र", audit: "ऑडिट लॉग",
    payments: "भुगतान", settings: "सेटिंग्स", assistant: "डेटा सहायक", signout: "साइन आउट",
    outstanding: "बकाया जुर्माना", pending: "लंबित चालान", paid: "भुगतान किए चालान",
    activeAppeals: "सक्रिय अपील", recent: "हाल के चालान", myVehicles: "मेरे वाहन",
    payFine: "जुर्माना भरें", why: "मुझे यह जुर्माना क्यों मिला?", dispute: "चालान पर आपत्ति",
    searchPh: "चालान, वाहन, उल्लंघन खोजें…", verify: "चालान सत्यापित करें",
  },
} as const;

export type TKey = keyof typeof dict.en;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict.en[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem("lang") as Lang | null;
    if (s && s in dict) setLangState(s);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
  };
  return (
    <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] ?? dict.en[k] }}>
      {children}
    </Ctx.Provider>
  );
}

export const useT = () => useContext(Ctx);
