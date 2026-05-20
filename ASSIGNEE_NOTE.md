# Assignee Extraction — Design Note

## The Problem

Assignee extraction is the hardest part of meeting NLP. Meeting language is informal, indirect, and full of ambiguity:

- "Someone should look into the billing issue" — who?
- "We'll get the deploy done by Friday" — we who?
- "That's on the eng team" — which engineer?
- "Lisa" (mentioned 10 minutes earlier, no last name) — which Lisa?

Even strong LLMs hallucinate or misattribute owners, especially in long transcripts with many speakers.

---

## How This App Handles It

### 1. Explicit prompt rules in the system message

The extraction system prompt includes precise assignee heuristics:

```
- "John will handle X"       → assignee: "John"
- "Sarah to complete Y"      → assignee: "Sarah"
- "@alice review the doc"    → assignee: "Alice"
- Passive / vague language   → assignee: "Unassigned"
```

This instructs the model to be conservative — only assign a name when syntactically clear, not by inference.

### 2. "Unassigned" as a first-class value

Rather than forcing a name, the model returns `"Unassigned"` for ambiguous items. The UI then:

- **Flags these visually** with an amber left border and `⚠ No owner` badge
- **Shows a warning banner** at the bottom of the action items panel
- Prompts the user to manually review before sharing

This surfaces errors to the human rather than hiding them behind a wrong name.

### 3. Context from the participant list

The model is given the full participant list (extracted first), so when it sees "he'll handle it" after "Marcus mentioned…", it can resolve the pronoun. This reduces errors from coreference chains.

### 4. UI escape hatch — chat to clarify

If an extraction is wrong, the user can open **Chat** and ask:

> "Who should own the Stripe documentation task?"

The model re-reads the raw transcript and can give a more considered answer than the one-shot extraction pass.

---

## What Still Goes Wrong (Known Limitations)

| Scenario | Failure mode | Mitigation |
|---|---|---|
| Multiple people named "Sarah" | Wrong Sarah assigned | Use full names; flag for review |
| Passive voice tasks | No assignee extracted | Shows as Unassigned — correct behavior |
| Implied ownership from role | "QA will validate" → Tom Okafor | Only works if participant list is present in transcript |
| Non-English transcripts | Extraction quality degrades | Tested on English only for this MVP |
| Very long transcripts (>4k words) | Context dilution | Chunk transcript before extraction in v2 |

---

## Recommended Production Improvements

1. **Post-processing pass**: Run a second Claude call with only the participant list and the action items, asking it to validate and confirm assignees.
2. **Human-in-the-loop editor**: Inline editable assignee field in the UI — click a name to change it.
3. **Confidence scoring**: Ask the model to return `"confidence": "high|medium|low"` per action item; surface low-confidence items prominently.
4. **Speaker-diarized input**: If the transcript comes from a meeting tool (Otter, Fireflies) with speaker labels, use those as ground truth and skip LLM-based attribution entirely.
