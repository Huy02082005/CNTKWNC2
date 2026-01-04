// websocket-server.js
const socketIo = require('socket.io');

let io;

function initWebSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: "*", // Thay bằng domain của bạn
            methods: ["GET", "POST"]
        }
    });
    
    io.on('connection', (socket) => {
        console.log('New client connected');
        
        // Người dùng join room theo customerId để nhận thông báo
        socket.on('join_customer', (customerId) => {
            socket.join(`customer_${customerId}`);
        });
        
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
    
    global.io = io;
    return io;
}

// Hàm gửi thông báo cập nhật trạng thái đơn hàng
function notifyOrderStatusUpdate(orderId, customerId, newStatus) {
    if (global.io) {
        global.io.to(`customer_${customerId}`).emit('order_status_updated', {
            orderId: orderId,
            status: newStatus,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    initWebSocket,
    notifyOrderStatusUpdate
};