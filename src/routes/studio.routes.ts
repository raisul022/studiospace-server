import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { verifyJWT, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// 1. Get all studios (optional category filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const db = getDB();
    const studiosCollection = db.collection('studios');

    const filter: any = {};
    if (category && typeof category === 'string' && category !== 'All') {
      filter.category = category;
    }
    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const studios = await studiosCollection.find(filter).sort({ createdAt: -1 }).toArray();

    return res.status(200).json({
      success: true,
      count: studios.length,
      studios,
    });
  } catch (error) {
    console.error('Fetch studios error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch studios.' });
  }
});

// 2. Get featured studios (top 6 limit as required by PDF page 2)
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const studiosCollection = db.collection('studios');

    // Fetch 6 top-rated or newest studios
    const featured = await studiosCollection
      .find({})
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .toArray();

    return res.status(200).json({
      success: true,
      studios: featured,
    });
  } catch (error) {
    console.error('Fetch featured studios error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch featured studios.' });
  }
});

// 3. Get user-owned studios (filtered by ownerEmail)
router.get('/user/:email', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    const db = getDB();
    const studiosCollection = db.collection('studios');

    const userStudios = await studiosCollection
      .find({ ownerEmail: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      studios: userStudios,
    });
  } catch (error) {
    console.error('Fetch user studios error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user listings.' });
  }
});

// 4. Get single studio details by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Studio ID format.' });
    }

    const db = getDB();
    const studiosCollection = db.collection('studios');

    const studio = await studiosCollection.findOne({ _id: new ObjectId(id) });
    if (!studio) {
      return res.status(404).json({ success: false, message: 'Studio space not found.' });
    }

    return res.status(200).json({
      success: true,
      studio,
    });
  } catch (error) {
    console.error('Fetch single studio error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch studio details.' });
  }
});

// 5. Create new studio (Private - Challenge 1: Protected with JWT HTTPOnly cookie)
router.post('/', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      amenities,
      overview,
      ownerEmail,
      ownerName,
    } = req.body;

    if (!title || !category || !hourlyRate || !location || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, hourly rate, location, and image URL are required.',
      });
    }

    const db = getDB();
    const studiosCollection = db.collection('studios');

    const newStudio = {
      title,
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: Number(securityDeposit || 0),
      maxCapacity: Number(maxCapacity || 10),
      location,
      imageUrl,
      amenities: Array.isArray(amenities) ? amenities : [],
      overview: overview || '',
      ownerEmail: (ownerEmail || req.user?.email || '').toLowerCase(),
      ownerName: ownerName || req.user?.name || 'Studio Host',
      rating: 4.9, // Default initial rating
      reviewCount: 12,
      createdAt: new Date(),
    };

    const result = await studiosCollection.insertOne(newStudio);

    return res.status(201).json({
      success: true,
      message: 'Studio workspace published successfully! 🎬',
      studioId: result.insertedId,
    });
  } catch (error) {
    console.error('Create studio error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating studio.' });
  }
});

// 6. Update studio (Private - Protected with JWT)
router.put('/:id', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Studio ID format.' });
    }

    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      amenities,
      overview,
    } = req.body;

    const db = getDB();
    const studiosCollection = db.collection('studios');

    const updateDoc = {
      $set: {
        title,
        category,
        hourlyRate: Number(hourlyRate),
        securityDeposit: Number(securityDeposit || 0),
        maxCapacity: Number(maxCapacity || 10),
        location,
        imageUrl,
        amenities: Array.isArray(amenities) ? amenities : [],
        overview,
        updatedAt: new Date(),
      },
    };

    const result = await studiosCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Studio space not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Studio listing updated successfully! ✨',
    });
  } catch (error) {
    console.error('Update studio error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating studio.' });
  }
});

// 7. Delete studio (Private - Challenge 1: Protected with JWT)
router.delete('/:id', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Studio ID format.' });
    }

    const db = getDB();
    const studiosCollection = db.collection('studios');

    const result = await studiosCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Studio space not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Studio workspace deleted successfully.',
    });
  } catch (error) {
    console.error('Delete studio error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting studio.' });
  }
});

export default router;
