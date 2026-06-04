# ImmunoExplorer — Demo Read-Aloud Script (~5–6 min)

**How to use this script:** The large text is what you *say* — read it straight through.
The `▶` lines are what you *do* (click/hover) — glance at them, then keep reading. Pause
briefly at each `▶`.

**Before you hit record (off-camera):**

- `npm i`, then `npm run dev`, and open the `localhost` URL.
- Start the Data Chat engine: have Ollama running with `gemma4`, then
  `cd ImmunoExplorer/server && shiny run querychat_app.py --port 8001`.
  Ask it one question first so the model is warm before recording.
- Have the app open on the **Dataset Overview** page to start.

---

## 1. Intro — (0:00–0:35)

> Hello and welcome to our demo for ImmunoExplorer — a conceptual app developed by
> Arvind Krish, Brian Hill, and Chayan Tronson for the CMI-Flu project as part of our capstone for
> UCSD Data Science & Engineering Master's program.

> ImmunoExplorer is an interactive dashboard for exploring the data from our flu vaccine
> study. Instead of digging through spreadsheets, you can browse the whole dataset, drill
> down to a single participant, and even ask questions in plain English.

▶ *Gesture to the sidebar.*

> One term you'll hear throughout: the key measurement is a person's antibody level against
> each flu strain, taken before and after the shot — so most of what we look at is simply
> how much did people's immunity go up.

> There are five views. The first four are the figures we think a research team would want
> at their fingertips — the questions we already knew to ask. But the one we're most excited
> about is the fifth: an interactive chat that lets researchers ask the data anything,
> directly. So if these charts don't answer your specific question, or you want to dig
> deeper, you just ask. Keep that in mind as we go — it's where we'll finish.

---

## 2. Dataset Overview — "what's in the dataset" (0:35–1:45)

▶ *Click **Dataset Overview**.*

> Let's start with the big picture. Up top, the headline numbers: how many participants are
> in the study, how many flu strains we tested against, how many time points, and how many
> study groups.

▶ *Point at the stat cards.*

> Below that, the makeup of the study — the group sizes, the age range, and the sex split.
> Everything here is interactive, so I can hover anything to get the exact numbers.

▶ *Hover a bar to show the tooltip.*

▶ *Point at "HAI Measurements by Timepoint."*

> This bottom-left chart shows how many actual antibody measurements we have at each
> timepoint — before the shot, at four weeks, and at one year. Notice the one-year bar is
> much shorter: a lot of people didn't come back for that final visit, so any result at one
> year rests on far less data. That's worth knowing before you read too much into a
> long-term trend.

▶ *Point at "Strains per Antigenic Group."*

> And this chart sorts the flu strains we tested into their families — the H1N1 and H3N2
> groups you've probably heard of, plus the influenza B lineages. The taller the bar, the
> more individual strains we measured in that family. It shows where the study's coverage is
> deepest: we tested far more strains in some groups than others, which tells you which
> questions the rest of the app can answer in real detail and which it can only sketch.

> So this first page is your at-a-glance summary of the whole study.

---

## 3. HAI Titer Explorer — "did the vaccine work" (1:45–3:00)

▶ *Click **HAI Titer Explorer**.*

> This is where we ask: did the vaccine actually work? We look at one flu strain at a time.

▶ *Open the strain dropdown (top right) and pick one — everything updates.*

> These tiles up top give the headline: how many people we measured, and how much their
> antibody levels rose on average.

> This box plot shows the spread before and after vaccination. You can see the whole group
> shift upward — that's the vaccine doing its job.

▶ *Point at the box plot.*

> In this scatter, each dot is one person. Anything above the dashed line means their
> immunity went up by the post-vaccine visit, and the color tells you which study group
> they were in.

▶ *Hover a dot.*

> And on the right, the same response broken out by group, so you can compare them
> side by side. So this is the page you'd use to answer "did people respond, and by how
> much."

---

## 4. Feature Correlations — "how strains relate" (3:00–3:50)

▶ *Click **Feature Correlations**.*

> This view asks a different question: does immunity to different flu strains tend to go
> together? If someone's protected against one strain, are they usually protected against a
> similar one?

▶ *Point at the heatmap.*

> Blue squares are pairs that move together, red ones move in opposite directions, and dark
> ones are unrelated. You can usually spot whole blocks of related strains lighting up blue.

> And I can focus in on just one family of strains.

▶ *Switch the subtype dropdown.*

> It's a quick way to see the structure across the strains without reading a giant table of
> numbers.

---

## 5. Participant Deep Dive — "one person in context" (3:50–4:40)

▶ *Click **Participant Deep Dive**.*

> Now we zoom all the way in — to a single participant.

▶ *Pick a participant from the dropdown.*

> These cards tell us how strongly this person responded, and how they stack up against the
> typical participant.

> In this chart, blue is this person and grey is the study average — so at a glance you can
> see where they're a strong or a weak responder.

▶ *Point at the bar chart.*

> And here's the full detail: every strain, the before-and-after numbers, and a simple
> yes-or-no on whether the vaccine clearly worked for them.

▶ *Scroll the table.*

> Switch the person and the whole page updates — which makes this really handy for checking
> interesting individual cases.

> Now, those four views cover the questions we built for in advance. But a researcher will
> always have one we didn't anticipate — and that's exactly what this last view is for.

---

## 6. Data Chat — the highlight: "just ask" (4:40–6:00)

▶ *Click **Data Chat**.*

> And this is the one we're most excited about. Everything so far answered questions we
> already knew to ask. This view answers the ones we didn't — instead of hunting through
> charts, you just ask, in plain English.

> It runs on a local model, so nothing leaves the machine — and there are no API fees.

> And it doesn't just guess from a summary — behind the scenes it turns your plain-English
> question into a real database query, runs it against the actual dataset, and answers from
> the result. So the numbers are computed live, not made up.

▶ *Type: "How many participants are in each vaccine arm?" and let it answer.*

> It worked out the query on its own and gave us the real counts for each group — and you
> can see the data it pulled right here in the table.

▶ *Point at the data table / the query it ran.*

> I can ask something completely different and it writes a brand-new query on the spot.

▶ *Type: "What's the average age by sex?" and let it answer.*

> And because it's working from the real data, if you ask for something we didn't collect,
> it'll tell you that instead of inventing an answer.

> That's what makes this the centerpiece. The four views give you the prepared story; this
> chat lets you go anywhere they don't — no new chart to build, no analyst to wait on. You
> just ask.

---

## 7. Wrap (6:00)

> So that's ImmunoExplorer: a summary of the study, a view of how people responded, the
> relationships between the strains, and a deep dive on any individual — and then, tying it
> all together, a chat that answers whatever those views don't. The curated figures get you
> started; the chat takes you the rest of the way.

> Thanks for watching.

---

### Backup: trim to ~3 minutes by reading just these

| View | Say this |
|------|----------|
| Dataset Overview | At-a-glance summary of who's in the study and how complete the data is. |
| HAI Titer Explorer | Did people's immunity go up after the shot, and by how much. |
| Feature Correlations | Which flu strains' immunity tends to move together. |
| Participant Deep Dive | One person's response, compared to the average. |
| Data Chat | Ask in plain English — it writes a live query on the real data and answers, all locally. |

### If the Data Chat is offline during recording

> This part needs the local query engine running — it's offline in this recording, but when
> it's connected it queries the dataset live and answers straight from the results.
