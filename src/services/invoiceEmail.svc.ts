// Invoice email service for sending invoices to clients

import { EmailService } from './email.svc';
import { generateInvoiceToken } from '@/components/PublicInvoiceView';
import { sqliteService } from './sqlite.svc';

interface InvoiceEmailData {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  due_date: string;
  status: string;
  notes?: string;
}

interface CompanySettings {
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export class InvoiceEmailService {
  private static instance: InvoiceEmailService;
  private emailService: EmailService;

  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  static getInstance(): InvoiceEmailService {
    if (!InvoiceEmailService.instance) {
      InvoiceEmailService.instance = new InvoiceEmailService();
    }
    return InvoiceEmailService.instance;
  }

  /**
   * Sends an invoice email to the client
   */
  async sendInvoiceEmail(invoice: InvoiceEmailData): Promise<{ success: boolean; message: string }> {
    try {
      // Generate secure token for public viewing
      const token = generateInvoiceToken(invoice.id.toString());
      const invoiceViewUrl = `${window.location.origin}/invoice/${invoice.id}?token=${token}`;

      // Get company settings
      const companySettings = await this.getCompanySettings();
      
      // Create email content
      const subject = `Invoice ${invoice.invoice_number} from ${companySettings.companyName}`;
      const htmlContent = this.generateInvoiceEmailHTML(invoice, invoiceViewUrl, companySettings);
      const textContent = this.generateInvoiceEmailText(invoice, invoiceViewUrl, companySettings);

      // Send email
      const result = await this.emailService.sendEmail(
        invoice.client_email,
        subject,
        htmlContent,
        textContent
      );

      return result;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return {
        success: false,
        message: 'Failed to send invoice email'
      };
    }
  }

  /**
   * Sends a reminder email for an overdue invoice
   */
  async sendInvoiceReminder(invoice: InvoiceEmailData): Promise<{ success: boolean; message: string }> {
    try {
      const token = generateInvoiceToken(invoice.id.toString());
      const invoiceViewUrl = `${window.location.origin}/invoice/${invoice.id}?token=${token}`;
      const companySettings = await this.getCompanySettings();
      
      const subject = `Payment Reminder: Invoice ${invoice.invoice_number} - ${companySettings.companyName}`;
      const htmlContent = this.generateReminderEmailHTML(invoice, invoiceViewUrl, companySettings);
      const textContent = this.generateReminderEmailText(invoice, invoiceViewUrl, companySettings);

      const result = await this.emailService.sendEmail(
        invoice.client_email,
        subject,
        htmlContent,
        textContent
      );

      return result;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return {
        success: false,
        message: 'Failed to send reminder email'
      };
    }
  }

  /**
   * Gets company settings for email templates
   */
  private async getCompanySettings(): Promise<CompanySettings> {
    try {
      if (sqliteService.isReady()) {
        const settings = await sqliteService.getSetting('company_settings');
        if (settings) {
          return settings;
        }
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }

    // Return default settings if none found
    return {
      companyName: 'Slimbooks',
      ownerName: '',
      email: 'noreply@slimbooks.app',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    };
  }

  /**
   * Generates HTML content for invoice email
   */
  private generateInvoiceEmailHTML(
    invoice: InvoiceEmailData, 
    viewUrl: string, 
    company: CompanySettings
  ): string {
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">${company.companyName}</h1>
          <p style="color: #666; margin: 0;">New Invoice</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Invoice ${invoice.invoice_number}</h2>
          <p style="color: #666; margin: 5px 0;"><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
          <p style="color: #666; margin: 5px 0;"><strong>To:</strong> ${invoice.client_name}</p>
        </div>
        
        <p style="color: #333; line-height: 1.6;">
          Hello ${invoice.client_name},
        </p>
        
        <p style="color: #333; line-height: 1.6;">
          We've prepared a new invoice for you. Please review the details and submit your payment by the due date.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View Invoice
          </a>
        </div>
        
        ${invoice.notes ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #333;">Notes:</h4>
            <p style="color: #666; margin-bottom: 0; white-space: pre-line;">${invoice.notes}</p>
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin: 5px 0;">
            <strong>${company.companyName}</strong>
          </p>
          ${company.email ? `<p style="color: #666; font-size: 14px; margin: 5px 0;">${company.email}</p>` : ''}
          ${company.phone ? `<p style="color: #666; font-size: 14px; margin: 5px 0;">${company.phone}</p>` : ''}
          ${company.address ? `
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
              ${company.address}${company.city ? `, ${company.city}` : ''}${company.state ? `, ${company.state}` : ''} ${company.zipCode}
            </p>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This email was sent by ${company.companyName}. If you have any questions about this invoice, please contact us.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generates text content for invoice email
   */
  private generateInvoiceEmailText(
    invoice: InvoiceEmailData,
    viewUrl: string,
    company: CompanySettings
  ): string {
    const dueDate = new Date(invoice.due_date).toLocaleDateString();

    return `
${company.companyName}
New Invoice

Invoice ${invoice.invoice_number}
Amount: $${invoice.amount.toFixed(2)}
Due Date: ${dueDate}
To: ${invoice.client_name}

Hello ${invoice.client_name},

We've prepared a new invoice for you. Please review the details and submit your payment by the due date.

View Invoice: ${viewUrl}

${invoice.notes ? `Notes:\n${invoice.notes}\n\n` : ''}

${company.companyName}
${company.email ? company.email + '\n' : ''}${company.phone ? company.phone + '\n' : ''}${company.address ? company.address + (company.city ? `, ${company.city}` : '') + (company.state ? `, ${company.state}` : '') + ' ' + company.zipCode + '\n' : ''}

This email was sent by ${company.companyName}. If you have any questions about this invoice, please contact us.
    `.trim();
  }

  /**
   * Generates HTML content for reminder email
   */
  private generateReminderEmailHTML(
    invoice: InvoiceEmailData,
    viewUrl: string,
    company: CompanySettings
  ): string {
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    const isOverdue = new Date(invoice.due_date) < new Date();

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">${company.companyName}</h1>
          <p style="color: #dc3545; margin: 0; font-weight: bold;">Payment Reminder</p>
        </div>

        <div style="background-color: ${isOverdue ? '#fff5f5' : '#f8f9fa'}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${isOverdue ? '#dc3545' : '#ffc107'};">
          <h2 style="color: #333; margin-top: 0;">Invoice ${invoice.invoice_number}</h2>
          <p style="color: #666; margin: 5px 0;"><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Status:</strong> ${isOverdue ? 'Overdue' : 'Due Soon'}</p>
        </div>

        <p style="color: #333; line-height: 1.6;">
          Hello ${invoice.client_name},
        </p>

        <p style="color: #333; line-height: 1.6;">
          This is a friendly reminder that invoice ${invoice.invoice_number} ${isOverdue ? 'is now overdue' : 'is due soon'}.
          Please review the invoice and submit your payment at your earliest convenience.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewUrl}"
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View & Pay Invoice
          </a>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin: 5px 0;">
            <strong>${company.companyName}</strong>
          </p>
          ${company.email ? `<p style="color: #666; font-size: 14px; margin: 5px 0;">${company.email}</p>` : ''}
          ${company.phone ? `<p style="color: #666; font-size: 14px; margin: 5px 0;">${company.phone}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generates text content for reminder email
   */
  private generateReminderEmailText(
    invoice: InvoiceEmailData,
    viewUrl: string,
    company: CompanySettings
  ): string {
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    const isOverdue = new Date(invoice.due_date) < new Date();

    return `
${company.companyName}
Payment Reminder

Invoice ${invoice.invoice_number}
Amount: $${invoice.amount.toFixed(2)}
Due Date: ${dueDate}
Status: ${isOverdue ? 'Overdue' : 'Due Soon'}

Hello ${invoice.client_name},

This is a friendly reminder that invoice ${invoice.invoice_number} ${isOverdue ? 'is now overdue' : 'is due soon'}.
Please review the invoice and submit your payment at your earliest convenience.

View & Pay Invoice: ${viewUrl}

${company.companyName}
${company.email ? company.email + '\n' : ''}${company.phone ? company.phone + '\n' : ''}
    `.trim();
  }
}
