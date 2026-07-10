import orderModel from '../models/orderModel.js';
import generateUniqueId from '../utils/generateId.js';

// Create a new order with randomly generated fields
export const createOrder = async (req, res) => {
    try {
        const order_id = await generateUniqueId(orderModel, "order_id", "ORD");
        const user_id = await generateUniqueId(orderModel, "user_id", "USR");
        const customer_name = await generateUniqueId(orderModel, "customer_name", "Customer_");

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const amount = Math.floor(1000 + Math.random() * 5000);

        const newOrder = new orderModel({
            order_id,
            user_id,
            customer_name,
            order_date: dateStr,
            order_time: timeStr,
            amount,
            payment_details: {
                payment_status: 'pending'
            }
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order generated successfully', order: newOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all orders
export const getOrders = async (req, res) => {
    try {
        const orders = await orderModel.find().sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order status updated', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete order
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await orderModel.findOneAndDelete({ order_id: id });

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
