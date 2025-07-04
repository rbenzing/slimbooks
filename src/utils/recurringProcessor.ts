
import { templateOperations, invoiceOperations } from '@/lib/database';

export const processRecurringInvoices = () => {
  const templates = templateOperations.getAll();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  templates.forEach(template => {
    const nextInvoiceDate = new Date(template.next_invoice_date);
    nextInvoiceDate.setHours(0, 0, 0, 0);

    // If the next invoice date is today or in the past, create an invoice
    if (nextInvoiceDate <= today) {
      console.log(`Creating recurring invoice for template: ${template.name}`);
      
      // Create the invoice
      const invoiceData = {
        client_name: template.client_name,
        client_email: template.client_email,
        client_phone: template.client_phone,
        client_address: template.client_address,
        amount: template.amount,
        line_items: template.line_items,
        tax_amount: template.tax_amount,
        shipping_amount: template.shipping_amount,
        notes: template.notes,
        status: 'draft',
        invoice_number: generateInvoiceNumber(),
        due_date: calculateDueDate(template.payment_terms)
      };

      invoiceOperations.create(invoiceData);

      // Calculate next invoice date based on frequency
      const nextDate = calculateNextInvoiceDate(nextInvoiceDate, template.frequency);
      
      // Update the template with the new next invoice date
      templateOperations.update(template.id, {
        ...template,
        next_invoice_date: nextDate.toISOString().split('T')[0]
      });

      console.log(`Next invoice for ${template.name} scheduled for: ${nextDate.toLocaleDateString()}`);
    }
  });
};

const generateInvoiceNumber = () => {
  const existingInvoices = invoiceOperations.getAll();
  const invoiceCount = existingInvoices.length + 1;
  return `INV-${String(invoiceCount).padStart(4, '0')}`;
};

const calculateDueDate = (paymentTerms: string) => {
  const today = new Date();
  const dueDate = new Date(today);
  
  switch (paymentTerms) {
    case 'net_15':
      dueDate.setDate(today.getDate() + 15);
      break;
    case 'net_30':
      dueDate.setDate(today.getDate() + 30);
      break;
    case 'net_60':
      dueDate.setDate(today.getDate() + 60);
      break;
    case 'due_on_receipt':
    default:
      // Due immediately
      break;
  }
  
  return dueDate.toISOString().split('T')[0];
};

const calculateNextInvoiceDate = (currentDate: Date, frequency: string) => {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(currentDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(currentDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(currentDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(currentDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly if frequency is not recognized
      nextDate.setMonth(currentDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
};
