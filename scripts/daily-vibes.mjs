#!/usr/bin/env node
/**
 * Daily Deploy of Joy — text-only Discord bot for the Kuberna Labs server.
 *
 * Post messages as the bot via the Discord REST API. No images, no embeds,
 * no voice. Modes:
 *   vibes     — morning mood poll + affirmation
 *   joke      — midday bad-joke drop
 *   rose      — evening rose / bud / thorn check-in
 *   compliment — random compliment cannon (pings a random member)
 *
 * Env:
 *   BOT_TOKEN         Discord bot token
 *   CHANNEL_ID        target channel (default: #general)
 *   GUILD_ID          guild id (required for compliment mode)
 */
import { randomInt } from 'node:crypto';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const CHANNEL_ID = process.env.CHANNEL_ID || '1458685093945147582';
const GUILD_ID = process.env.GUILD_ID || '1458685092728668200';

const UA = 'KubernaLabsDailyDeploy/1.0 (Discord bot)';
const BASE = 'https://discord.com/api/v10';

const AFFIRMATIONS = [
  "You don't have to be productive every single hour. The work you did yesterday still counts.",
  'If you wrote one line of code today, you shipped. Small steps compound.',
  'Somewhere, a bug you fixed last week is still silently working. Thank you, past you.',
  'You are allowed to close the laptop and go for a walk. The code will still be there.',
  'Every expert was once a beginner who refused to give up.',
  'Progress is not linear. Your best work might be the "nothing" days in between.',
  'The repo can wait. You matter more than your to-do list.',
  'Be kind to yourself today. You are doing better than you think.',
];

const MOODS = ['🌱', '☕', '🚀', '💀', '✨', '🧘', '🔥'];

const JOKES = [
  { setup: 'Why do programmers prefer dark mode?', punchline: 'Because light attracts bugs.' },
  { setup: 'How many programmers does it take to change a light bulb?', punchline: 'None, that\'s a hardware problem.' },
  { setup: 'Why do Java developers wear glasses?', punchline: 'Because they can\'t C#.' },
  { setup: 'What do you call 8 Hobbits?', punchline: 'A hobbyte.' },
  { setup: 'Why did the developer go broke?', punchline: 'Because they used up all their cache.' },
  { setup: 'A SQL query walks into a bar, goes up to two tables and asks…', punchline: '"Can I JOIN you?"' },
  { setup: 'Why was the JavaScript developer sad?', punchline: 'Because they didn\'t know how to "null" their feelings.' },
  { setup: 'There are only 10 types of people in the world:', punchline: 'Those who understand binary and those who don\'t.' },
  { setup: 'Why do programmers mix up Halloween and Christmas?', punchline: 'Because Oct 31 == Dec 25.' },
  { setup: 'I told my computer I needed a break…', punchline: 'Now it won\'t stop sending me KitKat ads.' },
  { setup: 'Why don\'t programmers like nature?', punchline: 'Too many bugs.' },
  { setup: 'What\'s a computer\'s favorite beat?', punchline: 'An algorithm.' },
];

const COMPLIMENTS = [
  'the community is lucky to have you. Your presence makes this server warmer.',
  'you\'re quietly carrying this server on your back and we noticed. Keep being awesome.',
  'your last message added real value to this server. Thanks for being here.',
  'you matter here. Even the lurkers hold the room together.',
  'someone in this server probably learned something from you today. That\'s a win.',
  'your energy is appreciated more than you know. Stay golden.',
  'you make this server a better place just by being in it.',
  'if this server had a MVP award, it\'d be yours today.',
];

const THORNS = [
  'a task that took way longer than expected',
  'something that got blocked',
  'a bug that refused to die',
  'too many meetings / too much context switching',
  'a tool that fought back',
  'hitting a wall and needing a break',
];

const BUDS = [
  'something you learned today',
  'a feature you started',
  'an idea you\'re excited about',
  'a conversation that inspired you',
  'a skill you\'re leveling up',
];

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'User-Agent': UA,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Discord API ${options.method || 'GET'} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function post(content) {
  const msg = await api(`/channels/${CHANNEL_ID}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  console.log(`posted to ${CHANNEL_ID}: ${content.split('\n')[0]}`);
  return msg;
}

function pick(arr) {
  if (!arr.length) return undefined;
  return arr[randomInt(0, arr.length)];
}

async function vibes() {
  const moodLine = `**☀️ Good morning, builders!** How are we feeling today? React with one:\n\n${MOODS.join(' ')}\n\n_${pick(AFFIRMATIONS)}_`;
  await post(moodLine);
}

async function joke() {
  const j = pick(JOKES);
  await post(`**🍔 BAD JOKE DROP — the daily serving of terrible humor**\n\n${j.setup}\n\n${j.punchline}\n\nRate it: 😂 💀 🤔`);
}

async function rose() {
  const thorn = pick(THORNS);
  const bud = pick(BUDS);
  await post(`**🌙 Evening check-in — Rose, Bud, Thorn**\n\nReply with one line each, no pressure:\n\n🌹 **Rose** — one good thing from today\n🌱 **Bud** — ${bud}\n🌵 **Thorn** — ${thorn}\n\n(Or just react 🫶 and call it a day.)`);
}

async function compliment() {
  const messages = await api(`/channels/${CHANNEL_ID}/messages?limit=30`);
  const humans = messages
    .filter((m) => !(m.author && m.author.bot))
    .map((m) => m.author && m.author.id)
    .filter((id, i, arr) => id && arr.indexOf(id) === i);
  const target = pick(humans);
  if (!target) {
    console.log('no recent human messages found; skipping compliment');
    return;
  }
  await post(`🎁 **COMPLIMENT CANNON** fires at <@${target}>!\n\nHey <@${target}> — ${pick(COMPLIMENTS)}\n\n_Enjoy your random daily dose of recognition._`);
}

const mode = process.argv[2] || 'vibes';
const handlers = { vibes, joke, rose, compliment };

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN env is required');
  process.exit(1);
}
if (!handlers[mode]) {
  console.error(`unknown mode: ${mode}. Valid: ${Object.keys(handlers).join(', ')}`);
  process.exit(1);
}

handlers[mode]().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
