// Stripe integration service for payment processing and webhook handling

import { sqliteService } from '@/lib/sqlite-service';

export interface StripeSettings {
  isEnabled: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  webhookEndpoint: string;
  testMode: boolean;
  accountId?: string;
  accountName?: string;
  connectedAt?: string;
}

export interface StripeAccountInfo {
  id: string;
  display_name?: string;
  business_profile?: {
    name?: string;
    url?: string;
  };
  country: string;
  default_currency: string;
}

export interface StripeTestResult {
  success: boolean;
  message: string;
  accountInfo?: StripeAccountInfo;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface StripeInvoice {
  id: string;
  number: string;
  customer: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  due_date?: number;
  created: number;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  customer?: string;
  invoice?: string;
}

export class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Gets Stripe settings from storage
   */
  private async getStripeSettings(): Promise<StripeSettings | null> {
    try {
      if (sqliteService.isReady()) {
        return sqliteService.getSetting('stripe_settings');
      }
    } catch (error) {
      console.error('Error loading Stripe settings:', error);
    }
    return null;
  }

  /**
   * Tests Stripe connection with provided keys
   */
  async testConnection(publishableKey: string, secretKey: string): Promise<StripeTestResult> {
    try {
      // Validate key formats
      const isTestMode = publishableKey.startsWith('pk_test_') && secretKey.startsWith('sk_test_');
      const isLiveMode = publishableKey.startsWith('pk_live_') && secretKey.startsWith('sk_live_');
      
      if (!isTestMode && !isLiveMode) {
        return {
          success: false,
          message: 'Invalid API key format. Keys must match (both test or both live).'
        };
      }

      // In a real implementation, this would make an actual API call to Stripe
      // For now, we'll simulate the connection test
      console.log('Testing Stripe connection with keys:', {
        publishableKey: publishableKey.substring(0, 12) + '...',
        secretKey: secretKey.substring(0, 12) + '...',
        mode: isTestMode ? 'test' : 'live'
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful connection with mock account info
      const mockAccountInfo: StripeAccountInfo = {
        id: isTestMode ? 'acct_test_123456789' : 'acct_live_123456789',
        display_name: 'Test Business Account',
        business_profile: {
          name: 'Slimbooks Business',
          url: 'https://slimbooks.app'
        },
        country: 'US',
        default_currency: 'usd'
      };

      return {
        success: true,
        message: 'Connection successful',
        accountInfo: mockAccountInfo
      };
    } catch (error) {
      console.error('Stripe connection test error:', error);
      return {
        success: false,
        message: 'Connection test failed: ' + error
      };
    }
  }

  /**
   * Creates a Stripe customer
   */
  async createCustomer(customerData: {
    email: string;
    name?: string;
    phone?: string;
    address?: any;
  }): Promise<{ success: boolean; customer?: StripeCustomer; message: string }> {
    try {
      const settings = await this.getStripeSettings();
      if (!settings || !settings.isEnabled) {
        return { success: false, message: 'Stripe is not enabled' };
      }

      // In a real implementation, this would call the Stripe API
      console.log('Creating Stripe customer:', customerData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCustomer: StripeCustomer = {
        id: 'cus_' + Math.random().toString(36).substr(2, 9),
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address
      };

      return {
        success: true,
        customer: mockCustomer,
        message: 'Customer created successfully'
      };
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return {
        success: false,
        message: 'Failed to create customer: ' + error
      };
    }
  }

  /**
   * Creates a Stripe invoice
   */
  async createInvoice(invoiceData: {
    customer: string;
    amount: number;
    currency?: string;
    description?: string;
    due_date?: Date;
  }): Promise<{ success: boolean; invoice?: StripeInvoice; message: string }> {
    try {
      const settings = await this.getStripeSettings();
      if (!settings || !settings.isEnabled) {
        return { success: false, message: 'Stripe is not enabled' };
      }

      console.log('Creating Stripe invoice:', invoiceData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockInvoice: StripeInvoice = {
        id: 'in_' + Math.random().toString(36).substr(2, 9),
        number: 'INV-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        customer: invoiceData.customer,
        amount_due: invoiceData.amount,
        amount_paid: 0,
        currency: invoiceData.currency || 'usd',
        status: 'draft',
        hosted_invoice_url: `https://invoice.stripe.com/i/acct_test/test_invoice_${Math.random().toString(36).substr(2, 9)}`,
        due_date: invoiceData.due_date ? Math.floor(invoiceData.due_date.getTime() / 1000) : undefined,
        created: Math.floor(Date.now() / 1000)
      };

      return {
        success: true,
        invoice: mockInvoice,
        message: 'Invoice created successfully'
      };
    } catch (error) {
      console.error('Error creating Stripe invoice:', error);
      return {
        success: false,
        message: 'Failed to create invoice: ' + error
      };
    }
  }

  /**
   * Sends a Stripe invoice
   */
  async sendInvoice(invoiceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.getStripeSettings();
      if (!settings || !settings.isEnabled) {
        return { success: false, message: 'Stripe is not enabled' };
      }

      console.log('Sending Stripe invoice:', invoiceId);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: 'Invoice sent successfully'
      };
    } catch (error) {
      console.error('Error sending Stripe invoice:', error);
      return {
        success: false,
        message: 'Failed to send invoice: ' + error
      };
    }
  }

  /**
   * Handles Stripe webhook events
   */
  async handleWebhook(event: any, signature: string): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.getStripeSettings();
      if (!settings || !settings.isEnabled || !settings.webhookSecret) {
        return { success: false, message: 'Webhook not configured' };
      }

      // In a real implementation, this would verify the webhook signature
      console.log('Processing Stripe webhook:', {
        type: event.type,
        id: event.id,
        signature: signature.substring(0, 20) + '...'
      });

      // Handle different event types
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionEvent(event.data.object, event.type);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        default:
          console.log('Unhandled webhook event type:', event.type);
      }

      return {
        success: true,
        message: 'Webhook processed successfully'
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        success: false,
        message: 'Failed to process webhook: ' + error
      };
    }
  }

  /**
   * Handles successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    try {
      console.log('Invoice payment succeeded:', invoice.id);
      
      // Update local invoice status to paid
      const { invoiceOperations } = await import('@/lib/database');
      const localInvoices = await invoiceOperations.getAll();
      const localInvoice = localInvoices.find(inv => inv.stripe_invoice_id === invoice.id);
      
      if (localInvoice) {
        await invoiceOperations.update(localInvoice.id, {
          status: 'paid'
        });
        console.log('Updated local invoice status to paid');
      }
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
    }
  }

  /**
   * Handles failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    try {
      console.log('Invoice payment failed:', invoice.id);
      
      // Update local invoice status
      const { invoiceOperations } = await import('@/lib/database');
      const localInvoices = await invoiceOperations.getAll();
      const localInvoice = localInvoices.find(inv => inv.stripe_invoice_id === invoice.id);
      
      if (localInvoice) {
        await invoiceOperations.update(localInvoice.id, {
          status: 'overdue'
        });
        console.log('Updated local invoice status to overdue');
      }
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
    }
  }

  /**
   * Handles subscription events
   */
  private async handleSubscriptionEvent(subscription: any, eventType: string): Promise<void> {
    try {
      console.log('Subscription event:', eventType, subscription.id);
      // Handle subscription updates in your local database
    } catch (error) {
      console.error('Error handling subscription event:', error);
    }
  }

  /**
   * Handles successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    try {
      console.log('Payment intent succeeded:', paymentIntent.id);
      // Handle successful payment
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
    }
  }

  /**
   * Gets Stripe dashboard URL for the current mode
   */
  async getDashboardUrl(): Promise<string> {
    const settings = await this.getStripeSettings();
    const baseUrl = 'https://dashboard.stripe.com';
    
    if (settings?.testMode) {
      return `${baseUrl}/test`;
    }
    
    return baseUrl;
  }

  /**
   * Checks if Stripe is properly configured
   */
  async isConfigured(): Promise<boolean> {
    const settings = await this.getStripeSettings();
    return !!(settings?.isEnabled && settings?.publishableKey && settings?.secretKey);
  }
}
