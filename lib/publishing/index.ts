import { publishToTwitter } from "./twitter";
import { publishToLinkedIn } from "./linkedin";
import { publishToFacebook } from "./facebook";
import { publishToInstagram } from "./instagram";

export type ConnectedAccountRow = {
  access_token: string | null;
  platform_account_id: string | null;
};

export async function publishToPlatform(
  platform: string,
  account: ConnectedAccountRow,
  text: string,
  mediaUrls: string[]
): Promise<{ externalId: string }> {
  if (!account.access_token) {
    throw new Error(`No access token stored for ${platform} — reconnect the account.`);
  }

  const input = {
    accessToken: account.access_token,
    platformAccountId: account.platform_account_id,
    text,
    mediaUrls,
  };

  switch (platform) {
    case "twitter":
      return publishToTwitter(input);
    case "linkedin":
      return publishToLinkedIn(input);
    case "facebook":
      return publishToFacebook(input);
    case "instagram":
      return publishToInstagram(input);
    default:
      throw new Error(`Publishing isn't supported for platform "${platform}" yet.`);
  }
}