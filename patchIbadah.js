const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'frontend/public/locales');

const en = {
    home: {
        prophets: {
            title: "Prophets Lineage",
            subtitle: "A chronological spiritual journey",
            nodeProphetLabel: "Prophet",
            exploreLife: "Explore Life",
            backToLineage: "Back to Lineage",
            sacredLineage: "Sacred Lineage",
            eraOfPresence: "Era of Presence",
            divineTrials: "Divine Trials",
            propheticLessons: "Prophetic Lessons",
            quranicReferences: "Quranic References"
        }
    },
    ibadah: {
        hero: {
            fajr: "Fajr — Dawn is Breaking",
            dhuhr: "Dhuhr — Under the Midday Sun",
            asr: "Asr — Afternoon Glow",
            maghrib: "Maghrib — Evening prayer awaits",
            isha: "Isha — Under the Night Sky"
        },
        prayers: {
            Fajr: "Fajr",
            Dhuhr: "Dhuhr",
            Asr: "Asr",
            Maghrib: "Maghrib",
            Isha: "Isha"
        },
        next: "Next",
        prayer: "Prayer"
    },
    prophets: {
        adam: { name: "Adam (AS)", lineage: "The First Human", timePeriod: "Beginning of Humanity" },
        idris: { name: "Idris (AS)", lineage: "Descendant of Adam", timePeriod: "Ancient Era" },
        nuh: { name: "Nuh (AS)", lineage: "10th generation after Adam", timePeriod: "Approx 3900-2900 BC" },
        hud: { name: "Hud (AS)", lineage: "Sent to tribe of 'Ad", timePeriod: "Ancient Era" },
        salih: { name: "Saleh (AS)", lineage: "Sent to Thamud", timePeriod: "Ancient Era" },
        ibrahim: { name: "Ibrahim (AS)", lineage: "Known as 'Father of Prophets'", timePeriod: "Approx 2000 BC" },
        lut: { name: "Lut (AS)", lineage: "Nephew of Ibrahim", timePeriod: "Approx 2000 BC" },
        ismail: { name: "Ismail (AS)", lineage: "Son of Ibrahim & Hajar", timePeriod: "Approx 1900 BC" },
        "is-haq": { name: "Ishaq (AS)", lineage: "Son of Ibrahim & Sarah", timePeriod: "Approx 1850 BC" },
        yaqub: { name: "Yaqub (AS)", lineage: "Son of Ishaq", timePeriod: "Approx 1800 BC" },
        yusuf: { name: "Yusuf (AS)", lineage: "Son of Yaqub", timePeriod: "Approx 1700 BC" },
        ayyub: { name: "Ayyub (AS)", lineage: "Descendant of Ibrahim", timePeriod: "Ancient Era" },
        shuayb: { name: "Shu'aib (AS)", lineage: "Sent to Madyan", timePeriod: "Ancient Era" },
        musa: { name: "Musa (AS)", lineage: "Descendant of Yaqub", timePeriod: "Approx 1300 BC" },
        harun: { name: "Harun (AS)", lineage: "Brother of Musa", timePeriod: "Approx 1300 BC" },
        "dhul-kifl": { name: "Dhul-Kifl (AS)", lineage: "Righteous judge after Musa", timePeriod: "Ancient Era" },
        dawud: { name: "Dawud (AS)", lineage: "Descendant of Yaqub", timePeriod: "Approx 1000 BC" },
        sulayman: { name: "Sulayman (AS)", lineage: "Son of Dawud", timePeriod: "Approx 950 BC" },
        ilyas: { name: "Ilyas (AS)", lineage: "Descendant of Harun", timePeriod: "Ancient Era" },
        "al-yasa": { name: "Al-Yasa (AS)", lineage: "Successor of Ilyas", timePeriod: "Ancient Era" },
        yunus: { name: "Yunus (AS)", lineage: "Descendant of Yaqub", timePeriod: "Approx 8th CC BC" },
        zakariya: { name: "Zakariya (AS)", lineage: "Descendant of Yaqub", timePeriod: "1st Century BC" },
        yahya: { name: "Yahya (AS)", lineage: "Son of Zakariya", timePeriod: "1st Century AD" },
        isa: { name: "Isa (AS)", lineage: "Son of Maryam", timePeriod: "1st Century AD" },
        muhammad: { name: "Muhammad (PBUH)", lineage: "Descendant of Ismail", timePeriod: "570 - 632 AD" }
    }
};

const hi = {
    home: {
        prophets: {
            title: "नवियों का वंशज (Lineage)",
            subtitle: "एक कालानुक्रमिक रूहानी सफर",
            nodeProphetLabel: "नबी (Prophet)",
            exploreLife: "जीवन जानें",
            backToLineage: "वंशज चार्ट पर लौटें",
            sacredLineage: "मुकद्दस वंशावली",
            eraOfPresence: "मौजूदगी का दौर",
            divineTrials: "ईश्वरीय आज़माइशें",
            propheticLessons: "नबियों की सीख",
            quranicReferences: "कुरान के हवाले"
        }
    },
    ibadah: {
        hero: {
            fajr: "फज्र — सुबह की दस्तक",
            dhuhr: "ज़ुहर — दोपहर की रोशनी में",
            asr: "अस्र — ढलती दोपहर की चमक",
            maghrib: "मगरिब — शाम की नमाज़ का वक़्त",
            isha: "ईशा — रात के आसमान तले"
        },
        prayers: {
            Fajr: "फज्र",
            Dhuhr: "ज़ुहर",
            Asr: "अस्र",
            Maghrib: "मगरिब",
            Isha: "ईशा"
        },
        next: "अगली",
        prayer: "नमाज़"
    },
    prophets: {
        adam: { name: "आदम (AS)", lineage: "पहले इंसान", timePeriod: "मानवता की शुरुआत" },
        idris: { name: "इदरीस (AS)", lineage: "आदम के वंशज", timePeriod: "प्राचीन काल" },
        nuh: { name: "नूह (AS)", lineage: "आदम के बाद 10वीं पीढ़ी", timePeriod: "लगभग 3900-2900 ईसा पूर्व" },
        hud: { name: "हूद (AS)", lineage: "आद कबीले की ओर भेजे गए", timePeriod: "प्राचीन काल" },
        salih: { name: "सालेह (AS)", lineage: "समूद की ओर भेजे गए", timePeriod: "प्राचीन काल" },
        ibrahim: { name: "इब्राहीम (AS)", lineage: "नबियों के पिता के रूप में प्रसिद्ध", timePeriod: "लगभग 2000 ईसा पूर्व" },
        lut: { name: "लूत (AS)", lineage: "इब्राहीम के भतीजे", timePeriod: "लगभग 2000 ईसा पूर्व" },
        ismail: { name: "इस्माईल (AS)", lineage: "इब्राहीम और हाजरा के पुत्र", timePeriod: "लगभग 1900 ईसा पूर्व" },
        "is-haq": { name: "इसहाक (AS)", lineage: "इब्राहीम और सारा के पुत्र", timePeriod: "लगभग 1850 ईसा पूर्व" },
        yaqub: { name: "याकूब (AS)", lineage: "इसहाक के पुत्र", timePeriod: "लगभग 1800 ईसा पूर्व" },
        yusuf: { name: "यूसुफ (AS)", lineage: "याकूब के पुत्र", timePeriod: "लगभग 1700 ईसा पूर्व" },
        ayyub: { name: "अय्यूब (AS)", lineage: "इब्राहीम के वंशज", timePeriod: "प्राचीन काल" },
        shuayb: { name: "शुआएब (AS)", lineage: "मदयन की ओर भेजे गए", timePeriod: "प्राचीन काल" },
        musa: { name: "मूसा (AS)", lineage: "याकूब के वंशज", timePeriod: "लगभग 1300 ईसा पूर्व" },
        harun: { name: "हारून (AS)", lineage: "मूसा के भाई", timePeriod: "लगभग 1300 ईसा पूर्व" },
        "dhul-kifl": { name: "जुल-किफ्ल (AS)", lineage: "मूसा के बाद न्याय करने वाले", timePeriod: "प्राचीन काल" },
        dawud: { name: "दाऊद (AS)", lineage: "याकूब के वंशज", timePeriod: "लगभग 1000 ईसा पूर्व" },
        sulayman: { name: "सुलेमान (AS)", lineage: "दाऊद के पुत्र", timePeriod: "लगभग 950 ईसा पूर्व" },
        ilyas: { name: "इल्यास (AS)", lineage: "हारून के वंशज", timePeriod: "प्राचीन काल" },
        "al-yasa": { name: "अल-यसा (AS)", lineage: "इल्यास के उत्तराधिकारी", timePeriod: "प्राचीन काल" },
        yunus: { name: "यूनुस (AS)", lineage: "याकूब के वंशज", timePeriod: "लगभग 8वीं सदी ईसा पूर्व" },
        zakariya: { name: "ज़करिया (AS)", lineage: "याकूब के वंशज", timePeriod: "पहली सदी ईसा पूर्व" },
        yahya: { name: "याह्या (AS)", lineage: "ज़करिया के पुत्र", timePeriod: "पहली सदी ईसवी" },
        isa: { name: "ईसा (AS)", lineage: "मरियम के पुत्र", timePeriod: "पहली सदी ईसवी" },
        muhammad: { name: "मुहम्मद (PBUH)", lineage: "इस्माईल के वंशज", timePeriod: "570 - 632 ईसवी" }
    }
};

const ur = {
    home: {
        prophets: {
            title: "انبیاء کا شجرہ نسب",
            subtitle: "ایک تاریخی روحانی سفر",
            nodeProphetLabel: "نبی",
            exploreLife: "زندگی جانیں",
            backToLineage: "شجرہ نسب پر واپس جائیں",
            sacredLineage: "مقدس شجرہ",
            eraOfPresence: "دورِ موجودگی",
            divineTrials: "الٰہی آزمائشیں",
            propheticLessons: "انبیاء کی تعلیمات",
            quranicReferences: "قرآنی حوالے"
        }
    },
    ibadah: {
        hero: {
            fajr: "فجر — صبح نمودار ہو رہی ہے",
            dhuhr: "ظہر — دوپہر کی دھوپ میں",
            asr: "عصر — ڈھلتی دوپہر کی چمک",
            maghrib: "مغرب — شام کی نماز کا وقت",
            isha: "عشاء — رات کے آسمان تلے"
        },
        prayers: {
            Fajr: "فجر",
            Dhuhr: "ظہر",
            Asr: "عصر",
            Maghrib: "مغرب",
            Isha: "عشاء"
        },
        next: "اگلی",
        prayer: "نماز"
    },
    prophets: {
        adam: { name: "آدم (AS)", lineage: "پہلا انسان", timePeriod: "انسانیت کا آغاز" },
        idris: { name: "ادریس (AS)", lineage: "آدم کی نسل", timePeriod: "قدیم دور" },
        nuh: { name: "نوح (AS)", lineage: "آدم کے بعد دسویں پشت", timePeriod: "تقریبا 3900-2900 قبل مسیح" },
        hud: { name: "ہود (AS)", lineage: "قوم عاد کی طرف بھیجے گئے", timePeriod: "قدیم دور" },
        salih: { name: "صالح (AS)", lineage: "قوم ثمود کی طرف بھیجے گئے", timePeriod: "قدیم دور" },
        ibrahim: { name: "ابراہیم (AS)", lineage: "انبیاء کے والد", timePeriod: "تقریبا 2000 قبل مسیح" },
        lut: { name: "لوط (AS)", lineage: "ابراہیم کے بھتیجے", timePeriod: "تقریبا 2000 قبل مسیح" },
        ismail: { name: "اسماعیل (AS)", lineage: "ابراہیم اور ہاجرہ کے بیٹے", timePeriod: "تقریبا 1900 قبل مسیح" },
        "is-haq": { name: "اسحاق (AS)", lineage: "ابراہیم اور سارہ کے بیٹے", timePeriod: "تقریبا 1850 قبل مسیح" },
        yaqub: { name: "یعقوب (AS)", lineage: "اسحاق کے بیٹے", timePeriod: "تقریبا 1800 قبل مسیح" },
        yusuf: { name: "یوسف (AS)", lineage: "یعقوب کے بیٹے", timePeriod: "تقریبا 1700 قبل مسیح" },
        ayyub: { name: "ایوب (AS)", lineage: "ابراہیم کی نسل", timePeriod: "قدیم دور" },
        shuayb: { name: "شعیب (AS)", lineage: "مدین کی طرف بھیجے گئے", timePeriod: "قدیم دور" },
        musa: { name: "موسیٰ (AS)", lineage: "یعقوب کی نسل", timePeriod: "تقریبا 1300 قبل مسیح" },
        harun: { name: "ہارون (AS)", lineage: "موسیٰ کے بھائی", timePeriod: "تقریبا 1300 قبل مسیح" },
        "dhul-kifl": { name: "ذوالکفل (AS)", lineage: "موسیٰ کے بعد فیصلے کرنے والے", timePeriod: "قدیم دور" },
        dawud: { name: "داؤد (AS)", lineage: "یعقوب کی نسل", timePeriod: "تقریبا 1000 قبل مسیح" },
        sulayman: { name: "سلیمان (AS)", lineage: "داؤد کے بیٹے", timePeriod: "تقریبا 950 قبل مسیح" },
        ilyas: { name: "الیاس (AS)", lineage: "ہارون کی نسل", timePeriod: "قدیم دور" },
        "al-yasa": { name: "الیسع (AS)", lineage: "الیاس کے جانشین", timePeriod: "قدیم دور" },
        yunus: { name: "یونس (AS)", lineage: "یعقوب کی نسل", timePeriod: "تقریبا 8ویں صدی قبل مسیح" },
        zakariya: { name: "زکریا (AS)", lineage: "یعقوب کی نسل", timePeriod: "پہلی صدی قبل مسیح" },
        yahya: { name: "یحییٰ (AS)", lineage: "زکریا کے بیٹے", timePeriod: "پہلی صدی عیسوی" },
        isa: { name: "عیسیٰ (AS)", lineage: "مریم کے بیٹے", timePeriod: "پہلی صدی عیسوی" },
        muhammad: { name: "محمد (PBUH)", lineage: "اسماعیل کی نسل", timePeriod: "570 - 632 عیسوی" }
    }
};

const bn = {
    home: {
        prophets: {
            title: "নবীদের বংশতালিকা",
            subtitle: "একটি কালানুক্রমিক আধ্যাত্মিক যাত্রা",
            nodeProphetLabel: "নবী",
            exploreLife: "জীবন অন্বেষণ করুন",
            backToLineage: "বংশতালিকায় ফিরে যান",
            sacredLineage: "পবিত্র বংশতালিকা",
            eraOfPresence: "উপস্থিতির যুগ",
            divineTrials: "ঐশ্বরিক পরীক্ষা",
            propheticLessons: "নবীদের শিক্ষা",
            quranicReferences: "কুরআনের সূত্র"
        }
    },
    ibadah: {
        hero: {
            fajr: "ফজর — ভোরের সূচনা",
            dhuhr: "যোহর — দুপুরের রোদে",
            asr: "আসর — বিকেলের আভা",
            maghrib: "মাগরিব — সন্ধ্যার নামাযের অপেক্ষায়",
            isha: "এশা — রাতের আকাশের নিচে"
        },
        prayers: {
            Fajr: "ফজর",
            Dhuhr: "যোহর",
            Asr: "আসর",
            Maghrib: "মাগরিব",
            Isha: "এশা"
        },
        next: "পরবর্তী",
        prayer: "নামায"
    },
    prophets: {
        adam: { name: "আদম (আঃ)", lineage: "প্রথম মানব", timePeriod: "মানবতার শুরু" },
        idris: { name: "ইদ্রিস (আঃ)", lineage: "আদমের বংশধর", timePeriod: "প্রাচীন যুগ" },
        nuh: { name: "নূহ (আঃ)", lineage: "আদমের পর ১০ম প্রজন্ম", timePeriod: "প্রায় ৩৯০০-২৯০০ খ্রিস্টপূর্বাব্দ" },
        hud: { name: "হুদ (আঃ)", lineage: "আদ জাতির প্রতি প্রেরিত", timePeriod: "প্রাচীন যুগ" },
        salih: { name: "সালেহ (আঃ)", lineage: "সামুদ জাতির প্রতি প্রেরিত", timePeriod: "প্রাচীন যুগ" },
        ibrahim: { name: "ইবরাহীম (আঃ)", lineage: "নবীদের পিতা হিসেবে পরিচিত", timePeriod: "প্রায় ২০০০ খ্রিস্টপূর্বাব্দ" },
        lut: { name: "লুত (আঃ)", lineage: "ইবরাহীমের ভাতিজা", timePeriod: "প্রায় ২০০০ খ্রিস্টপূর্বাব্দ" },
        ismail: { name: "ইসমাইল (আঃ)", lineage: "ইবরাহীম ও হাজারার পুত্র", timePeriod: "প্রায় ১৯০০ খ্রিস্টপূর্বাব্দ" },
        "is-haq": { name: "ইসহাক (আঃ)", lineage: "ইবরাহীম ও সারার পুত্র", timePeriod: "প্রায় ১৮৫০ খ্রিস্টপূর্বাব্দ" },
        yaqub: { name: "ইয়াকুব (আঃ)", lineage: "ইসহাকের পুত্র", timePeriod: "প্রায় ১৮০০ খ্রিস্টপূর্বাব্দ" },
        yusuf: { name: "ইউসুফ (আঃ)", lineage: "ইয়াকুবের পুত্র", timePeriod: "প্রায় ১৭০০ খ্রিস্টপূর্বাব্দ" },
        ayyub: { name: "আইয়ুব (আঃ)", lineage: "ইবরাহীমের বংশধর", timePeriod: "প্রাচীন যুগ" },
        shuayb: { name: "শোয়াইব (আঃ)", lineage: "মাদইয়ানের প্রতি প্রেরিত", timePeriod: "প্রাচীন যুগ" },
        musa: { name: "মুসা (আঃ)", lineage: "ইয়াকুবের বংশধর", timePeriod: "প্রায় ১৩০০ খ্রিস্টপূর্বাব্দ" },
        harun: { name: "হারুন (আঃ)", lineage: "মুসার ভাই", timePeriod: "প্রায় ১৩০০ খ্রিস্টপূর্বাব্দ" },
        "dhul-kifl": { name: "যুল-কিফল (আঃ)", lineage: "উত্তম বিচারক", timePeriod: "প্রাচীন যুগ" },
        dawud: { name: "দাউদ (আঃ)", lineage: "ইয়াকুবের বংশধর", timePeriod: "প্রায় ১০০০ খ্রিস্টপূর্বাব্দ" },
        sulayman: { name: "সুলাইমান (আঃ)", lineage: "দাউদের পুত্র", timePeriod: "প্রায় ৯৫০ খ্রিস্টপূর্বাব্দ" },
        ilyas: { name: "ইলিয়াস (আঃ)", lineage: "হারুনের বংশধর", timePeriod: "প্রাচীন যুগ" },
        "al-yasa": { name: "আল-ইয়াসা (আঃ)", lineage: "ইলিয়াসের উত্তরসূরি", timePeriod: "প্রাচীন যুগ" },
        yunus: { name: "ইউনূস (আঃ)", lineage: "ইয়াকুবের বংশধর", timePeriod: "প্রায় ৮ম শতাব্দী খ্রিস্টপূর্বাব্দ" },
        zakariya: { name: "জাকারিয়া (আঃ)", lineage: "ইয়াকুবের বংশধর", timePeriod: "১ম শতাব্দী খ্রিস্টপূর্বাব্দ" },
        yahya: { name: "ইয়াহিয়া (আঃ)", lineage: "জাকারিয়ার পুত্র", timePeriod: "১ম শতাব্দী খ্রিস্টাব্দ" },
        isa: { name: "ঈসা (আঃ)", lineage: "মারিয়ামের পুত্র", timePeriod: "১ম শতাব্দী খ্রিস্টাব্দ" },
        muhammad: { name: "মুহাম্মদ (সাঃ)", lineage: "ইসমাইলের বংশধর", timePeriod: "৫৭০ - ৬৩২ খ্রিস্টাব্দ" }
    }
};

const ml = {
    home: {
        prophets: {
            title: "പ്രവാചക പരമ്പര",
            subtitle: "കാലാനുക്രമത്തിലുള്ള ആത്മീയ യാത്ര",
            nodeProphetLabel: "പ്രവാചകൻ",
            exploreLife: "ജീവിതം പര്യവേക്ഷണം ചെയ്യുക",
            backToLineage: "പരമ്പരയിലേക്ക് മടങ്ങുക",
            sacredLineage: "വിശുദ്ധ പരമ്പര",
            eraOfPresence: "ജീവിച്ചിരുന്ന കാലഘട്ടം",
            divineTrials: "ദൈവിക പരീക്ഷണങ്ങൾ",
            propheticLessons: "പ്രവാചകരുടെ പാഠങ്ങൾ",
            quranicReferences: "ഖുർആനിക പരാമർശങ്ങൾ"
        }
    },
    ibadah: {
        hero: {
            fajr: "ഫജർ — പ്രഭാതം വിരിയുന്നു",
            dhuhr: "ളുഹർ — മധ്യാഹ്ന സൂര്യന് കീഴിൽ",
            asr: "അസർ — സായാഹ്ന വെളിച്ചം",
            maghrib: "മഗ്‌രിബ് — സായാഹ്ന പ്രാർത്ഥനയ്ക്കായി കാത്തിരിക്കുന്നു",
            isha: "ഇഷാ — രാത്രി ആകാശത്തിന് കീഴിൽ"
        },
        prayers: {
            Fajr: "ഫജർ",
            Dhuhr: "ളുഹർ",
            Asr: "അസർ",
            Maghrib: "മഗ്‌രിബ്",
            Isha: "ഇഷാ"
        },
        next: "അടുത്തത്",
        prayer: "നമസ്കാരം"
    },
    prophets: {
        adam: { name: "ആദം (അ)", lineage: "ആദ്യ മനുഷ്യൻ", timePeriod: "മനുഷ്യ രാശിയുടെ തുടക്കം" },
        idris: { name: "ഇദ്‌രീസ് (അ)", lineage: "ആദമിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "പ്രാചീന കാലം" },
        nuh: { name: "നൂഹ് (അ)", lineage: "ആദമിന് ശേഷമുള്ള 10-ാം തലമുറ", timePeriod: "ഏകദേശം 3900-2900 ബിസി" },
        hud: { name: "ഹൂദ് (അ)", lineage: "ആദ് സമുദായത്തിലേക്ക് അയക്കപ്പെട്ടവർ", timePeriod: "പ്രാചീന കാലം" },
        salih: { name: "സ്വാലിഹ് (അ)", lineage: "ഥമൂദ് സമുദായത്തിലേക്ക് അയക്കപ്പെട്ടവർ", timePeriod: "പ്രാചീന കാലം" },
        ibrahim: { name: "ഇബ്രാഹിം (അ)", lineage: "പ്രവാചകരുടെ പിതാവ്", timePeriod: "ഏകദേശം 2000 ബിസി" },
        lut: { name: "ലൂത്ത് (അ)", lineage: "ഇബ്രാഹിമിന്റെ സഹോദരപുത്രൻ", timePeriod: "ഏകദേശം 2000 ബിസി" },
        ismail: { name: "ഇസ്മാഈൽ (അ)", lineage: "ഇബ്രാഹിമിന്റെയും ഹാജറയുടെയും മകൻ", timePeriod: "ഏകദേശം 1900 ബിസി" },
        "is-haq": { name: "ഇസ്ഹാഖ് (അ)", lineage: "ഇബ്രാഹിമിന്റെയും സാറയുടെയും മകൻ", timePeriod: "ഏകദേശം 1850 ബിസി" },
        yaqub: { name: "യഅ്ഖൂബ് (അ)", lineage: "ഇസ്ഹാഖിന്റെ മകൻ", timePeriod: "ഏകദേശം 1800 ബിസി" },
        yusuf: { name: "യൂസുഫ് (അ)", lineage: "യഅ്ഖൂബിന്റെ മകൻ", timePeriod: "ഏകദേശം 1700 ബിസി" },
        ayyub: { name: "അയ്യൂബ് (അ)", lineage: "ഇബ്രാഹിമിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "പ്രാചീന കാലം" },
        shuayb: { name: "ശുഐബ് (അ)", lineage: "മദ്‌യനിലേക്ക് അയക്കപ്പെട്ടവർ", timePeriod: "പ്രാചീന കാലം" },
        musa: { name: "മൂസാ (അ)", lineage: "യഅ്ഖൂബിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "ഏകദേശം 1300 ബിസി" },
        harun: { name: "ഹാറൂൻ (അ)", lineage: "മൂസായുടെ സഹോദരൻ", timePeriod: "ഏകദേശം 1300 ബിസി" },
        "dhul-kifl": { name: "ദുൽ-കിഫ്ല് (അ)", lineage: "മൂസായ്ക്ക് ശേഷമുള്ള നീതിമാനായ വിധികർത്താവ്", timePeriod: "പ്രാചീന കാലം" },
        dawud: { name: "ദാവൂദ് (അ)", lineage: "യഅ്ഖൂബിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "ഏകദേശം 1000 ബിസി" },
        sulayman: { name: "സുലൈമാൻ (അ)", lineage: "ദാവൂദിന്റെ മകൻ", timePeriod: "ഏകദേശം 950 ബിസി" },
        ilyas: { name: "ഇൽയാസ് (അ)", lineage: "ഹാറൂനിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "പ്രാചീന കാലം" },
        "al-yasa": { name: "അൽ-യസഅ് (അ)", lineage: "ഇൽയാസിന്റെ പിൻഗാമി", timePeriod: "പ്രാചീന കാലം" },
        yunus: { name: "യൂനുസ് (അ)", lineage: "യഅ്ഖൂബിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "ഏകദേശം ബിസി 8-ാം നൂറ്റാണ്ട്" },
        zakariya: { name: "സകരിയ്യ (അ)", lineage: "യഅ്ഖൂബിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "ഒന്നാം നൂറ്റാണ്ട് ബിസി" },
        yahya: { name: "യഹ്‌യ (അ)", lineage: "സകരിയ്യായുടെ മകൻ", timePeriod: "ഒന്നാം നൂറ്റാണ്ട് എഡി" },
        isa: { name: "ഈസാ (അ)", lineage: "മർയമിന്റെ മകൻ", timePeriod: "ഒന്നാം നൂറ്റാണ്ട് എഡി" },
        muhammad: { name: "മുഹമ്മദ് (സ)", lineage: "ഇസ്മാഈലിന്റെ പരമ്പരയിൽ പെട്ടവർ", timePeriod: "570 - 632 എഡി" }
    }
};

const map = { en, hi, ur, bn, ml };

Object.keys(map).forEach(lang => {
    const filePath = path.join(localesPath, lang, 'common.json');
    if (fs.existsSync(filePath)) {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!fileData.home) fileData.home = {};
        fileData.home.prophets = { ...map[lang].home.prophets };

        if (!fileData.ibadah) fileData.ibadah = {};
        if (!fileData.ibadah.hero) fileData.ibadah.hero = {};
        if (!fileData.ibadah.prayers) fileData.ibadah.prayers = {};
        fileData.ibadah.hero = { ...fileData.ibadah.hero, ...map[lang].ibadah.hero };
        fileData.ibadah.prayers = { ...fileData.ibadah.prayers, ...map[lang].ibadah.prayers };
        fileData.ibadah.next = map[lang].ibadah.next;
        fileData.ibadah.prayer = map[lang].ibadah.prayer;

        if (!fileData.prophets) fileData.prophets = {};
        fileData.prophets = { ...map[lang].prophets };

        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
        console.log(`Updated ${lang} common.json`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
