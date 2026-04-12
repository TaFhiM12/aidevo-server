import nodemailer from "nodemailer";
import env from "../../config/env.js";

const parseSmtpPort = (portValue) => {
  const parsed = Number.parseInt(portValue || "", 10);
  return Number.isNaN(parsed) ? 587 : parsed;
};

const getTransport = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: parseSmtpPort(env.smtpPort),
    secure: env.smtpSecure === "true",
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const buildEventMail = (event) => {
  const eventTitle = event?.title || "New Event";
  const eventLocation = event?.location || "TBA";
  const eventStart = event?.startAt
    ? new Date(event.startAt).toLocaleString()
    : "Coming soon";
  const eventLink = `${env.publicAppUrl}/events`;

  return {
    subject: `New Event Published: ${eventTitle}`,
    text: [
      `A new volunteering event has been published: ${eventTitle}`,
      `Location: ${eventLocation}`,
      `Starts: ${eventStart}`,
      `Check details: ${eventLink}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">A new event is live</h2>
        <p style="margin: 0 0 10px;"><strong>${eventTitle}</strong></p>
        <p style="margin: 0 0 6px;">Location: ${eventLocation}</p>
        <p style="margin: 0 0 14px;">Starts: ${eventStart}</p>
        <a href="${eventLink}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;">View Events</a>
      </div>
    `,
  };
};

const sendEventPublishedEmail = async ({ recipientEmail, event }) => {
  const transporter = getTransport();

  if (!transporter) {
    return {
      sent: false,
      reason: "smtp_not_configured",
    };
  }

  const mail = buildEventMail(event);

  await transporter.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to: recipientEmail,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return {
    sent: true,
  };
};

const newsletterMailer = {
  sendEventPublishedEmail,
};

export default newsletterMailer;
