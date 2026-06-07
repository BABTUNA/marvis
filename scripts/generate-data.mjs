/**
 * Generate synthetic meeting corpus for Orrery.
 * Outputs public/meetings.json with ~150 meetings, ~25 moments each,
 * pre-computed galaxy positions (cluster-based) and TF-IDF vectors.
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Seeded PRNG for reproducibility
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const randRange = (min, max) => min + rand() * (max - min);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Topic Clusters ───
const clusters = [
  {
    id: 'acme-renewal',
    label: 'Acme Corp Renewal',
    account: 'Acme Corp',
    center: [8, 2, -3],
    radius: 2.5,
    topics: ['renewal', 'contract', 'pricing', 'expansion', 'upsell', 'timeline', 'budget'],
    participants: ['Sarah Chen (AE)', 'Marcus Webb (VP Sales)', 'Dana Liu (CSM)', 'James Okafor (CFO, Acme)', 'Priya Sharma (CTO, Acme)'],
    meetingTypes: ['QBR', 'Renewal Discussion', 'Executive Alignment', 'Pricing Review', 'Technical Review'],
  },
  {
    id: 'acme-support',
    label: 'Acme Support & Onboarding',
    account: 'Acme Corp',
    center: [10, 0, -1],
    radius: 2,
    topics: ['onboarding', 'support', 'integration', 'API', 'bug', 'ticket', 'escalation'],
    participants: ['Dana Liu (CSM)', 'Tom Reeves (Support Lead)', 'Priya Sharma (CTO, Acme)', 'Raj Patel (Eng, Acme)'],
    meetingTypes: ['Support Call', 'Onboarding Check-in', 'Technical Troubleshooting', 'Integration Review'],
  },
  {
    id: 'globex-deal',
    label: 'Globex New Business',
    account: 'Globex Industries',
    center: [-6, 4, 5],
    radius: 3,
    topics: ['demo', 'POC', 'pilot', 'security', 'compliance', 'procurement', 'evaluation'],
    participants: ['Marcus Webb (VP Sales)', 'Aisha Kone (AE)', 'Nina Petrovic (SE)', 'Victor Huang (CIO, Globex)', 'Elena Rodriguez (CISO, Globex)'],
    meetingTypes: ['Discovery Call', 'Product Demo', 'Security Review', 'POC Kickoff', 'Technical Deep Dive'],
  },
  {
    id: 'internal-product',
    label: 'Product Strategy',
    account: 'Internal',
    center: [-2, -6, -4],
    radius: 3,
    topics: ['roadmap', 'feature', 'priority', 'sprint', 'backlog', 'release', 'velocity', 'OKR'],
    participants: ['Lena Vasquez (PM)', 'Chris Donovan (Eng Lead)', 'Yuki Tanaka (Design)', 'Marcus Webb (VP Sales)', 'Sarah Chen (AE)'],
    meetingTypes: ['Sprint Planning', 'Product Review', 'Roadmap Sync', 'Feature Prioritization', 'Design Review'],
  },
  {
    id: 'internal-hiring',
    label: 'Hiring & Team Growth',
    account: 'Internal',
    center: [0, 7, 8],
    radius: 2,
    topics: ['hiring', 'candidate', 'interview', 'headcount', 'role', 'JD', 'offer', 'pipeline'],
    participants: ['Marcus Webb (VP Sales)', 'Lena Vasquez (PM)', 'Chris Donovan (Eng Lead)', 'Angela Morris (HR)'],
    meetingTypes: ['Hiring Sync', 'Interview Debrief', 'Headcount Planning', 'Candidate Review'],
  },
  {
    id: 'vertexai-expansion',
    label: 'VertexAI Expansion',
    account: 'VertexAI',
    center: [-8, -2, 0],
    radius: 2.5,
    topics: ['expansion', 'multi-team', 'rollout', 'training', 'adoption', 'usage', 'seats'],
    participants: ['Sarah Chen (AE)', 'Dana Liu (CSM)', 'Leo Kim (VP Eng, VertexAI)', 'Maria Santos (PM, VertexAI)'],
    meetingTypes: ['Expansion Discussion', 'Adoption Review', 'Training Session', 'Rollout Planning'],
  },
  {
    id: 'competitor-intel',
    label: 'Competitive Intelligence',
    account: 'Internal',
    center: [4, -5, 6],
    radius: 2,
    topics: ['competitor', 'win-loss', 'positioning', 'battlecard', 'differentiation', 'market'],
    participants: ['Marcus Webb (VP Sales)', 'Sarah Chen (AE)', 'Aisha Kone (AE)', 'Lena Vasquez (PM)'],
    meetingTypes: ['Win-Loss Review', 'Competitive Intel Sync', 'Market Analysis', 'Positioning Workshop'],
  },
  {
    id: 'zenith-churn',
    label: 'Zenith Health Risk',
    account: 'Zenith Health',
    center: [3, 6, -7],
    radius: 2,
    topics: ['churn', 'risk', 'escalation', 'unhappy', 'downgrade', 'cancellation', 'save'],
    participants: ['Dana Liu (CSM)', 'Marcus Webb (VP Sales)', 'Tom Reeves (Support Lead)', 'Karen Wu (COO, Zenith)'],
    meetingTypes: ['Health Check', 'Escalation Call', 'Executive Save Meeting', 'Risk Review'],
  },
  {
    id: 'partnerships',
    label: 'Partnership Discussions',
    account: 'Various',
    center: [-5, 5, -6],
    radius: 2.5,
    topics: ['partnership', 'integration', 'co-sell', 'marketplace', 'reseller', 'channel', 'alliance'],
    participants: ['Marcus Webb (VP Sales)', 'Lena Vasquez (PM)', 'Chris Donovan (Eng Lead)', 'External Partners'],
    meetingTypes: ['Partnership Intro', 'Integration Planning', 'Co-Sell Strategy', 'Channel Review'],
  },
  {
    id: 'board-investors',
    label: 'Board & Investor Updates',
    account: 'Internal',
    center: [0, -8, -2],
    radius: 1.5,
    topics: ['ARR', 'revenue', 'growth', 'metrics', 'fundraise', 'board', 'investor', 'runway', 'burn'],
    participants: ['Marcus Webb (VP Sales)', 'CEO (Alex Ruiz)', 'CFO (Jordan Blake)', 'Board Members'],
    meetingTypes: ['Board Meeting', 'Investor Update', 'Monthly Metrics Review', 'Fundraise Prep'],
  },
];

// ─── Moment Templates per Cluster ───
const momentTemplates = {
  'acme-renewal': [
    { text: "James mentioned they're evaluating two competitors for the renewal. Price is the main concern — he said our per-seat cost is 40% above Competitor X.", keywords: ['pricing', 'competitor', 'renewal', 'cost', 'seats'] },
    { text: "Priya wants a native Salesforce integration before they'll commit to a 3-year deal. She said their team spends 2 hours daily on manual data entry.", keywords: ['integration', 'salesforce', 'deal', 'manual', 'commitment'] },
    { text: "Sarah proposed a volume discount: 20% off if they expand to 500 seats. James seemed interested but needs board approval.", keywords: ['discount', 'volume', 'seats', 'expansion', 'board'] },
    { text: "The CFO flagged that their fiscal year ends in March. Any renewal needs to close by end of Q1 or it gets pushed to next budget cycle.", keywords: ['fiscal', 'timeline', 'Q1', 'budget', 'deadline'] },
    { text: "Marcus committed to having the integration ready by February. Engineering hasn't been looped in on this timeline yet.", keywords: ['integration', 'promise', 'timeline', 'engineering', 'commitment'] },
    { text: "Dana reviewed usage metrics — Acme's adoption dropped 15% last quarter. Three teams stopped using the product entirely.", keywords: ['adoption', 'usage', 'drop', 'churn', 'teams'] },
    { text: "Priya asked about our AI roadmap. She's concerned we're falling behind on AI features compared to competitors.", keywords: ['AI', 'roadmap', 'competitor', 'features', 'concern'] },
    { text: "James wants to renegotiate the SLA terms. Current 99.9% uptime guarantee isn't being met — they had 3 outages last quarter.", keywords: ['SLA', 'uptime', 'outages', 'renegotiate', 'reliability'] },
    { text: "Sarah suggested a joint case study to strengthen the relationship. Acme's marketing team is interested but legal needs to approve.", keywords: ['case study', 'marketing', 'relationship', 'legal', 'approval'] },
    { text: "The renewal discussion stalled when James brought up the unresolved support tickets. 12 tickets open for more than 30 days.", keywords: ['support', 'tickets', 'stalled', 'resolution', 'backlog'] },
    { text: "Priya's team built a workaround for the missing webhook feature. She said if we don't ship it by Q2, they'll build their own middleware.", keywords: ['webhook', 'workaround', 'feature', 'Q2', 'middleware'] },
    { text: "Marcus offered to fly out for an in-person executive dinner. Trying to get face time with their CEO who hasn't been in any calls.", keywords: ['executive', 'dinner', 'CEO', 'relationship', 'in-person'] },
    { text: "James revealed they're consolidating vendors — going from 8 tools to 4. We need to be in that final 4 or we're out.", keywords: ['consolidation', 'vendors', 'tools', 'risk', 'strategy'] },
    { text: "Dana presented a health score of 62/100 for Acme. Red flags: declining logins, support sentiment negative, champion (Priya) updating LinkedIn.", keywords: ['health score', 'risk', 'logins', 'sentiment', 'champion'] },
    { text: "Pricing discussion got heated. James said 'at this price point, I can get 80% of the functionality from a competitor at half the cost.'", keywords: ['pricing', 'pushback', 'competitor', 'cost', 'functionality'] },
    { text: "Sarah identified an expansion opportunity in Acme's APAC division — 200 potential new seats if we can support Japanese localization.", keywords: ['expansion', 'APAC', 'localization', 'seats', 'opportunity'] },
    { text: "Priya wants to pilot our new analytics module. If it works well, that could be the lever to justify the renewal price.", keywords: ['analytics', 'pilot', 'justification', 'price', 'value'] },
    { text: "End of call: James said 'I like your product, but I need ammunition to defend this spend to my board.' We need to build that ammo.", keywords: ['board', 'justification', 'spend', 'defense', 'ROI'] },
  ],
  'acme-support': [
    { text: "Raj reported the API is returning 504 timeouts on bulk exports. Affecting their nightly data sync — been happening for 2 weeks.", keywords: ['API', 'timeout', '504', 'bulk', 'sync'] },
    { text: "Onboarding call: walked through SSO setup. Acme uses Okta — our SAML integration had a redirect bug that Tom escalated to engineering.", keywords: ['SSO', 'Okta', 'SAML', 'bug', 'onboarding'] },
    { text: "Priya asked if we support a Snowflake connector. Tom said no — but 'we promised it was on the roadmap 6 months ago.' No ETA exists.", keywords: ['Snowflake', 'connector', 'promise', 'roadmap', 'missing'] },
    { text: "Support ticket #4521: user permissions not syncing from Active Directory. Workaround in place but fragile. Raj wants a permanent fix.", keywords: ['permissions', 'Active Directory', 'sync', 'workaround', 'fix'] },
    { text: "Integration review: their Hubspot data flow is working but our webhook payloads are missing the custom field mappings they configured.", keywords: ['Hubspot', 'webhook', 'custom fields', 'mapping', 'integration'] },
    { text: "Tom committed to a dedicated support channel for Acme — Slack Connect. This was supposed to be set up 3 weeks ago but still pending.", keywords: ['Slack', 'support channel', 'dedicated', 'pending', 'delay'] },
    { text: "Raj found a data integrity issue: duplicate records appearing after their CSV import. Affects ~2000 records. Manual cleanup required.", keywords: ['data integrity', 'duplicates', 'CSV', 'import', 'cleanup'] },
    { text: "Priya escalated directly to Marcus about the API rate limits. They hit the cap during business hours — needs 10x increase or it's a blocker.", keywords: ['rate limit', 'API', 'escalation', 'blocker', 'capacity'] },
    { text: "Onboarding milestone: 80% of Acme users have logged in at least once. But only 35% are weekly active. Need engagement strategy.", keywords: ['onboarding', 'adoption', 'login', 'engagement', 'milestone'] },
    { text: "Tom mentioned they promised Acme a custom report builder that doesn't exist in our product. It was a pre-sales commitment from 8 months ago.", keywords: ['promise', 'report builder', 'custom', 'pre-sales', 'missing'] },
  ],
  'globex-deal': [
    { text: "Discovery: Globex processes 2M transactions/day. Their current system (built in-house) can't scale past 3M. That's their pain.", keywords: ['scale', 'transactions', 'pain point', 'in-house', 'growth'] },
    { text: "Elena requires SOC 2 Type II and HIPAA compliance before any POC. We have SOC 2 but HIPAA is in progress — ETA unclear.", keywords: ['SOC2', 'HIPAA', 'compliance', 'security', 'requirement'] },
    { text: "Victor wants to see our system handle their peak load scenario: 50k concurrent users, 500 API calls/second. Nina is setting up a load test.", keywords: ['load test', 'performance', 'concurrent', 'POC', 'benchmark'] },
    { text: "Procurement sent over a 47-page security questionnaire. Nina and Tom are splitting it — due back in 2 weeks.", keywords: ['procurement', 'security', 'questionnaire', 'deadline', 'process'] },
    { text: "Demo went well. Victor said 'this is the first product that actually handles our multi-tenant architecture requirements natively.'", keywords: ['demo', 'multi-tenant', 'architecture', 'positive', 'native'] },
    { text: "Elena flagged data residency requirements — all data must stay in EU. We currently only have US regions. This could be a dealbreaker.", keywords: ['data residency', 'EU', 'dealbreaker', 'compliance', 'regions'] },
    { text: "Globex's legal team wants a custom DPA. Our standard one doesn't cover their specific sub-processor requirements.", keywords: ['DPA', 'legal', 'sub-processor', 'custom', 'contract'] },
    { text: "POC results: 99.7% accuracy on their test dataset. Victor is impressed but wants to test edge cases around Unicode handling.", keywords: ['POC', 'accuracy', 'results', 'edge cases', 'Unicode'] },
    { text: "Aisha learned Globex is also evaluating DataWeave and Segment. Timeline: decision by end of Q2. Budget: $800K ARR.", keywords: ['competitor', 'DataWeave', 'timeline', 'budget', 'evaluation'] },
    { text: "Nina discovered that Globex's legacy system uses a proprietary data format. Migration will need a custom ETL pipeline — 4-6 weeks of eng work.", keywords: ['migration', 'ETL', 'legacy', 'custom', 'engineering'] },
    { text: "Victor mentioned they'd want a dedicated solutions engineer for the first 90 days post-launch. We don't currently offer that tier of support.", keywords: ['solutions engineer', 'dedicated', 'support', 'post-launch', 'service'] },
    { text: "Security deep dive complete. Elena signed off on our encryption (AES-256, TLS 1.3) but wants us to add FIPS 140-2 certification.", keywords: ['encryption', 'FIPS', 'certification', 'security', 'approved'] },
  ],
  'internal-product': [
    { text: "Sprint retro: velocity dropped 20% because of unplanned Acme support escalations pulling engineers off feature work.", keywords: ['velocity', 'sprint', 'support', 'escalation', 'impact'] },
    { text: "Lena presented the Q3 roadmap: AI summarization, advanced analytics, and the Snowflake connector. Chris said engineering capacity only covers 2 of the 3.", keywords: ['roadmap', 'Q3', 'AI', 'analytics', 'capacity'] },
    { text: "Design review for the new dashboard. Yuki proposed a widget-based layout. Chris pushed back — too much complexity for v1.", keywords: ['dashboard', 'design', 'widgets', 'complexity', 'v1'] },
    { text: "Feature request triage: 42 requests from customers this month. Top 3: webhook improvements, bulk export, and role-based permissions.", keywords: ['feature requests', 'triage', 'webhook', 'export', 'permissions'] },
    { text: "Chris flagged technical debt in the auth module. Refactor would take 2 sprints but would prevent recurring security patches.", keywords: ['tech debt', 'auth', 'refactor', 'security', 'maintenance'] },
    { text: "Marcus pushed for the Salesforce integration to be moved up in priority — it's blocking the Acme renewal. Lena pushed back on scope creep.", keywords: ['Salesforce', 'priority', 'Acme', 'scope creep', 'conflict'] },
    { text: "OKR review: Product hit 3 of 5 key results. Missed on 'reduce time-to-value for new customers' and 'launch mobile app beta.'", keywords: ['OKR', 'review', 'missed', 'mobile', 'time-to-value'] },
    { text: "Backlog grooming: 127 items. Lena is ruthlessly cutting — anything not tied to a revenue goal or a top-10 customer request gets archived.", keywords: ['backlog', 'grooming', 'prioritization', 'revenue', 'archiving'] },
    { text: "Release 4.2 postmortem: the rollout caused a 45-minute outage due to a database migration script that wasn't tested on production-scale data.", keywords: ['release', 'outage', 'postmortem', 'migration', 'database'] },
    { text: "Yuki demoed the new onboarding flow. Reduced steps from 12 to 5. A/B test shows 30% improvement in completion rate.", keywords: ['onboarding', 'UX', 'A/B test', 'improvement', 'completion'] },
  ],
  'internal-hiring': [
    { text: "Headcount planning: Marcus wants 3 more AEs and 1 SE for Q3. Angela said the budget only supports 2 hires total.", keywords: ['headcount', 'budget', 'AE', 'SE', 'hiring'] },
    { text: "Interview debrief for senior backend role. Candidate was strong technically but had concerns about our scale — compared us unfavorably to their current company.", keywords: ['interview', 'backend', 'candidate', 'concerns', 'scale'] },
    { text: "Hiring pipeline review: 45 applications for the PM role, 8 phone screens, 3 onsites scheduled. Time-to-hire averaging 52 days.", keywords: ['pipeline', 'PM', 'applications', 'time-to-hire', 'process'] },
    { text: "Angela raised concern about offer competitiveness. We lost 2 candidates to higher offers last month. Need to revisit comp bands.", keywords: ['compensation', 'offers', 'competitive', 'lost candidates', 'bands'] },
    { text: "Chris wants to hire a DevOps engineer to reduce deployment friction. Currently engineers spend 15% of time on infra issues.", keywords: ['DevOps', 'deployment', 'infra', 'friction', 'efficiency'] },
    { text: "Diversity hiring update: 40% of final-round candidates are from underrepresented groups, up from 25% last quarter.", keywords: ['diversity', 'hiring', 'candidates', 'improvement', 'inclusion'] },
    { text: "Lena proposed creating a new 'Growth PM' role focused entirely on activation and retention metrics. Marcus supports it.", keywords: ['Growth PM', 'role', 'activation', 'retention', 'new position'] },
  ],
  'vertexai-expansion': [
    { text: "Leo wants to roll out to their entire engineering org — 400 seats. Currently on 50. But he needs SSO and SCIM provisioning first.", keywords: ['rollout', 'seats', 'SSO', 'SCIM', 'engineering'] },
    { text: "Maria reported that their data science team built custom dashboards on top of our API. They want official support for that use case.", keywords: ['API', 'dashboards', 'custom', 'data science', 'support'] },
    { text: "Expansion pricing discussion: Leo wants a volume discount at 400 seats. Current per-seat price is $45/mo — he's asking for $30.", keywords: ['pricing', 'volume', 'discount', 'seats', 'negotiation'] },
    { text: "Training session went well. 92% satisfaction score. But Leo flagged that the admin interface is 'confusing for non-technical team leads.'", keywords: ['training', 'satisfaction', 'admin', 'UX', 'feedback'] },
    { text: "Usage review: VertexAI's power users average 4.2 hours/day in the product. But 60% of users log in less than once a week.", keywords: ['usage', 'power users', 'adoption', 'engagement', 'bimodal'] },
    { text: "Dana proposed a customer advisory board seat for Leo. He'd get early access to features in exchange for regular feedback.", keywords: ['advisory board', 'feedback', 'early access', 'relationship', 'engagement'] },
    { text: "Maria asked about our SOC 2 report — VertexAI's compliance team needs it for their vendor audit. We sent it over same day.", keywords: ['SOC2', 'compliance', 'audit', 'vendor', 'documentation'] },
    { text: "Leo mentioned they're evaluating Notion and Confluence for their wiki — potential integration opportunity if we can embed our widgets.", keywords: ['Notion', 'Confluence', 'integration', 'wiki', 'opportunity'] },
  ],
  'competitor-intel': [
    { text: "Win-loss analysis: lost 3 deals to CompetitorX last quarter. All cited 'better AI features' and 'lower price point' as reasons.", keywords: ['win-loss', 'competitor', 'AI', 'pricing', 'lost deals'] },
    { text: "CompetitorY just raised $50M Series C. They're hiring aggressively in our target market — poaching our customers' contacts.", keywords: ['competitor', 'funding', 'Series C', 'market', 'threat'] },
    { text: "Sarah shared intel from a prospect: CompetitorX is offering 6-month free pilots to enterprise accounts. Predatory pricing.", keywords: ['competitor', 'pilot', 'free', 'enterprise', 'predatory'] },
    { text: "Battlecard review: our positioning on security is strong but we're weak on 'time-to-value' messaging. Customers say onboarding takes too long.", keywords: ['battlecard', 'positioning', 'security', 'onboarding', 'messaging'] },
    { text: "Market analysis: the total addressable market grew 25% YoY. But 3 new entrants launched this quarter — the space is getting crowded.", keywords: ['TAM', 'market', 'growth', 'entrants', 'competition'] },
    { text: "Aisha reported that CompetitorZ is spreading FUD about our uptime. Shared a slide claiming we had '47 hours of downtime last year' — it's false.", keywords: ['FUD', 'competitor', 'uptime', 'false claims', 'reputation'] },
    { text: "Marcus wants a 'competitive SWAT team' — 2 SEs who only work on competitive deals. Chris says we can't spare the headcount.", keywords: ['SWAT team', 'competitive', 'headcount', 'resources', 'strategy'] },
  ],
  'zenith-churn': [
    { text: "Karen expressed frustration: 'We've reported the same bug 4 times and it's still not fixed. My team has lost confidence in the product.'", keywords: ['bug', 'frustration', 'confidence', 'repeated', 'churn risk'] },
    { text: "Health check reveals Zenith's NPS dropped from 42 to -8 in the last quarter. Red alert.", keywords: ['NPS', 'drop', 'health', 'alert', 'satisfaction'] },
    { text: "Dana presented a save plan: dedicated support engineer, weekly check-ins, and a 15% discount on renewal. Marcus approved.", keywords: ['save plan', 'discount', 'support', 'check-ins', 'retention'] },
    { text: "Escalation call: Karen's team found a data export that was missing 3 months of records. Potential compliance issue for a healthcare company.", keywords: ['data loss', 'export', 'compliance', 'healthcare', 'escalation'] },
    { text: "Tom's team traced the bug to a race condition in the sync engine. Fix is in staging but needs 2 more weeks of testing before production.", keywords: ['bug fix', 'race condition', 'sync', 'testing', 'timeline'] },
    { text: "Karen said their contract auto-renews in 60 days. If the issues aren't resolved by then, they'll invoke the termination clause.", keywords: ['auto-renewal', 'termination', 'deadline', '60 days', 'contract'] },
    { text: "Marcus had a private call with Karen's CEO. The CEO is pragmatic — willing to stay if we commit to a formal SLA with penalties.", keywords: ['CEO', 'SLA', 'penalties', 'commitment', 'save'] },
    { text: "Zenith's usage is actually increasing despite the complaints — their team is locked in. The frustration is real but switching cost is high.", keywords: ['usage', 'switching cost', 'lock-in', 'frustration', 'retention'] },
  ],
  'partnerships': [
    { text: "Intro call with Zapier: they want us in their top-tier integration directory. Requirements: OAuth 2.0 support and a published API schema.", keywords: ['Zapier', 'integration', 'OAuth', 'API', 'directory'] },
    { text: "Co-sell opportunity with Salesforce. Their AE has a prospect (NovaTech) who needs our capabilities. Could be $200K deal.", keywords: ['Salesforce', 'co-sell', 'prospect', 'deal', 'partnership'] },
    { text: "Marketplace listing review: our Atlassian marketplace app has 340 installs but only 12 reviews. Need to drive more engagement.", keywords: ['marketplace', 'Atlassian', 'installs', 'reviews', 'engagement'] },
    { text: "Channel partner (TechForward) wants reseller pricing. They have 15 prospects in their pipeline. Asking for 30% margin.", keywords: ['reseller', 'channel', 'margin', 'pipeline', 'pricing'] },
    { text: "Integration planning with Slack: they want us to build a Slack bot for in-channel notifications. Would differentiate us from competitors.", keywords: ['Slack', 'bot', 'integration', 'notifications', 'differentiation'] },
    { text: "Alliance review: our AWS partnership drove $450K in influenced revenue last quarter. Considering upgrading to Advanced tier.", keywords: ['AWS', 'partnership', 'revenue', 'tier', 'influenced'] },
    { text: "Lena proposed an API-first partner program: give partners early access to new APIs and a rev-share on integrations they build.", keywords: ['API', 'partner program', 'rev-share', 'early access', 'ecosystem'] },
    { text: "Tom mentioned we promised CloudBridge a custom SSO adapter 5 months ago. It was a partnership commitment. Nobody built it.", keywords: ['promise', 'SSO', 'custom', 'partnership', 'unfulfilled'] },
  ],
  'board-investors': [
    { text: "ARR update: $8.2M, up from $6.1M last quarter. Net revenue retention at 112%. Gross margin improved to 78%.", keywords: ['ARR', 'revenue', 'retention', 'margin', 'growth'] },
    { text: "Board concerns: CAC payback period is 18 months — above the 12-month target. Sales efficiency needs improvement.", keywords: ['CAC', 'payback', 'efficiency', 'board', 'concern'] },
    { text: "Fundraise discussion: Alex wants to raise a $15M Series A in Q4. Jordan says current runway is 14 months at current burn.", keywords: ['fundraise', 'Series A', 'runway', 'burn', 'timeline'] },
    { text: "Investor update: 3 new enterprise logos this quarter. Average deal size up 35% to $120K ARR. Pipeline at $4.2M.", keywords: ['enterprise', 'deal size', 'pipeline', 'logos', 'investor'] },
    { text: "Board member asked about AI strategy. Alex presented the 'AI-first product' thesis — embed AI into every workflow, not just as a feature.", keywords: ['AI strategy', 'board', 'thesis', 'product', 'vision'] },
    { text: "Jordan flagged: top 3 customers represent 42% of ARR. Board wants to see concentration risk below 30% before Series A.", keywords: ['concentration', 'risk', 'customers', 'ARR', 'diversification'] },
    { text: "Metrics review: monthly churn dropped to 1.8% from 2.5%. Expansion revenue is now 25% of total new ARR — a positive signal.", keywords: ['churn', 'expansion', 'metrics', 'improvement', 'growth'] },
  ],
};

// ─── Generate Meetings ───
const meetings = [];
let meetingId = 0;

const startDate = new Date('2025-07-01');
const endDate = new Date('2026-06-01');

for (const cluster of clusters) {
  const templates = momentTemplates[cluster.id];
  const numMeetings = cluster.id === 'board-investors' ? 8 : cluster.id === 'internal-hiring' ? 10 : Math.floor(12 + rand() * 8);

  for (let m = 0; m < numMeetings; m++) {
    meetingId++;
    const dateOffset = randRange(0, endDate - startDate);
    const date = new Date(startDate.getTime() + dateOffset);
    const dateStr = date.toISOString().split('T')[0];

    // Position: cluster center + random offset within radius
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const r = cluster.radius * Math.cbrt(rand()); // uniform in volume
    const px = cluster.center[0] + r * Math.sin(phi) * Math.cos(theta);
    const py = cluster.center[1] + r * Math.sin(phi) * Math.sin(theta);
    const pz = cluster.center[2] + r * Math.cos(phi);

    // Select moments for this meeting
    const numMoments = Math.floor(15 + rand() * 15);
    const selectedMoments = [];
    const shuffledTemplates = shuffle(templates);

    for (let i = 0; i < numMoments; i++) {
      const template = shuffledTemplates[i % shuffledTemplates.length];
      // Local position (moment offset from meeting center)
      const lr = 0.3 + rand() * 0.5;
      const lt = rand() * Math.PI * 2;
      const lp = Math.acos(2 * rand() - 1);
      selectedMoments.push({
        id: `${meetingId}-${i}`,
        text: template.text,
        keywords: template.keywords,
        localPos: [
          lr * Math.sin(lp) * Math.cos(lt),
          lr * Math.sin(lp) * Math.sin(lt),
          lr * Math.cos(lp),
        ],
        timestamp: `${Math.floor(rand() * 55 + 1)}:${String(Math.floor(rand() * 60)).padStart(2, '0')}`,
      });
    }

    const type = pick(cluster.meetingTypes);
    const numParticipants = Math.floor(2 + rand() * 3);
    const participants = shuffle(cluster.participants).slice(0, Math.min(numParticipants, cluster.participants.length));

    meetings.push({
      id: `meeting-${meetingId}`,
      title: `${type} — ${cluster.account}${cluster.account === 'Internal' ? ` (${cluster.label})` : ''}`,
      date: dateStr,
      account: cluster.account,
      cluster: cluster.id,
      clusterLabel: cluster.label,
      participants,
      position: [px, py, pz],
      moments: selectedMoments,
      summary: `${type} covering ${cluster.topics.slice(0, 3).join(', ')} topics.`,
    });
  }
}

// Sort meetings by date
meetings.sort((a, b) => a.date.localeCompare(b.date));

// ─── Build TF-IDF Vocabulary & Vectors ───

// Collect all text
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
}

const stopwords = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'from', 'they',
  'this', 'that', 'with', 'will', 'each', 'make', 'like', 'just', 'over',
  'such', 'than', 'them', 'very', 'some', 'what', 'about', 'which', 'when',
  'would', 'there', 'their', 'said', 'into', 'also', 'more', 'other', 'then',
  'these', 'could', 'only', 'after', 'those', 'being', 'most', 'where',
]);

// Build document frequency
const docFreq = {};
const allDocs = [];

for (const meeting of meetings) {
  const allText = [meeting.title, meeting.summary, ...meeting.moments.map(m => m.text)].join(' ');
  const tokens = tokenize(allText);
  const unique = new Set(tokens);
  allDocs.push(tokens);
  for (const w of unique) {
    docFreq[w] = (docFreq[w] || 0) + 1;
  }
}

// Select top vocabulary terms by document frequency (keep manageable vector size)
const vocabEntries = Object.entries(docFreq)
  .filter(([, freq]) => freq >= 2 && freq <= meetings.length * 0.8)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 384); // Match embedding dimension target

const vocab = {};
vocabEntries.forEach(([word], i) => { vocab[word] = i; });
const vocabSize = vocabEntries.length;

// Compute TF-IDF vectors
function computeVector(tokens) {
  const tf = {};
  for (const t of tokens) {
    if (vocab[t] !== undefined) {
      tf[t] = (tf[t] || 0) + 1;
    }
  }
  const vec = new Array(vocabSize).fill(0);
  const maxTf = Math.max(...Object.values(tf), 1);
  for (const [word, count] of Object.entries(tf)) {
    const idx = vocab[word];
    const normalizedTf = 0.5 + 0.5 * (count / maxTf);
    const idf = Math.log(meetings.length / (docFreq[word] || 1));
    vec[idx] = normalizedTf * idf;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => Math.round((v / norm) * 10000) / 10000);
}

// Compute vectors for meetings and moments
for (let i = 0; i < meetings.length; i++) {
  meetings[i].vector = computeVector(allDocs[i]);

  for (const moment of meetings[i].moments) {
    const momentTokens = tokenize(moment.text);
    moment.vector = computeVector(momentTokens);
  }
}

// ─── Output ───
const output = {
  meta: {
    generated: new Date().toISOString(),
    numMeetings: meetings.length,
    numMoments: meetings.reduce((s, m) => s + m.moments.length, 0),
    vocabSize,
    vectorDim: vocabSize,
  },
  vocab: Object.fromEntries(vocabEntries.map(([word], i) => [word, i])),
  idf: Object.fromEntries(vocabEntries.map(([word]) => [word, Math.round(Math.log(meetings.length / (docFreq[word] || 1)) * 10000) / 10000])),
  meetings,
};

const outPath = join(__dirname, '..', 'public', 'meetings.json');
writeFileSync(outPath, JSON.stringify(output));
const sizeMB = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2);
console.log(`Generated ${output.meta.numMeetings} meetings, ${output.meta.numMoments} moments`);
console.log(`Vocabulary: ${vocabSize} terms, vector dim: ${vocabSize}`);
console.log(`Output: ${outPath} (${sizeMB} MB)`);
