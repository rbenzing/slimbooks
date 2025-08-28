// Controllers index - exports all controller modules
// Provides a single import point for all controllers

// User controller
export {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByGoogleId,
  createUser,
  updateUser,
  deleteUser,
  updateUserLoginAttempts,
  updateUserLastLogin,
  updateLoginAttemptsByUserId,
  updateLastLoginByUserId,
  verifyUserEmail
} from './userController.js';

// Client controller
export {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  searchClients,
  getClientsWithInvoiceSummary
} from './clientController.js';

// Invoice controller
export {
  getAllInvoices,
  getInvoiceById,
  getPublicInvoiceById,
  generatePublicInvoiceToken,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  updateInvoiceStatus,
  markInvoiceAsSent,
  getOverdueInvoices
} from './invoiceController.js';

// Expense controller
export {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpenseCategories,
  updateExpenseStatus,
  bulkUpdateExpenseStatus,
  getExpensesByDateRange,
  bulkImportExpenses,
  bulkDeleteExpenses,
  bulkUpdateExpenseCategory,
  bulkUpdateExpenseMerchant
} from './expenseController.js';

// Payment controller
export {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats,
  bulkDeletePayments
} from './paymentController.js';

// Authentication controller
export {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword
} from './authController.js';

// Settings controller
export {
  getAllSettings,
  getSettingByKey,
  saveSetting,
  saveMultipleSettings,
  getProjectSettings,
  updateProjectSettings
} from './settingsController.js';

// Database controller
export {
  getDatabaseHealth,
  getDatabaseInfo,
  exportDatabase,
  importDatabase
} from './databaseController.js';

// Template controller
export {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from './templateController.js';

// PDF controller
export {
  generateInvoicePDF,
  generateInvoicePDFWithToken,
  generatePagePDF,
  getPDFServiceStatus,
  initializePDFService
} from './pdfController.js';
