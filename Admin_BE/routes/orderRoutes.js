const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getAllOrders);
router.get('/stats', orderController.getOrderStats);
router.get('/:id', orderController.getOrderDetail);
router.put('/:id/status', orderController.updateOrderStatus);
router.post('/create', orderController.createOrder);
router.get('/customer/:customerId', orderController.getCustomerOrders);
router.get('/:orderId/products', orderController.getOrderProducts);
router.get('/:orderId/detail', orderController.getOrderFullDetail);
router.get('/customer/:customerId/updates', orderController.checkOrderUpdates);
router.get('/email/:email', orderController.getOrdersByEmail);
router.get('/customer/:customerId/stats', orderController.getCustomerOrderStats);

router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { Status } = req.body;
        
        // Kiểm tra trạng thái hợp lệ
        const validStatuses = ['pending', 'shipping', 'completed', 'cancelled'];
        if (!validStatuses.includes(Status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trạng thái không hợp lệ' 
            });
        }
        
        // Cập nhật trong database
        await pool.request()
            .input('OrderID', sql.Int, id)
            .input('Status', sql.NVarChar(20), Status)
            .input('UpdatedAt', sql.DateTime, new Date())
            .query(`
                UPDATE [Order] 
                SET Status = @Status, 
                    OrderDate = CASE 
                        WHEN @Status = 'shipping' THEN ISNULL(OrderDate, GETDATE())
                        ELSE OrderDate 
                    END
                WHERE OrderID = @OrderID
            `);
        
        // Log hoạt động
        await logOrderActivity(id, Status, req.user.id);
        
        // Gửi thông báo realtime nếu có WebSocket
        if (global.io) {
            global.io.emit('order_status_updated', {
                orderId: id,
                status: Status,
                updatedAt: new Date()
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Cập nhật trạng thái thành công',
            orderId: id,
            newStatus: Status
        });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi cập nhật trạng thái' 
        });
    }
});

// Hàm log hoạt động
async function logOrderActivity(orderId, newStatus, adminId) {
    try {
        await pool.request()
            .input('OrderID', sql.Int, orderId)
            .input('Action', sql.NVarChar(50), `Cập nhật trạng thái: ${newStatus}`)
            .input('AdminID', sql.Int, adminId)
            .query(`
                INSERT INTO OrderActivityLog (OrderID, Action, AdminID, CreatedAt)
                VALUES (@OrderID, @Action, @AdminID, GETDATE())
            `);
    } catch (error) {
        console.error('Error logging order activity:', error);
    }
}

module.exports = router;