import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { verifyJWT, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// 1. Create a reservation with Double-Booking Prevention (Challenge 2)
router.post('/', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      studioId,
      studioTitle,
      studioImage,
      date,
      startTime,
      endTime,
      totalAmount,
    } = req.body;

    if (!studioId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Studio ID, date, start time, and end time are required.',
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time.',
      });
    }

    const db = getDB();
    const bookingsCollection = db.collection('bookings');

    // Challenge 2: Verify time overlap against existing "Confirmed" (and "Pending") bookings in MongoDB
    // Overlap formula: existing.startTime < new.endTime AND existing.endTime > new.startTime
    const collision = await bookingsCollection.findOne({
      studioId: studioId,
      date: date,
      status: { $in: ['Confirmed', 'Pending'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (collision) {
      return res.status(409).json({
        success: false,
        message: `Time Slot Collision: This studio is already reserved on ${date} between ${collision.startTime} and ${collision.endTime}. Please select another time window.`,
      });
    }

    const newBooking = {
      studioId,
      studioTitle: studioTitle || 'Creative Studio Space',
      studioImage: studioImage || '',
      date,
      startTime,
      endTime,
      totalAmount: Number(totalAmount || 0),
      userEmail: (req.user?.email || '').toLowerCase(),
      userName: req.user?.name || 'Creator',
      status: 'Pending', // Initial status required by PDF
      createdAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(newBooking);

    return res.status(201).json({
      success: true,
      message: 'Booking request placed successfully with Pending status! 🎟️',
      bookingId: result.insertedId,
      booking: newBooking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating booking.' });
  }
});

// 2. Get user bookings (filtered by userEmail)
router.get('/user/:email', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    const db = getDB();
    const bookingsCollection = db.collection('bookings');

    const bookings = await bookingsCollection
      .find({ userEmail: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user bookings.' });
  }
});

// 3. Cancel pending booking
router.patch('/:id/cancel', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Booking ID format.' });
    }

    const db = getDB();
    const bookingsCollection = db.collection('bookings');

    const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status '${booking.status}'. Only 'Pending' reservations can be cancelled.`,
      });
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'Cancelled', cancelledAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error cancelling booking.' });
  }
});

export default router;
