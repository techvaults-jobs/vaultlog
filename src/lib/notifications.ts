// Notification helpers – wire into your chosen providers (email, WhatsApp).

export type TicketStatusForNotification =
  | "NEW"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "ARCHIVED";

export async function sendEmailNotification(opts: {
  to: string;
  subject: string;
  body: string;
}) {
  // TODO: Integrate with your email provider (e.g. Resend, SendGrid).
  if (!process.env.NOTIFICATIONS_EMAIL_PROVIDER) {
    console.log("Email notification:", opts);
    return;
  }
}

export async function sendWhatsAppNotification(opts: {
  to: string;
  message: string;
}) {
  // TODO: Integrate with your WhatsApp provider (e.g. WhatsApp Business API).
  if (!process.env.NOTIFICATIONS_WHATSAPP_PROVIDER) {
    console.log("WhatsApp notification:", opts);
    return;
  }
}

export async function notifyClientOnStatusChange(params: {
  ticketId: string;
  clientDisplayName: string;
  statusFrom: TicketStatusForNotification;
  statusTo: TicketStatusForNotification;
}) {
  const { ticketId, clientDisplayName, statusFrom, statusTo } = params;

  // Example hook: trigger when moving from IN_PROGRESS to an external-facing state.
  if (statusFrom === "IN_PROGRESS" && statusTo === "COMPLETED") {
    const subject = `Update on your ticket ${ticketId}`;
    const body = `Hi ${clientDisplayName},\n\nYour ticket ${ticketId} has been moved for your review.\n\nBest regards,\nSupport Team`;
    const message = `Your ticket ${ticketId} has been moved for review.`;

    // In a real system you'll look up client email/phone from the database.
    await Promise.all([
      sendEmailNotification({
        to: "client@example.com",
        subject,
        body,
      }),
      sendWhatsAppNotification({
        to: "2340000000000",
        message,
      }),
    ]);
  }
}

