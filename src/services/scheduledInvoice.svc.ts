// Scheduled invoice sending service for post-dated invoices

import { invoiceOperations } from '@/lib/database';
import { InvoiceEmailService } from './invoiceEmail.svc';
import { InvoiceStatusService } from './invoiceStatus.svc';

export interface ScheduledInvoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  due_date: string;
  status: string;
  notes?: string;
  email_status?: string;
}

export class ScheduledInvoiceService {
  private static instance: ScheduledInvoiceService;
  private emailService: InvoiceEmailService;
  private statusService: InvoiceStatusService;

  private constructor() {
    this.emailService = InvoiceEmailService.getInstance();
    this.statusService = InvoiceStatusService.getInstance();
  }

  static getInstance(): ScheduledInvoiceService {
    if (!ScheduledInvoiceService.instance) {
      ScheduledInvoiceService.instance = new ScheduledInvoiceService();
    }
    return ScheduledInvoiceService.instance;
  }

  /**
   * Gets all invoices that are scheduled to be sent today
   */
  async getTodaysScheduledInvoices(): Promise<ScheduledInvoice[]> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const allInvoices = await invoiceOperations.getAll();
      
      // Filter invoices that:
      // 1. Are in 'draft' status (not yet sent)
      // 2. Have a due date of today or earlier
      // 3. Haven't been sent yet (email_status is not 'sent')
      const scheduledInvoices = allInvoices.filter(invoice => {
        const invoiceDueDate = invoice.due_date ? invoice.due_date.split('T')[0] : null;
        return (
          invoice.status === 'draft' &&
          invoiceDueDate &&
          invoiceDueDate <= todayStr &&
          (!invoice.email_status || invoice.email_status !== 'sent')
        );
      });

      return scheduledInvoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        amount: invoice.amount,
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes,
        email_status: invoice.email_status
      }));
    } catch (error) {
      console.error('Error getting scheduled invoices:', error);
      return [];
    }
  }

  /**
   * Gets all overdue invoices that need reminder emails
   */
  async getOverdueInvoices(): Promise<ScheduledInvoice[]> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const allInvoices = await invoiceOperations.getAll();
      
      // Filter invoices that:
      // 1. Are in 'sent' status (already sent to client)
      // 2. Have a due date before today
      // 3. Are not yet paid
      const overdueInvoices = allInvoices.filter(invoice => {
        const invoiceDueDate = invoice.due_date ? invoice.due_date.split('T')[0] : null;
        return (
          invoice.status === 'sent' &&
          invoiceDueDate &&
          invoiceDueDate < todayStr &&
          invoice.payment_status !== 'paid'
        );
      });

      return overdueInvoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        amount: invoice.amount,
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes,
        email_status: invoice.email_status
      }));
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      return [];
    }
  }

  /**
   * Processes and sends all scheduled invoices for today
   */
  async processScheduledInvoices(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ invoice: ScheduledInvoice; success: boolean; message: string }>;
  }> {
    const scheduledInvoices = await this.getTodaysScheduledInvoices();
    const results: Array<{ invoice: ScheduledInvoice; success: boolean; message: string }> = [];
    
    let successful = 0;
    let failed = 0;

    for (const invoice of scheduledInvoices) {
      try {
        // Update status to 'sending'
        await this.statusService.updateEmailStatus(invoice.id, 'sending');
        
        // Send the invoice email
        const emailResult = await this.emailService.sendInvoiceEmail(invoice);
        
        if (emailResult.success) {
          // Mark as sent and update invoice status
          await this.statusService.markInvoiceAsSent(invoice.id);
          successful++;
          results.push({
            invoice,
            success: true,
            message: 'Invoice sent successfully'
          });
        } else {
          // Mark as failed
          await this.statusService.updateEmailStatus(invoice.id, 'failed', emailResult.message);
          failed++;
          results.push({
            invoice,
            success: false,
            message: emailResult.message
          });
        }
      } catch (error) {
        // Mark as failed
        await this.statusService.updateEmailStatus(invoice.id, 'failed', error.message);
        failed++;
        results.push({
          invoice,
          success: false,
          message: error.message
        });
      }
    }

    return {
      processed: scheduledInvoices.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Sends reminder emails for overdue invoices
   */
  async sendOverdueReminders(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ invoice: ScheduledInvoice; success: boolean; message: string }>;
  }> {
    const overdueInvoices = await this.getOverdueInvoices();
    const results: Array<{ invoice: ScheduledInvoice; success: boolean; message: string }> = [];
    
    let successful = 0;
    let failed = 0;

    for (const invoice of overdueInvoices) {
      try {
        // Send reminder email
        const emailResult = await this.emailService.sendInvoiceReminder(invoice);
        
        if (emailResult.success) {
          successful++;
          results.push({
            invoice,
            success: true,
            message: 'Reminder sent successfully'
          });
        } else {
          failed++;
          results.push({
            invoice,
            success: false,
            message: emailResult.message
          });
        }
      } catch (error) {
        failed++;
        results.push({
          invoice,
          success: false,
          message: error.message
        });
      }
    }

    return {
      processed: overdueInvoices.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Manually sends a specific scheduled invoice
   */
  async sendScheduledInvoice(invoiceId: number): Promise<{ success: boolean; message: string }> {
    try {
      const invoice = await invoiceOperations.getById(invoiceId);
      if (!invoice) {
        return {
          success: false,
          message: 'Invoice not found'
        };
      }

      // Check if invoice can be sent
      const emailStatus = await this.statusService.getEmailStatus(invoiceId);
      if (emailStatus && !this.statusService.canSendInvoice(emailStatus.status)) {
        return {
          success: false,
          message: 'Invoice is currently being sent'
        };
      }

      // Update status to 'sending'
      await this.statusService.updateEmailStatus(invoiceId, 'sending');
      
      // Send the invoice email
      const emailResult = await this.emailService.sendInvoiceEmail({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        amount: invoice.amount,
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes
      });
      
      if (emailResult.success) {
        // Mark as sent and update invoice status
        await this.statusService.markInvoiceAsSent(invoiceId);
        return {
          success: true,
          message: 'Invoice sent successfully'
        };
      } else {
        // Mark as failed
        await this.statusService.updateEmailStatus(invoiceId, 'failed', emailResult.message);
        return {
          success: false,
          message: emailResult.message
        };
      }
    } catch (error) {
      console.error('Error sending scheduled invoice:', error);
      // Mark as failed
      await this.statusService.updateEmailStatus(invoiceId, 'failed', error.message);
      return {
        success: false,
        message: 'Failed to send invoice'
      };
    }
  }
