const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'profile-data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const DEFAULT_PROFILE = {
  name: "OG Believer",
  role: "Programmer and Developer",
  bio: "Building the future, one commit at a time. Passionate about crafting seamless digital experiences with cutting-edge technology and minimalist design.",
  avatar: null,
  github: "https://github.com/believerrh",
  whatsapp: "https://wa.me/233534970884",
  stats: {
    projects: "42+",
    commits: "8.2K",
    online: "24/7"
  }
};

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_PROFILE, null, 2));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.get('/api/profile', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json(DEFAULT_PROFILE);
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load profile data' });
  }
});

app.post('/api/profile', express.json(), (req, res) => {
  const { password, ...profileData } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(profileData, null, 2));
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save profile data' });
  }
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`Profile page: http://localhost:${PORT}`);
});
