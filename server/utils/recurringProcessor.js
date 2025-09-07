// Server-side recurring invoice processor
// Handles processing of recurring invoices from templates

import { databaseService } from '../core/DatabaseService.js';

const processRecurringInvoices = async () => {
  try {
    console.log('Starting recurring invoice processing...');
    
    // Get all templates
    const templates = databaseService.getMany('SELECT * FROM invoice_templates');
    
    if (!templates || templates.length === 0) {
      console.log('No recurring invoice templates found');
      return { success: true, processed: 0, message: 'No templates to process' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let processedCount = 0;
    
    for (const template of templates) {
      try {
        // Skip templates with missing required data
        if (!template.client_id || !template.amount || !template.next_invoice_date) {
          console.warn(`Skipping template ${template.name} - missing required data`);
          continue;
        }

        const nextInvoiceDate = new Date(template.next_invoice_date);
        nextInvoiceDate.setHours(0, 0, 0, 0);

        // Skip if next_invoice_date is invalid
        if (isNaN(nextInvoiceDate.getTime())) {
          console.warn(`Skipping template ${template.name} - invalid next_invoice_date`);
          continue;
        }

        // If the next invoice date is today or in the past, create an invoice
        if (nextInvoiceDate <= today) {
          console.log(`Creating recurring invoice for template: ${template.name}`);

          // Get client information
          const client = databaseService.getOne('SELECT * FROM clients WHERE id = ?', [template.client_id]);
          if (!client) {
            console.error(`Client not found for template ${template.name}`);
            continue;
          }

          // Generate invoice number
          const invoiceCountResult = databaseService.getOne('SELECT COUNT(*) as count FROM invoices');
          const invoiceCount = invoiceCountResult ? invoiceCountResult.count : 0;
          const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;

          // Create the invoice
          const invoiceData = {
            client_id: template.client_id,
            template_id: template.id,
            amount: Number(template.amount),
            status: 'draft',
            invoice_number: invoiceNumber,
            due_date: calculateDueDate(template.payment_terms || 'net_30'),
            issue_date: today.toISOString().split('T')[0],
            description: template.description || '',
            type: 'invoice',
            client_name: client.name,
            client_email: client.email,
            client_phone: client.phone || '',
            client_address: `${client.address || ''}, ${client.city || ''}, ${client.state || ''} ${client.zipCode || ''}`.trim(),
            line_items: template.line_items || '[]',
            tax_amount: template.tax_amount || 0,
            tax_rate_id: template.tax_rate_id || null,
            shipping_amount: template.shipping_amount || 0,
            shipping_rate_id: template.shipping_rate_id || null,
            notes: template.notes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Additional validation before creating invoice
          if (!invoiceData.client_id || invoiceData.client_id <= 0) {
            console.error(`Invalid client_id for template ${template.name}`);
            continue;
          }
          
          if (!invoiceData.amount || invoiceData.amount <= 0) {
            console.error(`Invalid amount for template ${template.name}`);
            continue;
          }

          // Insert invoice into database
          const insertResult = databaseService.executeQuery(`
            INSERT INTO invoices (
              client_id, template_id, amount, status, invoice_number, due_date, issue_date,
              description, type, client_name, client_email, client_phone, client_address,
              line_items, tax_amount, tax_rate_id, shipping_amount, shipping_rate_id,
              notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            invoiceData.client_id,
            invoiceData.template_id,
            invoiceData.amount,
            invoiceData.status,
            invoiceData.invoice_number,
            invoiceData.due_date,
            invoiceData.issue_date,
            invoiceData.description,
            invoiceData.type,
            invoiceData.client_name,
            invoiceData.client_email,
            invoiceData.client_phone,
            invoiceData.client_address,
            invoiceData.line_items,
            invoiceData.tax_amount,
            invoiceData.tax_rate_id,
            invoiceData.shipping_amount,
            invoiceData.shipping_rate_id,
            invoiceData.notes,
            invoiceData.created_at,
            invoiceData.updated_at
          ]);

          // Calculate next invoice date based on frequency
          const nextDate = calculateNextInvoiceDate(nextInvoiceDate, template.frequency);

          // Update the template with the new next invoice date
          databaseService.executeQuery(
            'UPDATE invoice_templates SET next_invoice_date = ? WHERE id = ?',
            [nextDate.toISOString().split('T')[0], template.id]
          );

          console.log(`Next invoice for ${template.name} scheduled for: ${nextDate.toISOString().split('T')[0]}`);
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing template ${template.name}:`, error);
        // Continue processing other templates
        continue;
      }
    }
    
    console.log(`Recurring invoice processing completed. Processed ${processedCount} invoices.`);
    return { success: true, processed: processedCount, message: `Processed ${processedCount} recurring invoices` };
    
  } catch (error) {
    console.error('Error in recurring invoice processing:', error);
    return { success: false, error: error.message };
  }
};

const calculateDueDate = (paymentTerms) => {
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

const calculateNextInvoiceDate = (currentDate, frequency) => {
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

export { processRecurringInvoices };