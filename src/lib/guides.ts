/**
 * Beginner guides. DRAFT CONTENT: every guide must be reviewed by a qualified
 * scholar or licensed partner before public launch (see the UAE rules in the
 * concept doc). The UI shows a review banner on every guide.
 */
export interface GuideStep {
  title: string;
  body: string;
  arabic?: string;
  transliteration?: string;
  meaning?: string;
}

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  steps: GuideStep[];
}

export const GUIDES: Guide[] = [
  {
    slug: "five-pillars",
    title: "The five pillars",
    summary: "The five core practices every Muslim builds their life around, in plain language.",
    minutes: 4,
    steps: [
      {
        title: "1. Shahada — the declaration of faith",
        body: "Believing and saying that there is no god but Allah and that Muhammad ﷺ is His messenger. It's how someone becomes Muslim, and Muslims repeat it in every prayer.",
        arabic: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
        transliteration: "Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan rasulullah",
        meaning: "I bear witness that there is no god but Allah, and I bear witness that Muhammad is the messenger of Allah.",
      },
      {
        title: "2. Salah — the five daily prayers",
        body: "Fajr, Dhuhr, Asr, Maghrib and Isha, each at its own time. If five feels like a lot right now, start with one and build up — the app's progress tab is built for exactly that.",
      },
      {
        title: "3. Zakat — giving to those in need",
        body: "Once a year, Muslims whose savings stay above a minimum threshold (the nisab) for a full lunar year give 2.5% of them to people in need. In the UAE you can pay through official zakat channels.",
      },
      {
        title: "4. Sawm — fasting in Ramadan",
        body: "During the month of Ramadan, healthy adults go without food and drink from dawn (Fajr) to sunset (Maghrib). See the fasting guide for the details.",
      },
      {
        title: "5. Hajj — the pilgrimage to Makkah",
        body: "Once in a lifetime, for those who are physically and financially able. Many people perform Umrah, the lesser pilgrimage, first.",
      },
    ],
  },
  {
    slug: "wudu",
    title: "How to make wudu",
    summary: "The washing you do before prayer. Takes about two minutes once you know it.",
    minutes: 5,
    steps: [
      { title: "Make the intention", body: "In your heart, intend to make wudu for prayer. Then say Bismillah.", arabic: "بِسْمِ اللَّهِ", transliteration: "Bismillah", meaning: "In the name of Allah" },
      { title: "Wash your hands", body: "Wash both hands up to the wrists, three times, getting water between the fingers." },
      { title: "Rinse your mouth", body: "Take water into your mouth with your right hand, swirl it and spit it out. Three times." },
      { title: "Rinse your nose", body: "Gently sniff a little water into your nose with your right hand and blow it out with your left. Three times." },
      { title: "Wash your face", body: "Wash your whole face — from the hairline to the chin and from ear to ear — three times." },
      { title: "Wash your arms", body: "Wash your right arm from the fingertips up to and including the elbow, three times. Then the left arm." },
      { title: "Wipe your head", body: "With wet hands, wipe over your head from the front to the back and back again. Once." },
      { title: "Wipe your ears", body: "With wet fingers, wipe the inside of your ears with your index fingers and the back with your thumbs. Once." },
      { title: "Wash your feet", body: "Wash your right foot up to and including the ankle, three times, getting between the toes. Then the left foot." },
      {
        title: "Finish with the shahada",
        body: "It's recommended to say the declaration of faith after wudu. Wudu stays valid until something breaks it, such as using the toilet, passing wind or falling into a deep sleep.",
        arabic: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
        transliteration: "Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan abduhu wa rasuluh",
        meaning: "I bear witness that there is no god but Allah, and that Muhammad is His servant and messenger.",
      },
    ],
  },
  {
    slug: "how-to-pray",
    title: "How to pray, step by step",
    summary: "A two-rak'ah prayer (like Fajr), one movement at a time. Reading from your phone while you learn is fine.",
    minutes: 8,
    steps: [
      { title: "Face the Qibla and intend", body: "Stand facing the direction of Makkah (the Prayer tab shows it). In your heart, intend which prayer you are about to pray." },
      {
        title: "Begin with the takbir",
        body: "Raise your hands to your ears (or shoulders) and say:",
        arabic: "اللَّهُ أَكْبَرُ",
        transliteration: "Allahu Akbar",
        meaning: "Allah is the Greatest",
      },
      {
        title: "Stand and recite Al-Fatiha",
        body: "Place your right hand over your left on your chest and recite the opening chapter of the Quran.",
        arabic:
          "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝١ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝٢ الرَّحْمَٰنِ الرَّحِيمِ ۝٣ مَالِكِ يَوْمِ الدِّينِ ۝٤ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝٥ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝٦ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ۝٧",
        transliteration:
          "Bismillahir-rahmanir-rahim. Al-hamdu lillahi rabbil-'alamin. Ar-rahmanir-rahim. Maliki yawmid-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinas-siratal-mustaqim. Siratal-ladhina an'amta 'alayhim, ghayril-maghdubi 'alayhim wa lad-dallin.",
        meaning:
          "In the name of Allah, the Most Gracious, the Most Merciful. All praise is for Allah, Lord of the worlds, the Most Gracious, the Most Merciful, Master of the Day of Judgement. You alone we worship and You alone we ask for help. Guide us to the straight path — the path of those You have blessed, not of those who earned Your anger, nor of those who went astray.",
      },
      {
        title: "Recite a short surah",
        body: "After Al-Fatiha, in the first two rak'ahs, recite any short passage. Al-Ikhlas is a common first one to learn.",
        arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝١ اللَّهُ الصَّمَدُ ۝٢ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝٣ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ۝٤",
        transliteration: "Qul huwa Allahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.",
        meaning: "Say: He is Allah, the One. Allah, the Eternal. He neither begets nor was begotten, and there is none comparable to Him.",
      },
      {
        title: "Bow (ruku')",
        body: "Say Allahu Akbar and bow, hands on your knees and back straight. Say three times:",
        arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
        transliteration: "Subhana Rabbiyal-'Adhim",
        meaning: "Glory be to my Lord, the Magnificent",
      },
      {
        title: "Rise from the bow",
        body: "Stand up straight while saying the first phrase, then say the second once standing.",
        arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ، رَبَّنَا وَلَكَ الْحَمْدُ",
        transliteration: "Sami'Allahu liman hamidah. Rabbana wa lakal-hamd.",
        meaning: "Allah hears those who praise Him. Our Lord, to You belongs all praise.",
      },
      {
        title: "Prostrate (sujood)",
        body: "Say Allahu Akbar and go down to the ground: forehead, nose, both palms, knees and toes touching the floor. Say three times:",
        arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
        transliteration: "Subhana Rabbiyal-A'la",
        meaning: "Glory be to my Lord, the Most High",
      },
      {
        title: "Sit, then prostrate again",
        body: "Say Allahu Akbar and sit up briefly, saying the phrase below. Then say Allahu Akbar and make a second prostration exactly like the first. That completes one rak'ah.",
        arabic: "رَبِّ اغْفِرْ لِي",
        transliteration: "Rabbighfir li",
        meaning: "My Lord, forgive me",
      },
      { title: "Stand for the second rak'ah", body: "Say Allahu Akbar, stand up, and repeat Al-Fatiha, a short surah, the bow and the two prostrations." },
      {
        title: "Sit for the tashahhud",
        body: "After the second prostration of the second rak'ah, stay sitting and recite the tashahhud, then send blessings on the Prophet ﷺ (a companion or teacher can help you learn that part).",
        arabic:
          "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
        transliteration:
          "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan 'abduhu wa rasuluh.",
        meaning:
          "All greetings, prayers and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and that Muhammad is His servant and messenger.",
      },
      {
        title: "End with the salam",
        body: "Turn your head to the right and say the greeting below, then turn to the left and say it again. Your prayer is complete.",
        arabic: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
        transliteration: "As-salamu 'alaykum wa rahmatullah",
        meaning: "Peace be upon you and the mercy of Allah",
      },
      {
        title: "Three- and four-rak'ah prayers",
        body: "For Maghrib (3), and Dhuhr, Asr and Isha (4): after the tashahhud in the second rak'ah, say Allahu Akbar and stand up again. In the extra rak'ahs recite only Al-Fatiha, then finish with the final tashahhud and salam. In congregation, you simply follow the imam.",
      },
    ],
  },
  {
    slug: "mosque-etiquette",
    title: "Your first visit to the mosque",
    summary: "What to wear, what happens when you walk in, and what to do if you don't know what to do.",
    minutes: 4,
    steps: [
      { title: "What to wear", body: "Clean, loose, modest clothes. Men: at least from navel to knee, and most people wear long trousers. Women: loose clothes covering the body and a headscarf. Avoid strong smells like garlic or onion beforehand." },
      { title: "Make wudu first if you can", body: "Making wudu at home means one less new thing to figure out when you arrive. Most mosques also have a wudu area." },
      { title: "Walking in", body: "Step in with your right foot, take your shoes off and put them in the racks. Say \"Assalamu alaikum\" to people you pass — that's all the small talk needed. Brothers and sisters usually have separate entrances and prayer areas." },
      { title: "While you wait", body: "If there's time, you can pray two short rak'ahs to greet the mosque, or just sit quietly. Put your phone on silent." },
      { title: "When the prayer starts", body: "People stand in straight rows, shoulder to shoulder, filling the front rows first. Follow the imam: don't move before him. If you're unsure, copy the person next to you — honestly, nobody is watching you as closely as you think." },
      { title: "Afterwards", body: "Many people stay to say a few remembrances (dhikr) or pray extra rak'ahs. You're welcome to leave quietly whenever you're ready, stepping out with your left foot." },
    ],
  },
  {
    slug: "jummah",
    title: "Friday prayer (Jummah)",
    summary: "The weekly congregational prayer that replaces Dhuhr on Fridays.",
    minutes: 3,
    steps: [
      { title: "What it is", body: "A short sermon (khutbah) followed by a two-rak'ah prayer led by the imam. It replaces Dhuhr on Fridays. It's an obligation for adult men; women are welcome to attend, and if they do it counts in place of Dhuhr." },
      { title: "When it is in the UAE", body: "Friday prayer across the UAE is held at 1:15 pm. Mosques fill up, so aim to arrive 20–30 minutes early. Check your local mosque for any changes." },
      { title: "Getting ready", body: "It's recommended to take a full bath (ghusl), wear clean clothes and, for men, a little perfume." },
      { title: "During the khutbah", body: "Sit and listen quietly — no talking or phones, even to tell someone else to be quiet. In the UAE the khutbah is usually in Arabic; some mosques and centres offer translations." },
      { title: "The prayer", body: "After the khutbah, stand in rows and follow the imam for two rak'ahs. That's it — you've prayed Jummah." },
    ],
  },
  {
    slug: "fasting",
    title: "Fasting basics",
    summary: "Ramadan fasting explained simply, with tips for your first Ramadan.",
    minutes: 4,
    steps: [
      { title: "When you fast", body: "In Ramadan, the ninth month of the Islamic calendar, from dawn (Fajr) until sunset (Maghrib). The Prayer tab shows both times for your area." },
      { title: "Suhoor and iftar", body: "Suhoor is the meal before Fajr — try not to skip it. Iftar is breaking the fast at Maghrib, traditionally with dates and water." },
      { title: "What breaks the fast", body: "Eating, drinking or smoking on purpose, deliberately making yourself vomit, and intimacy. If you eat or drink because you forgot you were fasting, your fast is still valid — stop when you remember." },
      { title: "Who doesn't have to fast", body: "People who are ill, travelling, pregnant or breastfeeding, or menstruating. Most make up the missed days later; people who can't fast at all for health reasons may give food to someone in need instead (fidyah)." },
      { title: "Your first Ramadan", body: "Start gently, sleep when you can, and break your fast with others — many UAE mosques host free iftars. Taraweeh (the night prayer) is a great time to go with a companion." },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
