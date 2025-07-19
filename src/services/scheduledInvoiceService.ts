// Scheduled invoice sending service for post-dated invoices

import { invoiceOperations } from '@/lib/database';
import { InvoiceEmailService } from './invoiceEmailService';
import { InvoiceStatusService } from './invoiceStatusService';

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
   * Processes all invoices that are due to be sent today
   */
  async processDueInvoices(): Promise<{
    processed: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      const dueInvoices = await this.getDueInvoices();
      results.processed = dueInvoices.length;

      for (const invoice of dueInvoices) {
        try {
          await this.sendScheduledInvoice(invoice);
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to send invoice ${invoice.invoice_number}: ${error}`);
          console.error(`Error sending scheduled invoice ${invoice.id}:`, error);
        }
      }

      console.log(`Processed ${results.processed} due invoices: ${results.sent} sent, ${results.failed} failed`);
    } catch (error) {
      console.error('Error processing due invoices:', error);
      results.errors.push(`System error: ${error}`);
    }

    return results;
  }

  /**
   * Gets all invoices that are due to be sent today
   */
  private async getDueInvoices(): Promise<ScheduledInvoice[]> {
    try {
      const allInvoices = await invoiceOperations.getAll();
      const today = new Date().toISOString().split('T')[0];

      // Filter invoices that:
      // 1. Have due date of today
      // 2. Are in draft status (scheduled to be sent)
      // 3. Have not been sent yet (email_status is not 'sent')
      // 4. Have a valid client email
      const dueInvoices = allInvoices.filter(invoice => {
        const invoiceDueDate = invoice.due_date?.split('T')[0];
        return (
          invoiceDueDate === today &&
          invoice.status === 'draft' &&
          invoice.email_status !== 'sent' &&
          invoice.client_email &&
          invoice.client_email.trim() !== ''
        );
      });

      return dueInvoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name || 'Unknown Client',
        client_email: invoice.client_email || '',
        amount: invoice.amount,
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes,
        email_status: invoice.email_status
      }));
    } catch (error) {
      console.error('Error getting due invoices:', error);
      return [];
    }
  }

  /**
   * Sends a scheduled invoice
   */
  private async sendScheduledInvoice(invoice: ScheduledInvoice): Promise<void> {
    try {
      // Update email status to sending
      await this.statusService.updateEmailStatus(invoice.id, 'sending');

      // Send the email
      const emailResult = await this.emailService.sendInvoiceEmail(invoice);

      if (emailResult.success) {
        // Mark as sent and update invoice status
        await this.statusService.markInvoiceAsSent(invoice.id);
        console.log(`Successfully sent scheduled invoice ${invoice.invoice_number} to ${invoice.client_email}`);
      } else {
        // Mark as failed
        await this.statusService.updateEmailStatus(invoice.id, 'failed', emailResult.message);
        throw new Error(emailResult.message);
      }
    } catch (error) {
      // Ensure status is updated to failed
      await this.statusService.updateEmailStatus(invoice.id, 'failed', error.toString());
      throw error;
    }
  }

  /**
   * Gets invoices scheduled to be sent in the future
   */
  async getScheduledInvoices(): Promise<ScheduledInvoice[]> {
    try {
      const allInvoices = await invoiceOperations.getAll();
      const today = new Date().toISOString().split('T')[0];

      // Filter invoices that:
      // 1. Have due date in the future
      // 2. Are in draft status (scheduled to be sent)
      // 3. Have not been sent yet
      // 4. Have a valid client email
      const scheduledInvoices = allInvoices.filter(invoice => {
        const invoiceDueDate = invoice.due_date?.split('T')[0];
        return (
          invoiceDueDate && invoiceDueDate > today &&
          invoice.status === 'draft' &&
          invoice.email_status !== 'sent' &&
          invoice.client_email &&
          invoice.client_email.trim() !== ''
        );
      });

      return scheduledInvoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name || 'Unknown Client',
        client_email: invoice.client_email || '',
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
   * Cancels a scheduled invoice (prevents it from being sent automatically)
   */
  async cancelScheduledInvoice(invoiceId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Reset email status to not_sent to prevent automatic sending
      await this.statusService.updateEmailStatus(invoiceId, 'not_sent');
      
      return {
        success: true,
        message: 'Scheduled sending cancelled'
      };
    } catch (error) {
      console.error('Error cancelling scheduled invoice:', error);
      return {
        success: false,
        message: 'Failed to cancel scheduled sending'
      };
    }
  }

  /**
   * Reschedules an invoice for a different date
   */
  async rescheduleInvoice(invoiceId: number, newDueDate: string): Promise<{ success: boolean; message: string }> {
    try {
      await invoiceOperations.update(invoiceId, {
        due_date: newDueDate
      });

      // Reset email status if it was failed
      const emailStatus = await this.statusService.getEmailStatus(invoiceId);
      if (emailStatus?.status === 'failed') {
        await this.statusService.updateEmailStatus(invoiceId, 'not_sent');
      }

      return {
        success: true,
        message: 'Invoice rescheduled successfully'
      };
    } catch (error) {
      console.error('Error rescheduling invoice:', error);
      return {
        success: false,
        message: 'Failed to reschedule invoice'
      };
    }
  }

  /**
   * Gets summary of scheduled sending activity
   */
  async getSchedulingSummary(): Promise<{
    dueToday: number;
    scheduledFuture: number;
    failed: number;
  }> {
    try {
      const allInvoices = await invoiceOperations.getAll();
      const today = new Date().toISOString().split('T')[0];

      let dueToday = 0;
      let scheduledFuture = 0;
      let failed = 0;

      for (const invoice of allInvoices) {
        const invoiceDueDate = invoice.due_date?.split('T')[0];
        
        if (invoice.status === 'draft' && invoice.email_status !== 'sent' && invoice.client_email) {
          if (invoiceDueDate === today) {
            dueToday++;
          } else if (invoiceDueDate && invoiceDueDate > today) {
            scheduledFuture++;
          }
        }

        if (invoice.email_status === 'failed') {
          failed++;
        }
      }

      return { dueToday, scheduledFuture, failed };
    } catch (error) {
      console.error('Error getting scheduling summary:', error);
      return { dueToday: 0, scheduledFuture: 0, failed: 0 };
    }
  }

  /**
   * Starts automatic processing (would be called by a cron job or scheduler)
   */
  startScheduledProcessing(): void {
    // Process due invoices every hour
    const processInterval = 60 * 60 * 1000; // 1 hour in milliseconds
    
    const processNow = async () => {
      console.log('Processing due invoices...');
      const results = await this.processDueInvoices();
      
      if (results.processed > 0) {
        console.log(`Scheduled invoice processing complete: ${results.sent} sent, ${results.failed} failed`);
        
        if (results.errors.length > 0) {
          console.error('Errors during processing:', results.errors);
        }
      }
    };

    // Process immediately on start
    processNow();

    // Then process every hour
    setInterval(processNow, processInterval);
    
    console.log('Scheduled invoice processing started (checking every hour)');
  }
}
