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
  verifyUserEmail,
  enableUser2FA,
  disableUser2FA
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
  getExpensesByDateRange
} from './expenseController.js';

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
