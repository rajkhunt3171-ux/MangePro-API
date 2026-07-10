import express from 'express';
import { createOrder, getOrders, updateOrderStatus, deleteOrder } from '../controllers/orderController.js';

const router = express.Router();

// Route to create a new order
router.get('/generate-order', createOrder);

// Route to get all orders
router.get('/get-order', getOrders);

// Route to delete order
router.get('/delete-order/:id', deleteOrder);

// Route to update order status
router.patch('/:id/status', updateOrderStatus);


export default router;
