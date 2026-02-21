export interface ProphetNode {
    id: string;
    name: string;
    lineage?: string;
    timePeriod?: string;
    trials?: string[];
    lessons?: string[];
    references?: string[];
    connections: string[]; // IDs of connected prophets
    x: number; // for tree visualization
    y: number;
}

export const PROPHETS_DATA: ProphetNode[] = [
    {
        id: 'adam',
        name: 'Adam (AS)',
        lineage: 'The First Human',
        timePeriod: 'Beginning of Humanity',
        trials: ['Temptation by Satan', 'Expulsion from Paradise'],
        lessons: ['Sincere Repentance', 'Human Responsibility'],
        references: ['Surah Al-Baqarah 2:33', 'Surah Al-A\'raf 7:11'],
        connections: ['idris'],
        x: 500,
        y: 100
    },
    {
        id: 'idris',
        name: 'Idris (AS)',
        lineage: 'Descendant of Adam',
        timePeriod: 'Ancient Era',
        trials: ['Corruption of Qabil\'s descendants'],
        lessons: ['Perseverance', 'Wisdom'],
        references: ['Surah Maryam 19:56-57'],
        connections: ['nuh'],
        x: 500,
        y: 250
    },
    {
        id: 'nuh',
        name: 'Nuh (AS)',
        lineage: '10th generation after Adam',
        timePeriod: 'Approx 3900-2900 BC',
        trials: ['950 Years of rejection', 'The Ark & Great Flood'],
        lessons: ['Steadfast Faith', 'Unyielding Commitment'],
        references: ['Surah Nuh 71:1', 'Surah Hud 11:36-48'],
        connections: ['hud', 'salih', 'ibrahim'],
        x: 500,
        y: 400
    },
    {
        id: 'hud',
        name: 'Hud (AS)',
        lineage: 'Sent to tribe of \'Ad',
        timePeriod: 'Ancient Era',
        trials: ['Ridicule by the people of \'Ad'],
        lessons: ['Warning against Arrogance', 'Patience'],
        references: ['Surah Hud 11:50', 'Surah Al-A\'raf 7:65-72'],
        connections: [],
        x: 350,
        y: 550
    },
    {
        id: 'salih',
        name: 'Saleh (AS)',
        lineage: 'Sent to Thamud',
        timePeriod: 'Ancient Era',
        trials: ['The miracle of the She-Camel'],
        lessons: ['Consequences of Disbelief', 'Protecting Signs'],
        references: ['Surah Ash-Shu\'ara 26:142', 'Surah Al-A\'raf 7:73-79'],
        connections: [],
        x: 650,
        y: 550
    },
    {
        id: 'ibrahim',
        name: 'Ibrahim (AS)',
        lineage: 'Known as "Father of Prophets"',
        timePeriod: 'Approx 2000 BC',
        trials: ['Fire of Nimrod', 'Sacrifice of his son'],
        lessons: ['Pure Monotheism', 'Absolute Devotion'],
        references: ['Surah Ibrahim 2:124', 'Surah Al-Anbiya 21:51-70'],
        connections: ['lut', 'ismail', 'is-haq', 'shuayb'],
        x: 500,
        y: 700
    },
    {
        id: 'lut',
        name: 'Lut (AS)',
        lineage: 'Nephew of Ibrahim',
        timePeriod: 'Approx 2000 BC',
        trials: ['Immorality of Sodom'],
        lessons: ['Moral Courage', 'Standing against Sin'],
        references: ['Surah Al-Hajj 22:43', 'Surah Al-A\'raf 7:80-84'],
        connections: [],
        x: 250,
        y: 700
    },
    {
        id: 'ismail',
        name: 'Ismail (AS)',
        lineage: 'Son of Ibrahim & Hajar',
        timePeriod: 'Approx 1900 BC',
        trials: ['Command of Sacrifice', 'Left in the Desert'],
        lessons: ['Obedience', 'Patience'],
        references: ['Surah Maryam 19:54-55', 'Surah Al-Anbiya 21:85'],
        connections: ['muhammad'],
        x: 350,
        y: 850
    },
    {
        id: 'is-haq',
        name: 'Ishaq (AS)',
        lineage: 'Son of Ibrahim & Sarah',
        timePeriod: 'Approx 1850 BC',
        trials: ['Guiding his community'],
        lessons: ['Sincerity', 'Righteousness'],
        references: ['Surah Hud 11:71'],
        connections: ['yaqub'],
        x: 650,
        y: 850
    },
    {
        id: 'yaqub',
        name: 'Yaqub (AS)',
        lineage: 'Son of Ishaq',
        timePeriod: 'Approx 1800 BC',
        trials: ['Separation from Yusuf', 'Loss of sight'],
        lessons: ['Beautiful Patience', 'Hope in Allah'],
        references: ['Surah Al-Anbiya 21:72', 'Surah Yusuf 12:86'],
        connections: ['yusuf', 'ayyub', 'musa', 'dawud', 'yunus', 'zakariya'],
        x: 650,
        y: 1000
    },
    {
        id: 'yusuf',
        name: 'Yusuf (AS)',
        lineage: 'Son of Yaqub',
        timePeriod: 'Approx 1700 BC',
        trials: ['Betrayal by brothers', 'False Imprisonment'],
        lessons: ['Purity of Heart', 'Forgiveness'],
        references: ['Surah Yusuf 12:69'],
        connections: [],
        x: 800,
        y: 1150
    },
    {
        id: 'ayyub',
        name: 'Ayyub (AS)',
        lineage: 'Descendant of Ibrahim',
        timePeriod: 'Ancient Era',
        trials: ['Loss of Health & Wealth', 'Loss of Family'],
        lessons: ['Gratefulness in Hardship', 'Constant Remembrance'],
        references: ['Surah Sad 38:41'],
        connections: [],
        x: 500,
        y: 1150
    },
    {
        id: 'shuayb',
        name: 'Shu\'aib (AS)',
        lineage: 'Sent to Madyan',
        timePeriod: 'Ancient Era',
        trials: ['Dishonesty in trade of Madyan'],
        lessons: ['Ethical Business', 'Social Justice'],
        references: ['Surah Ash-Shu\'ara 26:177'],
        connections: [],
        x: 200,
        y: 1150
    },
    {
        id: 'musa',
        name: 'Musa (AS)',
        lineage: 'Descendant of Yaqub',
        timePeriod: 'Approx 1300 BC',
        trials: ['Pharaoh\'s Tyranny', 'Leading Israelites'],
        lessons: ['Fearless Truth', 'Reliance on God'],
        references: ['Surah As-Saffat 37:120', 'Surah Al-Qasas 28:1'],
        connections: ['harun', 'dhul-kifl'],
        x: 600,
        y: 1300
    },
    {
        id: 'harun',
        name: 'Harun (AS)',
        lineage: 'Brother of Musa',
        timePeriod: 'Approx 1300 BC',
        trials: ['Golden Calf Incident'],
        lessons: ['Effective Communication', 'Firmness in Principle'],
        references: ['Surah As-Saffat 37:120', 'Surah Al-Qasas 28:34'],
        connections: ['ilyas'],
        x: 750,
        y: 1300
    },
    {
        id: 'dhul-kifl',
        name: 'Dhul-Kifl (AS)',
        lineage: 'Righteous judge after Musa',
        timePeriod: 'Ancient Era',
        trials: ['Upholding justice'],
        lessons: ['Righteousness', 'Patience'],
        references: ['Surah Al-Anbiya 21:85', 'Surah Sad 38:48'],
        connections: [],
        x: 450,
        y: 1300
    },
    {
        id: 'dawud',
        name: 'Dawud (AS)',
        lineage: 'Descendant of Yaqub',
        timePeriod: 'Approx 1000 BC',
        trials: ['Battle against Goliath', 'Judgment Wisdom'],
        lessons: ['Sincere Repentance', 'Wisdom in Leadership'],
        references: ['Surah Al-Baqarah 2:251', 'Surah Sad 38:24'],
        connections: ['sulayman', 'isa'],
        x: 600,
        y: 1450
    },
    {
        id: 'sulayman',
        name: 'Sulayman (AS)',
        lineage: 'Son of Dawud',
        timePeriod: 'Approx 950 BC',
        trials: ['Trial of Power', 'Trial of Wealth'],
        lessons: ['Ultimate Gratitude', 'Balance of Dunya & Deen'],
        references: ['Surah An-Naml 27:44'],
        connections: [],
        x: 750,
        y: 1450
    },
    {
        id: 'ilyas',
        name: 'Ilyas (AS)',
        lineage: 'Descendant of Harun',
        timePeriod: 'Ancient Era',
        trials: ['Confrontation with Idolators'],
        lessons: ['Pure Tawheed', 'Fearlessness'],
        references: ['Surah As-Saffat 37:123', 'Surah Al-An\'am 6:85'],
        connections: ['al-yasa'],
        x: 400,
        y: 1450
    },
    {
        id: 'al-yasa',
        name: 'Al-Yasa (AS)',
        lineage: 'Successor of Ilyas',
        timePeriod: 'Ancient Era',
        trials: ['Continuing mission in hardship'],
        lessons: ['Firmness of Faith', 'Gratefulness'],
        references: ['Surah Al-An\'am 6:86'],
        connections: [],
        x: 250,
        y: 1450
    },
    {
        id: 'yunus',
        name: 'Yunus (AS)',
        lineage: 'Descendant of Yaqub',
        timePeriod: 'Approx 8th CC BC',
        trials: ['The Whale\'s Belly', 'Impatience with people'],
        lessons: ['Repentance in Darkness', 'Trusting the Process'],
        references: ['Surah As-Saffat 37:139'],
        connections: [],
        x: 350,
        y: 1600
    },
    {
        id: 'zakariya',
        name: 'Zakariya (AS)',
        lineage: 'Descendant of Yaqub',
        timePeriod: '1st Century BC',
        trials: ['Old age Childlessness'],
        lessons: ['Persistence in Dua', 'Silent Reflection'],
        references: ['Surah Al-Imran 3:37'],
        connections: ['yahya'],
        x: 650,
        y: 1600
    },
    {
        id: 'yahya',
        name: 'Yahya (AS)',
        lineage: 'Son of Zakariya',
        timePeriod: '1st Century AD',
        trials: ['Standing for Truth against Tyrants'],
        lessons: ['Piety and Compassion', 'Martyrdom for Faith'],
        references: ['Surah Al-An\'am 6:85', 'Surah Maryam 19:12'],
        connections: [],
        x: 650,
        y: 1750
    },
    {
        id: 'isa',
        name: 'Isa (AS)',
        lineage: 'Son of Maryam',
        timePeriod: '1st Century AD',
        trials: ['Miraculous Birth', 'Rejection by people'],
        lessons: ['Mercy', 'Divine Intervention'],
        references: ['Surah Al-Ma\'idah 5:112', 'Surah Maryam 19:16'],
        connections: [],
        x: 500,
        y: 1750
    },
    {
        id: 'muhammad',
        name: 'Muhammad (PBUH)',
        lineage: 'Descendant of Ismail',
        timePeriod: '570 - 632 AD',
        trials: ['Persecution in Mecca', 'Seerah Transitions'],
        lessons: ['Exemplary Character', 'Finality of Guidance'],
        references: ['Surah Muhammad 47:2', 'Surah Al-Ahzab 33:40'],
        connections: [],
        x: 500,
        y: 1900
    }
];

export const DAILY_REFLECTION = {
    ayah: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    reference: "Surah Al-Fatihah 1:1",
    calligraphy: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
};

export const DISCOVERY_CARDS = [
    {
        title: "The Path of Seerah",
        desc: "A journey through the life of the Final Messenger.",
        tag: "Life of Prophet",
        color: "from-emerald-900 to-green-800"
    },
    {
        title: "Moral Excellence",
        desc: "Developing Akhlaq through the lens of divine guidance.",
        tag: "Character",
        color: "from-amber-900 to-yellow-800"
    },
    {
        title: "Stewardship",
        desc: "Our role as Khilafah on this beautiful Earth.",
        tag: "Theology",
        color: "from-blue-900 to-indigo-800"
    }
];
