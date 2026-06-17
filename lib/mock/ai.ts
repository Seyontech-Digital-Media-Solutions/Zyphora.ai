// Mock AI responses — replace with real Anthropic API later

export const MOCK_GENERATED_POSTS = {
  twitter: [
    "🚀 Just discovered a game-changing productivity hack that saved me 3 hours this week. The secret? Automating the boring stuff so you can focus on what actually moves the needle. What's your biggest time-waster? #Productivity #AI #Automation",
    "The future of business isn't about working harder — it's about working smarter. AI tools are leveling the playing field for solo founders. Excited about what's coming. 🤖 #StartupLife #AITools",
    "Hot take: Most 'productivity' advice is just procrastination in disguise. Real productivity = fewer decisions, more systems. Here's what actually works for me 👇 #Founders #Productivity",
  ],
  linkedin: [
    "After 6 months of building Zyphora.ai, here's what I've learned about AI-powered business automation:\n\n1. Start with the task you hate most\n2. Automate it completely\n3. Move to the next one\n\nThe compound effect of small automations is staggering. We've saved 40+ hours/month for our users.\n\nWhat's the one task you wish you could automate today?\n\n#AI #Automation #Productivity #StartupLife",
    "The biggest mistake founders make with AI tools:\n\nThey try to use AI for everything at once.\n\nInstead, pick ONE workflow. Automate it perfectly. Then expand.\n\nThat's exactly how we built Zyphora — one automation at a time.\n\n#Founders #AITools #BusinessGrowth",
  ],
  instagram: [
    "Working smarter, not harder ✨ Our AI just generated a week's worth of content in 30 seconds. This is the future of content creation. 🤖💡 #AIContent #ContentCreator #DigitalMarketing #Automation #FutureOfWork",
    "POV: You let AI handle your content calendar while you focus on actually growing your business 🚀 #ContentStrategy #AITools #SmallBusiness #Entrepreneur",
  ],
};

export const MOCK_HASHTAGS = [
  "#AI",
  "#Automation",
  "#Productivity",
  "#StartupLife",
  "#ContentCreator",
  "#DigitalMarketing",
  "#SocialMedia",
  "#BusinessGrowth",
  "#Founders",
  "#Tech",
];

export const MOCK_AI_CHAT_RESPONSES = [
  "Great question! Here's a content strategy for your business:\n\n**Week 1-2: Foundation**\n- Post 3x/week on LinkedIn focusing on your expertise\n- Share behind-the-scenes on Instagram daily\n- Engage with 10 accounts per day in your niche\n\n**Week 3-4: Growth**\n- Launch a Twitter thread series\n- Cross-post top performers to all platforms\n- Start a weekly newsletter\n\nWould you like me to generate specific post ideas for any of these?",
  "Based on your industry, the best times to post are:\n\n- **LinkedIn**: Tuesday–Thursday, 8–10am or 5–6pm\n- **Twitter/X**: Monday–Friday, 9am or 8–9pm\n- **Instagram**: Tuesday, Wednesday, Friday, 11am–1pm\n\nThese are general guidelines — I recommend checking your own analytics after 2 weeks to find your specific audience's peak times.",
  "Here's a cold email template for your outreach:\n\n**Subject**: Quick question about [their company]\n\nHi [Name],\n\nI noticed [specific observation about their business]. I help [target audience] achieve [specific result] without [common pain point].\n\n[One-line social proof]\n\nWorth a 15-minute call this week?\n\n[Your name]\n\nWant me to personalize this for a specific prospect?",
  "Here's your 30-day content plan outline:\n\n**Days 1–10**: Establish authority — share expertise, tips, lessons learned\n**Days 11–20**: Build trust — case studies, testimonials, behind-the-scenes\n**Days 21–30**: Drive action — offers, CTAs, product highlights\n\nI can generate specific post ideas for each day. Just tell me your niche and target audience!",
];

export async function mockGenerateContent(
  prompt: string,
  platform: string
): Promise<{
  content: string;
  hashtags: string[];
  suggestion: string;
}> {
  void prompt;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const posts =
    MOCK_GENERATED_POSTS[platform as keyof typeof MOCK_GENERATED_POSTS] ||
    MOCK_GENERATED_POSTS.twitter;
  const randomPost = posts[Math.floor(Math.random() * posts.length)];
  return {
    content: randomPost,
    hashtags: MOCK_HASHTAGS.slice(0, 5),
    suggestion: "Best time to post: Tuesday 9am or Thursday 6pm",
  };
}

export interface CaptionGenerationResult {
  caption: string;
  hashtags: string[];
  platformVersions: {
    twitter: string;
    linkedin: string;
    instagram: string;
  };
}

export async function mockGenerateCaption(
  _hasMedia?: boolean,
  prompt?: string
): Promise<CaptionGenerationResult> {
  void _hasMedia;
  void prompt;
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    caption:
      "🚀 Building something amazing takes consistency, vision, and the right tools. Here's what our latest milestone looks like — and we're just getting started. Drop a 🔥 if you're on a similar journey!",
    hashtags: [
      "#Entrepreneur",
      "#StartupLife",
      "#BuildInPublic",
      "#AI",
      "#SaaS",
      "#Founder",
      "#Growth",
      "#TechStartup",
      "#Innovation",
      "#FutureOfWork",
    ],
    platformVersions: {
      twitter:
        "🚀 Building something amazing takes consistency + the right tools. Milestone unlocked! 🔥\n\n#BuildInPublic #Startup #AI",
      linkedin:
        "Building something amazing takes consistency, vision, and the right tools.\n\nHere's what our latest milestone looks like — and we're just getting started.\n\nWhat milestone are you celebrating this week? Drop it in the comments 👇\n\n#Entrepreneur #StartupLife #BuildInPublic #AI #SaaS",
      instagram:
        "🚀 Building something amazing takes consistency, vision, and the right tools ✨\n\nHere's what our latest milestone looks like — and we're just getting started 💪\n\nDrop a 🔥 if you're on a similar journey!\n\n#Entrepreneur #StartupLife #BuildInPublic #AI #SaaS #Founder #Growth #TechStartup #Innovation #FutureOfWork",
    },
  };
}

export async function mockChatResponse(message: string): Promise<string> {
  void message;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const responses = MOCK_AI_CHAT_RESPONSES;
  return responses[Math.floor(Math.random() * responses.length)];
}
