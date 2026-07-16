# axis-claude-skills

Central [Claude Code](https://code.claude.com) plugin marketplace for the **Axis** skills
ecosystem. **Axis** is an opinionated way of building backend software — Hexagonal Architecture +
DDD + CQRS + Vertical Slices with errors-as-values (`AxisResult`) — currently materialized as a
C#/.NET framework and skill set in
[`axis-sys/axis-framework-dotnet`](https://github.com/axis-sys/axis-framework-dotnet).

This repo is the single entry point for using those skills in Claude Code: it hosts the
deterministic intent router (`axis-router`) and aggregates the domain skill plugins — each domain
keeps living in its own repository and is pulled in via `git-subdir` sources.

## Plugins

| Plugin | Source | What it does |
|---|---|---|
| `axis-router` | this repo | `UserPromptSubmit` hook that keyword-matches the prompt (local, zero API calls) and injects a suggested skill route into the context |
| `axis-dotnet` | [`axis-sys/axis-framework-dotnet`](https://github.com/axis-sys/axis-framework-dotnet) → `skills/plugins/axis-dotnet` | 28 skills for C#/.NET backend engineering the Axis way (Hexagonal + DDD + CQRS + Vertical Slices + AxisResult); start from the `axis-dotnet-architect` hub |

## Get started

Requirements: [Claude Code](https://code.claude.com) with plugin-marketplace support, and
[Node.js](https://nodejs.org) ≥ 18 on your `PATH` (the router hook runs `node`).

**1. Add the marketplace and install both plugins:**

```bash
claude plugin marketplace add axis-sys/axis-claude-skills
claude plugin install axis-router@axis-claude-skills
claude plugin install axis-dotnet@axis-claude-skills
```

**2. Start a new Claude Code session** — hooks are only picked up by sessions started after the
install.

**3. Try it.** Type a prompt with clear .NET intent, e.g. *"implementar um handler cqrs no
backend"*. The router injects a note like this into the context before the model answers:

```
[axis-router] Intent detected in the prompt: implement-feature (keywords: implementar, backend, ...).
Suggested primary skill: axis-dotnet:axis-dotnet-architect. Related: ...
```

Vague prompts and slash commands produce no note — the router only speaks when it is confident.

To pick up new skill versions later:

```bash
claude plugin marketplace update axis-claude-skills
```

## How routing works

Two layers, by design:

1. **Deterministic** — `axis-router`'s hook matches ≥ 2 distinct keywords (PT/EN,
   accent-insensitive) of one intent in `plugins/axis-router/router.mapping.json` and injects a
   `[axis-router]` suggestion: primary skill + related skills with priorities. Silent when not
   confident; never blocks the prompt.
2. **Semantic** — the session model maps intent to skills itself when the hook stays silent.

The full algorithm, mapping schema and maintenance playbook are documented in the
[`axis-router` skill](plugins/axis-router/skills/axis-router/SKILL.md).

## Extending the mapping

New skill in a domain plugin → add its route to `router.mapping.json` **in the same PR**.
Skill names are qualified (`plugin:skill`, e.g. `axis-dotnet:axis-saga`). Test locally:

```bash
echo '{"prompt":"implementar um handler cqrs no backend"}' | node plugins/axis-router/hooks/router.js
```

## License

[Apache-2.0](LICENSE)
