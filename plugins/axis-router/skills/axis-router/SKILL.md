---
name: axis-router
description: >
  Navigate and maintain the deterministic intent router of the Axis skills ecosystem — the
  UserPromptSubmit hook that keyword-matches prompts against router.mapping.json and injects a
  suggested skill route into the context. Use when adding a new skill or intent to the ecosystem,
  tuning routing keywords, or debugging why a prompt did or did not route.
---

# axis-router

The Axis ecosystem routes work to skills through **two layers**:

1. **Deterministic layer (this plugin)** — the `UserPromptSubmit` hook in
   `hooks/router.js`. Local keyword matching, zero dependencies, zero API calls. When confident,
   it injects a `[axis-router]` note suggesting a route; the session model decides and loads.
2. **Semantic layer (global `CLAUDE.md`)** — the model itself maps intent to skills when the hook
   stays silent (vague prompt, or wording outside the keyword set).

The hook never replaces the model's judgment: it only *suggests*. A false positive is explicitly
ignorable; a silent hook means "no confident route", not "no route".

## How the hook decides

| Parameter | Value | Meaning |
|---|---|---|
| Normalization | lowercase → NFD → strip diacritics | PT with/without accents ≡ EN (`execução` ≡ `execucao`) |
| `MIN_HITS` | 2 | at least 2 **distinct** keywords of the same intent must appear in the prompt |
| Tie-break | most hits wins | the intent with more distinct matched keywords is chosen |
| Slash guard | `prompt.startsWith('/')` → exit | slash commands already route themselves |
| No match | empty stdout, exit 0 | silent — never pollutes the context |
| Any error | swallowed, exit 0 | the router must never take down the user's prompt |

Matching is substring-based (`prompt.includes(keyword)`) over the normalized prompt, so keep
keywords distinctive; `MIN_HITS = 2` is what keeps short keywords safe.

## `router.mapping.json` schema

The mapping is the **single source of truth** for routes. Root key is `intent_patterns`
(required — the hook destructures it):

```jsonc
{
  "intent_patterns": {
    "<intent-name>": {
      "keywords": ["..."],                     // PT + EN, short phrases allowed
      "primary_skill": "<plugin>:<skill>",     // qualified name, e.g. axis-dotnet:axis-saga
      "related_skills": [
        { "name": "<plugin>:<skill>", "priority": "high|medium|low", "reason": "optional" }
      ],
      "domain": "<domain>"                     // e.g. "dotnet"
    }
  }
}
```

Skill names are **qualified** (`plugin:skill`) because the router lives in its own plugin and
routes across plugins — that is the format the Skill tool accepts.

## Playbook: adding a skill or intent

1. New skill lands in a domain plugin (e.g. `axis-dotnet`) → **add or update its route in
   `router.mapping.json` in the same PR**. A skill without a route only exists for the semantic layer.
2. Pick keywords from the skill's `description` frontmatter: nouns and verbs a user would actually
   type, PT + EN. Avoid keywords shorter than 3 chars and generic English words (`then`, `map`).
3. If the skill is an entry point for a whole intention, give it a new `intent_patterns` entry;
   if it supports an existing intention, add it to that intent's `related_skills`.
4. Re-test locally (below) with a realistic prompt before merging.

## Testing locally

```bash
# should print a route (>= 2 keywords hit):
echo '{"prompt":"implementar um handler cqrs no backend"}' | node hooks/router.js

# should print nothing (vague / slash / invalid input):
echo '{"prompt":"me ajuda com uma coisa"}' | node hooks/router.js
echo '{"prompt":"/commit"}' | node hooks/router.js
echo 'not json' | node hooks/router.js; echo "exit=$?"   # exit=0, silent
```

The installed copy lives under `~/.claude/plugins/cache/axis-claude-skills/axis-router/<version>/`;
hooks are picked up by **new** Claude Code sessions only.
