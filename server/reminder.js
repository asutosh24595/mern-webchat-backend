const cron = require("node-cron");
const nodemailer = require("nodemailer");
const User = require("./model/User");

// Create a mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "asutoshshukla951@gmail.com",
    pass: "sggygvefoioogcyq",
  },
});

// Function to send a reminder email
const sendReminderEmail = async () => {
  try {
    const users = await User.find({}, "email");
    users.forEach((user) => {
      const mailOptions = {
        from: "asutoshshukla951@gmail.com",
        to: user.email,
        subject: "Weekly Reminder",
        text: "Hello world! This is your weekly reminder.",
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending reminder email:", error);
        } else {
          console.log("Reminder email sent:", info.response);
        }
      });
    });
    
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

// Schedule the task to run every week on Sunday at 9 AM
cron.schedule(
  "0 9 * * 0",
  () => {
    sendReminderEmail();
  },
  {
    timezone: "Asia/Kolkata", // Specify your timezone
  }
);

module.exports = { sendReminderEmail }; 
