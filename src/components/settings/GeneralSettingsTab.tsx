
import React from 'react';

export const GeneralSettingsTab = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">General Settings</h3>
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Currency</label>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option>USD - US Dollar</option>
          <option>EUR - Euro</option>
          <option>GBP - British Pound</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option>America/New_York</option>
          <option>America/Los_Angeles</option>
          <option>Europe/London</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
        Save Changes
      </button>
    </div>
  </div>
);
