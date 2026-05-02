const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.use(requireAdmin);

router.get('/admin/stats', (req, res) => {
  const queries = {
    pendingReports: 'SELECT COUNT(*) as count FROM reports WHERE status = "pending"',
    totalUsers: 'SELECT COUNT(*) as count FROM users WHERE role != "admin"',
    activeListings: 'SELECT COUNT(*) as count FROM listings WHERE status = "available"',
    resolvedReports: 'SELECT COUNT(*) as count FROM reports WHERE status IN ("resolved", "dismissed")'
  };
  
  db.query(queries.pendingReports, (err, pending) => {
    if (err) {
      console.error('Stats Error (pendingReports):', err);
      return res.status(500).json({ success: false, message: 'Error fetching pending reports' });
    }
    db.query(queries.totalUsers, (err, users) => {
      if (err) {
        console.error('Stats Error (totalUsers):', err);
        return res.status(500).json({ success: false, message: 'Error fetching total users' });
      }
      db.query(queries.activeListings, (err, listings) => {
        if (err) {
          console.error('Stats Error (activeListings):', err);
          return res.status(500).json({ success: false, message: 'Error fetching active listings' });
        }
        db.query(queries.resolvedReports, (err, resolved) => {
          if (err) {
            console.error('Stats Error (resolvedReports):', err);
            return res.status(500).json({ success: false, message: 'Error fetching resolved reports' });
          }
          res.json({
            success: true,
            data: {
              pending_reports: pending[0].count,
              total_users: users[0].count,
              active_listings: listings[0].count,
              resolved_reports: resolved[0].count
            }
          });
        });
      });
    });
  });
});

router.get('/admin/reports', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT 
      r.*,
      u.full_name AS reporter_name,
      u.email AS reporter_email,
      CASE 
        WHEN r.reported_type = 'listing' THEN 
          (SELECT title FROM listings WHERE listing_id = r.reported_id)
        WHEN r.reported_type = 'user' THEN 
          (SELECT full_name FROM users WHERE user_id = r.reported_id)
        ELSE NULL
      END AS reported_title,
      CASE 
        WHEN r.reported_type = 'listing' THEN 
          (SELECT seller_id FROM listings WHERE listing_id = r.reported_id)
        WHEN r.reported_type = 'user' THEN 
          r.reported_id
        ELSE NULL
      END AS reported_user_id,
      CASE 
        WHEN r.reported_type = 'listing' THEN 
          (SELECT full_name FROM users WHERE user_id = (SELECT seller_id FROM listings WHERE listing_id = r.reported_id))
        WHEN r.reported_type = 'user' THEN 
          (SELECT full_name FROM users WHERE user_id = r.reported_id)
        ELSE NULL
      END AS reported_user_name,
      CASE 
        WHEN r.reported_type = 'listing' THEN 
          (SELECT status FROM listings WHERE listing_id = r.reported_id)
        ELSE NULL
      END AS listing_status
    FROM reports r
    JOIN users u ON u.user_id = r.reporter_id
  `;
  const params = [];
  
  if (status && status !== 'all') {
    sql += ` WHERE r.status = ?`;
    params.push(status);
  }
  
  sql += ` ORDER BY r.created_at DESC`;
  
  db.query(sql, params, (err, reports) => {
    if (err) {
      console.error('Error fetching reports:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: reports });
  });
});

router.put('/admin/reports/:id', (req, res) => {
  const reportId = parseInt(req.params.id);
  const { status, admin_note } = req.body;
  
  const validStatuses = ['reviewed', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  
  db.query(
    'UPDATE reports SET status = ?, admin_note = ?, resolved_at = NOW() WHERE report_id = ?',
    [status, admin_note || null, reportId],
    (err, result) => {
      if (err) {
        console.error('Error updating report:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      res.json({ success: true, message: `Report marked as ${status}` });
    }
  );
});

router.get('/admin/listings', (req, res) => {
  const { search, status } = req.query;
  let sql = `
    SELECT 
      l.*,
      u.full_name AS seller_name,
      u.email AS seller_email,
      (SELECT image_url FROM listing_images WHERE listing_id = l.listing_id AND is_primary = 1 LIMIT 1) AS primary_image
    FROM listings l
    JOIN users u ON u.user_id = l.seller_id
    WHERE 1=1
  `;
  const params = [];
  
  if (search) {
    sql += ` AND (l.title LIKE ? OR l.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (status && status !== 'all') {
    sql += ` AND l.status = ?`;
    params.push(status);
  }
  
  sql += ` ORDER BY l.created_at DESC`;
  
  db.query(sql, params, (err, listings) => {
    if (err) {
      console.error('Error fetching listings:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: listings });
  });
});

router.delete('/admin/listings/:id', (req, res) => {
  const listingId = parseInt(req.params.id);
  
  db.query('DELETE FROM listing_images WHERE listing_id = ?', [listingId], (err) => {
    if (err) {
      console.error('Error deleting images:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    db.query('DELETE FROM listings WHERE listing_id = ?', [listingId], (err, result) => {
      if (err) {
        console.error('Error deleting listing:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Listing not found' });
      }
      res.json({ success: true, message: 'Listing deleted successfully' });
    });
  });
});

router.get('/admin/users', (req, res) => {
  const { search, role, status } = req.query;
  
  let sql = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.role,
      u.department,
      u.profile_picture,
      u.bio,
      u.is_verified,
      u.is_active,
      u.created_at,
      (SELECT COUNT(*) FROM listings WHERE seller_id = u.user_id) AS listing_count,
      (SELECT COUNT(*) FROM reports WHERE reported_type = 'user' AND reported_id = u.user_id AND status = 'pending') AS pending_reports_count
    FROM users u
    WHERE u.role != 'admin'
  `;
  const params = [];
  
  if (search) {
    sql += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (role && role !== 'all') {
    sql += ` AND u.role = ?`;
    params.push(role);
  }
  
  if (status === 'active') {
    sql += ` AND u.is_active = 1`;
  } else if (status === 'suspended') {
    sql += ` AND u.is_active = 0`;
  }
  
  sql += ` ORDER BY u.user_id DESC`;
  
  db.query(sql, params, (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: users });
  });
});

router.get('/admin/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  const sql = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.role,
      u.department,
      u.profile_picture,
      u.bio,
      u.is_verified,
      u.is_active,
      u.created_at,
      (SELECT AVG(rating) FROM reviews WHERE seller_id = u.user_id) AS avg_rating,
      (SELECT COUNT(*) FROM listings WHERE seller_id = u.user_id) AS listing_count,
      (SELECT COUNT(*) FROM reports WHERE reported_type = 'user' AND reported_id = u.user_id AND status = 'pending') AS pending_reports
    FROM users u
    WHERE u.user_id = ?
  `;
  
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: rows[0] });
  });
});

router.put('/admin/users/:id/role', (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  
  const validRoles = ['student', 'faculty', 'staff', 'alumni'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  
  db.query('UPDATE users SET role = ? WHERE user_id = ? AND role != "admin"', [role, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or cannot change admin role' });
    }
    res.json({ success: true, message: 'Role updated successfully' });
  });
});

router.put('/admin/users/:id/status', (req, res) => {
  const userId = parseInt(req.params.id);
  const { is_active } = req.body;
  
  if (userId === req.user.user_id) {
    return res.status(400).json({ success: false, message: 'You cannot suspend yourself' });
  }
  
  db.query('UPDATE users SET is_active = ? WHERE user_id = ? AND role != "admin"', [is_active, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or cannot modify admin' });
    }
    const message = is_active === 1 ? 'User activated successfully' : 'User suspended successfully';
    res.json({ success: true, message: message });
  });
});

router.put('/admin/users/:id/verify', (req, res) => {
  const userId = parseInt(req.params.id);
  const { is_verified } = req.body;
  
  db.query('UPDATE users SET is_verified = ? WHERE user_id = ?', [is_verified, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const message = is_verified === 1 ? 'User verified successfully' : 'User unverified successfully';
    res.json({ success: true, message: message });
  });
});

router.post('/admin/send-warning', (req, res) => {
  const { user_id, message, report_id } = req.body;
  
  if (!user_id || !message) {
    return res.status(400).json({ success: false, message: 'User ID and message are required' });
  }
  
  const sql = `
    INSERT INTO notifications (user_id, type, title, body, link, created_at)
    VALUES (?, 'system', 'Admin Warning', ?, NULL, NOW())
  `;
  
  db.query(sql, [user_id, message], (err, result) => {
    if (err) {
      console.error('Error sending warning:', err);
      return res.status(500).json({ success: false, message: 'Failed to send warning' });
    }
    
    if (report_id) {
      db.query(
        'UPDATE reports SET admin_note = CONCAT(IFNULL(admin_note, ""), " Warning sent to user. ") WHERE report_id = ?',
        [report_id],
        () => {}
      );
    }
    
    res.json({ success: true, message: 'Warning sent successfully' });
  });
});

module.exports = router;