# Dashboard Calculation Issues Analysis

## Issues Found

### 1. **Status Mapping Problem**
- **Issue**: Dashboard logic only looks for `'pending'` status for pending invoices, but database contains `'overdue'`, `'sent'`, `'draft'` statuses
- **Current Logic**: 
  ```javascript
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  ```
- **Database Reality**: No invoices have `'pending'` status, they have `'overdue'`, `'sent'`, `'draft'`, `'paid'`

### 2. **Overdue Calculation Logic Error**
- **Issue**: Overdue calculation only considers invoices with `'pending'` status, but overdue invoices have `'overdue'` status
- **Current Logic**:
  ```javascript
  const overdueInvoices = invoices.filter(inv => {
    const dueDate = new Date(inv.due_date);
    return inv.status === 'pending' && dueDate < new Date();
  }).length;
  ```
- **Should Be**: Check for `'overdue'` status OR check if `'sent'` invoices are past due date

### 3. **Negative Invoice Amounts**
- **Issue**: Database contains invoices with negative amounts (-$17.78, -$42.09)
- **Impact**: These are included in total revenue calculation, which may not be intended
- **Question**: Are these refunds/credits that should be handled differently?

### 4. **Status Definitions Unclear**
- **Database Statuses Found**: `'draft'`, `'sent'`, `'overdue'`, `'paid'`
- **Dashboard Expects**: `'pending'`, `'paid'`
- **Need**: Clear status mapping or update dashboard logic

## Current Database State
- Total Invoices: 24
- Paid: 3 invoices ($7,778.20)
- Draft: 8 invoices 
- Sent: 7 invoices
- Overdue: 6 invoices
- Pending: 0 invoices (dashboard expects this status)

## Recommended Fixes

### Option 1: Update Dashboard Logic (Recommended)
Map the actual database statuses to dashboard categories:
- **Pending**: `'sent'` status (invoices sent but not paid)
- **Overdue**: `'overdue'` status (explicitly marked as overdue)
- **Paid**: `'paid'` status (already correct)
- **Draft**: `'draft'` status (not yet sent)

### Option 2: Update Database Statuses
Change database to use `'pending'` instead of `'sent'` status.

### Option 3: Handle Negative Amounts
Decide how to handle negative amounts:
- Exclude from revenue calculation
- Show as separate "Credits/Refunds" metric
- Include but highlight the issue

## Impact on Metrics
With current logic:
- **Pending Invoices**: Shows 0 (should show 7 'sent' invoices)
- **Overdue Invoices**: Shows 0 (should show 6 'overdue' invoices)  
- **Total Revenue**: Includes negative amounts (may be incorrect)
- **Paid Invoices**: Correct (3 invoices)
- **Total Invoices**: Correct (24 invoices)
