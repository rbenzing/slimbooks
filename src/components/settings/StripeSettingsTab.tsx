
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { themeClasses } from '@/lib/utils';

export const StripeSettingsTab = () => (
  <div className="space-y-6">
    {/* Connection Status */}
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-card-foreground">Stripe Connection</h3>
        <div className="flex items-center text-destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Not Connected</span>
        </div>
      </div>
      <p className="text-muted-foreground mb-4">
        Connect your Stripe account to enable payment processing and invoice automation.
      </p>
      <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Backend Required</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Connect to a backend service to enable secure Stripe integration.
          </p>
        </div>
      </div>
      <button
        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed"
        disabled
      >
        Connect Stripe Account
      </button>
    </div>

    {/* Webhook Configuration */}
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <h3 className="text-lg font-medium text-card-foreground mb-4">Webhook Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Webhook Endpoint</label>
          <input
            type="text"
            placeholder="https://your-app.com/api/webhooks/stripe"
            className={`${themeClasses.input} bg-muted text-muted-foreground`}
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Events to Listen</label>
          <div className="space-y-2">
            {['invoice.payment_succeeded', 'invoice.payment_failed', 'customer.subscription.updated'].map((event) => (
              <label key={event} className="flex items-center">
                <input type="checkbox" className="mr-2" disabled />
                <span className="text-sm text-muted-foreground">{event}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
