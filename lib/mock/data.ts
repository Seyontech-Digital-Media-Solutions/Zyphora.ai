// Seed data for all dashboard UI components

export const MOCK_STATS = {
  totalFollowers: 12847,
  followersGrowth: +340,
  postsPublished: 47,
  avgEngagement: "4.2%",
  automationsRun: 128,
  creditsUsed: 13,
};

export const MOCK_CONTENT_ITEMS = [
  {
    id: "1",
    title: "AI productivity post",
    body: "🚀 Just discovered a game-changing productivity hack that saved me 3 hours this week. The secret? Automating the boring stuff so you can focus on what actually moves the needle.",
    platform: "twitter",
    status: "published",
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    hashtags: ["#AI", "#Productivity", "#Startup"],
    media_url: null,
    analytics: { likes: 47, retweets: 12, replies: 8, impressions: 1240 },
  },
  {
    id: "2",
    title: "LinkedIn thought leadership",
    body: "After 6 months of building Zyphora.ai, here's what I've learned about AI-powered business automation...",
    platform: "linkedin",
    status: "scheduled",
    scheduled_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    hashtags: ["#AI", "#Automation", "#StartupLife"],
    media_url: null,
    analytics: {},
  },
  {
    id: "3",
    title: "Instagram caption",
    body: "Working smarter, not harder ✨ Our AI just generated a week's worth of content in 30 seconds.",
    platform: "instagram",
    status: "draft",
    hashtags: ["#ContentCreator", "#AIContent"],
    media_url: null,
    analytics: {},
  },
  {
    id: "4",
    title: "Weekly business tips thread",
    body: "5 AI tools that changed how I run my business 🧵 Thread below...",
    platform: "twitter",
    status: "published",
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    hashtags: ["#BuildInPublic", "#AITools", "#Founders"],
    media_url: null,
    analytics: { likes: 132, retweets: 54, replies: 23, impressions: 8900 },
  },
  {
    id: "5",
    title: "LinkedIn case study",
    body: "How we helped a client save 40 hours/month with AI automations...",
    platform: "linkedin",
    status: "draft",
    hashtags: ["#CaseStudy", "#SaaS"],
    media_url: null,
    analytics: {},
  },
  {
    id: "6",
    title: "Product launch teaser",
    body: "Something big is coming. We've been building in stealth for 6 months. Stay tuned 👀",
    platform: "instagram",
    status: "scheduled",
    scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    hashtags: ["#Launch", "#Startup"],
    media_url: null,
    analytics: {},
  },
];

export const MOCK_POST_ANALYTICS: Record<
  string,
  {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    engagementRate: number;
    impressionsOverTime: { day: string; impressions: number }[];
  }
> = {
  "1": {
    likes: 47,
    comments: 8,
    shares: 12,
    reach: 1240,
    engagementRate: 3.8,
    impressionsOverTime: [
      { day: "Day 1", impressions: 620 },
      { day: "Day 2", impressions: 380 },
      { day: "Day 3", impressions: 140 },
      { day: "Day 4", impressions: 60 },
      { day: "Day 5", impressions: 30 },
      { day: "Day 6", impressions: 10 },
      { day: "Day 7", impressions: 0 },
    ],
  },
  "4": {
    likes: 132,
    comments: 23,
    shares: 54,
    reach: 8900,
    engagementRate: 4.2,
    impressionsOverTime: [
      { day: "Day 1", impressions: 3200 },
      { day: "Day 2", impressions: 2800 },
      { day: "Day 3", impressions: 1400 },
      { day: "Day 4", impressions: 800 },
      { day: "Day 5", impressions: 400 },
      { day: "Day 6", impressions: 200 },
      { day: "Day 7", impressions: 100 },
    ],
  },
};

export const MOCK_COMMENTS = [
  {
    id: "1",
    username: "@techfounder",
    avatar: "👤",
    text: "This is exactly what I needed! 🔥 Bookmarked.",
    time: "2h ago",
    likes: 4,
  },
  {
    id: "2",
    username: "@sarahbuilds",
    avatar: "👤",
    text: "Can you share more about how you set this up?",
    time: "5h ago",
    likes: 2,
  },
  {
    id: "3",
    username: "@growthlab_",
    avatar: "👤",
    text: "Great content as always! Just followed 🙌",
    time: "1d ago",
    likes: 1,
  },
  {
    id: "4",
    username: "@startupweekly",
    avatar: "👤",
    text: "Sharing this with my audience — so valuable!",
    time: "1d ago",
    likes: 7,
  },
  {
    id: "5",
    username: "@indiehacker42",
    avatar: "👤",
    text: "Which tool do you use for this? Curious!",
    time: "2d ago",
    likes: 3,
  },
];

export const MOCK_BEST_TIMES = {
  twitter: { day: "Tuesday", time: "9:00 AM", timezone: "IST" },
  linkedin: { day: "Wednesday", time: "8:00 AM", timezone: "IST" },
  instagram: { day: "Friday", time: "11:00 AM", timezone: "IST" },
  facebook: { day: "Thursday", time: "1:00 PM", timezone: "IST" },
};

export const MOCK_GROWTH_TIPS = [
  {
    icon: "📈",
    title: "Post more consistently",
    description:
      "Your engagement drops 40% on weeks you post less than 3x. Try to maintain a daily schedule.",
    action: "→ Set up auto-scheduler",
    priority: "high" as const,
  },
  {
    icon: "⏰",
    title: "Optimal posting time",
    description:
      "Your audience is most active at 9am and 8pm. Your last 3 posts were published at noon — move them earlier.",
    action: "→ Update schedule",
    priority: "high" as const,
  },
  {
    icon: "💬",
    title: "Reply to comments faster",
    description:
      "Posts where you reply within 1 hour get 3x more reach. You have 5 unanswered comments.",
    action: "→ View comments",
    priority: "medium" as const,
  },
  {
    icon: "🏷️",
    title: "Use more niche hashtags",
    description:
      "Your posts use broad tags like #AI. Try niche ones like #IndieHackers #BuildInPublic for better reach.",
    action: "→ Regenerate hashtags",
    priority: "medium" as const,
  },
  {
    icon: "📸",
    title: "Add visuals to more posts",
    description:
      "Your posts with images get 2.3x more engagement. Only 40% of your recent posts have media.",
    action: "→ Create visual post",
    priority: "low" as const,
  },
  {
    icon: "🧵",
    title: "Try thread format on Twitter",
    description:
      "Threads in your niche get 5x more impressions. Your audience responds well to educational content.",
    action: "→ Create a thread",
    priority: "low" as const,
  },
];

export const MOCK_AUTOMATIONS = [
  {
    id: "auto_1",
    name: "Daily LinkedIn Post",
    trigger_type: "schedule",
    is_active: true,
    run_count: 42,
    last_run_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: "success",
  },
  {
    id: "auto_2",
    name: "Twitter Mention Responder",
    trigger_type: "mention",
    is_active: true,
    run_count: 86,
    last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: "success",
  },
  {
    id: "auto_3",
    name: "Weekly Content Planner",
    trigger_type: "schedule",
    is_active: false,
    run_count: 8,
    last_run_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "success",
  },
];

export const MOCK_ANALYTICS = {
  followerGrowth: [
    { date: "Jan", twitter: 1200, linkedin: 890, instagram: 2100 },
    { date: "Feb", twitter: 1450, linkedin: 1020, instagram: 2400 },
    { date: "Mar", twitter: 1800, linkedin: 1240, instagram: 2900 },
    { date: "Apr", twitter: 2100, linkedin: 1500, instagram: 3200 },
    { date: "May", twitter: 2600, linkedin: 1820, instagram: 3800 },
    { date: "Jun", twitter: 3200, linkedin: 2100, instagram: 4500 },
  ],
  topPosts: [
    {
      title: "5 AI tools thread",
      platform: "twitter",
      likes: 132,
      shares: 54,
      reach: 8900,
    },
    {
      title: "Building in public update",
      platform: "linkedin",
      likes: 89,
      shares: 31,
      reach: 5400,
    },
    {
      title: "Automation tip carousel",
      platform: "instagram",
      likes: 203,
      shares: 12,
      reach: 6700,
    },
  ],
  platformBreakdown: [
    { platform: "Twitter", percentage: 35 },
    { platform: "LinkedIn", percentage: 28 },
    { platform: "Instagram", percentage: 27 },
    { platform: "Facebook", percentage: 10 },
  ],
  bestTimes: {
    twitter: ["9am", "12pm", "8pm"],
    linkedin: ["8am", "5pm", "6pm"],
    instagram: ["11am", "1pm", "7pm"],
  },
};

export const MOCK_CONVERSATIONS = [
  {
    id: "conv_1",
    title: "Content strategy for Q3",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "Here is a content strategy for your business...",
  },
  {
    id: "conv_2",
    title: "Cold email templates",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    preview: "Here is a cold email template for your outreach...",
  },
];

export const MOCK_INTEGRATIONS = [
  {
    id: "twitter",
    name: "Twitter / X",
    category: "social",
    connected: true,
    icon: "𝕏",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "social",
    connected: true,
    icon: "in",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    connected: false,
    icon: "📷",
  },
  {
    id: "facebook",
    name: "Facebook",
    category: "social",
    connected: false,
    icon: "f",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    connected: false,
    icon: "♪",
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    connected: false,
    icon: "#",
  },
  {
    id: "notion",
    name: "Notion",
    category: "productivity",
    connected: false,
    icon: "N",
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "email",
    connected: false,
    icon: "M",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    connected: false,
    icon: "🔶",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "automation",
    connected: false,
    icon: "Z",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "automation",
    connected: false,
    icon: "⚡",
  },
  {
    id: "airtable",
    name: "Airtable",
    category: "productivity",
    connected: false,
    icon: "▦",
  },
];

export const MOCK_ACTIVITY = [
  {
    id: "act_1",
    type: "content_published",
    message: 'Published "AI productivity post" to Twitter',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act_2",
    type: "automation_ran",
    message: "Daily LinkedIn Post automation completed",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act_3",
    type: "ai_used",
    message: "Generated LinkedIn post with AI",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act_4",
    type: "content_scheduled",
    message: 'Scheduled "LinkedIn thought leadership" for tomorrow',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act_5",
    type: "automation_ran",
    message: "Twitter Mention Responder replied to 3 mentions",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];
