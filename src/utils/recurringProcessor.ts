
import { templateOperations, invoiceOperations, clientOperations } from '@/lib/database';
import { generateInvoiceNumber } from '@/utils/invoiceNumbering';
import { formatDateSync } from '@/utils/dateFormatting';

export const processRecurringInvoices = async () => {
  try {
    const templates = await templateOperations.getAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const template of templates) {
      const nextInvoiceDate = new Date(template.next_invoice_date);
      nextInvoiceDate.setHours(0, 0, 0, 0);

      // If the next invoice date is today or in the past, create an invoice
      if (nextInvoiceDate <= today) {
        console.log(`Creating recurring invoice for template: ${template.name}`);

        // Get client information
        const client = await clientOperations.getById(template.client_id);
        if (!client) {
          console.error(`Client not found for template ${template.name}`);
          continue;
        }
      
      // Create the invoice
      const invoiceData = {
        client_id: template.client_id,
        template_id: template.id,
        amount: template.amount,
        status: 'draft' as const,
        invoice_number: await generateInvoiceNumber(),
        due_date: calculateDueDate(template.payment_terms || 'net_30'),
        description: template.description,
        type: 'invoice' as const,
        client_name: client.name,
        client_email: client.email,
        client_phone: client.phone,
        client_address: `${client.address}, ${client.city}, ${client.state} ${client.zipCode}`,
        line_items: template.line_items || '[]',
        tax_amount: template.tax_amount || 0,
        tax_rate_id: template.tax_rate_id || null,
        shipping_amount: template.shipping_amount || 0,
        shipping_rate_id: template.shipping_rate_id || null,
        notes: template.notes || ''
      };

        await invoiceOperations.create(invoiceData);

        // Calculate next invoice date based on frequency
        const nextDate = calculateNextInvoiceDate(nextInvoiceDate, template.frequency);

        // Update the template with the new next invoice date
        await templateOperations.update(template.id, {
          next_invoice_date: nextDate.toISOString().split('T')[0]
        });

        console.log(`Next invoice for ${template.name} scheduled for: ${formatDateSync(nextDate)}`);
      }
    }
  } catch (error) {
    console.error('Error processing recurring invoices:', error);
  }
};

// Remove the old generateInvoiceNumber function since we're now importing it from utils

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
