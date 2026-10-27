const nodemailer = require('nodemailer');

/**
 * Resilient Email Sender Utility
 * Sends transactional HTML & plain text emails using Nodemailer.
 * In development mode with placeholder credentials, logs email contents to the console.
 */
const sendEmail = async (options) => {
  const isPlaceholder =
    !process.env.EMAIL_USERNAME ||
    process.env.EMAIL_USERNAME === 'your_mailtrap_username' ||
    process.env.EMAIL_USERNAME.includes('your_');

  // Development & Test simulation fallback
  if (
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
    isPlaceholder
  ) {
    if (process.env.NODE_ENV !== 'test') {
      console.log('\n==================================================');
      console.log('📧 [DEV EMAIL SIMULATOR] Transactional Email Generated:');
      console.log(`• To:      ${options.email}`);
      console.log(`• Subject: ${options.subject}`);
      console.log('• Body:');
      console.log(options.message);
      console.log('==================================================\n');
    }
    return { messageId: 'simulated-dev-id', simulated: true };
  }

  // 1) Create Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ApexMart Support <support@apexmart.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message.replace(/\n/g, '<br>'),
  };

  // 3) Send the email
  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
