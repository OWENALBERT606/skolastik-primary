"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  MessageChannel,
  MessageAudience,
  MessageStatus,
  MessagePriority,
  DeliveryStatus,
  EventStatus,
  EventAudience,
  EventType,
} from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create and (optionally) dispatch a message
 * Handles SYSTEM, EMAIL, and SMS channels in a single call.
 */
export async function createMessage(data: {
  schoolId: string;
  createdById: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  channels: MessageChannel[];
  audience: MessageAudience;
  recipientUserIds?: string[];
  targetClassYearIds?: string[];
  targetStreamIds?: string[];
  priority?: MessagePriority;
  scheduledAt?: Date;
  attachmentUrls?: string[];
  sendNow?: boolean;
}) {
  try {
    const {
      schoolId,
      createdById,
      subject,
      body,
      bodyHtml,
      channels,
      audience,
      recipientUserIds = [],
      targetClassYearIds = [],
      targetStreamIds = [],
      priority = "NORMAL",
      scheduledAt,
      attachmentUrls = [],
      sendNow = false,
    } = data;

    if (!subject?.trim()) {
      return { ok: false, message: "Subject is required" };
    }
    if (!body?.trim()) {
      return { ok: false, message: "Message body is required" };
    }
    if (!channels || channels.length === 0) {
      return { ok: false, message: "At least one delivery channel is required" };
    }
    if (audience === "SPECIFIC_USERS" && recipientUserIds.length === 0) {
      return { ok: false, message: "Specify at least one recipient for targeted messages" };
    }

    const message = await db.message.create({
      data: {
        schoolId,
        createdById,
        subject: subject.trim(),
        body: body.trim(),
        bodyHtml: bodyHtml?.trim() ?? null,
        channels,
        audience,
        recipientUserIds,
        targetClassYearIds,
        targetStreamIds,
        priority,
        scheduledAt: scheduledAt ?? null,
        attachmentUrls,
        status: sendNow ? "SENDING" : scheduledAt ? "SCHEDULED" : "DRAFT",
      },
    });

    if (sendNow) {
      await _dispatchMessage(message.id, schoolId);
    }

    revalidatePath("/dashboard/communications/messages");

    return {
      ok: true,
      data: message,
      message: sendNow
        ? "Message sent successfully"
        : scheduledAt
        ? "Message scheduled successfully"
        : "Message saved as draft",
    };
  } catch (error: any) {
    console.error("❌ Error creating message:", error);
    return { ok: false, message: error?.message ?? "Failed to create message" };
  }
}

/**
 * Resolve the full list of recipient User IDs for a given message audience.
 * Used internally before creating MessageDelivery / SystemMessagePost rows.
 */
async function _resolveRecipients(
  schoolId: string,
  audience: MessageAudience,
  recipientUserIds: string[],
  targetClassYearIds: string[],
  targetStreamIds: string[]
): Promise<{ id: string; name: string; email: string | null; phone: string }[]> {
  if (audience === "SPECIFIC_USERS") {
    return db.user.findMany({
      where: { id: { in: recipientUserIds }, schoolId },
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  const where: Prisma.UserWhereInput = { schoolId };

  if (audience === "PARENTS") {
    where.userType = "PARENT";
    if (targetClassYearIds.length > 0 || targetStreamIds.length > 0) {
      where.parent = {
        students: {
          some: {
            enrollments: {
              some: {
                status: "ACTIVE",
                ...(targetClassYearIds.length > 0 && {
                  classYearId: { in: targetClassYearIds },
                }),
                ...(targetStreamIds.length > 0 && {
                  streamId: { in: targetStreamIds },
                }),
              },
            },
          },
        },
      };
    }
  } else if (audience === "TEACHERS") {
    where.userType = "STAFF";
    where.teacher = { isNot: null };
  } else if (audience === "ALL_STAFF") {
    where.userType = "STAFF";
  }
  // audience === "ALL" — no extra filter

  return db.user.findMany({
    where,
    select: { id: true, name: true, email: true, phone: true },
  });
}

/**
 * Internal: fan-out a message to its resolved recipients.
 * Creates MessageDelivery rows (email / SMS) and SystemMessagePost rows (SYSTEM).
 */
async function _dispatchMessage(messageId: string, schoolId: string) {
  const message = await db.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      channels: true,
      audience: true,
      recipientUserIds: true,
      targetClassYearIds: true,
      targetStreamIds: true,
    },
  });
  if (!message) return;

  const recipients = await _resolveRecipients(
    schoolId,
    message.audience,
    message.recipientUserIds,
    message.targetClassYearIds,
    message.targetStreamIds
  );

  const now = new Date();
  const deliveryRows: Prisma.MessageDeliveryCreateManyInput[] = [];
  const systemPostRows: Prisma.SystemMessagePostCreateManyInput[] = [];

  for (const user of recipients) {
    for (const channel of message.channels) {
      if (channel === "SYSTEM") {
        systemPostRows.push({ messageId, userId: user.id });
      } else {
        deliveryRows.push({
          messageId,
          userId: user.id,
          channel,
          status: "PENDING",
          recipientName: user.name,
          recipientEmail: user.email,
          recipientPhone: user.phone,
        });
      }
    }
  }

  await Promise.all([
    deliveryRows.length > 0
      ? db.messageDelivery.createMany({ data: deliveryRows, skipDuplicates: true })
      : Promise.resolve(),
    systemPostRows.length > 0
      ? db.systemMessagePost.createMany({ data: systemPostRows, skipDuplicates: true })
      : Promise.resolve(),
  ]);

  await db.message.update({
    where: { id: messageId },
    data: {
      status: "SENT",
      sentAt: now,
      totalRecipients: recipients.length,
    },
  });
}

/**
 * Send a draft / scheduled message immediately
 */
export async function sendMessage(messageId: string) {
  try {
    const message = await db.message.findUnique({
      where: { id: messageId },
      select: { id: true, status: true, schoolId: true },
    });

    if (!message) return { ok: false, message: "Message not found" };
    if (message.status === "SENT") {
      return { ok: false, message: "Message has already been sent" };
    }
    if (message.status === "CANCELLED") {
      return { ok: false, message: "Cannot send a cancelled message" };
    }

    await db.message.update({
      where: { id: messageId },
      data: { status: "SENDING" },
    });

    await _dispatchMessage(messageId, message.schoolId);

    revalidatePath("/dashboard/communications/messages");

    return { ok: true, message: "Message sent successfully" };
  } catch (error: any) {
    console.error("❌ Error sending message:", error);
    return { ok: false, message: error?.message ?? "Failed to send message" };
  }
}

/**
 * Get all messages for a school (with pagination)
 */
export async function getMessagesBySchool(
  schoolId: string,
  options?: {
    status?: MessageStatus;
    audience?: MessageAudience;
    channel?: MessageChannel;
    page?: number;
    pageSize?: number;
  }
) {
  try {
    const { status, audience, channel, page = 1, pageSize = 20 } = options ?? {};
    const skip = (page - 1) * pageSize;

    const where: Prisma.MessageWhereInput = {
      schoolId,
      ...(status && { status }),
      ...(audience && { audience }),
      ...(channel && { channels: { has: channel } }),
    };

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { deliveries: true, systemPosts: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.message.count({ where }),
    ]);

    return {
      ok: true,
      data: messages,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error: any) {
    console.error("❌ Error fetching messages:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch messages", data: [] };
  }
}

/**
 * Get a single message with full details
 */
export async function getMessageById(messageId: string) {
  try {
    return await db.message.findUnique({
      where: { id: messageId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        deliveries: {
          include: {
            user: { select: { id: true, name: true, userType: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        systemPosts: {
          include: {
            user: { select: { id: true, name: true, userType: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching message:", error);
    return null;
  }
}

/**
 * Get the system-message inbox for a specific user
 */
export async function getUserInbox(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    archived?: boolean;
    page?: number;
    pageSize?: number;
  }
) {
  try {
    const { unreadOnly = false, archived = false, page = 1, pageSize = 20 } = options ?? {};
    const skip = (page - 1) * pageSize;

    const where: Prisma.SystemMessagePostWhereInput = {
      userId,
      deletedAt: null,
      isArchived: archived,
      ...(unreadOnly && { isRead: false }),
    };

    const [posts, total, unreadCount] = await Promise.all([
      db.systemMessagePost.findMany({
        where,
        include: {
          message: {
            select: {
              id: true,
              subject: true,
              body: true,
              priority: true,
              sentAt: true,
              createdBy: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.systemMessagePost.count({ where }),
      db.systemMessagePost.count({ where: { userId, isRead: false, deletedAt: null } }),
    ]);

    return { ok: true, data: posts, total, unreadCount, page, pageSize };
  } catch (error: any) {
    console.error("❌ Error fetching user inbox:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch inbox", data: [] };
  }
}

/**
 * Mark a system message post as read
 */
export async function markMessageAsRead(postId: string, userId: string) {
  try {
    const post = await db.systemMessagePost.findFirst({
      where: { id: postId, userId },
    });
    if (!post) return { ok: false, message: "Message not found" };

    await db.systemMessagePost.update({
      where: { id: postId },
      data: { isRead: true, readAt: new Date() },
    });

    revalidatePath("/dashboard/communications/inbox");
    return { ok: true, message: "Message marked as read" };
  } catch (error: any) {
    console.error("❌ Error marking message as read:", error);
    return { ok: false, message: error?.message ?? "Failed to mark as read" };
  }
}

/**
 * Mark all unread inbox posts as read for a user
 */
export async function markAllMessagesAsRead(userId: string) {
  try {
    const result = await db.systemMessagePost.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });

    revalidatePath("/dashboard/communications/inbox");
    return { ok: true, message: `${result.count} message(s) marked as read` };
  } catch (error: any) {
    console.error("❌ Error marking all messages as read:", error);
    return { ok: false, message: error?.message ?? "Failed to mark all as read" };
  }
}

/**
 * Archive / unarchive a system message post
 */
export async function toggleMessageArchive(postId: string, userId: string) {
  try {
    const post = await db.systemMessagePost.findFirst({
      where: { id: postId, userId },
      select: { isArchived: true },
    });
    if (!post) return { ok: false, message: "Message not found" };

    await db.systemMessagePost.update({
      where: { id: postId },
      data: { isArchived: !post.isArchived },
    });

    revalidatePath("/dashboard/communications/inbox");
    return {
      ok: true,
      message: post.isArchived ? "Message unarchived" : "Message archived",
    };
  } catch (error: any) {
    console.error("❌ Error toggling message archive:", error);
    return { ok: false, message: error?.message ?? "Failed to archive message" };
  }
}

/**
 * Soft-delete a system message post for a user
 */
export async function deleteMessagePost(postId: string, userId: string) {
  try {
    const post = await db.systemMessagePost.findFirst({
      where: { id: postId, userId },
    });
    if (!post) return { ok: false, message: "Message not found" };

    await db.systemMessagePost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/communications/inbox");
    return { ok: true, message: "Message deleted" };
  } catch (error: any) {
    console.error("❌ Error deleting message post:", error);
    return { ok: false, message: error?.message ?? "Failed to delete message" };
  }
}

/**
 * Cancel a scheduled or draft message
 */
export async function cancelMessage(messageId: string) {
  try {
    const message = await db.message.findUnique({
      where: { id: messageId },
      select: { status: true },
    });
    if (!message) return { ok: false, message: "Message not found" };
    if (message.status === "SENT") {
      return { ok: false, message: "Cannot cancel a message that has already been sent" };
    }

    await db.message.update({
      where: { id: messageId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/dashboard/communications/messages");
    return { ok: true, message: "Message cancelled" };
  } catch (error: any) {
    console.error("❌ Error cancelling message:", error);
    return { ok: false, message: error?.message ?? "Failed to cancel message" };
  }
}

/**
 * Update delivery status (called by email / SMS provider webhooks)
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  meta?: { externalRef?: string; failureReason?: string }
) {
  try {
    const delivery = await db.messageDelivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, messageId: true },
    });
    if (!delivery) return { ok: false, message: "Delivery record not found" };

    await db.messageDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        ...(status === "DELIVERED" && { deliveredAt: new Date() }),
        ...(status === "READ" && { readAt: new Date() }),
        ...(meta?.externalRef && { externalRef: meta.externalRef }),
        ...(meta?.failureReason && { failureReason: meta.failureReason }),
      },
    });

    // Refresh aggregate stats on the parent message
    const [delivered, read, failed] = await Promise.all([
      db.messageDelivery.count({
        where: { messageId: delivery.messageId, status: "DELIVERED" },
      }),
      db.messageDelivery.count({
        where: { messageId: delivery.messageId, status: "READ" },
      }),
      db.messageDelivery.count({
        where: { messageId: delivery.messageId, status: "FAILED" },
      }),
    ]);

    await db.message.update({
      where: { id: delivery.messageId },
      data: { deliveredCount: delivered, readCount: read, failedCount: failed },
    });

    return { ok: true, message: "Delivery status updated" };
  } catch (error: any) {
    console.error("❌ Error updating delivery status:", error);
    return { ok: false, message: error?.message ?? "Failed to update delivery status" };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create a school event
 */
export async function createEvent(data: {
  schoolId: string;
  createdById: string;
  title: string;
  description?: string;
  eventType: EventType;
  audience?: EventAudience;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  location?: string;
  onlineUrl?: string;
  colorTag?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: Date;
  attachmentUrls?: string[];
  coverImageUrl?: string;
  isPinned?: boolean;
  publishNow?: boolean;
  reminderMinutesBefore?: number[];
}) {
  try {
    const {
      schoolId,
      createdById,
      title,
      description,
      eventType,
      audience = "ALL",
      startDate,
      endDate,
      allDay = false,
      location,
      onlineUrl,
      colorTag,
      isRecurring = false,
      recurrenceRule,
      recurrenceEndDate,
      attachmentUrls = [],
      coverImageUrl,
      isPinned = false,
      publishNow = false,
      reminderMinutesBefore = [],
    } = data;

    if (!title?.trim()) {
      return { ok: false, message: "Event title is required" };
    }
    if (!startDate || !endDate) {
      return { ok: false, message: "Start date and end date are required" };
    }
    if (endDate < startDate) {
      return { ok: false, message: "End date must be after start date" };
    }
    if (isRecurring && !recurrenceRule) {
      return { ok: false, message: "Recurrence rule is required for recurring events" };
    }

    const event = await db.schoolEvent.create({
      data: {
        schoolId,
        createdById,
        title: title.trim(),
        description: description?.trim() ?? null,
        eventType,
        audience,
        startDate,
        endDate,
        allDay,
        location: location?.trim() ?? null,
        onlineUrl: onlineUrl?.trim() ?? null,
        colorTag: colorTag ?? null,
        isRecurring,
        recurrenceRule: recurrenceRule ?? null,
        recurrenceEndDate: recurrenceEndDate ?? null,
        attachmentUrls,
        coverImageUrl: coverImageUrl ?? null,
        isPinned,
        status: publishNow ? "PUBLISHED" : "DRAFT",
        publishedAt: publishNow ? new Date() : null,
        // Create reminders inline
        reminders: reminderMinutesBefore.length > 0
          ? {
              createMany: {
                data: reminderMinutesBefore.map((minutes) => ({
                  minutesBefore: minutes,
                  audience,
                  channels: ["SYSTEM"] as MessageChannel[],
                })),
              },
            }
          : undefined,
      },
      include: {
        reminders: true,
        _count: { select: { rsvps: true } },
      },
    });

    revalidatePath("/dashboard/communications/events");

    return {
      ok: true,
      data: event,
      message: publishNow ? "Event published successfully" : "Event saved as draft",
    };
  } catch (error: any) {
    console.error("❌ Error creating event:", error);
    return { ok: false, message: error?.message ?? "Failed to create event" };
  }
}

/**
 * Get all events for a school (with optional filters)
 */
export async function getEventsBySchool(
  schoolId: string,
  options?: {
    status?: EventStatus;
    eventType?: EventType;
    audience?: EventAudience;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
  }
) {
  try {
    const {
      status,
      eventType,
      audience,
      fromDate,
      toDate,
      page = 1,
      pageSize = 20,
    } = options ?? {};
    const skip = (page - 1) * pageSize;

    const where: Prisma.SchoolEventWhereInput = {
      schoolId,
      ...(status && { status }),
      ...(eventType && { eventType }),
      ...(audience && { audience }),
      ...(fromDate || toDate
        ? {
            startDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
    };

    const [events, total] = await Promise.all([
      db.schoolEvent.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { rsvps: true, reminders: true } },
        },
        orderBy: [{ isPinned: "desc" }, { startDate: "asc" }],
        skip,
        take: pageSize,
      }),
      db.schoolEvent.count({ where }),
    ]);

    return { ok: true, data: events, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error: any) {
    console.error("❌ Error fetching events:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch events", data: [] };
  }
}

/**
 * Get upcoming events visible to a specific user
 */
export async function getUpcomingEventsForUser(
  userId: string,
  schoolId: string,
  limit = 5
) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });
    if (!user) return [];

    // Derive the audiences this user can see
    const audienceFilter: EventAudience[] = ["ALL"];
    if (user.userType === "PARENT") audienceFilter.push("PARENTS");
    if (user.userType === "STAFF") {
      audienceFilter.push("ALL_STAFF", "TEACHERS");
    }
    if (user.userType === "STUDENT") audienceFilter.push("STUDENTS");

    return db.schoolEvent.findMany({
      where: {
        schoolId,
        status: "PUBLISHED",
        audience: { in: audienceFilter },
        endDate: { gte: new Date() },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { rsvps: true } },
      },
      orderBy: { startDate: "asc" },
      take: limit,
    });
  } catch (error: any) {
    console.error("❌ Error fetching upcoming events:", error);
    return [];
  }
}

/**
 * Get single event by ID
 */
export async function getEventById(eventId: string) {
  try {
    return await db.schoolEvent.findUnique({
      where: { id: eventId },
      include: {
        createdBy: { select: { id: true, name: true } },
        reminders: true,
        rsvps: {
          include: {
            user: { select: { id: true, name: true, userType: true } },
          },
        },
        _count: { select: { rsvps: true } },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching event:", error);
    return null;
  }
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  data: Partial<{
    title: string;
    description: string;
    eventType: EventType;
    audience: EventAudience;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    location: string;
    onlineUrl: string;
    colorTag: string;
    isRecurring: boolean;
    recurrenceRule: string;
    recurrenceEndDate: Date;
    attachmentUrls: string[];
    coverImageUrl: string;
    isPinned: boolean;
    status: EventStatus;
  }>
) {
  try {
    const event = await db.schoolEvent.findUnique({
      where: { id: eventId },
      select: { id: true, status: true },
    });
    if (!event) return { ok: false, message: "Event not found" };

    if (
      data.startDate &&
      data.endDate &&
      data.endDate < data.startDate
    ) {
      return { ok: false, message: "End date must be after start date" };
    }

    const updated = await db.schoolEvent.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.eventType !== undefined && { eventType: data.eventType }),
        ...(data.audience !== undefined && { audience: data.audience }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.location !== undefined && { location: data.location.trim() }),
        ...(data.onlineUrl !== undefined && { onlineUrl: data.onlineUrl.trim() }),
        ...(data.colorTag !== undefined && { colorTag: data.colorTag }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.recurrenceRule !== undefined && { recurrenceRule: data.recurrenceRule }),
        ...(data.recurrenceEndDate !== undefined && { recurrenceEndDate: data.recurrenceEndDate }),
        ...(data.attachmentUrls !== undefined && { attachmentUrls: data.attachmentUrls }),
        ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
        ...(data.status !== undefined && {
          status: data.status,
          ...(data.status === "PUBLISHED" && event.status !== "PUBLISHED"
            ? { publishedAt: new Date() }
            : {}),
        }),
      },
    });

    revalidatePath("/dashboard/communications/events");
    revalidatePath(`/dashboard/communications/events/${eventId}`);

    return { ok: true, data: updated, message: "Event updated successfully" };
  } catch (error: any) {
    console.error("❌ Error updating event:", error);
    return { ok: false, message: error?.message ?? "Failed to update event" };
  }
}

/**
 * Publish a draft event
 */
export async function publishEvent(eventId: string) {
  try {
    const event = await db.schoolEvent.findUnique({
      where: { id: eventId },
      select: { status: true },
    });
    if (!event) return { ok: false, message: "Event not found" };
    if (event.status === "PUBLISHED") {
      return { ok: false, message: "Event is already published" };
    }
    if (event.status === "CANCELLED") {
      return { ok: false, message: "Cannot publish a cancelled event" };
    }

    await db.schoolEvent.update({
      where: { id: eventId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    revalidatePath("/dashboard/communications/events");
    return { ok: true, message: "Event published successfully" };
  } catch (error: any) {
    console.error("❌ Error publishing event:", error);
    return { ok: false, message: error?.message ?? "Failed to publish event" };
  }
}

/**
 * Cancel an event
 */
export async function cancelEvent(eventId: string) {
  try {
    const event = await db.schoolEvent.findUnique({
      where: { id: eventId },
      select: { status: true },
    });
    if (!event) return { ok: false, message: "Event not found" };
    if (event.status === "COMPLETED") {
      return { ok: false, message: "Cannot cancel a completed event" };
    }

    await db.schoolEvent.update({
      where: { id: eventId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/dashboard/communications/events");
    return { ok: true, message: "Event cancelled successfully" };
  } catch (error: any) {
    console.error("❌ Error cancelling event:", error);
    return { ok: false, message: error?.message ?? "Failed to cancel event" };
  }
}

/**
 * Delete an event (only drafts with no RSVPs)
 */
export async function deleteEvent(eventId: string) {
  try {
    const event = await db.schoolEvent.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { rsvps: true } },
      },
    });
    if (!event) return { ok: false, message: "Event not found" };
    if (event.status === "PUBLISHED" && event._count.rsvps > 0) {
      return {
        ok: false,
        message: `Cannot delete a published event with ${event._count.rsvps} RSVP(s). Cancel it instead.`,
      };
    }

    await db.schoolEvent.delete({ where: { id: eventId } });

    revalidatePath("/dashboard/communications/events");
    return { ok: true, message: `Event "${event.title}" deleted successfully` };
  } catch (error: any) {
    console.error("❌ Error deleting event:", error);
    return { ok: false, message: error?.message ?? "Failed to delete event" };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT RSVPs
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create or update an RSVP for an event
 */
export async function upsertEventRSVP(data: {
  eventId: string;
  userId: string;
  response: "ATTENDING" | "DECLINED" | "MAYBE";
  notes?: string;
}) {
  try {
    const { eventId, userId, response, notes } = data;

    const event = await db.schoolEvent.findUnique({
      where: { id: eventId },
      select: { status: true, title: true },
    });
    if (!event) return { ok: false, message: "Event not found" };
    if (event.status !== "PUBLISHED") {
      return { ok: false, message: "RSVPs are only accepted for published events" };
    }

    const rsvp = await db.eventRSVP.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, response, notes: notes ?? null },
      update: { response, notes: notes ?? null, respondedAt: new Date() },
    });

    revalidatePath(`/dashboard/communications/events/${eventId}`);
    return { ok: true, data: rsvp, message: "RSVP recorded successfully" };
  } catch (error: any) {
    console.error("❌ Error upserting RSVP:", error);
    return { ok: false, message: error?.message ?? "Failed to record RSVP" };
  }
}

/**
 * Get all RSVPs for an event
 */
export async function getEventRSVPs(eventId: string) {
  try {
    return await db.eventRSVP.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, userType: true, email: true },
        },
      },
      orderBy: { respondedAt: "desc" },
    });
  } catch (error: any) {
    console.error("❌ Error fetching RSVPs:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get notification preferences for a user (creates defaults if absent)
 */
export async function getNotificationPreferences(userId: string, schoolId: string) {
  try {
    return await db.notificationPreference.upsert({
      where: { userId_schoolId: { userId, schoolId } },
      create: { userId, schoolId },
      update: {},
    });
  } catch (error: any) {
    console.error("❌ Error fetching notification preferences:", error);
    return null;
  }
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  schoolId: string,
  data: Partial<{
    systemEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    receiveSchoolMessages: boolean;
    receiveEventReminders: boolean;
    receiveFeeAlerts: boolean;
    receiveGradeReports: boolean;
    receiveAttendanceAlerts: boolean;
    receiveStaffNotices: boolean;
    receiveAnnouncements: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    digestEnabled: boolean;
    digestFrequency: string;
  }>
) {
  try {
    const prefs = await db.notificationPreference.upsert({
      where: { userId_schoolId: { userId, schoolId } },
      create: { userId, schoolId, ...data },
      update: data,
    });

    revalidatePath("/dashboard/settings/notifications");
    return { ok: true, data: prefs, message: "Notification preferences updated" };
  } catch (error: any) {
    console.error("❌ Error updating notification preferences:", error);
    return { ok: false, message: error?.message ?? "Failed to update preferences" };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// APP NOTIFICATIONS (Bell icon feed)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create a single in-app notification for a user
 */
export async function createAppNotification(data: {
  userId: string;
  schoolId: string;
  title: string;
  body: string;
  actionUrl?: string;
  iconType?: string;
  sourceType?: string;
  sourceId?: string;
  expiresAt?: Date;
}) {
  try {
    const notification = await db.appNotification.create({ data });
    return { ok: true, data: notification };
  } catch (error: any) {
    console.error("❌ Error creating app notification:", error);
    return { ok: false, message: error?.message ?? "Failed to create notification" };
  }
}

/**
 * Fan-out a notification to multiple users at once
 */
export async function broadcastAppNotification(data: {
  userIds: string[];
  schoolId: string;
  title: string;
  body: string;
  actionUrl?: string;
  iconType?: string;
  sourceType?: string;
  sourceId?: string;
  expiresAt?: Date;
}) {
  try {
    const { userIds, ...rest } = data;

    await db.appNotification.createMany({
      data: userIds.map((userId) => ({ userId, ...rest })),
      skipDuplicates: true,
    });

    return { ok: true, message: `Notification sent to ${userIds.length} user(s)` };
  } catch (error: any) {
    console.error("❌ Error broadcasting app notification:", error);
    return { ok: false, message: error?.message ?? "Failed to broadcast notification" };
  }
}

/**
 * Get in-app notifications for a user
 */
export async function getAppNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; page?: number; pageSize?: number }
) {
  try {
    const { unreadOnly = false, page = 1, pageSize = 20 } = options ?? {};
    const skip = (page - 1) * pageSize;

    const where: Prisma.AppNotificationWhereInput = {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      db.appNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.appNotification.count({ where }),
      db.appNotification.count({ where: { userId, isRead: false } }),
    ]);

    return { ok: true, data: notifications, total, unreadCount, page, pageSize };
  } catch (error: any) {
    console.error("❌ Error fetching app notifications:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch notifications", data: [] };
  }
}

/**
 * Mark a single app notification as read
 */
export async function markAppNotificationRead(notificationId: string, userId: string) {
  try {
    const n = await db.appNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!n) return { ok: false, message: "Notification not found" };

    await db.appNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return { ok: true, message: "Notification marked as read" };
  } catch (error: any) {
    console.error("❌ Error marking notification as read:", error);
    return { ok: false, message: error?.message ?? "Failed to mark as read" };
  }
}

/**
 * Mark ALL app notifications as read for a user
 */
export async function markAllAppNotificationsRead(userId: string) {
  try {
    const result = await db.appNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { ok: true, message: `${result.count} notification(s) marked as read` };
  } catch (error: any) {
    console.error("❌ Error marking all notifications as read:", error);
    return { ok: false, message: error?.message ?? "Failed to mark all as read" };
  }
}

/**
 * Delete an app notification
 */
export async function deleteAppNotification(notificationId: string, userId: string) {
  try {
    const n = await db.appNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!n) return { ok: false, message: "Notification not found" };

    await db.appNotification.delete({ where: { id: notificationId } });
    return { ok: true, message: "Notification deleted" };
  } catch (error: any) {
    console.error("❌ Error deleting notification:", error);
    return { ok: false, message: error?.message ?? "Failed to delete notification" };
  }
}

/**
 * Get communication stats for a school (for admin dashboard)
 */
export async function getCommunicationStats(schoolId: string) {
  try {
    const [
      totalMessages,
      sentMessages,
      scheduledMessages,
      draftMessages,
      totalEvents,
      upcomingEvents,
      unreadSystemPosts,
    ] = await Promise.all([
      db.message.count({ where: { schoolId } }),
      db.message.count({ where: { schoolId, status: "SENT" } }),
      db.message.count({ where: { schoolId, status: "SCHEDULED" } }),
      db.message.count({ where: { schoolId, status: "DRAFT" } }),
      db.schoolEvent.count({ where: { schoolId } }),
      db.schoolEvent.count({
        where: {
          schoolId,
          status: "PUBLISHED",
          startDate: { gte: new Date() },
        },
      }),
      db.systemMessagePost.count({
        where: {
          isRead: false,
          deletedAt: null,
          message: { schoolId },
        },
      }),
    ]);

    return {
      ok: true,
      data: {
        totalMessages,
        sentMessages,
        scheduledMessages,
        draftMessages,
        totalEvents,
        upcomingEvents,
        unreadSystemPosts,
      },
    };
  } catch (error: any) {
    console.error("❌ Error fetching communication stats:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch stats" };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEACHER COMMUNICATIONS VIEW
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch all communications visible to teaching staff:
 * - Messages with audience: ALL, ALL_STAFF, TEACHERS
 * - Published events with audience: ALL, ALL_STAFF, TEACHERS
 * - User's own inbox posts
 */
export async function getTeacherCommunications(userId: string, schoolId: string) {
  try {
    const staffAudiences: MessageAudience[] = ["ALL", "ALL_STAFF", "TEACHERS"];
    const eventAudiences: EventAudience[]   = ["ALL", "ALL_STAFF", "TEACHERS"];

    const [messages, events, inboxPosts] = await Promise.all([
      db.message.findMany({
        where: {
          schoolId,
          status: "SENT",
          audience: { in: staffAudiences },
        },
        select: {
          id: true,
          subject: true,
          body: true,
          audience: true,
          priority: true,
          sentAt: true,
          createdAt: true,
          channels: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { sentAt: "desc" },
        take: 50,
      }),
      db.schoolEvent.findMany({
        where: {
          schoolId,
          status: "PUBLISHED",
          audience: { in: eventAudiences },
        },
        select: {
          id: true,
          title: true,
          description: true,
          eventType: true,
          audience: true,
          startDate: true,
          endDate: true,
          allDay: true,
          location: true,
          colorTag: true,
          isPinned: true,
          coverImageUrl: true,
          createdBy: { select: { id: true, name: true } },
          _count: { select: { rsvps: true } },
        },
        orderBy: [{ isPinned: "desc" }, { startDate: "asc" }],
      }),
      db.systemMessagePost.findMany({
        where: { userId, deletedAt: null },
        select: {
          id: true,
          isRead: true,
          createdAt: true,
          message: {
            select: {
              id: true,
              subject: true,
              body: true,
              priority: true,
              sentAt: true,
              audience: true,
              createdBy: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const unreadCount = inboxPosts.filter(p => !p.isRead).length;

    return { ok: true as const, data: { messages, events, inboxPosts, unreadCount } };
  } catch (error: any) {
    console.error("❌ Error fetching teacher communications:", error);
    return { ok: false as const, message: error?.message ?? "Failed to fetch communications" };
  }
}
