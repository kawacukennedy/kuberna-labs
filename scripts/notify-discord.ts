import { config } from 'dotenv';
config({ path: `${__dirname}/../backend/.env` });

interface NotificationPayload {
  title: string;
  description: string;
  features: { name: string; description: string }[];
  improvements: { name: string; description: string }[];
  fixes: { name: string; description: string }[];
  environment: 'staging' | 'production';
  url?: string;
  version: string;
}

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

async function sendDiscordNotification(payload: NotificationPayload): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('No DISCORD_WEBHOOK_URL set. Skipping Discord notification.');
    printNotification(payload);
    return;
  }

  const fields: { name: string; value: string; inline?: boolean }[] = [];

  if (payload.features.length > 0) {
    fields.push({
      name: 'New Features',
      value: payload.features.map(f => `✅ **${f.name}** — ${f.description}`).join('\n'),
    });
  }

  if (payload.improvements.length > 0) {
    fields.push({
      name: 'Improvements',
      value: payload.improvements.map(f => `🔧 **${f.name}** — ${f.description}`).join('\n'),
    });
  }

  if (payload.fixes.length > 0) {
    fields.push({
      name: 'Bug Fixes',
      value: payload.fixes.map(f => `🐛 **${f.name}** — ${f.description}`).join('\n'),
    });
  }

  const embed = {
    title: `🚀 Kuberna Labs — ${payload.title}`,
    description: payload.description,
    color: 0x22c55e,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: `v${payload.version} • ${payload.environment}`,
    },
  };

  const body = {
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'GitHub',
            url: 'https://github.com/kawacukennedy/kuberna-labs',
          },
          {
            type: 2,
            style: 5,
            label: 'Discord',
            url: 'https://discord.gg/MZvNuhpXu',
          },
          ...(payload.url
            ? [
                {
                  type: 2,
                  style: 5,
                  label: 'Dashboard',
                  url: payload.url,
                },
              ]
            : []),
        ],
      },
    ],
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
  console.log(`Version: ${payload.version}`);
  console.log(`Environment: ${payload.environment}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('\nNew Features:');
  payload.features.forEach(f => console.log(`  ✅ ${f.name} — ${f.description}`));
  console.log('\nImprovements:');
  payload.improvements.forEach(f => console.log(`  🔧 ${f.name} — ${f.description}`));
  console.log('\nBug Fixes:');
  payload.fixes.forEach(f => console.log(`  🐛 ${f.name} — ${f.description}`));
  console.log('===============================\n');
}

// Main - export for programmatic use or run as script
export { sendDiscordNotification, printNotification, NotificationPayload };

// If run directly
if (require.main === module) {
  const payload: NotificationPayload = {
    title: process.env.NOTIFY_TITLE || 'New Features Shipped!',
    description: process.env.NOTIFY_DESC || 'Latest updates deployed to Kuberna Labs.',
    features: JSON.parse(process.env.NOTIFY_FEATURES || '[]'),
    improvements: JSON.parse(process.env.NOTIFY_IMPROVEMENTS || '[]'),
    fixes: JSON.parse(process.env.NOTIFY_FIXES || '[]'),
    environment: (process.env.NOTIFY_ENV as 'staging' | 'production') || 'staging',
    url: process.env.NOTIFY_URL,
    version: process.env.NOTIFY_VERSION || '1.0.0',
  };

  sendDiscordNotification(payload).catch(err => {
    console.error('Failed to send notification:', err);
    process.exit(1);
  });
}
