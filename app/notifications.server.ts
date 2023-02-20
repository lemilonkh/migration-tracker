import cron from "node-cron";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import invariant from "tiny-invariant";

import { getUsersWithMigrations } from "./models/user.server";

let lastExecutionDate: Date = new Date();

function isSameDay(d1: Date, d2: Date) {
  // year is ignored since migrations repeat annually
  return d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export async function sendNotifications() {
  // make sure this doesn't run too often because of hot reload
  const now = new Date();
  const elapsedMinutes = Math.abs(now.getTime() - lastExecutionDate.getTime()) / (1000 * 60);
  if (elapsedMinutes < 5) {
    console.error('Too early! Not sending notifications yet');
    return;
  }
  lastExecutionDate = now;

  console.log("Sending out notifications");
  invariant(process.env.NOTIFICATION_EMAIL, "Set NOTIFICATION_EMAIL in .env to use notifications");
  invariant(process.env.NOTIFICATION_PASSWORD, "Set NOTIFICATION_PASSWORD in .env to use notifications");

  const users = await getUsersWithMigrations();
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NOTIFICATION_EMAIL,
      pass: process.env.NOTIFICATION_PASSWORD,
    },
  });
  const today = new Date();

  for (const user of users) {
    if (!user.location) {
      console.log('No location for user', user.email);
      continue;
    }

    const startingMigrations = user.location.migrationSteps.filter((step) => isSameDay(step.startDate, today));
    if (startingMigrations.length === 0) {
      console.log('No starting migrations found for', user.location.title);
      continue;
    }

    const animals = startingMigrations.map((step) => step.migration.species);
    const verb = animals.length > 1 ? "are" : "is";
    const links = startingMigrations.map((step) => {
      return `<a href="${process.env.BASE_URL}/migrations/${step.migrationId}">${step.migration.title} (${step.migration.species})</a>`;
    }).join("<br/>");
    const mailOptions = {
      from: process.env.NOTIFICATION_EMAIL,
      to: user.email,
      subject: `${animals.join(', ')} ${verb} beginning to migrate to ${user.location.title}`,
      html: `You can find more info about these migrations here:<br>${links}`,
    };

    transport.sendMail(mailOptions, function(error: Error | null, info: SMTPTransport.SentMessageInfo) {
      if (error) {
        console.log(error);
      } else {
        console.log("Notification email to", user.email, "sent:", info.response);
      }
    });
  }
}
