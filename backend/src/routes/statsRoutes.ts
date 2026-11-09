import { Router } from 'express';
import { getSummaryStats } from '../controllers/statsController.js';

export const statsRoutes = Router();

statsRoutes.get('/summary', getSummaryStats);
