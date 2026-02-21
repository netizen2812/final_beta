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
        trials: ['Testing in Paradise', 'The Tree of Knowledge'],
        lessons: ['Sincere Repentance', 'Human Responsibility'],
        references: ['Surah Al-Baqarah 2:30-39', 'Surah Al-A\'raf 7:11-25'],
        connections: ['seth', 'idris'],
        x: 500,
        y: 100
    },
    {
        id: 'nuh',
        name: 'Nuh (AS)',
        lineage: 'Descendant of Idris',
        timePeriod: 'Approx 3900-2900 BC',
        trials: ['950 Years of Preaching', 'The Great Flood'],
        lessons: ['Infinite Patience', 'Trust in God\'s Plan'],
        references: ['Surah Nuh 71:1-28', 'Surah Hud 11:25-49'],
        connections: ['idris', 'hud', 'salih'],
        x: 500,
        y: 250
    },
    {
        id: 'ibrahim',
        name: 'Ibrahim (AS)',
        lineage: 'Son of Azar',
        timePeriod: 'Approx 2000 BC',
        trials: ['The Fire of Nimrod', 'The Sacrifice of Ismail'],
        lessons: ['Absolute Submission', 'Search for Truth'],
        references: ['Surah Ibrahim 14:35-41', 'Surah Al-Anbiya 21:51-70'],
        connections: ['nuh', 'ismail', 'is-haq', 'lut'],
        x: 500,
        y: 400
    },
    {
        id: 'ismail',
        name: 'Ismail (AS)',
        lineage: 'First son of Ibrahim',
        timePeriod: 'Approx 1900 BC',
        trials: ['Left in the Desert', 'The Sacrifice'],
        lessons: ['Obedience', 'Steadfastness'],
        references: ['Surah Maryam 19:54-55'],
        connections: ['ibrahim'],
        x: 350,
        y: 550
    },
    {
        id: 'is-haq',
        name: 'Is-haq (AS)',
        lineage: 'Second son of Ibrahim',
        timePeriod: 'Approx 1850 BC',
        trials: ['Legacy of Prophethood'],
        lessons: ['Sincerity', 'Wisdom'],
        references: ['Surah Sad 38:45-47'],
        connections: ['ibrahim', 'yaqub'],
        x: 650,
        y: 550
    },
    {
        id: 'musa',
        name: 'Musa (AS)',
        lineage: 'Lineage of Yaqub',
        timePeriod: 'Approx 1300 BC',
        trials: ['Confronting Pharaoh', 'Leading the Israelites'],
        lessons: ['Courage in Truth', 'Reliance on God'],
        references: ['Surah Al-Qasas 28:1-46', 'Surah Ta-Ha 20:9-98'],
        connections: ['harun', 'yaqub'],
        x: 650,
        y: 750
    },
    {
        id: 'isa',
        name: 'Isa (AS)',
        lineage: 'Son of Maryam',
        timePeriod: '1st Century AD',
        trials: ['False Accusations', 'Healing the Sick'],
        lessons: ['Mercy', 'Holy Spirit Support'],
        references: ['Surah Maryam 19:16-36', 'Surah Al-Ma\'idah 5:110-120'],
        connections: ['yahya', 'zakariya'],
        x: 500,
        y: 900
    }
];

export const DAILY_REFLECTION = {
    ayah: "And We have not sent you, [O Muhammad], except as a mercy to the worlds.",
    reference: "Surah Al-Anbiya 21:107",
    calligraphy: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِلْعَالَمِينَ"
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
