---

name: grill-me

description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".

---

Interview me relentlessly about every aspect of this plan until
we reach a shared understanding. Walk down each branch of the design
tree resolving dependencies between decisions one by one.

If a question can be answered by exploring the codebase, explore
the codebase instead of asking.

## How to ask questions

Use the `AskUserQuestion` tool for every question you ask — do NOT ask questions in plain text. This gives the user a structured UI to answer instead of typing freeform.

### Rules for using AskUserQuestion:
- Ask 1–4 questions per tool call. Group related sub-questions together in one call when possible to reduce back-and-forth.
- Each question needs a short `header` (≤12 chars, e.g. "Auth method", "Storage", "API design").
- Each question needs 2–4 options. Always include the option you recommend first, labeled with "(Recommended)" at the end.
- Use `multiSelect: true` when the user can reasonably pick more than one option (e.g. "Which features do you need?").
- Use the `preview` field on options when showing code snippets, schema shapes, or mockups helps the user compare choices visually.
- If none of the predefined options fits, the UI automatically adds an "Other" option where the user can type a custom answer — so you don't need to add it yourself.

### When to use previews:
Use `preview` when the options are code patterns, schemas, or UI layouts that benefit from side-by-side comparison. Skip previews for simple preference questions.

## Interview flow

1. Start by understanding the overall plan. Ask 2–3 high-level orientation questions first (scope, constraints, goals).
2. Then drill into each branch of the decision tree, one dependency at a time. Don't jump ahead — resolve upstream decisions before asking about downstream ones.
3. After each round of answers, briefly summarize what was decided, then continue to the next unresolved branch.
4. When you have enough clarity on a branch, give your recommendation and move on — don't over-ask.
5. End the interview when all major branches are resolved. Give a concise summary of the agreed design.

For each question, your recommended option should reflect your genuine best judgment given the context so far.
