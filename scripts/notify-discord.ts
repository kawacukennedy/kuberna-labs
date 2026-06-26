import { config } from 'dotenv';
config({ path: `${__dirname}/../backend/.env` });

interface ChangeItem {
  name: string;
  description: string;
}

interface JobResult {
  name: string;
  status: 'success' | 'failure' | 'skipped' | 'cancelled';
  duration?: string;
}

interface NotificationPayload {
  title: string;
  description: string;
  commit: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    timestamp: string;
  };
  branch: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  features: ChangeItem[];
  improvements: ChangeItem[];
  fixes: ChangeItem[];
  jobs: JobResult[];
  environment: 'staging' | 'production';
  appUrl?: string;
  ciRunUrl?: string;
  deployUrl?: string;
  version: string;
  duration?: string;
}

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

function escapeMarkdown(text: string): string {
  return text.replace(/([_*~`|>])/g, '\\$1');
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 3) + '...' : text;
}

async function sendDiscordNotification(payload: NotificationPayload): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('No DISCORD_WEBHOOK_URL set. Skipping Discord notification.');
    printNotification(payload);
    return;
  }

  const fields: { name: string; value: string; inline?: boolean }[] = [];

  // Commit info
  const commitMsg = truncate(escapeMarkdown(payload.commit.message), 900);
  fields.push({
    name: '🔖 Commit',
    value: [
      `**SHA:** \`${payload.commit.shortSha}\``,
      `**Message:** ${commitMsg}`,
      `**Author:** ${escapeMarkdown(payload.commit.author)}`,
      `**Branch:** \`${payload.branch}\``,
    ].join('\n'),
  });

  // Stats
  fields.push({
    name: '📊 Changes',
    value: `**Files:** ${payload.filesChanged}\n**++** ${payload.insertions} / **--** ${payload.deletions}`,
    inline: true,
  });

  if (payload.duration) {
    fields.push({
      name: '⏱ Duration',
      value: payload.duration,
      inline: true,
    });
  }

  if (payload.version) {
    fields.push({
      name: '🏷 Version',
      value: `v${payload.version}`,
      inline: true,
    });
  }

  // CI Jobs status
  if (payload.jobs.length > 0) {
    const total = payload.jobs.length;
    const passed = payload.jobs.filter(j => j.status === 'success').length;
    const failed = payload.jobs.filter(j => j.status === 'failure').length;
    const skipped = payload.jobs.filter(j => j.status === 'skipped').length;

    const statusIcon = failed > 0 ? '❌' : '✅';
    const jobLines = payload.jobs.map(j => {
      const icon = j.status === 'success' ? '✅' : j.status === 'failure' ? '❌' : j.status === 'cancelled' ? '🚫' : '⏭️';
      const dur = j.duration ? ` (${j.duration})` : '';
      return `${icon} **${j.name}**${dur}`;
    });

    fields.push({
      name: `${statusIcon} CI Pipeline — ${passed}/${total} passed`,
      value: jobLines.join('\n'),
    });
  }

  // Features
  if (payload.features.length > 0) {
    fields.push({
      name: '✨ New Features',
      value: payload.features.map(f => `• **${escapeMarkdown(f.name)}** — ${escapeMarkdown(f.description)}`).join('\n'),
    });
  }

  // Improvements
  if (payload.improvements.length > 0) {
    fields.push({
      name: '🔧 Improvements',
      value: payload.improvements.map(f => `• **${escapeMarkdown(f.name)}** — ${escapeMarkdown(f.description)}`).join('\n'),
    });
  }

  // Fixes
  if (payload.fixes.length > 0) {
    fields.push({
      name: '🐛 Bug Fixes',
      value: payload.fixes.map(f => `• **${escapeMarkdown(f.name)}** — ${escapeMarkdown(f.description)}`).join('\n'),
    });
  }

  const color = payload.jobs.some(j => j.status === 'failure') ? 0xef4444 : 0x22c55e;

  const embed = {
    title: `🚀 Kuberna Labs — ${payload.title}`,
    description: payload.description,
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: `v${payload.version} • ${payload.environment}${payload.duration ? ` • ${payload.duration}` : ''}`,
    },
  };

  const buttons: { type: number; style: number; label: string; url: string }[] = [];

  buttons.push({
    type: 2,
    style: 5,
    label: '🔗 GitHub',
    url: `https://github.com/kawacukennedy/kuberna-labs`,
  });

  if (payload.ciRunUrl) {
    buttons.push({
      type: 2,
      style: 5,
      label: '⚙️ CI Run',
      url: payload.ciRunUrl,
    });
  }

  if (payload.deployUrl) {
    buttons.push({
      type: 2,
      style: 5,
      label: '🚀 Deploy',
      url: payload.deployUrl,
    });
  }

  if (payload.appUrl) {
    buttons.push({
      type: 2,
      style: 5,
      label: '🌐 App',
      url: payload.appUrl,
    });
  }

  buttons.push({
    type: 2,
    style: 5,
    label: '💬 Discord',
    url: 'https://discord.gg/MZvNuhpXu',
  });

  const body = {
    embeds: [embed],
    components: [{ type: 1, components: buttons }],
  };

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed (${response.status}): ${text}`);
  }

  console.log('Discord notification sent successfully.');
}

function printNotification(payload: NotificationPayload): void {
  console.log('\n=== DEPLOYMENT NOTIFICATION ===');
  console.log(`Title: ${payload.title}`);
  console.log(`Version: v${payload.version}`);
  console.log(`Environment: ${payload.environment}`);
  console.log(`Commit: ${payload.commit.shortSha} by ${payload.commit.author}`);
  console.log(`Branch: ${payload.branch}`);
  console.log(`Changes: ${payload.filesChanged} files (++${payload.insertions}/--${payload.deletions})`);
  console.log(`Duration: ${payload.duration || 'N/A'}`);
  console.log(`Date: ${new Date().toISOString()}`);

  if (payload.jobs.length > 0) {
    const passed = payload.jobs.filter(j => j.status === 'success').length;
    const failed = payload.jobs.filter(j => j.status === 'failure').length;
    console.log(`\nCI Pipeline: ${passed}/${payload.jobs.length} passed${failed > 0 ? `, ${failed} failed` : ''}`);
    payload.jobs.forEach(j => {
      const icon = j.status === 'success' ? '✅' : j.status === 'failure' ? '❌' : '⏭️';
      console.log(`  ${icon} ${j.name}${j.duration ? ` (${j.duration})` : ''}`);
    });
  }

  if (payload.features.length > 0) {
    console.log('\nNew Features:');
    payload.features.forEach(f => console.log(`  ✅ ${f.name} — ${f.description}`));
  }
  if (payload.improvements.length > 0) {
    console.log('\nImprovements:');
    payload.improvements.forEach(f => console.log(`  🔧 ${f.name} — ${f.description}`));
  }
  if (payload.fixes.length > 0) {
    console.log('\nBug Fixes:');
    payload.fixes.forEach(f => console.log(`  🐛 ${f.name} — ${f.description}`));
  }
  console.log('===============================\n');
}

export { sendDiscordNotification, printNotification, NotificationPayload };

if (require.main === module) {
  const payload: NotificationPayload = {
    title: process.env.NOTIFY_TITLE || 'New Features Shipped!',
    description: process.env.NOTIFY_DESC || 'Latest updates deployed to Kuberna Labs.',
    commit: {
      sha: process.env.NOTIFY_COMMIT_SHA || 'unknown',
      shortSha: (process.env.NOTIFY_COMMIT_SHA || 'unknown').slice(0, 7),
      message: process.env.NOTIFY_COMMIT_MSG || '',
      author: process.env.NOTIFY_COMMIT_AUTHOR || 'unknown',
      timestamp: process.env.NOTIFY_COMMIT_TIMESTAMP || new Date().toISOString(),
    },
    branch: process.env.NOTIFY_BRANCH || 'main',
    filesChanged: parseInt(process.env.NOTIFY_FILES_CHANGED || '0', 10),
    insertions: parseInt(process.env.NOTIFY_INSERTIONS || '0', 10),
    deletions: parseInt(process.env.NOTIFY_DELETIONS || '0', 10),
    features: JSON.parse(process.env.NOTIFY_FEATURES || '[]'),
    improvements: JSON.parse(process.env.NOTIFY_IMPROVEMENTS || '[]'),
    fixes: JSON.parse(process.env.NOTIFY_FIXES || '[]'),
    jobs: JSON.parse(process.env.NOTIFY_JOBS || '[]'),
    environment: (process.env.NOTIFY_ENV as 'staging' | 'production') || 'staging',
    appUrl: process.env.NOTIFY_APP_URL,
    ciRunUrl: process.env.NOTIFY_CI_RUN_URL,
    deployUrl: process.env.NOTIFY_DEPLOY_URL,
    version: process.env.NOTIFY_VERSION || '1.0.0',
    duration: process.env.NOTIFY_DURATION,
  };

  sendDiscordNotification(payload).catch(err => {
    console.error('Failed to send notification:', err);
    process.exit(1);
  });
}
