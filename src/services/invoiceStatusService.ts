// Invoice status tracking service

import { invoiceOperations } from '@/lib/database';

export type EmailStatus = 'not_sent' | 'sending' | 'sent' | 'failed';

export interface EmailStatusUpdate {
  email_status: EmailStatus;
  email_sent_at?: string;
  email_error?: string;
  last_email_attempt: string;
}

export class InvoiceStatusService {
  private static instance: InvoiceStatusService;

  static getInstance(): InvoiceStatusService {
    if (!InvoiceStatusService.instance) {
      InvoiceStatusService.instance = new InvoiceStatusService();
    }
    return InvoiceStatusService.instance;
  }

  /**
   * Updates the email status of an invoice
   */
  async updateEmailStatus(
    invoiceId: number, 
    status: EmailStatus, 
    error?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();
      
      const updateData: Partial<EmailStatusUpdate> = {
        email_status: status,
        last_email_attempt: now
      };

      // Set specific fields based on status
      switch (status) {
        case 'sent':
          updateData.email_sent_at = now;
          updateData.email_error = null;
          break;
        case 'failed':
          updateData.email_error = error || 'Unknown error';
          break;
        case 'sending':
          updateData.email_error = null;
          break;
        case 'not_sent':
          updateData.email_sent_at = null;
          updateData.email_error = null;
          break;
      }

      await invoiceOperations.update(invoiceId, updateData);

      return {
        success: true,
        message: `Email status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating email status:', error);
      return {
        success: false,
        message: 'Failed to update email status'
      };
    }
  }

  /**
   * Marks an invoice as being sent (updates status to 'sent' and email status)
   */
  async markInvoiceAsSent(invoiceId: number): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();
      
      await invoiceOperations.update(invoiceId, {
        status: 'sent',
        email_status: 'sent',
        email_sent_at: now,
        last_email_attempt: now,
        email_error: null
      });

      return {
        success: true,
        message: 'Invoice marked as sent'
      };
    } catch (error) {
      console.error('Error marking invoice as sent:', error);
      return {
        success: false,
        message: 'Failed to mark invoice as sent'
      };
    }
  }

  /**
   * Gets the email status of an invoice
   */
  async getEmailStatus(invoiceId: number): Promise<{
    status: EmailStatus;
    sentAt?: string;
    error?: string;
    lastAttempt?: string;
  } | null> {
    try {
      const invoice = await invoiceOperations.getById(invoiceId);
      if (!invoice) {
        return null;
      }

      return {
        status: (invoice.email_status as EmailStatus) || 'not_sent',
        sentAt: invoice.email_sent_at || undefined,
        error: invoice.email_error || undefined,
        lastAttempt: invoice.last_email_attempt || undefined
      };
    } catch (error) {
      console.error('Error getting email status:', error);
      return null;
    }
  }

  /**
   * Gets a human-readable status message
   */
  getStatusMessage(
    status: EmailStatus, 
    sentAt?: string, 
    error?: string, 
    lastAttempt?: string
  ): string {
    switch (status) {
      case 'not_sent':
        return 'Not sent';
      case 'sending':
        return 'Sending...';
      case 'sent':
        if (sentAt) {
          const date = new Date(sentAt);
          return `Sent on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        }
        return 'Sent';
      case 'failed':
        if (error) {
          return `Failed to send: ${error}`;
        }
        if (lastAttempt) {
          const date = new Date(lastAttempt);
          return `Failed to send (last attempt: ${date.toLocaleDateString()})`;
        }
        return 'Failed to send';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Gets the appropriate status color for UI display
   */
  getStatusColor(status: EmailStatus): string {
    switch (status) {
      case 'not_sent':
        return 'text-muted-foreground';
      case 'sending':
        return 'text-blue-600';
      case 'sent':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  }

  /**
   * Gets the appropriate status icon for UI display
   */
  getStatusIcon(status: EmailStatus): string {
    switch (status) {
      case 'not_sent':
        return 'mail';
      case 'sending':
        return 'loader';
      case 'sent':
        return 'check-circle';
      case 'failed':
        return 'x-circle';
      default:
        return 'mail';
    }
  }

  /**
   * Checks if an invoice can be sent based on its current email status
   */
  canSendInvoice(status: EmailStatus): boolean {
    // Can send if not currently sending
    return status !== 'sending';
  }

  /**
   * Checks if an invoice should show retry option
   */
  shouldShowRetry(status: EmailStatus): boolean {
    return status === 'failed';
  }

  /**
   * Gets all invoices with failed email status for retry processing
   */
  async getFailedInvoices(): Promise<any[]> {
    try {
      const allInvoices = await invoiceOperations.getAll();
      return allInvoices.filter(invoice => invoice.email_status === 'failed');
    } catch (error) {
      console.error('Error getting failed invoices:', error);
      return [];
    }
  }

  /**
   * Retries sending a failed invoice
   */
  async retryFailedInvoice(invoiceId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Reset status to allow retry
      await this.updateEmailStatus(invoiceId, 'not_sent');
      
      return {
        success: true,
        message: 'Invoice ready for retry'
      };
    } catch (error) {
      console.error('Error preparing invoice for retry:', error);
      return {
        success: false,
        message: 'Failed to prepare invoice for retry'
      };
    }
  }

  /**
   * Clears email error for an invoice
   */
  async clearEmailError(invoiceId: number): Promise<{ success: boolean; message: string }> {
    try {
      await invoiceOperations.update(invoiceId, {
        email_error: null
      });

      return {
        success: true,
        message: 'Email error cleared'
      };
    } catch (error) {
      console.error('Error clearing email error:', error);
      return {
        success: false,
        message: 'Failed to clear email error'
      };
    }
  }
}
