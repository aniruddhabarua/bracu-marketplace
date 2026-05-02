const db = require('./config/db');
const AnnouncementModel = require('./models/announcementModels');

db.query(
  'SELECT u.full_name as seller_name, l.title as listing_title, l.seller_id FROM users u JOIN listings l ON u.user_id = l.seller_id WHERE l.listing_id = 6',
  (err, rows) => {
    if (rows && rows.length > 0) {
      AnnouncementModel.create({
        admin_id: 1,
        title: '🎉 Exciting News! Item Sold!',
        content: `The item **${rows[0].listing_title}** was just purchased! Check out more items from <a href="/user?id=${rows[0].seller_id}">${rows[0].seller_name}</a>!`,
        category: 'Announcement'
      }, () => {
        console.log('Announcement posted');
        process.exit();
      });
    } else {
      process.exit();
    }
  }
);
