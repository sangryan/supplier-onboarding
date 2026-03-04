
const mongoose = require('mongoose');
const Notification = require('./server/models/Notification');
require('dotenv').config();

async function checkNotifications() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);
        console.log('Last 10 notifications:');
        notifications.forEach(n => {
            console.log(`ID: ${n._id}, Title: "${n.title}", Type: ${n.type}, Created: ${n.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkNotifications();
