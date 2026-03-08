export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  modules: Module[];
  students: number;
  image?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "audio";
  duration?: string;
  completed?: boolean;
}

export const seedCourses: Course[] = [
  {
    id: "maktab-foundations",
    title: "Maktab Foundations",
    description: "Start your journey with the Arabic alphabet, basic Harakat, and begin reading the Quran from scratch. Perfect for young learners and beginners.",
    category: "Quran Reading",
    students: 234,
    modules: [
      {
        id: "arabic-alphabet",
        title: "Arabic Alphabet",
        lessons: [
          { id: "l1", title: "Alif to Thaa", type: "video", duration: "12 min" },
          { id: "l2", title: "Jeem to Zaa", type: "video", duration: "10 min" },
          { id: "l3", title: "Seen to Dhad", type: "video", duration: "11 min" },
          { id: "l4", title: "Taa to Yaa", type: "video", duration: "10 min" },
        ],
      },
      {
        id: "harakat",
        title: "Harakat (Fatha, Kasra, Damma)",
        lessons: [
          { id: "l5", title: "Fatha - The Opening Vowel", type: "video", duration: "8 min" },
          { id: "l6", title: "Kasra - The Lower Vowel", type: "video", duration: "8 min" },
          { id: "l7", title: "Damma - The Rounded Vowel", type: "video", duration: "8 min" },
        ],
      },
      {
        id: "basic-reading",
        title: "Basic Quran Reading",
        lessons: [
          { id: "l8", title: "Joining Letters", type: "video", duration: "15 min" },
          { id: "l9", title: "Reading Simple Words", type: "video", duration: "12 min" },
        ],
      },
    ],
  },
  {
    id: "tajweed-basics",
    title: "Tajweed Basics",
    description: "Learn the fundamental rules of Tajweed including Makharij al-Huroof, Noon Saakin rules, and begin practising proper recitation.",
    category: "Tajweed",
    students: 187,
    modules: [
      {
        id: "makharij",
        title: "Makharij al-Huroof",
        lessons: [
          { id: "l10", title: "Throat Letters", type: "video", duration: "10 min" },
          { id: "l11", title: "Tongue Letters", type: "video", duration: "12 min" },
          { id: "l12", title: "Lip Letters", type: "video", duration: "8 min" },
        ],
      },
      {
        id: "noon-saakin",
        title: "Noon Saakin Rules",
        lessons: [
          { id: "l13", title: "Izhaar", type: "video", duration: "10 min" },
          { id: "l14", title: "Idghaam", type: "video", duration: "10 min" },
          { id: "l15", title: "Ikhfaa", type: "video", duration: "10 min" },
          { id: "l16", title: "Iqlaab", type: "video", duration: "8 min" },
        ],
      },
      {
        id: "recitation-practice",
        title: "Basic Recitation Practice",
        lessons: [
          { id: "l17", title: "Surah Al-Fatiha Practice", type: "audio", duration: "15 min" },
          { id: "l18", title: "Short Surahs Practice", type: "audio", duration: "20 min" },
        ],
      },
    ],
  },
  {
    id: "daily-duas",
    title: "Daily Duas",
    description: "Memorise the essential daily Duas for morning, eating, sleeping, and more. Includes Arabic text, transliteration, and meaning.",
    category: "Duas & Adhkar",
    students: 312,
    modules: [
      {
        id: "morning-duas",
        title: "Morning Duas",
        lessons: [
          { id: "l19", title: "Dua Upon Waking Up", type: "text", duration: "5 min" },
          { id: "l20", title: "Morning Adhkar", type: "audio", duration: "10 min" },
        ],
      },
      {
        id: "eating-duas",
        title: "Eating Duas",
        lessons: [
          { id: "l21", title: "Dua Before Eating", type: "text", duration: "3 min" },
          { id: "l22", title: "Dua After Eating", type: "text", duration: "3 min" },
        ],
      },
      {
        id: "sleeping-duas",
        title: "Sleeping Duas",
        lessons: [
          { id: "l23", title: "Dua Before Sleeping", type: "text", duration: "5 min" },
          { id: "l24", title: "Ayatul Kursi", type: "audio", duration: "8 min" },
        ],
      },
    ],
  },
];
