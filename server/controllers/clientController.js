// Client controller for Slimbooks
// Handles all client-related business logic

import { clientService } from '../services/ClientService.js';
import {
  AppError,
  NotFoundError,
  ValidationError,
  asyncHandler
} from '../middleware/index.js';

/**
 * Get all clients
 */
export const getAllClients = asyncHandler(async (req, res) => {
  const clients = await clientService.getAllClients();
  res.json({ success: true, data: clients });
});

/**
 * Get client by ID
 */
export const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const client = await clientService.getClientById(id);

  if (!client) {
    throw new NotFoundError('Client');
  }

  res.json({ success: true, data: client });
});

/**
 * Create new client
 */
export const createClient = asyncHandler(async (req, res) => {
  const { clientData } = req.body;

  if (!clientData) {
    throw new ValidationError('Client data is required');
  }

  try {
    const clientId = await clientService.createClient(clientData);
    
    res.status(201).json({ 
      success: true, 
      data: { id: clientId },
      message: 'Client created successfully'
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Update client
 */
export const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { clientData } = req.body;

  if (!id || !clientData) {
    throw new ValidationError('Invalid parameters');
  }

  try {
    const changes = await clientService.updateClient(id, clientData);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Client updated successfully'
    });
  } catch (error) {
    if (error.message === 'Client not found') {
      throw new NotFoundError('Client');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Delete client
 */
export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const changes = await clientService.deleteClient(id);
    
    res.json({ 
      success: true, 
      data: { changes },
      message: 'Client deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Client not found') {
      throw new NotFoundError('Client');
    }
    throw new ValidationError(error.message);
  }
});

/**
 * Get client statistics
 */
export const getClientStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const stats = await clientService.getClientStats(id);
    res.json({ success: true, data: stats });
  } catch (error) {
    if (error.message === 'Client not found') {
      throw new NotFoundError('Client');
    }
    throw new AppError(error.message, 500);
  }
});

/**
 * Search clients
 */
export const searchClients = asyncHandler(async (req, res) => {
  const { q, limit = 10, offset = 0 } = req.query;
  
  try {
    const results = await clientService.searchClients(q, limit, offset);
    res.json({ success: true, data: results });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Get clients with invoice summaries
 */
export const getClientsWithInvoiceSummary = asyncHandler(async (req, res) => {
  const clients = await clientService.getClientsWithInvoiceSummary();
  res.json({ success: true, data: clients });
});
