
import React from 'react';

export const NotificationSettingsTab = () => (
  <div className="bg-card rounded-lg shadow-sm border border-border p-6">
    <h3 className="text-lg font-medium text-card-foreground mb-6">Notification Preferences</h3>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-card-foreground mb-3">Email Notifications</h4>
        <div className="space-y-3">
          {[
            'New invoice created',
            'Payment received',
            'Invoice overdue',
            'Recurring invoice scheduled'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-muted-foreground">{notification}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-card-foreground mb-3">Client Notifications</h4>
        <div className="space-y-3">
          {[
            'Send invoice automatically',
            'Send payment reminders',
            'Send payment confirmations'
          ].map((notification) => (
            <label key={notification} className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-sm text-muted-foreground">{notification}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  </div>
);
