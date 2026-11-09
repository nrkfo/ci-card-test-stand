import { Router } from 'express';
import { runTest, getRecentTests, getTestById } from '../controllers/testController.js';

export const testRoutes = Router();

testRoutes.post('/run', runTest);
testRoutes.get('/recent', getRecentTests);
testRoutes.get('/:id', getTestById);
