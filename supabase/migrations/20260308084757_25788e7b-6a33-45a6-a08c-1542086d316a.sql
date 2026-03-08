
-- Update Maktab Foundations - Arabic Alphabet lessons
UPDATE public.lessons SET 
  title = 'Alif to Thaa — أ ب ت ث',
  content = 'أَلِف (Alif) — بَاء (Baa) — تَاء (Taa) — ثَاء (Thaa)

Learn to recognise, write, and pronounce the first four letters of the Arabic alphabet. Each letter has a unique shape and sound that forms the foundation of Quran reading.'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

UPDATE public.lessons SET 
  title = 'Jeem to Zay — ج ح خ د ذ ر ز',
  content = 'جِيم (Jeem) — حَاء (Haa) — خَاء (Khaa) — دَال (Daal) — ذَال (Thaal) — رَاء (Raa) — زَاي (Zay)

Continue learning the next seven letters. Pay attention to the difference between similar-sounding letters like حَاء and خَاء.'
WHERE id = 'c0000000-0000-0000-0000-000000000002';

UPDATE public.lessons SET 
  title = 'Seen to Dhad — س ش ص ض',
  content = 'سِين (Seen) — شِين (Sheen) — صَاد (Saad) — ضَاد (Dhad)

These letters include some of the most distinctive sounds in Arabic. ض (Dhad) is unique to the Arabic language.'
WHERE id = 'c0000000-0000-0000-0000-000000000003';

-- Update Harakat lessons
UPDATE public.lessons SET 
  title = 'Fatha — The Opening Vowel  َ',
  content = 'فَتْحَة (Fathah) produces the "a" sound.

بَ (Ba) — تَ (Ta) — ثَ (Tha) — جَ (Ja) — حَ (Ha)

Practice placing Fatha on each letter and pronouncing the short "a" sound clearly.'
WHERE id = 'c0000000-0000-0000-0000-000000000004';

UPDATE public.lessons SET 
  title = 'Kasra — The Lower Vowel  ِ',
  content = 'كَسْرَة (Kasrah) produces the "i" sound.

بِ (Bi) — تِ (Ti) — ثِ (Thi) — جِ (Ji) — حِ (Hi)

Practice placing Kasra below each letter and pronouncing the short "i" sound.'
WHERE id = 'c0000000-0000-0000-0000-000000000005';

UPDATE public.lessons SET 
  title = 'Damma — The Rounded Vowel  ُ',
  content = 'ضَمَّة (Dammah) produces the "u" sound.

بُ (Bu) — تُ (Tu) — ثُ (Thu) — جُ (Ju) — حُ (Hu)

Practice placing Damma on each letter and pronouncing the rounded "u" sound.'
WHERE id = 'c0000000-0000-0000-0000-000000000006';

-- Update Basic Quran Reading lessons
UPDATE public.lessons SET 
  title = 'Joining Letters',
  content = 'Learn how Arabic letters connect to form words.

كَتَبَ (Kataba — He wrote) — قَرَأَ (Qara''a — He read) — عَلِمَ (Alima — He knew)

Practice reading 2-3 letter words with the Harakat you have learned.'
WHERE id = 'c0000000-0000-0000-0000-000000000007';

UPDATE public.lessons SET 
  title = 'Reading Surah Al-Fatiha',
  content = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
In the name of Allah, the Most Gracious, the Most Merciful

ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ
All praise is due to Allah, Lord of all the worlds

ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
The Most Gracious, the Most Merciful

Practice reading each ayah slowly with proper pronunciation.'
WHERE id = 'c0000000-0000-0000-0000-000000000008';

-- Update Tajweed lessons
UPDATE public.lessons SET 
  title = 'Throat Letters — حُرُوف حَلْقِيَّة',
  content = 'حُرُوف حَلْقِيَّة (Huruf Halqiyyah) — Letters from the throat:

هَاء (Haa) — عَيْن (Ayn) — حَاء (Haa) — غَيْن (Ghayn) — خَاء (Khaa) — هَمْزَة (Hamzah)

These six letters originate from three positions in the throat: the deepest, middle, and closest to the mouth.'
WHERE id = 'c0000000-0000-0000-0000-000000000009';

UPDATE public.lessons SET 
  title = 'Tongue Letters — حُرُوف لِسَانِيَّة',
  content = 'حُرُوف لِسَانِيَّة (Huruf Lisaniyyah) — Letters from the tongue:

ق (Qaaf) — ك (Kaaf) — ج (Jeem) — ش (Sheen) — ض (Dhad) — ل (Laam) — ن (Noon) — ر (Raa)

The majority of Arabic letters originate from the tongue. Mastering their exact articulation points is key to proper recitation.'
WHERE id = 'c0000000-0000-0000-0000-000000000010';

UPDATE public.lessons SET 
  title = 'Izhaar — إِظْهَار',
  content = 'إِظْهَار (Izhaar) means to make clear. When نْ (Noon Saakin) or Tanween is followed by one of the six throat letters, pronounce the Noon clearly without merging.

Throat letters: ء ه ع ح غ خ

Example: مَنْ هُوَ — مِنْ عِلْمٍ'
WHERE id = 'c0000000-0000-0000-0000-000000000011';

UPDATE public.lessons SET 
  title = 'Idghaam — إِدْغَام',
  content = 'إِدْغَام (Idghaam) means to merge. When نْ (Noon Saakin) or Tanween is followed by one of يَرْمَلُونَ letters, the Noon merges into the next letter.

Letters: ي ر م ل و ن

Example: مَنْ يَعْمَلْ — مِنْ رَبِّهِمْ'
WHERE id = 'c0000000-0000-0000-0000-000000000012';

UPDATE public.lessons SET 
  title = 'Ikhfaa — إِخْفَاء',
  content = 'إِخْفَاء (Ikhfaa) means to hide. When نْ (Noon Saakin) or Tanween is followed by any of the 15 Ikhfaa letters, the Noon is pronounced softly through the nose.

Example: مِنْ قَبْلُ — أَنْتُمْ — يُنْفِقُونَ'
WHERE id = 'c0000000-0000-0000-0000-000000000013';

UPDATE public.lessons SET 
  title = 'Practice: Surah Al-Ikhlas',
  content = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
In the name of Allah, the Most Gracious, the Most Merciful

قُلْ هُوَ ٱللَّهُ أَحَدٌ
Say: He is Allah, the One

ٱللَّهُ ٱلصَّمَدُ
Allah, the Eternal Refuge

لَمْ يَلِدْ وَلَمْ يُولَدْ
He neither begets nor is born

وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ
Nor is there to Him any equivalent'
WHERE id = 'c0000000-0000-0000-0000-000000000014';

UPDATE public.lessons SET 
  title = 'Practice: Surah An-Naas',
  content = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
In the name of Allah, the Most Gracious, the Most Merciful

قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ
Say: I seek refuge in the Lord of mankind

مَلِكِ ٱلنَّاسِ
The Sovereign of mankind

إِلَـٰهِ ٱلنَّاسِ
The God of mankind'
WHERE id = 'c0000000-0000-0000-0000-000000000015';

-- Update Daily Duas lessons
UPDATE public.lessons SET 
  title = 'Dua Upon Waking Up',
  content = 'اَلْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ
Alhamdu lillahil-lathee ahyana ba''da ma amatana wa ilayhin-nushoor

All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.'
WHERE id = 'c0000000-0000-0000-0000-000000000016';

UPDATE public.lessons SET 
  title = 'Morning Adhkar',
  content = 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ
Asbahna wa asbahal-mulku lillahi wal-hamdu lillah

We have reached the morning and at this very time the whole kingdom belongs to Allah, and all praise is for Allah.

سُبْحَانَ اللَّهِ وَبِحَمْدِهِ
SubhanAllahi wa bihamdihi
Glory be to Allah and praise Him — recite 100 times in the morning.'
WHERE id = 'c0000000-0000-0000-0000-000000000017';

UPDATE public.lessons SET 
  title = 'Dua Before Eating',
  content = 'بِسْمِ اللَّهِ
Bismillah
In the name of Allah

بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ
Bismillahi wa ala barakatillah
In the name of Allah and with the blessings of Allah'
WHERE id = 'c0000000-0000-0000-0000-000000000018';

UPDATE public.lessons SET 
  title = 'Dua After Eating',
  content = 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ
Alhamdu lillahil-lathee at''amana wa saqana wa ja''alana minal-muslimeen

All praise is for Allah who fed us, gave us drink, and made us Muslims.'
WHERE id = 'c0000000-0000-0000-0000-000000000019';

UPDATE public.lessons SET 
  title = 'Dua Before Sleeping',
  content = 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا
Bismika Allahumma amootu wa ahya
In Your name, O Allah, I die and I live

اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ
Allahumma qinee athabaka yawma tab''athu ibadak
O Allah, protect me from Your punishment on the day You resurrect Your servants.'
WHERE id = 'c0000000-0000-0000-0000-000000000020';

UPDATE public.lessons SET 
  title = 'Ayatul Kursi — آيَة الكُرْسِي',
  content = 'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ
Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence

لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ
Neither drowsiness overtakes Him nor sleep

لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ
To Him belongs whatever is in the heavens and whatever is on the earth

Recite Ayatul Kursi before sleeping for protection through the night.'
WHERE id = 'c0000000-0000-0000-0000-000000000021';

-- Update durations to match original
UPDATE public.lessons SET duration = '12 min' WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE public.lessons SET duration = '10 min' WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE public.lessons SET duration = '15 min' WHERE id = 'c0000000-0000-0000-0000-000000000007';
UPDATE public.lessons SET duration = '10 min' WHERE id = 'c0000000-0000-0000-0000-000000000009';
UPDATE public.lessons SET duration = '12 min' WHERE id = 'c0000000-0000-0000-0000-000000000010';
UPDATE public.lessons SET duration = '10 min' WHERE id = 'c0000000-0000-0000-0000-000000000011';
UPDATE public.lessons SET duration = '10 min' WHERE id = 'c0000000-0000-0000-0000-000000000012';
UPDATE public.lessons SET duration = '10 min' WHERE id = 'c0000000-0000-0000-0000-000000000013';
UPDATE public.lessons SET duration = '15 min' WHERE id = 'c0000000-0000-0000-0000-000000000014';
UPDATE public.lessons SET duration = '20 min' WHERE id = 'c0000000-0000-0000-0000-000000000015';
UPDATE public.lessons SET duration = '5 min' WHERE id = 'c0000000-0000-0000-0000-000000000016';
UPDATE public.lessons SET duration = '10 min' WHERE id = 'c0000000-0000-0000-0000-000000000017';
UPDATE public.lessons SET duration = '3 min' WHERE id = 'c0000000-0000-0000-0000-000000000018';
UPDATE public.lessons SET duration = '3 min' WHERE id = 'c0000000-0000-0000-0000-000000000019';
UPDATE public.lessons SET duration = '5 min' WHERE id = 'c0000000-0000-0000-0000-000000000020';
UPDATE public.lessons SET duration = '8 min' WHERE id = 'c0000000-0000-0000-0000-000000000021';
