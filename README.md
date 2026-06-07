# Dansul Bacului 💃🕺

A browser quiz game for the Romanian BAC **proba de limba română**, in the spirit
of a TikTok dance filter. A 3D dancer performs on a neon stage; a question appears
and you **swipe left or right** (or use the arrow keys / tap) to pick one of two
answers. Get it right and the dancer celebrates while the crowd cheers and confetti
flies; get it wrong and the dancer falls to the floor. The loop then smoothly
crossfades back to dancing and the next question appears.

- **+1** per correct answer, plus a **session high score** (no persistence — it
  resets on a full page reload, by design).
- Pick a run length on the start screen: **10 / 15 / 20** questions, sampled at
  random from the question bank.
- Portrait-first (mobile/TikTok-style), but fully responsive on desktop.

## Tech stack

| Concern        | Choice |
| -------------- | ------ |
| Framework      | Next.js 16 (App Router, TypeScript), deploys on Vercel |
| 3D             | three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (bloom) |
| Dancer model   | Mixamo-sourced human male dancer — three single-clip FBX (`dance.fbx` loop / `cheer.fbx` correct / `fall.fbx` wrong), loaded and retargeted in the browser |
| State          | `zustand` |
| UI / styling   | Tailwind CSS v4 |
| Content        | parsed at **build time** from `/content` into a bundled JSON |

> Note: the original plan used Ready Player Me for a realistic avatar, but RPM shut
> down (Netflix acquisition, Jan 2026), so the dancer is a set of Mixamo FBX clips
> committed to the repo. All three clips share one skeleton, so the cheer/fall
> animations retarget onto the dance mesh at runtime. Swapping characters is a
> drop-in — replace the FBX files (same rig) and adjust `FBX`/`CLIPS` in
> `src/components/Dancer.tsx`.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

`predev`/`prebuild` automatically (1) download the dancer GLB into `public/models`
and (2) parse `/content` into `src/data/questions.generated.json`, so a fresh
checkout just works.

```bash
npm run build && npm start   # production build + serve
npm run lint                 # eslint
```

## Authoring questions

Drop question files into the **`/content`** folder. They're parsed at build time;
re-running `npm run dev`/`build` (or `npm run build:questions`) regenerates the bank.

Supported formats: **`.docx`** (lettered MCQ — the real BAC bank lives here),
**`.txt` / `.md`** (native format), and **`.json`**.

Each question has exactly **two** options (the game is a binary swipe) and exactly
**one** correct answer. The correct answer's **on-screen side (left/right) is
randomized per question at runtime**, so authoring always-correct-first is fine.

### Lettered MCQ (`.docx`)

The shipped question bank (`content/bac-romana.docx`) uses this format: numbered
questions, lettered options, and the correct one tagged with a trailing `(C)`.
Lines that are neither numbered nor lettered are treated as **topic headers** and
ignored — questions from every topic are shuffled together.

```
Luceafărul

1. Artă poetică aparținând lui Mihai Eminescu
A. Luceafărul (C)
B. Testament

2. În ce an este publicat poemul Luceafărul?
A. 1883 (C)
B. 1914
```

Text is extracted from the `.docx` via `mammoth`, then parsed. The build **fails
loudly** on a malformed question (not exactly two options, not exactly one `(C)`).

### Native text format

Blocks are separated by a blank line or a `---` rule. The correct answer is marked
with a trailing `*`. Lines starting with `#` are comments.

```
Q: Cine a scris poemul „Luceafărul"?
A) Mihai Eminescu *
B) Ion Creangă
---
Q: „A fost odată ca niciodată" introduce un text de tip…
- basm *
- fabulă
```

- The question line may start with `Q:` / `Î:` / `Întrebare:`, or just be the
  first non-option line of the block.
- Option lines start with `A)` `B)` `a.` `-` `*` `•`.
- The build **fails loudly** on a malformed block (missing question, not exactly
  two options, not exactly one correct answer).

### JSON format

```json
[
  { "prompt": "Cine a scris „Ion\"?", "options": ["Liviu Rebreanu", "Marin Preda"], "correctIndex": 0 }
]
```

`prompt`/`question`, `options`/`answers`, and `correctIndex`/`correct`
(a `0`/`1` index, an `"A"`/`"B"` letter, or the exact correct-option text) are all
accepted.

### Adding a new format (strategy pattern)

Parsing is a strategy pattern. To support a new text format, implement
`QuestionParser` (`src/content/types.ts`) and register it in
`src/content/parsers/index.ts` — everything downstream consumes the universal
`Question` type.

## Controls

- **Swipe / drag** the prompt card left or right
- **← / →** arrow keys
- **Tap** an answer panel

## Project structure

```
content/                      # author-supplied question files (build input)
scripts/
  fetch-assets.mjs            # verifies the committed dancer FBX files are present
  build-questions.ts          # /content -> src/data/questions.generated.json
public/models/{dance,cheer,fall}.fbx
src/
  app/                        # layout, page, global styles
  components/                 # Game, GameCanvas, Stage, Dancer, Crowd, Confetti, screens, HUD, QuestionCard
  content/                    # universal types + parser strategies
  data/                       # typed question bank (generated JSON is gitignored)
  game/                       # zustand store + batch sampling
```

## Deploy to Vercel

Import the repo in Vercel and deploy — no configuration needed. The default build
command (`next build`) runs `prebuild`, which verifies the committed dancer asset
and regenerates the question bank, so the deployed app needs no runtime filesystem
access.

## License / assets

The dancer FBX files are exported from Mixamo (Adobe) — see Mixamo's license terms
for use of its characters and animations. The question bank in `content/` is
author-supplied BAC study material.
