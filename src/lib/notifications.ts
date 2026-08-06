import { getFirebaseMessaging } from "@/lib/firebase-admin";
import DeviceToken from "@/models/DeviceToken";
import { connectDB } from "@/lib/db";
import type { MulticastMessage } from "firebase-admin/messaging";

const FCM_BATCH_SIZE = 500;
const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export type NewContentType = "movie" | "anime" | "series";

type NewContent = {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  posterUrl?: string;
  bannerUrl?: string;
};

function getContentPath(type: NewContentType, slug: string | undefined, id: string) {
  const safeSlug = slug || id;
  if (type === "movie") return `/movies/${safeSlug}`;
  if (type === "anime") return `/anime/${safeSlug}`;
  return `/series/${safeSlug}`;
}

function truncateDescription(description: string | undefined) {
  const normalized = description?.replace(/\s+/g, " ").trim();
  if (!normalized) return "Watch it now on Sarrows.";
  return normalized.length > 180 ? `${normalized.slice(0, 177)}…` : normalized;
}

function getTypeLabel(type: NewContentType) {
  if (type === "movie") return "Movie";
  if (type === "anime") return "Anime";
  return "Web Series";
}

export async function sendNewContentNotification(type: NewContentType, content: NewContent) {
  await connectDB();
  const devices = await DeviceToken.find({}, { token: 1 }).lean<{ token: string }[]>();
  if (devices.length === 0) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  const contentPath = getContentPath(type, content.slug, content.id);
  const appUrl = process.env.PUBLIC_APP_URL || "https://sarrows.vercel.app";
  const imageUrl = content.posterUrl || content.bannerUrl;
  const title = `New ${getTypeLabel(type)} on Sarrows`;
  const body = `${content.title} — ${truncateDescription(content.description)}`;
  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (let start = 0; start < devices.length; start += FCM_BATCH_SIZE) {
    const batch = devices.slice(start, start + FCM_BATCH_SIZE);
    const tokens = batch.map((device) => device.token);
    const message: MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: {
        action: "open_content",
        contentType: type,
        contentId: content.id,
        contentTitle: content.title,
        contentPath,
        appName: "Sarrows",
        appLogoUrl: `${appUrl}/logo.svg`,
        ...(imageUrl ? { contentImageUrl: imageUrl } : {}),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "sarrows_updates",
          icon: "ic_notification",
          color: "#E50914",
          ...(imageUrl ? { imageUrl } : {}),
        },
      },
    };

    const response = await getFirebaseMessaging().sendEachForMulticast(message);
    sent += response.successCount;
    failed += response.failureCount;

    const invalidTokens = response.responses
      .map((result, index) => (result.error && INVALID_TOKEN_CODES.has(result.error.code) ? tokens[index] : null))
      .filter((token): token is string => Boolean(token));

    if (invalidTokens.length > 0) {
      const removedResult = await DeviceToken.deleteMany({ token: { $in: invalidTokens } });
      removed += removedResult.deletedCount || 0;
    }
  }

  return { sent, failed, removed };
}

export async function notifyNewContent(type: NewContentType, content: NewContent) {
  try {
    const result = await sendNewContentNotification(type, content);
    console.info("[Notifications] New content notification processed", {
      type,
      contentId: content.id,
      sent: result.sent,
      failed: result.failed,
      removed: result.removed,
    });
  } catch (error) {
    // Notification delivery must never make a successful upload fail.
    console.error("[Notifications] Delivery failed", {
      type,
      contentId: content.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}