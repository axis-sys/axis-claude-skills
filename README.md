# axis-claude-skills

Central [Claude Code](https://code.claude.com) plugin marketplace for the **Axis** skills
ecosystem. It hosts the deterministic intent router and aggregates the domain skill plugins —
each domain keeps living in its own repository and is pulled in via `git-subdir` sources.

## Plugins

| Plugin | Source | What it does |
|---|---|---|
| `axis-router` | this repo | `UserPromptSubmit` hook that keyword-matches the prompt (local, zero API calls) and injects a suggested skill route into the context |
| `axis-dotnet` | [`axis-sys/axis-framework-dotnet`](https://github.com/axis-sys/axis-framework-dotnet) → `skills/plugins/axis-dotnet` | 28 skills for C#/.NET backend engineering the Axis way (Hexagonal + DDD + CQRS + Vertical Slices + AxisResult); start from the `axis-dotnet-architect` hub |

## Install

```bash
claude plugin marketplace add axis-sys/axis-claude-skills
claude plugin install axis-router@axis-claude-skills
claude plugin install axis-dotnet@axis-claude-skills
```

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
