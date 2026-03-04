
const mongoose = require('mongoose');
const Supplier = require('./server/models/Supplier');
require('dotenv').config();

async function testVirtual() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const supplier = await Supplier.findOne();
        if (supplier) {
            console.log('Supplier ID:', supplier._id);
            console.log('Created At:', supplier.createdAt);
            console.log('Application Number Virtual:', supplier.applicationNumber);
        } else {
            console.log('No supplier found');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

testVirtual();
