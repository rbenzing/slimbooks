
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const StripeSettingsTab = () => (
  <div className="space-y-6">
    {/* Connection Status */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Stripe Connection</h3>
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Not Connected</span>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
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
        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
        disabled
      >
        Connect Stripe Account
      </button>
    </div>

    {/* Webhook Configuration */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Webhook Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Webhook Endpoint</label>
          <input
            type="text"
            placeholder="https://your-app.com/api/webhooks/stripe"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Events to Listen</label>
          <div className="space-y-2">
            {['invoice.payment_succeeded', 'invoice.payment_failed', 'customer.subscription.updated'].map((event) => (
              <label key={event} className="flex items-center">
                <input type="checkbox" className="mr-2" disabled />
                <span className="text-sm text-gray-500 dark:text-gray-400">{event}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
