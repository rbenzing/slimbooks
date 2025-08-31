// Stripe webhook utilities and handlers

import { StripeService } from '@/services/stripe.svc';

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key?: string;
  };
}

export interface WebhookHandlerResult {
  success: boolean;
  message: string;
  processed: boolean;
}

/**
 * Main webhook handler for Stripe events
 */
export class StripeWebhookHandler {
  private static instance: StripeWebhookHandler;
  private stripeService: StripeService;

  private constructor() {
    this.stripeService = StripeService.getInstance();
  }

  static getInstance(): StripeWebhookHandler {
    if (!StripeWebhookHandler.instance) {
      StripeWebhookHandler.instance = new StripeWebhookHandler();
    }
    return StripeWebhookHandler.instance;
  }

  /**
   * Processes incoming webhook from Stripe
   */
  async processWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookHandlerResult> {
    try {
      // Parse the webhook payload
      const event: WebhookEvent = JSON.parse(payload);
      

      // Verify webhook signature and process
      const result = await this.stripeService.handleWebhook(event, signature);
      
      if (result.success) {
        // Log successful processing
        await this.logWebhookEvent(event, 'processed');
        
        return {
          success: true,
          message: 'Webhook processed successfully',
          processed: true
        };
      } else {
        // Log failed processing
        await this.logWebhookEvent(event, 'failed', result.message);
        
        return {
          success: false,
          message: result.message,
          processed: false
        };
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      
      return {
        success: false,
        message: 'Failed to process webhook: ' + error,
        processed: false
      };
    }
  }

  /**
   * Logs webhook events for debugging and monitoring
   */
  private async logWebhookEvent(
    event: WebhookEvent,
    status: 'processed' | 'failed' | 'ignored',
    error?: string
  ): Promise<void> {
    try {
      const { sqliteService } = await import('@/services/sqlite.svc');
      
      if (sqliteService.isReady()) {
        const logEntry = {
          webhook_id: event.id,
          event_type: event.type,
          status,
          error_message: error || null,
          processed_at: new Date().toISOString(),
          event_data: JSON.stringify(event.data.object)
        };

        // Store in a webhook_logs setting (in a real app, this would be a proper table)
        const existingLogs = await sqliteService.getSetting('webhook_logs') || [];
        existingLogs.push(logEntry);
        
        // Keep only the last 100 webhook logs
        if (existingLogs.length > 100) {
          existingLogs.splice(0, existingLogs.length - 100);
        }
        
        await sqliteService.setSetting('webhook_logs', existingLogs);
      }
    } catch (error) {
      console.error('Error logging webhook event:', error);
    }
  }

  /**
   * Gets recent webhook logs for debugging
   */
  async getWebhookLogs(limit: number = 20): Promise<any[]> {
    try {
      const { sqliteService } = await import('@/services/sqlite.svc');
      
      if (sqliteService.isReady()) {
        const logs = await sqliteService.getSetting('webhook_logs') || [];
        return logs.slice(-limit).reverse(); // Get most recent first
      }
    } catch (error) {
      console.error('Error getting webhook logs:', error);
    }
    
    return [];
  }

  /**
   * Validates webhook signature (simplified version)
   */
  private validateSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // In a real implementation, this would use crypto to verify the signature
      // For now, we'll do a basic check
      return signature.includes('t=') && signature.includes('v1=') && secret.length > 0;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Handles specific event types with custom logic
   */
  async handleSpecificEvent(eventType: string, eventData: any): Promise<void> {
    switch (eventType) {
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(eventData);
        break;
      
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(eventData);
        break;
      
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(eventData);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(eventData);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(eventData);
        break;
      
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(eventData);
        break;
      
      default:
    }
  }

  /**
   * Handles successful invoice payments
   */
  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    try {
      
      // Update local invoice status
      const { invoiceOperations } = await import('@/lib/database');
      const allInvoices = await invoiceOperations.getAll();
      const localInvoice = allInvoices.find(inv => inv.stripe_invoice_id === invoice.id);
      
      if (localInvoice) {
        await invoiceOperations.update(localInvoice.id, {
          status: 'paid'
        });
        
        
        // You could also trigger notifications here
        // await this.sendPaymentConfirmation(localInvoice);
      } else {
        console.warn('Local invoice not found for Stripe invoice:', invoice.id);
      }
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Handles failed invoice payments
   */
  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    try {
      
      // Update local invoice status
      const { invoiceOperations } = await import('@/lib/database');
      const allInvoices = await invoiceOperations.getAll();
      const localInvoice = allInvoices.find(inv => inv.stripe_invoice_id === invoice.id);
      
      if (localInvoice) {
        await invoiceOperations.update(localInvoice.id, {
          status: 'overdue'
        });
        
        
        // You could also trigger payment failure notifications here
        // await this.sendPaymentFailureNotification(localInvoice);
      }
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
      throw error;
    }
  }

  /**
   * Handles subscription creation
   */
  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    try {
      
      // Update client record with subscription info
      const { clientOperations } = await import('@/lib/database');
      const allClients = await clientOperations.getAll();
      const client = allClients.find(c => c.stripe_customer_id === subscription.customer);
      
      if (client) {
        // You could store subscription info in client record or separate table
      }
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  /**
   * Handles subscription updates
   */
  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    try {
      // Handle subscription changes
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  /**
   * Handles subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    try {
      // Handle subscription cancellation
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  /**
   * Handles successful payment intents
   */
  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    try {
      // Handle successful one-time payments
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
      throw error;
    }
  }

  /**
   * Gets webhook statistics
   */
  async getWebhookStats(): Promise<{
    total: number;
    processed: number;
    failed: number;
    recent: any[];
  }> {
    try {
      const logs = await this.getWebhookLogs(100);
      
      const stats = {
        total: logs.length,
        processed: logs.filter(log => log.status === 'processed').length,
        failed: logs.filter(log => log.status === 'failed').length,
        recent: logs.slice(0, 5)
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting webhook stats:', error);
      return { total: 0, processed: 0, failed: 0, recent: [] };
    }
  }
}

/**
 * Express.js middleware for handling Stripe webhooks
 * (This would be used in a backend implementation)
 */
export const createStripeWebhookMiddleware = () => {
  return async (req: any, res: any, next: any) => {
    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;
      
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }
      
      const webhookHandler = StripeWebhookHandler.getInstance();
      const result = await webhookHandler.processWebhook(payload, signature);
      
      if (result.success) {
        res.status(200).json({ received: true });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Webhook middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};
