
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { templateOperations } from '@/lib/database';
import { TemplateForm } from './TemplateForm';
import { CreateRecurringInvoicePage } from './CreateRecurringInvoicePage';

export const TemplatesTab = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showCreatePage, setShowCreatePage] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const allTemplates = templateOperations.getAll();
    setTemplates(allTemplates);
  };

  const handleSave = (templateData: any) => {
    try {
      if (editingTemplate) {
        templateOperations.update(editingTemplate.id, templateData);
      } else {
        templateOperations.create(templateData);
      }
      loadTemplates();
      setIsFormOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      templateOperations.delete(id);
      loadTemplates();
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setShowCreatePage(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setShowCreatePage(true);
  };

  if (showCreatePage) {
    return (
      <CreateRecurringInvoicePage
        onBack={() => {
          setShowCreatePage(false);
          setEditingTemplate(null);
          loadTemplates();
        }}
        editingTemplate={editingTemplate}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recurring Templates</h2>
          <p className="text-gray-600 dark:text-gray-400">Set up templates for recurring invoices</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{template.client_name}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>${template.amount.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="capitalize">{template.frequency}</span>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Next: {new Date(template.next_invoice_date).toLocaleDateString()}
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{template.description}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(template.created_at).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No templates yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first recurring invoice template</p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>
        )}
      </div>

      <TemplateForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSave}
        template={editingTemplate}
      />
    </div>
  );
};
