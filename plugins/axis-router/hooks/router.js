#!/usr/bin/env node
'use strict';
// axis-router UserPromptSubmit hook (Claude Code) — the deterministic routing layer.
// Keyword matching against ../router.mapping.json: local, zero dependencies, zero API
// calls. When confident (>= 2 distinct keywords of the same intent), it injects the
// suggested skill route into the context; the session model decides and loads.
// It never blocks the prompt: any failure exits silently with code 0.

const fs = require('fs');
const path = require('path');

const MIN_HITS = 2;

const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const prompt = norm(JSON.parse(raw || '{}').prompt || '');
    // Slash commands already route to the right skill — do not interfere.
    if (!prompt || prompt.startsWith('/')) return;

    const mappingPath = path.join(__dirname, '..', 'router.mapping.json');
    const { intent_patterns } = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

    let best = null;
    for (const [intent, pattern] of Object.entries(intent_patterns)) {
      const hits = [...new Set(pattern.keywords.map(norm))].filter((k) => prompt.includes(k));
      if (hits.length >= MIN_HITS && (!best || hits.length > best.hits.length)) {
        best = { intent, hits, pattern };
      }
    }
    if (!best) return; // no confident route → stay silent, do not pollute the context

    const related = best.pattern.related_skills
      .map((s) => `${s.name} (${s.priority}${s.reason ? ': ' + s.reason : ''})`)
      .join('; ');
    process.stdout.write(
      [
        `[axis-router] Intent detected in the prompt: ${best.intent} ` +
          `(keywords: ${best.hits.join(', ')}).`,
        `Suggested primary skill: ${best.pattern.primary_skill}. Related: ${related}.`,
        'If the task matches the intent, load the primary skill and the high-priority ' +
          'related ones via the Skill tool before responding. If this is a false positive, ignore it.',
      ].join('\n')
    );
  } catch {
    // The router must never take down the user's prompt.
  }
});
