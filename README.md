# Suhba · صحبة

**Companionship on the way to the masjid.** Suhba helps reverts, and Muslims who find it hard to practise, build consistency and gain the confidence to walk into a mosque, starting with a companion who meets you at the door. UAE first.

> Early prototype. Companions are sample profiles, data is stored only in your browser, and the religious guides are drafts awaiting scholar review.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/otisvg/oystercard.git suhba
cd suhba
git checkout suhba
npm install
npm run dev
```

Open http://localhost:3000. No accounts or API keys are needed.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm test` | Unit tests (prayer times, Jummah, matching, privacy, progress) |
| `npm run lint` | ESLint |
| `npm run build && npm start` | Production build and server |

## What's in it

- **Today**: next prayer in a mihrab-style niche with a countdown, the Hijri date, a one-tap prayer log, upcoming meet-ups, and a Ramadan card with suhoor and iftar times when it's Ramadan.
- **Prayer**: the five daily times using the UAE method (Fajr and Isha at 18.2°, Jummah at 1:15 pm), a Qibla compass that can use the phone's compass, fasting times and the nearest mosques.
- **Mosques**: sample mosques that work offline, plus real mosques near you from OpenStreetMap. Each mosque has facilities, a meeting point, directions and a "first visit" guide.
- **Companion**: pick a prayer and a mosque, then see same-gender companions who are already going. You request one, chat in the app, meet at the entrance and leave private feedback. Safety tools include a trusted-contact check-in, report and block, and distances shown only as rough bands. People who want to help can also say when they're going and offer to accompany someone.
- **Learn**: step-by-step guides with Arabic, transliteration and meaning for the five pillars, wudu, how to pray, your first mosque visit, Jummah and fasting.
- **Progress**: a private week grid that's gentle about gaps, and a "confidence ladder" that runs from learning wudu to going to the mosque on your own.

## Design

The design takes its inspiration from the inside of a quiet mosque: lime-plaster and sandstone tones, a deep tile green, gold-leaf hairlines, arches and the eight-point star (khatam). Headings use Cormorant Garamond and the Arabic uses Amiri. The app supports dark mode, where the niche becomes a mosque at night.

## Code map

```
src/
  app/          routes (thin server pages that render the views)
  views/        one client view per screen
  components/   UI primitives, ornaments (arch, star, lattice), shared pieces
  lib/
    prayer.ts     prayer times, Jummah, Qibla, Hijri date (adhan library)
    companions.ts demo companion pool and matching rules
    places.ts     launch areas, sample mosques, distance bands
    osm.ts        OpenStreetMap mosque lookup
    progress.ts   week summary and confidence ladder
    guides.ts     guide content (DRAFT, needs scholar review)
    store.ts      local data store: the single seam to swap for Supabase
```

## Moving to a real backend

All reads go through `useAppState()` and all writes go through the actions exported from `src/lib/store.ts`. To go live, keep those names and replace their bodies with Supabase calls:

- Postgres tables for profiles, availability, requests and messages, with PostGIS for "companions going to this mosque".
- Realtime for chat.
- UAE Pass for identity.

The demo-only parts are marked in the code: the simulated acceptance (`acceptAt`) and the canned replies.

## Before launch

- Have every guide reviewed by a qualified scholar or licensed partner.
- Get a legal opinion on UAE licensing for religious activity, and partner with GAIAEZ or IACAD.
- Check the calculated prayer times against the official GAIAEZ timetable.
- Integrate UAE Pass, a real safety and reporting team, and real check-in notifications.
