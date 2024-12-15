import express, { json } from 'express';
import { connect, model } from 'mongoose';
import cors from 'cors';
const app = express();

// Middleware
app.use(cors());
app.use(json());

// MongoDB connection
connect('mongodb://localhost:27017/booking_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Booking Model
const Booking = model('Booking', {
    name: String,
    email: String,
    date: String,
    time: String,
    purpose: String
});

// API Routes
app.post('/api/bookings', async (req, res) => {
    try {
        // Check if slot is already booked
        const existingBooking = await Booking.findOne({
            date: req.body.date,
            time: req.body.time
        });
        
        if (existingBooking) {
            return res.status(400).json({ error: 'This time slot is already booked' });
        }

        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const { date } = req.query;
        const query = date ? { date } : {};
        const bookings = await Booking.find(query);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/available-slots', async (req, res) => {
    try {
        const date = req.query.date;
        
        // Validate date parameter
        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        const bookedSlots = await Booking.find({ date }).select('time');
        const bookedTimes = bookedSlots.map(slot => slot.time);
        
        // Business hours: 9 AM to 4 PM with 1 hour lunch break
        const availableSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
            .filter(slot => !bookedTimes.includes(slot));
            
        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));