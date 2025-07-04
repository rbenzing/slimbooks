
import React from 'react';

export const NotificationSettingsTab = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Notification Preferences</h3>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Email Notifications</h4>
        <div className="space-y-3">
          {[
            'New invoice created',
            'Payment received',
            'Invoice overdue',
            'Recurring invoice scheduled'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{notification}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Client Notifications</h4>
        <div className="space-y-3">
          {[
            'Send invoice automatically',
            'Send payment reminders',
            'Send payment confirmations'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{notification}</span>
            </label>
          ))}
        </div>
      </div>
      <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
        Save Preferences
      </button>
    </div>
  </div>
);
