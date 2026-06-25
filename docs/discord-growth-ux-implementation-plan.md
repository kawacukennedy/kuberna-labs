# Kuberna Labs Discord — Growth & UX Implementation Plan

**Priority-ranked checklist** of all changes made and remaining. Items marked with **→ DONE** have been executed.

---

## Phase 1: Identity & Structure (Day 1) — ✅ COMPLETE

### 1.1 Rename Server

**→ DONE** — `/dev/chat` → **Kuberna Labs**

- Set description: _"Open-source execution rails for AI agents. Cross-chain intents, TEE attestation, on-chain escrow. MIT."_
- API: `PATCH /guilds/{id}` with `{"name":"Kuberna Labs","description":"..."}`

### 1.2 Create Categories

**→ DONE** — 6 categories created:
| Category | Channels | Purpose |
|---|---|---|
| INFORMATION | welcome, rules, announcements, github-updates, star-feed | Entry point & official info |
| COMMUNITY | general, introduce-yourself, showcase, off-topic | Social & peer interaction |
| BUILDERS & SUPPORT | questions-help, code-review, feedback-suggestions, resources, start-here | Technical depth |
| EVENTS | events-announcements, ama-archive, collaboration | Time-bound & collaborative |
| VOICE | General, Coding Room, Discussion Room, Casual Voice | Real-time interaction |
| 🗃 ARCHIVE | roles, career-advice, frontend, backend, mobile-dev, ai-ml, devops, project-ideas, web3 | Preserved but hidden |

**Commands used:**

```bash
# Create category
curl -X POST -H "Authorization: Bot $TOKEN" \
  -d '{"name":"INFORMATION","type":4,"position":0}' \
  "https://discord.com/api/v10/guilds/$GUILD_ID/channels"
```

### 1.3 Set Channel Topics

**→ DONE** — Every active channel now has a descriptive `topic` field.

### 1.4 Read-Only Announcement Channels

**→ DONE** — Permission overwrite on welcome, rules, announcements, github-updates, star-feed, events-announcements, ama-archive:

- `@everyone`: ALLOW = VIEW_CHANNEL + CREATE_INSTANT_INVITE, DENY = SEND_MESSAGES + all write perms

**Command:**

```bash
curl -X PUT -H "Authorization: Bot $TOKEN" \
  -d '{"allow":"1025","deny":"8515703330568272","type":0}' \
  "https://discord.com/api/v10/channels/$CHANNEL_ID/permissions/$GUILD_ID"
```

---

## Phase 2: Onboarding & Roles (Day 1) — ✅ COMPLETE

### 2.1 Send Welcome Embed

**→ DONE** — Rich embed in `#welcome` with:

- 5 numbered steps (Rules → Introduce → Chat → Roles → Stay Updated)
- Links to GitHub, Docs, X/Twitter
- Footer: "175 tests · All green · MIT"
- **Pinned** to channel top

### 2.2 Send Rules Embed

**→ DONE** — 7 rules in embed format covering:

1. Be Respectful
2. Stay On Topic
3. No Spam or Self-Promotion
4. No Scams or Phishing
5. Use Channels Correctly
6. Respect Privacy
7. Follow Discord ToS

- **Pinned** to channel top

### 2.3 Create Roles

**→ DONE** — 4 roles created:

| Role             | ID                  | Color   | Hoisted | Permissions   |
| ---------------- | ------------------- | ------- | ------- | ------------- |
| **Kuberna Team** | 1519006604937400451 | #FF6600 | Yes     | None (manual) |
| **Contributor**  | 1519006611946082394 | #57F287 | Yes     | None          |
| **Builder**      | 1519006619265011804 | #3498DB | Yes     | None          |
| **Developer**    | 1519006633945075882 | #2ECC71 | No      | None          |

**API commands:**

```bash
curl -X POST -H "Authorization: Bot $TOKEN" \
  -d '{"name":"Kuberna Team","color":16737536,"hoist":true,"mentionable":true}' \
  "https://discord.com/api/v10/guilds/$GUILD_ID/roles"
```

**→ Also DONE:** Deleted old `new role` placeholder.

### 2.4 Update Onboarding Prompts

**→ DONE** — Updated Discord Server Onboarding:

- **Prompt 1** (required, single-select): "What describes you best?"
  - "I build with Kuberna Labs" → **@Developer** role
  - "I want to contribute" → **@Contributor** role
  - "I am exploring / curious" → **@Builder** role
- **Prompt 2**: "What topics interest you?" (multi-select)
  - Cross-chain Intents, Smart Contracts, TEE & Attestation, Agent Infrastructure, Open Source Dev, All of the above
- **Prompt 3**: "What do you want here?" (multi-select)
  - Learn, Build projects, Get help, Network

**API:**

```bash
curl -X PUT -H "Authorization: Bot $TOKEN" \
  -d '{"prompts":[...],"default_channel_ids":[...],"enabled":true}' \
  "https://discord.com/api/v10/guilds/$GUILD_ID/onboarding"
```

---

## Phase 3: Moderation & Safety (Day 1) — ✅ COMPLETE

### 3.1 Slow Mode

**→ DONE** — Set rate limits:

- `#general`: **5 seconds** between messages
- `#questions-help`: **10 seconds** between messages

**Command:**

```bash
curl -X PATCH -H "Authorization: Bot $TOKEN" \
  -d '{"rate_limit_per_user":5}' \
  "https://discord.com/api/v10/channels/$GENERAL_CHANNEL_ID"
```

### 3.2 Auto-Mod Rules

**→ DONE** — 3 rules active:

| #   | Rule                         | Trigger                                            | Action               | Exempt        |
| --- | ---------------------------- | -------------------------------------------------- | -------------------- | ------------- |
| 1   | Block Words in Profile Names | Keyword: "dih ass"                                 | Block member profile | —             |
| 2   | Block Mention Spam           | 20 mentions + raid protection                      | Timeout (none)       | —             |
| 3   | **Crypto Scam Protection**   | 11 keywords (free eth, airdrop, seed phrase, etc.) | 7-day timeout        | @Kuberna Team |

### 3.3 System Settings

**→ DONE:**

- `system_channel_id` → `#general` (welcome messages for new joins/leaves)
- `public_updates_channel_id` → `#announcements`
- `explicit_content_filter` → SCAN_ALL_MEDIA (level 2)

---

## Phase 4: Automation (Day 1–2) — ⏳ PARTIALLY DONE

### 4.1 GitHub Webhook — `#github-updates`

**Status:** Channel created, **webhook not configured yet**
**Manual steps:**

```
1. Go to https://github.com/kawacukennedy/kuberna-labs/settings/hooks
2. Click "Add webhook"
3. Payload URL: https://discord.com/api/webhooks/{channel_id}/discord
   → Actually use: Discord's GitHub integration
   → Or install the official GitHub Discord bot
4. Select events: Push, Pull requests, Releases
5. Target channel: #github-updates
```

### 4.2 Star Webhook — `#star-feed`

**Status:** Channel created, **webhook not configured yet**
**Options:**

- **Option A:** Use [zEpticon](https://zepticon.com/) (free star tracking bot)
- **Option B:** Use [GitHub Star Webhook](https://github.com/apps/github-star-webhook) GitHub App
- **Option C:** Manual — pipe GitHub API to Discord via GitHub Actions

### 4.3 Welcome Message Bot

**Status:** ✅ Our bot handles the welcome message (already sent as embed).
**Note:** Discord's own onboarding system handles the prompts and role assignment. No separate bot needed.

### 4.4 Leveling / XP Bot (Recommended)

**Status:** ❌ Not installed yet
**Priority:** Medium
**Recommended:** **Arcane** (free, reliable, good developer community integration)

- Alternative: **MEE6** (more features but paywalled)
- Alternative: **Tatsu** (gaming-focused, good free tier)

**Install steps for Arcane:**

```
1. Go to https://arcane.bot/invite
2. Authorize on Kuberna Labs server
3. Run: /setup
4. Configure XP rates (recommend: 15-25 XP per message, 60s cooldown)
5. Set level-up rewards:
   - Level 5 → @Builder role
   - Level 10 → @Developer role
   - Level 20 → @Contributor role
   - Level 50 → Special access (member-only voice channel)
```

---

## Phase 5: Engagement (Week 1–4)

### 5.1 Welcome Screen (500+ members)

**Priority:** Low (requires 500 members)
**Steps when eligible:**

```
1. Server Settings → Community → Welcome Screen
2. Enable Welcome Screen
3. Add channels: #welcome, #rules, #general, #introduce-yourself
4. Set Server Guide to highlight #welcome and #start-here
```

### 5.2 Scheduled Events

**Priority:** Medium
**Recurring events to create:**
| Event | Frequency | Format | Channel |
|---|---|---|---|
| Dev Office Hours | Weekly (Wed) | Stage/voice Q&A | Discussion Room |
| Code Review Club | Bi-weekly (Fri) | Async thread | #code-review |
| Community AMA | Monthly (1st Tue) | Stage event | Events category |
| Show & Tell | Monthly (3rd Thu) | Showcase thread | #showcase |
| Friday Off-Topic | Weekly | Casual voice | Casual Voice |

### 5.3 Feedback Loop

**→ DONE:** `#feedback-suggestions` channel created.
**Ongoing process:**

```
1. Users post in #feedback-suggestions
2. Team reviews weekly
3. Implemented suggestions get:
   - "✅ Implemented" tag in thread title
   - @mention the suggester
   - Link to PR or commit
4. Close the feedback loop publicly
```

### 5.4 Content Calendar Integration

**Link** the dev.to content series (`docs/posts/`) to Discord:

- New post published → cross-post to `#announcements`
- Start a thread for discussion under each cross-post
- Ask: "What would you add? What have we missed?"

---

## Phase 6: Growth (Month 1–3)

### 6.1 Membership Goals

| Milestone   | Target  | Strategy                                              |
| ----------- | ------- | ----------------------------------------------------- |
| 10 members  | Week 1  | Invite existing GitHub watchers and X followers       |
| 25 members  | Week 2  | dev.to Post 1 → embed server link in CTA              |
| 50 members  | Week 3  | dev.to Post 2 + GitHub repo mention                   |
| 100 members | Week 6  | dev.to Post 3 + 4, cross-post to Hacker News          |
| 250 members | Month 3 | Disboard listing (bump every 2h) + Reddit communities |
| 500 members | Month 6 | Server Insights unlocked + Welcome Screen             |

### 6.2 Promotion Points

Every place the Discord invite should live:

- **GitHub repo README** — add `[Join our Discord](invite-link)` badge
- **dev.to posts** — link to Discord in CTA and bio
- **X/Twitter profile** — add Discord link in bio
- **Substack newsletter** — add Discord link in every post
- **Website** — add Discord widget or link

### 6.3 Discord Listing

When members reach 50+:

```
1. List on https://disboard.org
2. List on https://discord.me
3. List on https://discordservers.com
4. Bump Disboard listing every 2 hours (automated via Disboard bump bot)
```

---

## Remaining Setup Checklist

### High Priority

- [ ] Configure GitHub webhook → `#github-updates`
- [ ] Configure star webhook → `#star-feed`
- [ ] Add Discord invite link to GitHub repo README
- [ ] Cross-post first dev.to article to `#announcements`

### Medium Priority

- [ ] Install Arcane or MEE6 for XP/leveling
- [ ] Schedule first recurring event (Dev Office Hours)
- [ ] Recruit 1-2 moderators from active members
- [ ] Set up Welcome Screen (when 500+ members)
- [ ] List on Disboard (when 50+ members)

### Low Priority

- [ ] Add Collab.Land for token-gated channels
- [ ] Create custom emoji (Kuberna Labs logo, key symbols)
- [ ] Set up server vanity URL (Level 1 boost or 500+ members)
- [ ] Add AutoMod custom regex for invite link filtering
- [ ] Create bot commands for FAQ (e.g., `!docs`, `!github`, `!sdk`)

---

## Commands Reference

### Quick Discord API Reference for Future Changes

```bash
# Get guild info
curl -H "Authorization: Bot $TOKEN" \
  "https://discord.com/api/v10/guilds/$GUILD_ID"

# Create channel
curl -X POST -H "Authorization: Bot $TOKEN" \
  -d '{"name":"channel-name","type":0,"parent_id":"$CATEGORY_ID"}' \
  "https://discord.com/api/v10/guilds/$GUILD_ID/channels"

# Update channel
curl -X PATCH -H "Authorization: Bot $TOKEN" \
  -d '{"topic":"New topic"}' \
  "https://discord.com/api/v10/channels/$CHANNEL_ID"

# Delete channel
curl -X DELETE -H "Authorization: Bot $TOKEN" \
  "https://discord.com/api/v10/channels/$CHANNEL_ID"

# Create role
curl -X POST -H "Authorization: Bot $TOKEN" \
  -d '{"name":"Role Name","color":16737536,"hoist":true}' \
  "https://discord.com/api/v10/guilds/$GUILD_ID/roles"

# Send message
curl -X POST -H "Authorization: Bot $TOKEN" \
  -d '{"content":"Hello!"}' \
  "https://discord.com/api/v10/channels/$CHANNEL_ID/messages"

# Send embed
curl -X POST -H "Authorization: Bot $TOKEN" \
  -d '{"embeds":[{"title":"Title","description":"Desc","color":16737536}]}' \
  "https://discord.com/api/v10/channels/$CHANNEL_ID/messages"

# Pin message
curl -X PUT -H "Authorization: Bot $TOKEN" \
  "https://discord.com/api/v10/channels/$CHANNEL_ID/pins/$MESSAGE_ID"

# Set permission overwrite
curl -X PUT -H "Authorization: Bot $TOKEN" \
  -d '{"allow":"1025","deny":"8515703330568272","type":0}' \
  "https://discord.com/api/v10/channels/$CHANNEL_ID/permissions/$ROLE_ID"

# Add auto-mod rule
curl -X POST -H "Authorization: Bot $TOKEN" \
  -d '{"name":"Rule","event_type":1,"trigger_type":1,"trigger_metadata":{"keyword_filter":["badword"]},"actions":[{"type":1,"metadata":{"duration_seconds":86400}}]}' \
  "https://discord.com/api/v10/guilds/$GUILD_ID/auto-moderation/rules"
```
