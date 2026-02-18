
import React from 'react';
import {
  Sun, Heart, Cloud, BookOpen, Moon, Award, Sparkles, Feather, Flame, Globe, Bug
} from 'lucide-react';

export type SubView = 'main' | 'lesson-detail' | 'quiz' | 'completion' | 'quest' | 'badge-detail' | 'achievements' | 'limit-edit' | 'filter-edit' | 'report-card';

export const USER_STATS = {
  level: 3,
  title: "Little Explorer",
  xp: 850,
  maxXp: 1000,
  streak: 12,
  gems: 45
};

export const DAILY_QUEST = {
  title: "Recite Surah Al-Fatiha",
  reward: 50,
  completed: false,
};

export const JOURNEY_STAGES = [
  {
    id: 1,
    title: 'Welcome to Ramadan',
    subtitle: 'The Month of the Quran',
    type: 'Ramadan',
    duration: '5 min',
    icon: React.createElement(Moon, { size: 24 }),
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    locked: false,
    progress: 0,
    stars: 0,
    description: "Discover why Ramadan is called the 'Month of the Quran' and learn about the special blessings of this month.",
    xpReward: 50,
    videoUrl: "https://www.youtube.com/embed/5tAmtxn76a0",
    mcqs: [
      { q: "Why is Ramadan also called the 'Month of the Quran'?", options: ["Because Muslims fast during the day", "Because the Quran was revealed to the Prophet ﷺ in this month", "Because Eid is celebrated after Ramadan"], answer: "Because the Quran was revealed to the Prophet ﷺ in this month", reference: "Surah Al-Baqarah 2:185" },
      { q: "What happens to Shaytan (Satan) during Ramadan?", options: ["He becomes more powerful", "He is imprisoned / locked away", "He travels to other planets"], answer: "He is imprisoned / locked away", reference: "Ramadan Virtues" },
      { q: "Who is the Quran's final revealed message for?", options: ["Only for adults", "Only for Arabs", "All of humanity, as guidance and light"], answer: "All of humanity, as guidance and light", reference: "Purpose of the Quran" },
    ]
  },
  {
    id: 2,
    title: 'The Wise Little Ant',
    subtitle: 'Lessons from Surah An-Naml',
    type: 'Stories',
    duration: '8 min',
    icon: React.createElement(Bug, { size: 24 }),
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "Explore the story of Prophet Sulayman (AS) and the ant colony, learning about teamwork and gratitude.",
    xpReward: 60,
    videoUrl: "https://www.youtube.com/embed/9T4_pE1LcZs",
    mcqs: [
      { q: "What did the ant queen say when she saw Prophet Sulayman's army approaching?", options: ["She asked them for food", "She told the ants to go into their homes so they wouldn't be crushed", "She attacked the army"], answer: "She told the ants to go into their homes so they wouldn't be crushed", reference: "Surah An-Naml 27:18" },
      { q: "How far away was Prophet Sulayman (AS) when he heard the ant's voice?", options: ["Right beside her", "1 kilometre away", "3 miles away"], answer: "3 miles away", reference: "Prophetic Powers" },
      { q: "What important quality do ants teach us according to this lesson?", options: ["Speed and competition", "Teamwork, discipline, and planning ahead", "Eating a lot of food"], answer: "Teamwork, discipline, and planning ahead", reference: "Life Lessons from Ants" },
    ]
  },
  {
    id: 3,
    title: 'The Crow That Taught Humanity',
    subtitle: 'Lessons from Surah Al-Ma\'idah',
    type: 'Stories',
    duration: '7 min',
    icon: React.createElement(Feather, { size: 24 }),
    color: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "Learn how a crow taught the first humans a valuable lesson about burial and respect for life.",
    xpReward: 60,
    videoUrl: "https://www.youtube.com/embed/M2EvoSm021c",
    mcqs: [
      { q: "What did Qabil (Cain) learn from watching the crow?", options: ["How to fly", "How to bury the dead in the ground", "How to find food"], answer: "How to bury the dead in the ground", reference: "Surah Al-Ma'idah 5:31" },
      { q: "Who was the first human being to pass away (die) in this world?", options: ["Adam (AS)", "Qabil", "Habil (Abel)"], answer: "Habil (Abel)", reference: "First Death in History" },
      { q: "What is the main lesson we learn from Allah's creation in this story?", options: ["Crows are dangerous birds", "Everything Allah created has a purpose and wisdom behind it", "We should be afraid of animals"], answer: "Everything Allah created has a purpose and wisdom behind it", reference: "Wisdom in Creation" },
    ]
  },
  {
    id: 4,
    title: 'Five Miracles of Isa (AS)',
    subtitle: 'Prophetic Powers from Allah',
    type: 'Prophets',
    duration: '10 min',
    icon: React.createElement(Sparkles, { size: 24 }),
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "Discover the five extraordinary miracles granted to Prophet Isa (AS) to help and guide his people.",
    xpReward: 70,
    videoUrl: "https://www.youtube.com/embed/8srLS_j9Uk4",
    mcqs: [
      { q: "Which of these is NOT one of the five miracles of Prophet Isa (AS) mentioned in the Quran?", options: ["Healing those born blind", "Splitting the moon in half", "Bringing the dead back to life"], answer: "Splitting the moon in half", reference: "Surah Aal-Imran 3:49" },
      { q: "What did Prophet Isa (AS) create from clay according to the Quran?", options: ["A lion", "A fish", "A bird that flew by Allah's permission"], answer: "A bird that flew by Allah's permission", reference: "Miracle of the Bird" },
      { q: "Why did Allah give Prophets such powerful miracles?", options: ["To compete with other people", "To prove they were truly sent by Allah and to help humanity", "To entertain the crowds"], answer: "To prove they were truly sent by Allah and to help humanity", reference: "Purpose of Miracles" },
    ]
  },
  {
    id: 5,
    title: 'The Shirt of Yusuf (AS)',
    subtitle: 'Blessings of the Pious',
    type: 'Stories',
    duration: '9 min',
    icon: React.createElement(Award, { size: 24 }),
    color: 'bg-teal-500/20 text-teal-300 border-teal-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "A beautiful story of patience, hope, and the miraculous healing of Prophet Ya'qub's eyesight.",
    xpReward: 70,
    videoUrl: "https://www.youtube.com/embed/ihksVH7wgpI",
    mcqs: [
      { q: "What happened to Prophet Ya'qub (AS) due to his grief over Yusuf (AS)?", options: ["He became very rich", "He lost his eyesight from crying", "He went on a long journey"], answer: "He lost his eyesight from crying", reference: "Grief of Ya'qub" },
      { q: "How did Prophet Ya'qub (AS) regain his sight?", options: ["A doctor treated him", "He drank special water", "Yusuf's shirt was placed on his face and his sight was restored"], answer: "Yusuf's shirt was placed on his face and his sight was restored", reference: "Miracle of the Shirt" },
      { q: "What important lesson do we learn from the story of Yusuf (AS)?", options: ["Jealousy always wins in the end", "Allah always protects and rewards the patient and righteous", "Brothers always fight with each other"], answer: "Allah always protects and rewards the patient and righteous", reference: "Patience and Trust in Allah" },
    ]
  },
  {
    id: 6,
    title: 'Think Before You React',
    subtitle: 'Lessons from Surah Al-Hujurat',
    type: 'Manners',
    duration: '6 min',
    icon: React.createElement(Heart, { size: 24 }),
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "Learn the importance of verifying news and not spreading rumors, a key social skill in Islam.",
    xpReward: 65,
    videoUrl: "https://www.youtube.com/embed/gTg8ztcjIUs",
    mcqs: [
      { q: "What does Surah Al-Hujurat (49:6) teach us to do when someone brings us news?", options: ["Immediately believe it and react", "Verify and check if the news is true before acting", "Share it with as many people as possible"], answer: "Verify and check if the news is true before acting", reference: "Surah Al-Hujurat 49:6" },
      { q: "What could happen if we act on false information without checking?", options: ["We make new friends", "We could hurt innocent people and feel ashamed later", "Nothing bad happens"], answer: "We could hurt innocent people and feel ashamed later", reference: "Consequences of Acting Rashly" },
      { q: "According to this lesson, whose news should we be especially careful about?", options: ["News from our best friend only", "News from Allah's Prophets only", "News from a sinful / unreliable person (fasiq)"], answer: "News from a sinful / unreliable person (fasiq)", reference: "Evaluating Sources" },
    ]
  },
  {
    id: 7,
    title: 'The Honoured Family',
    subtitle: 'Ahlul Bayt in the Quran',
    type: 'History',
    duration: '8 min',
    icon: React.createElement(Sun, { size: 24 }),
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "Discover the blessed household of Prophet Muhammad ﷺ and why Allah honored them in the Quran.",
    xpReward: 70,
    videoUrl: "https://www.youtube.com/embed/QV8J4fy-ca0",
    mcqs: [
      { q: "What does 'Ahlul Bayt' mean?", options: ["The People of the Mosque", "The Household / Family of the Prophet ﷺ", "The Companions of the Prophet ﷺ"], answer: "The Household / Family of the Prophet ﷺ", reference: "Meaning of Ahlul Bayt" },
      { q: "What does the Verse of Purification (Surah Al-Ahzab 33:33) tell us about the Ahlul Bayt?", options: ["They were very wealthy", "Allah wishes to purify them and keep them free from impurity", "They lived in Madinah only"], answer: "Allah wishes to purify them and keep them free from impurity", reference: "Surah Al-Ahzab 33:33" },
      { q: "Which of these is included among the Ahlul Bayt?", options: ["Hazrat Abu Bakr (RA)", "Hazrat Bibi Fatimah (RA), Imam Hasan, Imam Husain, and Hazrat Ali (RA)", "All Muslims who pray five times a day"], answer: "Hazrat Bibi Fatimah (RA), Imam Hasan, Imam Husain, and Hazrat Ali (RA)", reference: "Members of Ahlul Bayt" },
    ]
  },
  {
    id: 8,
    title: 'The Army of Birds',
    subtitle: 'Allah Protects the Ka\'bah',
    type: 'History',
    duration: '7 min',
    icon: React.createElement(Cloud, { size: 24 }),
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "The dramatic story of Abraha's elephant army and how Allah sent birds to protect the Ka'bah.",
    xpReward: 75,
    videoUrl: "https://www.youtube.com/embed/JedFY_rsMhg",
    mcqs: [
      { q: "Why did Abraha march his army towards Makkah?", options: ["To bring gifts to the Ka'bah", "To destroy the Ka'bah so people would worship in his own building instead", "To perform Hajj"], answer: "To destroy the Ka'bah so people would worship in his own building instead", reference: "Abraha's Plan" },
      { q: "What did Allah send to defeat Abraha's mighty army?", options: ["A great storm and lightning", "Another army of soldiers", "Flocks of Ababeel birds carrying small pebbles / stones"], answer: "Flocks of Ababeel birds carrying small pebbles / stones", reference: "Surah Al-Fil" },
      { q: "What is the main message of Surah Al-Fil for us today?", options: ["Birds are the strongest creatures", "No worldly power can destroy what Allah has chosen to protect", "We should build more mosques"], answer: "No worldly power can destroy what Allah has chosen to protect", reference: "Divine Protection" },
    ]
  },
  {
    id: 9,
    title: 'Jinns Are Real!',
    subtitle: 'Unseen Creation in the Quran',
    type: 'Theology',
    duration: '8 min',
    icon: React.createElement(Flame, { size: 24 }),
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "Learn about the Jinn, a creation made of smokeless fire, and how a Muslim should not fear them excessively.",
    xpReward: 65,
    videoUrl: "https://www.youtube.com/embed/l5yb9Y6hN7M",
    mcqs: [
      { q: "What were the Jinn created from according to the Quran?", options: ["Clay and water", "Light", "Smokeless fire"], answer: "Smokeless fire", reference: "Surah Al-Hijr 15:27" },
      { q: "Is believing in the existence of Jinn necessary in Islam?", options: ["No, it is just folklore", "Only scholars need to believe in it", "Yes, it is necessary because the Quran confirms their existence"], answer: "Yes, it is necessary because the Quran confirms their existence", reference: "Iman in the Unseen" },
      { q: "What is the best attitude a Muslim child should have towards Jinn?", options: ["Live in constant fear of them", "Be brave and trust in Allah's protection — excessive fear only invites more fear", "Try to contact and talk to them"], answer: "Be brave and trust in Allah's protection — excessive fear only invites more fear", reference: "Courage and Tawakkul" },
    ]
  },
  {
    id: 10,
    title: 'The Moon Split in Two',
    subtitle: 'Greatest Miracle of Prophet ﷺ',
    type: 'Prophets',
    duration: '9 min',
    icon: React.createElement(Globe, { size: 24 }),
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    locked: true,
    progress: 0,
    stars: 0,
    description: "Discover the breathtaking miracle of Shaqq-ul-Qamar, when the Prophet ﷺ split the moon in half.",
    xpReward: 80,
    videoUrl: "https://www.youtube.com/embed/Up0xlJ-SbWA",
    mcqs: [
      { q: "In which Surah does Allah mention the miracle of the moon being split?", options: ["Surah Al-Baqarah", "Surah Al-Qamar (The Moon)", "Surah Al-Fil"], answer: "Surah Al-Qamar (The Moon)", reference: "Surah Al-Qamar 54:1" },
      { q: "When the non-Muslims saw the moon split, what did they claim?", options: ["They immediately accepted Islam", "They said the Prophet ﷺ used magic to create the illusion", "They ran away in fear"], answer: "They said the Prophet ﷺ used magic to create the illusion", reference: "Reaction of the Disbelievers" },
      { q: "How was the moon-splitting miracle confirmed to be real and not an illusion?", options: ["A photograph was taken", "Travellers from other areas also confirmed they saw the moon split", "The moon never returned to normal"], answer: "Travellers from other areas also confirmed they saw the moon split", reference: "Evidence of the Miracle" },
    ]
  },
];

export const PARENT_STATS = [
  { name: 'Stories', value: 400 },
  { name: 'Duas', value: 300 },
  { name: 'Salah', value: 300 },
  { name: 'History', value: 200 },
];

export const WEEKLY_ACTIVITY = [
  { day: 'M', min: 20 },
  { day: 'T', min: 45 },
  { day: 'W', min: 30 },
  { day: 'T', min: 15 },
  { day: 'F', min: 60 },
  { day: 'S', min: 10 },
  { day: 'S', min: 5 },
];

export const COLORS = ['#10b981', '#fbbf24', '#3b82f6', '#f43f5e'];

// Rank Levels System
export const RANK_LEVELS = [
  { level: 1, title: 'Little Learner', minXP: 0, icon: '📚' },
  { level: 2, title: 'Quran Explorer', minXP: 100, icon: '🔍' },
  { level: 3, title: 'Story Seeker', minXP: 200, icon: '📜' },
  { level: 4, title: 'Miracle Learner', minXP: 300, icon: '✨' },
  { level: 5, title: 'Wise Thinker', minXP: 400, icon: '🧠' },
  { level: 6, title: "Ka'bah Guardian", minXP: 500, icon: '🕋' },
  { level: 7, title: 'Anbiya Champion', minXP: 600, icon: '🌟' },
  { level: 8, title: 'Quranic Scholar', minXP: 700, icon: '🎓' },
  { level: 9, title: "Prophet's Follower", minXP: 800, icon: '📋' },
  { level: 10, title: 'Ramadan Champion 🏆', minXP: 900, icon: '🏆' },
];

export const SCORING_RULES = {
  CORRECT_1ST_TRY: 10,
  CORRECT_2ND_TRY: 5,
  PERFECT_BONUS: 20
};

export const BADGES = [
  { id: 'b1', emoji: '🌅', name: 'Early Bird', desc: 'Completed a lesson before 8 AM.', progress: 100 },
  { id: 'b2', emoji: '📚', name: 'Bookworm', desc: 'Finished 5 History lessons.', progress: 60 },
  { id: 'b3', emoji: '🌙', name: 'Moon Walker', desc: 'Attended a night story session.', progress: 30 },
];
