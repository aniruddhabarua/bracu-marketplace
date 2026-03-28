const express        = require('express');
const router         = express.Router();
const bcrypt         = require('bcrypt');
const jwt            = require('jsonwebtoken');
const UserModel      = require('../models/userModels');
const UserController = require('../controllers/userControllers');
const { authenticate, JWT_SECRET } = require('../middleware/auth');


router.post('/api/auth/register', async (req, res) => {
  const { full_name, email, password, role, department } = req.body;

  if (!full_name || !email || !password)
    return res.status(400).json({ success: false, message: 'full_name, email and password are required.' });

  const allowedDomains = ['@bracu.ac.bd', '@g.bracu.ac.bd'];
  const isAllowed = allowedDomains.some(d => email.endsWith(d));
  if (!isAllowed)
    return res.status(400).json({ success: false, message: 'Only BRACU email addresses are allowed.' });

  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

  try {
    const password_hash = await bcrypt.hash(password, 10);

    UserModel.create({ full_name, email, password_hash, role, department }, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY')
          return res.status(409).json({ success: false, message: 'Email already registered.' });
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful. You can now log in.',
        user_id: result.insertId,
      });
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required.' });

  UserModel.findByEmail(email, async (err, user) => {
    if (err)   return res.status(500).json({ success: false, message: 'Database error.' });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      {
        user_id:   user.user_id,
        email:     user.email,
        role:      user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        user_id:         user.user_id,
        full_name:       user.full_name,
        email:           user.email,
        role:            user.role,
        department:      user.department,
        profile_picture: user.profile_picture,
      },
    });
  });
});


router.get('/api/users/:id', UserController.getProfile);


router.put('/api/users/:id', authenticate, UserController.updateProfile);


router.get('/api/auth/me', authenticate, (req, res) => {
  UserModel.getPublicProfile(req.user.user_id, (err, rows) => {
    if (err || !rows.length)
      return res.status(500).json({ success: false, message: 'Error fetching profile.' });
    return res.status(200).json({ success: true, data: rows[0] });
  });
});

module.exports = router;