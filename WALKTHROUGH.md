# ImmunoExplorer — Demo Video Script (~5–6 min)

A script for the app-demo segment of the larger project presentation. The wider talk
already covers *why* the project exists and the science — so this video stays focused on
**what the app does**: a tour of the tool and what each part lets you do.

Audience is mixed (students, researchers, business). Keep the language plain; explain a
term the first time it appears, then move on. Lines in _italics_ are roughly what to say;
the rest is what to click.

## Setup (off-camera)

- `npm i`, then `npm run dev`, open the `localhost` URL.
- Optional: for the **Data Chat** page, run a local LM Studio (or any OpenAI-compatible)
  server on `127.0.0.1:1234` with a model loaded and CORS on. If you skip it, the page
  shows an "Offline" badge — just narrate that.

---

## 1. What this is (0:00–0:30)

_"This is ImmunoExplorer — an interactive dashboard for exploring the data from our flu
vaccine study. Instead of digging through spreadsheets, you can browse the whole dataset,
drill down to a single participant, and even ask questions in plain English. Let me show
you the five views."_

Gesture at the sidebar. _"Each view answers a different question about the data."_

One term to seed (you'll lean on it later): _"The key measurement is the antibody level
against each flu strain, taken before and after the shot — so most of what we'll look at
is 'how much did people's immunity go up.'"_

---

## 2. Dataset Overview — "what's in the dataset" (0:30–1:45)

Click **Dataset Overview**.

- Stat cards: _"Top line — how many participants, how many flu strains we tested against,
  how many time points, and how many study groups."_
- Charts: _"Below that, the makeup of the study — group sizes, ages, sex split."_ Hover a
  bar to show the tooltip. _"Everything's interactive; hover anything for the exact
  numbers."_
- Bottom row: _"And how complete the data is — for instance, the one-year follow-up has
  fewer measurements than the early visits. That kind of gap is good to know before you
  trust a chart."_

_"So this first page is the at-a-glance summary of the whole study."_

---

## 3. HAI Titer Explorer — "did the vaccine work" (1:45–3:00)

Click **HAI Titer Explorer**.

- Strain dropdown (top right): _"Here we look at one flu strain at a time — I'll pick
  one."_ (Switch it; everything updates.)
- Summary strip: _"These tiles give the headline: how many people we measured, and how
  much their antibody levels rose on average."_
- Box plot: _"This shows the spread before and after vaccination — you can see the whole
  group shift upward, which is the vaccine doing its job."_
- Before-vs-after scatter: _"Each dot is one person. Anything above the dashed line means
  their immunity went up by the post-vaccine visit. Color is which study group they were
  in."_ Hover a dot.
- _"And on the right, the same response broken out by study group, so you can compare
  them."_

_"This is the page you'd use to answer 'did people respond, and by how much.'"_

---

## 4. Feature Correlations — "how strains relate" (3:00–3:50)

Click **Feature Correlations**.

- _"This view asks whether immunity to different flu strains tends to go together — if
  someone's protected against one strain, are they usually protected against a similar
  one?"_
- Point at the heatmap: _"Blue squares are pairs that move together, red move opposite,
  dark are unrelated. You can usually spot blocks of related strains lighting up blue."_
- Subtype dropdown: _"And you can focus in on one family of strains."_ (Switch it.)

_"It's a quick way to see structure across the strains without reading a table of
numbers."_

---

## 5. Participant Deep Dive — "one person in context" (3:50–4:50)

Click **Participant Deep Dive**.

- Participant dropdown: _"Now we zoom all the way in to a single participant."_ (Pick one.)
- Summary cards: _"How strongly this person responded, and how they stack up against the
  typical participant."_
- Bar chart: _"Blue is this person, grey is the study average — so you can see at a glance
  where they're a strong or weak responder."_
- Table: _"And the full detail — every strain, the before and after numbers, and a simple
  yes/no on whether the vaccine clearly worked for them."_ Scroll it.

_"Switch the person and the whole page updates — handy for checking interesting cases."_

---

## 6. Data Chat — "just ask" (4:50–5:30)

Click **Data Chat**.

- _"Finally, if you don't want to hunt through charts, you can just ask. This chat is
  wired up to the real dataset, and it runs on a local model, so nothing leaves the
  machine."_
- Click a suggested question and let it answer. _"It'll only answer from what's actually
  in the data — ask for something we didn't collect and it tells you so."_
- If offline: _"This one needs a local model running; it's offline in this recording, but
  it's loaded with the dataset's real numbers and answers from them when connected."_

---

## 7. Wrap (5:30)

_"So that's ImmunoExplorer: a summary of the study, a view of how people responded, the
relationships between strains, a deep dive on any individual, and a chat to ask anything —
all on one dataset, in one place."_

---

### One-liners (if you need to trim to ~3 min, keep these)

| View | Say this |
|------|----------|
| Dataset Overview | At-a-glance summary of who's in the study and how complete the data is |
| HAI Titer Explorer | Did people's immunity go up after the shot, and by how much |
| Feature Correlations | Which flu strains' immunity tends to move together |
| Participant Deep Dive | One person's response, compared to the average |
| Data Chat | Ask questions about the data in plain English, runs locally |
