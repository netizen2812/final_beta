const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'frontend/public/locales');

const data = {
    en: {
        ranks: {
            1: "Little Learner", 2: "Quran Explorer", 3: "Story Seeker", 4: "Miracle Learner", 5: "Wise Thinker",
            6: "Ka'bah Guardian", 7: "Anbiya Champion", 8: "Quranic Scholar", 9: "Prophet's Follower", 10: "Ramadan Champion"
        },
        lessons: {
            1: { title: "Welcome to Ramadan", subtitle: "The Month of the Quran", description: "Discover why Ramadan is called the 'Month of the Quran' and learn about the special blessings of this month." },
            2: { title: "The Wise Little Ant", subtitle: "Lessons from Surah An-Naml", description: "Explore the story of Prophet Sulayman (AS) and the ant colony, learning about teamwork and gratitude." },
            3: { title: "The Crow That Taught Humanity", subtitle: "Lessons from Surah Al-Ma'idah", description: "Learn how a crow taught the first humans a valuable lesson about burial and respect for life." },
            4: { title: "Five Miracles of Isa (AS)", subtitle: "Prophetic Powers from Allah", description: "Discover the five extraordinary miracles granted to Prophet Isa (AS) to help and guide his people." },
            5: { title: "The Shirt of Yusuf (AS)", subtitle: "Blessings of the Pious", description: "A beautiful story of patience, hope, and the miraculous healing of Prophet Ya'qub's eyesight." },
            6: { title: "Think Before You React", subtitle: "Lessons from Surah Al-Hujurat", description: "Learn the importance of verifying news and not spreading rumors, a key social skill in Islam." },
            7: { title: "The Honoured Family", subtitle: "Ahlul Bayt in the Quran", description: "Discover the blessed household of Prophet Muhammad ﷺ and why Allah honored them in the Quran." },
            8: { title: "The Army of Birds", subtitle: "Allah Protects the Ka'bah", description: "The dramatic story of Abraha's elephant army and how Allah sent birds to protect the Ka'bah." },
            9: { title: "Jinns Are Real!", subtitle: "Unseen Creation in the Quran", description: "Learn about the Jinn, a creation made of smokeless fire, and how a Muslim should not fear them excessively." },
            10: { title: "The Moon Split in Two", subtitle: "Greatest Miracle of Prophet ﷺ", description: "Discover the breathtaking miracle of Shaqq-ul-Qamar, when the Prophet ﷺ split the moon in half." }
        }
    },
    hi: {
        ranks: {
            1: "छोटा तालिब-ए-इल्म (लर्नर)", 2: "कुरान का खोजकर्ता", 3: "कहानी का मुतलाशी", 4: "मोज़ज़ा सीखने वाला", 5: "अक्लमंद विचारक",
            6: "काबा का मुहाफिज़", 7: "अंबिया का चैंपियन", 8: "कुरानी आलिम", 9: "नबी ﷺ का पैरोकार", 10: "रमज़ान चैंपियन"
        },
        lessons: {
            1: { title: "रमज़ान में खुशामदीद", subtitle: "कुरान का महीना", description: "जानें कि रमज़ान को 'कुरान का महीना' क्यों कहा जाता है और इस महीने की खास बरकतों को समझें।" },
            2: { title: "समझदार नन्ही चींटी", subtitle: "सूरह अन-नम्ल से सबक", description: "पैगंबर सुलेमान (AS) और चींटियों की बस्ती की कहानी एक्सप्लोर करें, टीमवर्क और शुक्रगुजारी के बारे में सीखें।" },
            3: { title: "कौवा जिसने इंसानियत को सिखाया", subtitle: "सूरह अल-माइदा से सबक", description: "जानें कि कैसे एक कौवे ने पहले इंसानों को दफनाने और जीवन के सम्मान के बारे में एक मूल्यवान सबक सिखाया।" },
            4: { title: "ईसा (AS) के पाँच मोज़ज़े (चमत्कार)", subtitle: "अल्लाह से नबियों की ताकत", description: "पैगंबर ईसा (AS) को उनके लोगों का मार्गदर्शन करने के लिए दिए गए पाँच असाधारण मोज़ज़ों के बारे में जानें।" },
            5: { title: "यूसुफ (AS) का कुरता", subtitle: "नेक लोगों की बरकतें", description: "सब्र, उम्मीद और पैगंबर याकूब की आँखों की रोशनी के चमत्कारी इलाज की एक खूबसूरत कहानी।" },
            6: { title: "प्रतिक्रिया देने से पहले सोचें", subtitle: "सूरह अल-हुजरात से सबक", description: "खबरों की सच्चाई जाँचने और अफवाहें न फैलाने के महत्व को जानें, जो इस्लाम में एक अहम सामाजिक कौशल है।" },
            7: { title: "मुअज्ज़ज़ परिवार", subtitle: "कुरान में अहलूल बैत", description: "पैगंबर मुहम्मद ﷺ के मुबारक घर वालों को जानें और अल्लाह ने कुरान में उन्हें क्यों सम्मानित किया।" },
            8: { title: "पक्षियों की फौज", subtitle: "अल्लाह काबा की हिफाज़त करता है", description: "अबरहा की हाथियों की फौज और अल्लाह ने काबा की हिफाज़त के लिए पक्षियों को कैसे भेजा, इसकी नाटकीय कहानी।" },
            9: { title: "जिन्न हकीकत हैं!", subtitle: "कुरान में अनदेखी मखलूक", description: "जिन्नों के बारे में जानें, जो धुएँ रहित आग से बने हैं, और एक मुसलमान को उनसे अत्यधिक नहीं डरना चाहिए।" },
            10: { title: "चाँद के दो टुकड़े", subtitle: "पैगंबर ﷺ का सबसे बड़ा मोज़ज़ा", description: "शक्कुल कमर के लुभावने मोज़ज़े को जानें, जब पैगंबर ﷺ ने चाँद के दो टुकड़े किए थे।" }
        }
    },
    ur: {
        ranks: {
            1: "چھوٹا طالب علم", 2: "قرآن کا کھوجی", 3: "کہانی کا متلاشی", 4: "معجزات سیکھنے والا", 5: "عقلمند سوچنے والا",
            6: "کعبہ کا محافظ", 7: "انبیاء کا چیمپیئن", 8: "قرآنی عالم", 9: "نبی ﷺ کا پیروکار", 10: "رمضان چیمپیئن"
        },
        lessons: {
            1: { title: "رمضان میں خوش آمدید", subtitle: "قرآن کا مہینہ", description: "جانیں کہ رمضان کو 'قرآن کا مہینہ' کیوں کہا جاتا ہے اور اس مہینے کی خاص برکات کے بارے میں سیکھیں۔" },
            2: { title: "عقلمند ننھی چیونٹی", subtitle: "سورۃ النمل سے سبق", description: "حضرت سلیمان (علیہ السلام) اور چیونٹیوں کے غول کا قصہ دریافت کریں، ٹیم ورک اور شکر گزاری سیکھیں۔" },
            3: { title: "کوا جس نے انسانیت کو سکھایا", subtitle: "سورۃ المائدہ سے سبق", description: "جانیں کہ ایک کوے نے کس طرح پہلے انسانوں کو تدفین اور زندگی کے احترام کا ایک قیمتی سبق سکھایا۔" },
            4: { title: "عیسیٰ (علیہ السلام) کے پانچ معجزات", subtitle: "اللہ کی طرف سے نبوی طاقتیں", description: "حضرت عیسیٰ (علیہ السلام) کو اپنی قوم کی رہنمائی کے لئے دیئے گئے پانچ غیر معمولی معجزات کے بارے میں جانیں۔" },
            5: { title: "یوسف (علیہ السلام) کی قمیص", subtitle: "نیک لوگوں کی برکات", description: "صبر، امید اور حضرت یعقوب کی بینائی کے معجزاتی علاج کی ایک خوبصورت کہانی۔" },
            6: { title: "ردعمل ظاہر کرنے سے پہلے سوچیں", subtitle: "سورۃ الحجرات سے سبق", description: "خبروں کی تصدیق کرنے اور افواہیں نہ پھیلانے کی اہمیت سیکھیں، جو اسلام میں ایک اہم سماجی مہارت ہے۔" },
            7: { title: "معزز خاندان", subtitle: "قرآن میں اہل بیت", description: "پیغمبر محمد ﷺ کے مبارک گھرانے کے بارے میں جانیں اور اللہ نے انہیں قرآن میں کیوں عزت بخشی۔" },
            8: { title: "پرندوں کی فوج", subtitle: "اللہ کعبہ کی حفاظت کرتا ہے", description: "ابرہہ کی ہاتھیوں کی فوج اور اللہ نے کعبہ کی حفاظت کے لئے پرندوں کو کیسے بھیجا، اس کی ڈرامائی کہانی۔" },
            9: { title: "جن حقیقت ہیں!", subtitle: "قرآن میں ان دیکھی مخلوق", description: "جنات کے بارے میں جانیں، جو بغیر دھوئیں کی آگ سے بنے ہیں، اور ایک مسلمان کو ان سے حد سے زیادہ خوفزدہ نہیں ہونا چاہیے۔" },
            10: { title: "چاند کے دو ٹکڑے", subtitle: "پیغمبر ﷺ کا سب سے بڑا معجزہ", description: "شق القمر کے حیرت انگیز معجزے کے بارے میں جانیں جب پیغمبر ﷺ نے چاند کے دو ٹکڑے کیے۔" }
        }
    },
    bn: {
        ranks: {
            1: "ছোট শিক্ষার্থী", 2: "কুরআন অন্বেষণকারী", 3: "গল্প সন্ধানী", 4: "মুজিযা শিক্ষার্থী", 5: "জ্ঞানী চিন্তাবিদ",
            6: "কাবার রক্ষক", 7: "নবীদের চ্যাম্পিয়ন", 8: "কুরআনের পণ্ডিত", 9: "নবী ﷺ এর অনুসারী", 10: "রমজান চ্যাম্পিয়ন"
        },
        lessons: {
            1: { title: "রমজানে স্বাগতম", subtitle: "কুরআনের মাস", description: "রমজানকে কেন 'কুরআনের মাস' বলা হয় তা জানুন এবং এই মাসের বিশেষ আশীর্বাদ সম্পর্কে শিখুন।" },
            2: { title: "জ্ঞানী ছোট্ট পিঁপড়া", subtitle: "সূরা আন-নামল থেকে শিক্ষা", description: "নবী সুলাইমান (আঃ) এবং পিঁপড়ার কলোনির গল্পটি অন্বেষণ করুন, দলগত কাজ এবং কৃতজ্ঞতা সম্পর্কে শিখুন।" },
            3: { title: "যে কাক মানবতাকে শিখিয়েছিল", subtitle: "সূরা আল-মায়েদা থেকে শিক্ষা", description: "জানুন কীভাবে একটি কাক প্রথম মানুষদের কবর দেওয়া এবং জীবনের সম্মান সম্পর্কে একটি মূল্যবান শিক্ষা দিয়েছিল।" },
            4: { title: "ঈসা (আঃ) এর পাঁচটি মুজিযা", subtitle: "আল্লাহর পক্ষ থেকে নবীদের ক্ষমতা", description: "নবী ঈসা (আঃ) কে তার জাতির পথপ্রদর্শনের জন্য দেওয়া পাঁচটি অসাধারণ মুজিযা সম্পর্কে জানুন।" },
            5: { title: "ইউসুফ (আঃ) এর জামা", subtitle: "নেককারদের বরকত", description: "ধৈর্য, আশা এবং নবী ইয়াকুবের দৃষ্টিশক্তি অলৌকিকভাবে ফিরে পাওয়ার একটি সুন্দর গল্প।" },
            6: { title: "প্রতিক্রিয়া দেখানোর আগে ভাবুন", subtitle: "সূরা আল-হুজুরাত থেকে শিক্ষা", description: "খবর যাচাই করা এবং গুজব না ছড়ানোর গুরুত্ব শিখুন, যা ইসলামে একটি মূল সামাজিক দক্ষতা।" },
            7: { title: "সম্মানিত পরিবার", subtitle: "কুরআনে আহলুল বাইত", description: "নবী মুহাম্মদ ﷺ এর মোবারক পরিবার এবং কেন আল্লাহ কুরআনে তাদের সম্মানিত করেছেন তা আবিষ্কার করুন।" },
            8: { title: "পাখির বাহিনী", subtitle: "আল্লাহ কাবা রক্ষা করেন", description: "আবরাহার হাতির বাহিনী এবং আল্লাহ কাবার রক্ষায় কীভাবে পাখি পাঠিয়েছিলেন তার নাটকীয় গল্প।" },
            9: { title: "জিন বাস্তব!", subtitle: "কুরআনে অদেখা সৃষ্টি", description: "জিন সম্পর্কে জানুন, যা ধোঁয়াহীন আগুন থেকে সৃষ্ট, এবং কেন একজন মুসলমানের তাদের অতিরিক্ত ভয় করা উচিত নয়।" },
            10: { title: "চাঁদ দ্বিখণ্ডিত", subtitle: "নবী ﷺ এর সবচেয়ে বড় মুজিযা", description: "শাক্কুল কামারের সেই শ্বাসরুদ্ধকর মুজিযা আবিষ্কার করুন, যখন নবী ﷺ চাঁদকে দুই খণ্ডে বিভক্ত করেছিলেন।" }
        }
    },
    ml: {
        ranks: {
            1: "ചെറിയ പഠിതാവ്", 2: "ഖുർആൻ പര്യവേക്ഷകൻ", 3: "കഥ അന്വേഷി", 4: "മുഅ്ജിസത്തുകൾ പഠിക്കുന്നവൻ", 5: "ചിന്തകൻ",
            6: "കഅ്ബയുടെ കാവൽക്കാരൻ", 7: "നബിമാരുടെ ചാമ്പ്യൻ", 8: "ഖുർആൻ പണ്ഡിതൻ", 9: "നബി ﷺ യുടെ അനുയായി", 10: "റമദാൻ ചാമ്പ്യൻ"
        },
        lessons: {
            1: { title: "റമദാനിലേക്ക് സ്വാഗതം", subtitle: "ഖുർആന്റെ മാസം", description: "റമദാനിനെ എന്തുകൊണ്ട് 'ഖുർആന്റെ മാസം' എന്ന് വിളിക്കുന്നുവെന്ന് മനസ്സിലാക്കുകയും ഈ മാസത്തെ പ്രത്യേക അനുഗ്രഹങ്ങളെക്കുറിച്ച് പഠിക്കുകയും ചെയ്യുക." },
            2: { title: "ബുദ്ധിമാനായ ചെറിയ ഉറുമ്പ്", subtitle: "സൂറത്ത് അന്നമ്ലിൽ നിന്നുള്ള പാഠങ്ങൾ", description: "നബി സുലൈമാന്റെയും (അ) ഉറുമ്പുകളുടെയും കഥ പര്യവേക്ഷണം ചെയ്യുക, കൂട്ടായ പ്രവർത്തനത്തെയും നന്ദിയെയും കുറിച്ച് പഠിക്കുക." },
            3: { title: "മനുഷ്യരാശിയെ പഠിപ്പിച്ച കാക്ക", subtitle: "സൂറത്തുൽ മാഇദയിൽ നിന്നുള്ള പാഠങ്ങൾ", description: "മൃതദേഹം മറവ് ചെയ്യുന്നതിനെക്കുറിച്ചും ജീവന്റെ ആദരവിനെക്കുറിച്ചും ഒരു കാക്ക എങ്ങനെ ആദ്യത്തെ മനുഷ്യരെ വിലപ്പെട്ട ഒരു പാഠം പഠിപ്പിച്ചു എന്നറിയുക." },
            4: { title: "ഈസാ നബിയുടെ (അ) അഞ്ച് മുഅ്ജിസത്തുകൾ", subtitle: "അല്ലാഹുവിൽ നിന്നുള്ള പ്രവാചക ശക്തികൾ", description: "തന്റെ ജനതയെ നയിക്കാൻ ഈസാ നബിക്ക് (അ) നൽകപ്പെട്ട അഞ്ച് അസാധാരണ മുഅ്ജിസത്തുകളെക്കുറിച്ച് മനസ്സിലാക്കുക." },
            5: { title: "യൂസുഫ് നബിയുടെ (അ) കുപ്പായം", subtitle: "സദ്‌വൃത്തരുടെ അനുഗ്രഹങ്ങൾ", description: "ക്ഷമയുടെയും പ്രതീക്ഷയുടെയും യഅ്ഖൂബ് നബിയുടെ കാഴ്ചശക്തി അത്ഭുതകരമായി തിരിച്ചുകിട്ടിയതിന്റെയും മനോഹരമായ ഒരു കഥ." },
            6: { title: "പ്രതികരിക്കുന്നതിന് മുമ്പ് ചിന്തിക്കുക", subtitle: "സൂറത്തുൽ ഹുജുറാത്തിൽ നിന്നുള്ള പാഠങ്ങൾ", description: "വാർത്തകൾ പരിശോധിക്കുന്നതിന്റെയും അഭ്യൂഹങ്ങൾ പ്രചരിപ്പിക്കാതിരിക്കുന്നതിന്റെയും പ്രാധാന്യം പഠിക്കുക, ഇത് ഇസ്ലാമിലെ ഒരു പ്രധാന സാമൂഹിക മര്യാദയാണ്." },
            7: { title: "ആദരിക്കപ്പെട്ട കുടുംബം", subtitle: "ഖുർആനിൽ അഹ്‌ലുൽ ബൈത്ത്", description: "നബി മുഹമ്മദ് (സ) യുടെ അനുഗ്രഹീത കുടുംബത്തെക്കുറിച്ചും ഖുർആനിൽ അല്ലാഹു അവരെ എന്തിനാണ് ആദരിച്ചതെന്നും മനസ്സിലാക്കുക." },
            8: { title: "പക്ഷികളുടെ സൈന്യം", subtitle: "അല്ലാഹു കഅ്ബയെ സംരക്ഷിക്കുന്നു", description: "അബ്റഹയുടെ ആനപ്പടയുടെയും കഅ്ബയെ സംരക്ഷിക്കാൻ അല്ലാഹു പക്ഷികളെ അയച്ചതിന്റെയും നാടകീയമായ കഥ." },
            9: { title: "ജിന്നുകൾ യാഥാർത്ഥ്യമാണ്!", subtitle: "ഖുർആനിലെ അദൃശ്യ സൃഷ്ടികൾ", description: "പുകയില്ലാത്ത തീയിൽ നിന്ന് സൃഷ്ടിക്കപ്പെട്ട ജിന്നുകളെക്കുറിച്ചും ഒരു മുസ്ലിം അവരെ അമിതമായി ഭയപ്പെടേണ്ടതില്ലാത്തത് എന്തുകൊണ്ടാണെന്നും പഠിക്കുക." },
            10: { title: "ചന്ദ്രൻ പിളർന്നു", subtitle: "നബി ﷺ യുടെ ഏറ്റവും വലിയ മുഅ്ജിസത്ത്", description: "നബി ﷺ ചന്ദ്രനെ രണ്ടായി പിളർത്തിയ 'ശഖ്ഖുൽ ഖമർ' എന്ന വിസ്മയകരമായ മുഅ്ജിസത്ത് മനസ്സിലാക്കുക." }
        }
    }
};

Object.keys(data).forEach(lang => {
    const filePath = path.join(localesPath, lang, 'common.json');
    if (fs.existsSync(filePath)) {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!fileData.tarbiyah.ranks) fileData.tarbiyah.ranks = {};
        if (!fileData.tarbiyah.lessons) fileData.tarbiyah.lessons = {};

        Object.assign(fileData.tarbiyah.ranks, data[lang].ranks);
        Object.assign(fileData.tarbiyah.lessons, data[lang].lessons);

        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
        console.log(`Updated ${lang} common.json`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
