// Client routes for Slimbooks API
// Handles all client-related endpoints

import { Router } from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  searchClients,
  getClientsWithInvoiceSummary
} from '../controllers/index.js';
import {
  requireAuth,
  validateRequest,
  validationSets
} from '../middleware/index.js';

const router = Router();

// All client routes require authentication
router.use(requireAuth);

// Get all clients
router.get('/', getAllClients);

// Search clients
router.get('/search', searchClients);

// Get clients with invoice summary
router.get('/with-invoice-summary', getClientsWithInvoiceSummary);

// Get client statistics
router.get('/:id/stats', 
  validationSets.updateClient.slice(0, 1), // Just ID validation
  validateRequest,
  getClientStats
);

// Get client by ID
router.get('/:id', 
  validationSets.updateClient.slice(0, 1), // Just ID validation
  validateRequest,
  getClientById
);

// Create new client
router.post('/', 
  validationSets.createClient,
  validateRequest,
  createClient
);

// Update client
router.put('/:id', 
  validationSets.updateClient,
  validateRequest,
  updateClient
);

// Delete client
router.delete('/:id', 
  validationSets.updateClient.slice(0, 1), // Just ID validation
  validateRequest,
  deleteClient
);

export default router;
