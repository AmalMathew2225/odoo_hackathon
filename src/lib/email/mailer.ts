import nodemailer, { type Transporter } from "nodemailer";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { getEnv } from "@/lib/env";
import type { Invoice, InvoiceLine, Profile } from "@/types/database";

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const env = getEnv();
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          }
        : undefined,
  });

  return transporter;
}

export interface SendInvoiceEmailParams {
  invoice: Invoice;
  lines: InvoiceLine[];
  customer: Profile;
}

/**
 * Sends an invoice notification email to the customer using configured SMTP credentials.
 */
export async function sendInvoiceEmail({
  invoice,
  lines,
  customer,
}: SendInvoiceEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const env = getEnv();
    const mail = getTransporter();

    const portalUrl = `${env.NEXT_PUBLIC_APP_URL}/portal/invoices`;
    const formattedTotal = formatPaiseToINR(invoice.total_amount);

    const itemsHtml = lines
      .map(
        (line) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #171717;">
            <strong>${line.product_name}</strong>
            ${line.variant_name ? `<br><span style="font-size: 12px; color: #737373;">${line.variant_name}</span>` : ""}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #171717; text-align: center;">
            ${line.quantity}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #171717; text-align: right;">
            ${formatPaiseToINR(line.unit_price)}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #171717; text-align: right;">
            ${formatPaiseToINR(line.line_total)}
          </td>
        </tr>`,
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; color: #171717; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 32px; }
          .header { border-bottom: 2px solid #171717; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 700; margin: 0; color: #171717; }
          .badge { display: inline-block; padding: 4px 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #f5f5f5; border: 1px solid #d4d4d4; }
          .totals-table { width: 100%; margin-top: 20px; }
          .totals-table td { padding: 6px 12px; font-size: 14px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #171717; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">BRIGHTLOOP SOFTWARE</h1>
            <p style="margin: 4px 0 0 0; color: #737373; font-size: 13px;">Subscription Billing & Operations</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px;">Dear <strong>${customer.full_name || customer.company_name || "Customer"}</strong>,</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #525252;">Your recurring subscription invoice <strong>${invoice.invoice_number}</strong> is now available.</p>
          </div>

          <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="color: #737373;">Invoice Number:</td>
                <td><strong>${invoice.invoice_number}</strong></td>
                <td style="color: #737373;">Issue Date:</td>
                <td><strong>${invoice.issue_date}</strong></td>
              </tr>
              <tr>
                <td style="color: #737373;">Billing Period:</td>
                <td>${invoice.period_start} to ${invoice.period_end}</td>
                <td style="color: #737373;">Due Date:</td>
                <td><strong>${invoice.due_date}</strong></td>
              </tr>
            </table>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f5f5f5; text-align: left;">
                <th style="padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #737373;">Item</th>
                <th style="padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #737373; text-align: center;">Qty</th>
                <th style="padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #737373; text-align: right;">Rate</th>
                <th style="padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #737373; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td style="text-align: right; color: #737373;">Subtotal:</td>
              <td style="text-align: right; width: 120px;">${formatPaiseToINR(invoice.subtotal)}</td>
            </tr>
            ${
              invoice.discount_amount > 0
                ? `<tr>
                    <td style="text-align: right; color: #737373;">Discount:</td>
                    <td style="text-align: right; color: #171717;">-${formatPaiseToINR(invoice.discount_amount)}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="text-align: right; color: #737373;">Tax (GST):</td>
              <td style="text-align: right;">${formatPaiseToINR(invoice.tax_amount)}</td>
            </tr>
            <tr style="border-top: 2px solid #171717;">
              <td style="text-align: right; font-weight: 700; font-size: 16px; padding-top: 10px;">Total Due:</td>
              <td style="text-align: right; font-weight: 700; font-size: 16px; padding-top: 10px;">${formattedTotal}</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${portalUrl}" class="button" target="_blank">View & Pay Invoice in Portal</a>
          </div>

          <div style="margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 12px; color: #a3a3a3; text-align: center;">
            Brightloop Software &bull; Automated Subscription Management &bull; Bangalore, India
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mail.sendMail({
      from: env.EMAIL_FROM,
      to: customer.email,
      subject: `Invoice ${invoice.invoice_number} from Brightloop Software [${formattedTotal}]`,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to dispatch invoice email:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
