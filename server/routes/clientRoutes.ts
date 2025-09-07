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
  searchClients
} from '../controllers/index.js';
import {
  requireAuth,
  validateRequest,
  validationSets
} from '../middleware/index.js';

const router: Router = Router();

// All client routes require authentication
router.use(requireAuth);

// Get all clients
router.get('/', getAllClients);

// Search clients
router.get('/search', searchClients);

// Get clients with invoice summary (disabled - function not implemented)
// router.get('/with-invoice-summary', getClientsWithInvoiceSummary);

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

// Bulk import clients
router.post('/bulk-import',
  // TODO: Add validation for bulk import
  // validateRequest,
  async (req: any, res: any) => {
    try {
      const { clients } = req.body;
      
      if (!clients || !Array.isArray(clients)) {
        return res.status(400).json({
          success: false,
          error: 'Clients array is required'
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < clients.length; i++) {
        const clientData = clients[i];
        try {
          await createClient({
            body: { clientData },
            user: req.user
          } as any, {
            status: () => ({ json: () => {} }),
            json: (data: any) => {
              if (data.success) {
                successCount++;
              } else {
                errorCount++;
                errors.push(`Client ${i + 1}: ${data.message || 'Failed to create'}`);
              }
            }
          } as any, () => {});
        } catch (error) {
          errorCount++;
          errors.push(`Client ${i + 1}: ${error}`);
        }
      }

      res.json({
        success: true,
        data: {
          imported: successCount,
          failed: errorCount,
          errors
        }
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import clients'
      });
    }
  }
);

export default router;