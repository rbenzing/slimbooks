// Stripe integration service for payment processing and webhook handling

import { sqliteService } from './sqlite.svc';

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

export interface StripePaymentLink {
  id: string;
  url: string;
  active: boolean;
  metadata?: Record<string, string>;
}

export interface StripeInvoiceData {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  description?: string;
  due_date?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  private static instance: StripeService;
  private settings: StripeSettings | null = null;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Loads Stripe settings from database
   */
  async loadSettings(): Promise<StripeSettings | null> {
    try {
      if (sqliteService.isReady()) {
        const settings = await sqliteService.getSetting('stripe_settings');
        if (settings) {
          this.settings = settings;
          return settings;
        }
      }
    } catch (error) {
      console.error('Error loading Stripe settings:', error);
    }
    return null;
  }

  /**
   * Saves Stripe settings to database
   */
  async saveSettings(settings: StripeSettings): Promise<{ success: boolean; message: string }> {
    try {
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }

      await sqliteService.setSetting('stripe_settings', settings, 'stripe');
      this.settings = settings;

      return {
        success: true,
        message: 'Stripe settings saved successfully'
      };
    } catch (error) {
      console.error('Error saving Stripe settings:', error);
      return {
        success: false,
        message: 'Failed to save Stripe settings'
      };
    }
  }

  /**
   * Gets current Stripe settings
   */
  getSettings(): StripeSettings | null {
    return this.settings;
  }

  /**
   * Tests Stripe API connection with current settings
   */
  async testConnection(): Promise<StripeTestResult> {
    try {
      const settings = await this.loadSettings();

      if (!settings || !settings.isEnabled) {
        return {
          success: false,
          message: 'Stripe is not enabled or configured'
        };
      }

      if (!settings.secretKey) {
        return {
          success: false,
          message: 'Stripe secret key is required'
        };
      }

      // In a browser environment, we simulate the connection test
      // In a real implementation, this would test the actual Stripe API connection

      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate success/failure based on basic validation
      const isValidConfig = settings.publishableKey.startsWith('pk_') &&
                           settings.secretKey.startsWith('sk_') &&
                           settings.publishableKey.length > 20 &&
                           settings.secretKey.length > 20;

      if (isValidConfig) {
        // Simulate account info
        const accountInfo: StripeAccountInfo = {
          id: 'acct_test123456789',
          display_name: 'Test Business',
          business_profile: {
            name: 'Test Business',
            url: 'https://testbusiness.com'
          },
          country: 'US',
          default_currency: 'usd'
        };

        return {
          success: true,
          message: 'Stripe connection successful',
          accountInfo
        };
      } else {
        return {
          success: false,
          message: 'Invalid Stripe API keys'
        };
      }
    } catch (error) {
      console.error('Error testing Stripe connection:', error);
      return {
        success: false,
        message: 'Connection test failed: ' + error
      };
    }
  }

  /**
   * Creates a Stripe payment link for an invoice
   */
  async createPaymentLink(invoiceData: StripeInvoiceData): Promise<{ success: boolean; message: string; paymentLink?: StripePaymentLink }> {
    try {
      const settings = await this.loadSettings();

      if (!settings || !settings.isEnabled) {
        return {
          success: false,
          message: 'Stripe is not enabled'
        };
      }

      // In a real implementation, this would create an actual Stripe payment link
      // For now, we'll simulate the payment link creation

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate payment link creation
      const paymentLink: StripePaymentLink = {
        id: `plink_${Date.now()}`,
        url: `https://buy.stripe.com/test_${Math.random().toString(36).substring(7)}`,
        active: true,
        metadata: {
          invoice_id: invoiceData.id.toString(),
          invoice_number: invoiceData.invoice_number,
          client_email: invoiceData.client_email
        }
      };

      return {
        success: true,
        message: 'Payment link created successfully',
        paymentLink
      };
    } catch (error) {
      console.error('Error creating Stripe payment link:', error);
      return {
        success: false,
        message: 'Failed to create payment link'
      };
    }
  }

  /**
   * Retrieves a payment link by ID
   */
  async getPaymentLink(linkId: string): Promise<{ success: boolean; message: string; paymentLink?: StripePaymentLink }> {
    try {
      const settings = await this.loadSettings();

      if (!settings || !settings.isEnabled) {
        return {
          success: false,
          message: 'Stripe is not enabled'
        };
      }

      // In a real implementation, this would retrieve the actual payment link from Stripe

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate payment link retrieval
      const paymentLink: StripePaymentLink = {
        id: linkId,
        url: `https://buy.stripe.com/test_${linkId.substring(6)}`,
        active: true,
        metadata: {
          invoice_id: '123',
          invoice_number: 'INV-001',
          client_email: 'client@example.com'
        }
      };

      return {
        success: true,
        message: 'Payment link retrieved successfully',
        paymentLink
      };
    } catch (error) {
      console.error('Error retrieving Stripe payment link:', error);
      return {
        success: false,
        message: 'Failed to retrieve payment link'
      };
    }
  }

  /**
   * Deactivates a payment link
   */
  async deactivatePaymentLink(linkId: string): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.loadSettings();

      if (!settings || !settings.isEnabled) {
        return {
          success: false,
          message: 'Stripe is not enabled'
        };
      }

      // In a real implementation, this would deactivate the actual payment link in Stripe

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        message: 'Payment link deactivated successfully'
      };
    } catch (error) {
      console.error('Error deactivating Stripe payment link:', error);
      return {
        success: false,
        message: 'Failed to deactivate payment link'
      };
    }
  }

  /**
   * Processes Stripe webhook events
   */
  async processWebhook(payload: string, signature: string): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.loadSettings();

      if (!settings || !settings.isEnabled) {
        return {
          success: false,
          message: 'Stripe is not enabled'
        };
      }

      if (!settings.webhookSecret) {
        return {
          success: false,
          message: 'Webhook secret not configured'
        };
      }

      // In a real implementation, this would verify the webhook signature
      // and process the actual Stripe event

      // Simulate webhook processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Parse the simulated event
      const event = JSON.parse(payload);

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

      // Update local invoice status to paid
      const { invoiceOperations } = await import('@/lib/database');
      const localInvoices = await invoiceOperations.getAll();
      const localInvoice = localInvoices.find(inv => inv.stripe_invoice_id === invoice.id);

      if (localInvoice) {
        await invoiceOperations.update(localInvoice.id, {
          status: 'paid'
        });
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

      // Update local invoice status
      const { invoiceOperations } = await import('@/lib/database');
      const localInvoices = await invoiceOperations.getAll();
      const localInvoice = localInvoices.find(inv => inv.stripe_invoice_id === invoice.id);

      if (localInvoice) {
        await invoiceOperations.update(localInvoice.id, {
          status: 'overdue'
        });
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
      // Handle successful payment
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
    }
  }

  /**
   * Gets Stripe dashboard URL for the current mode
   */
  async getDashboardUrl(): Promise<string> {
    const settings = await this.loadSettings();
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
    const settings = await this.loadSettings();
    return !!(settings?.isEnabled && settings?.publishableKey && settings?.secretKey);
  }
}
