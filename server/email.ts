import nodemailer from 'nodemailer';
import type { VpsOrder, VpsPackage } from '@shared/schema';

// Email configuration - you can switch between SMTP and SendGrid
const EMAIL_CONFIG = {
  // SMTP Configuration (using environment variables if available)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  // Fallback to console logging if SMTP not configured
  fallback: true,
};

// Create SMTP transporter
let transporter: nodemailer.Transporter | null = null;

try {
  if (EMAIL_CONFIG.smtp.auth.user && EMAIL_CONFIG.smtp.auth.pass) {
    transporter = nodemailer.createTransporter({
      host: EMAIL_CONFIG.smtp.host,
      port: EMAIL_CONFIG.smtp.port,
      secure: EMAIL_CONFIG.smtp.port === 465,
      auth: EMAIL_CONFIG.smtp.auth,
    });
    console.log('[Email] SMTP transporter configured successfully');
  } else {
    console.log('[Email] SMTP credentials not provided, using console logging fallback');
  }
} catch (error) {
  console.error('[Email] Failed to configure SMTP transporter:', error);
  transporter = null;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Generic email sending function
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (transporter) {
      // Send via SMTP
      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@hostfarm.org',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });
      
      console.log(`[Email] Email sent successfully to ${options.to}: ${result.messageId}`);
      return true;
    } else {
      // Fallback to console logging
      console.log('[Email] === EMAIL NOTIFICATION ===');
      console.log(`[Email] To: ${options.to}`);
      console.log(`[Email] Subject: ${options.subject}`);
      console.log(`[Email] Content:\n${options.text || options.html}`);
      console.log('[Email] === END EMAIL ===');
      return true;
    }
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

// Send VPS order notification to admin
export async function sendVpsOrderNotification(order: VpsOrder, vpsPackage: VpsPackage): Promise<boolean> {
  const subject = `🚨 New VPS Order #${order.id} - ${order.packageName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #1f2937; margin-bottom: 20px; text-align: center;">
          🆕 New VPS Order Received
        </h1>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Order ID:</td>
              <td style="padding: 8px 0; color: #1f2937;">#${order.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Customer Email:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Package:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.packageName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Operating System:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.operatingSystem}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Monthly Price:</td>
              <td style="padding: 8px 0; color: #1f2937;">$${(order.packagePrice / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Status:</td>
              <td style="padding: 8px 0;">
                <span style="background: #fbbf24; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${order.status.toUpperCase()}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Server Specifications</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">vCPU:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.vcpu}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Memory:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.memory}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Storage:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.storage}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Stripe Payment Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subscription ID:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 12px;">${order.stripeSubscriptionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Customer ID:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 12px;">${order.stripeCustomerId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subscription Status:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.subscriptionStatus}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/admin` : 'http://localhost:5000/admin'}" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            🎛️ Process Order in Admin Dashboard
          </a>
        </div>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
            📧 This is an automated notification from HostFarm.org VPS ordering system.<br>
            Order received at: ${new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
🆕 NEW VPS ORDER RECEIVED

Order Details:
- Order ID: #${order.id}
- Customer Email: ${order.customerEmail}
- Package: ${order.packageName}
- Operating System: ${order.operatingSystem}
- Monthly Price: $${(order.packagePrice / 100).toFixed(2)}
- Status: ${order.status.toUpperCase()}

Server Specifications:
- vCPU: ${order.vcpu}
- Memory: ${order.memory}
- Storage: ${order.storage}

Stripe Payment Details:
- Subscription ID: ${order.stripeSubscriptionId}
- Customer ID: ${order.stripeCustomerId}
- Subscription Status: ${order.subscriptionStatus}

⚡ Action Required: Please process this order in the admin dashboard.

Order received at: ${new Date(order.createdAt).toLocaleString()}
  `;

  return await sendEmail({
    to: 'ceo@openweb.email',
    subject,
    html,
    text,
  });
}

// Send VPS setup completion notification to customer
export async function sendVpsSetupCompleteNotification(order: VpsOrder): Promise<boolean> {
  const subject = `🎉 Your VPS Server is Ready! - Order #${order.id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #059669; margin-bottom: 20px; text-align: center;">
          🎉 Your VPS Server is Ready!
        </h1>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Server Access Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">IP Address:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${order.serverIpAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Username:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${order.serverUsername}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Password:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${order.serverPassword}</td>
            </tr>
            ${order.serverSshPort ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">SSH Port:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${order.serverSshPort}</td>
            </tr>
            ` : ''}
            ${order.serverRdpPort ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">RDP Port:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${order.serverRdpPort}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Package Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Package:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.packageName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Operating System:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.operatingSystem}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">vCPU:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.vcpu}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Memory:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.memory}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Storage:</td>
              <td style="padding: 8px 0; color: #1f2937;">${order.storage}</td>
            </tr>
          </table>
        </div>

        ${order.serverNotes ? `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Additional Notes</h2>
          <p style="color: #1f2937; margin: 0;">${order.serverNotes}</p>
        </div>
        ` : ''}

        <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #dc2626; font-size: 14px;">
            ⚠️ <strong>Important:</strong> Please save these credentials securely. We cannot recover your password if lost.
          </p>
        </div>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
            🚀 Your server is now fully provisioned and ready to use!<br>
            For support, please contact us at ceo@openweb.email
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
🎉 YOUR VPS SERVER IS READY!

Server Access Details:
- IP Address: ${order.serverIpAddress}
- Username: ${order.serverUsername}
- Password: ${order.serverPassword}
${order.serverSshPort ? `- SSH Port: ${order.serverSshPort}` : ''}
${order.serverRdpPort ? `- RDP Port: ${order.serverRdpPort}` : ''}

Package Information:
- Package: ${order.packageName}
- Operating System: ${order.operatingSystem}
- vCPU: ${order.vcpu}
- Memory: ${order.memory}
- Storage: ${order.storage}

${order.serverNotes ? `Additional Notes: ${order.serverNotes}` : ''}

⚠️ IMPORTANT: Please save these credentials securely. We cannot recover your password if lost.

🚀 Your server is now fully provisioned and ready to use!
For support, please contact us at ceo@openweb.email
  `;

  return await sendEmail({
    to: order.customerEmail,
    subject,
    html,
    text,
  });
}