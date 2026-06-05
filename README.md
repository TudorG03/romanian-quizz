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
| Dancer model   | [`RobotExpressive.glb`](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive) — CC0, ships with `Dance` / `Jump` / `ThumbsUp` / `Wave` / `Death` clips |
| State          | `zustand` |
| UI / styling   | Tailwind CSS v4 |
| Content        | parsed at **build time** from `/content` into a bundled JSON |

> Note: the original plan used Ready Player Me for a realistic avatar, but RPM shut
> down (Netflix acquisition, Jan 2026). We use the CC0 RobotExpressive robot
> instead. Swapping in a realistic character later is a drop-in — replace the GLB
> and remap the clip names in `src/components/Dancer.tsx`.

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

Supported formats: **`.txt` / `.md`** (native format), **`.json`**, **`.docx`**
(text extracted via `mammoth`, then parsed as native).

Each question has exactly **two** options (the game is a binary swipe) and exactly
**one** correct answer.

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
  fetch-assets.mjs            # downloads the dancer GLB
  build-questions.ts          # /content -> src/data/questions.generated.json
public/models/RobotExpressive.glb
src/
  app/                        # layout, page, global styles
  components/                 # Game, GameCanvas, Stage, Dancer, Crowd, Confetti, screens, HUD, QuestionCard
  content/                    # universal types + parser strategies
  data/                       # typed question bank (generated JSON is gitignored)
  game/                       # zustand store + batch sampling
```

## Deploy to Vercel

Import the repo in Vercel and deploy — no configuration needed. The default build
command (`next build`) runs `prebuild`, which fetches the asset and regenerates the
question bank, so the deployed app needs no runtime filesystem access.

## License / assets

`RobotExpressive.glb` is CC0 (three.js examples, by Tomás Laulhé, modified by Don
McCurdy). Sample questions are illustrative BAC-style items.
