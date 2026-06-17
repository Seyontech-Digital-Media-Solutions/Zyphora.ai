// Mock n8n — returns dummy success responses

export async function mockTriggerAutomation(
  workflowId: string,
  data: Record<string, unknown>
) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("[MOCK n8n] Triggered workflow:", workflowId, data);
  return {
    success: true,
    executionId: `exec_${Date.now()}`,
    status: "success",
    output: { message: "Automation completed successfully (mock)" },
  };
}

export const MOCK_AUTOMATION_TEMPLATES = [
  {
    id: "tpl_1",
    name: "Daily LinkedIn Post from RSS",
    description:
      "Automatically generate and post LinkedIn content from your favorite RSS feeds every morning",
    trigger: "Schedule (Daily 9am)",
    steps: ["Fetch RSS feed", "Generate AI post", "Post to LinkedIn"],
    category: "Social Media",
    icon: "linkedin",
  },
  {
    id: "tpl_2",
    name: "Reply to Twitter Mentions with AI",
    description:
      "Monitor mentions and auto-reply with personalized AI responses",
    trigger: "New Twitter mention",
    steps: [
      "Monitor mentions",
      "Analyze sentiment",
      "Generate reply",
      "Post reply",
    ],
    category: "Engagement",
    icon: "twitter",
  },
  {
    id: "tpl_3",
    name: "Weekly Content Calendar Generator",
    description:
      "Generate a full week of social media content every Sunday night",
    trigger: "Schedule (Sunday 8pm)",
    steps: [
      "Generate 7 posts",
      "Schedule across platforms",
      "Send summary email",
    ],
    category: "Content",
    icon: "calendar",
  },
  {
    id: "tpl_4",
    name: "Lead Magnet → Email Sequence",
    description:
      "When someone downloads your lead magnet, trigger a 5-email nurture sequence",
    trigger: "Form submission",
    steps: [
      "Capture lead",
      "Add to list",
      "Send welcome email",
      "Schedule follow-ups",
    ],
    category: "Email",
    icon: "mail",
  },
  {
    id: "tpl_5",
    name: "Competitor Mention Alert",
    description:
      "Get notified on Slack when your competitors are mentioned online",
    trigger: "Keyword monitor",
    steps: ["Monitor web", "Filter results", "Send Slack alert"],
    category: "Monitoring",
    icon: "bell",
  },
  {
    id: "tpl_6",
    name: "Blog Post → Social Repurposer",
    description:
      "Automatically turn blog posts into tweets, LinkedIn posts, and Instagram captions",
    trigger: "New blog post (RSS)",
    steps: [
      "Fetch blog post",
      "Generate Twitter thread",
      "Generate LinkedIn post",
      "Generate Instagram caption",
      "Schedule all",
    ],
    category: "Content",
    icon: "repeat",
  },
];
