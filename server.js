const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'profile-data.json');
const BIRTHDAY_DATA_FILE = path.join(__dirname, 'birthday-data.json');
const BIRTHDAY_PAGES_DIR = path.join(__dirname, 'birthday-pages');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

if (!fs.existsSync(BIRTHDAY_PAGES_DIR)) {
  fs.mkdirSync(BIRTHDAY_PAGES_DIR, { recursive: true });
}

const DEFAULT_PROFILE = {
  name: "OG Believer",
  role: "Programmer and Developer",
  bio: "Building the future, one commit at a time. Passionate about crafting seamless digital experiences with cutting-edge technology and minimalist design.",
  avatar: null,
  github: "https://github.com/believerrh",
  whatsapp: "https://wa.me/233534970884",
  botFilesLink: "https://github.com/believerh/CypherX/archive/refs/heads/main.zip",
  pairDeviceLink: "https://pair.cypherxbot.space/",
  stats: {
    projects: "42+",
    commits: "8.2K",
    online: "24/7"
  }
};

const DEFAULT_BIRTHDAY = {
  name: "ANITA",
  theme: "purple",
  bookTitle: "Anita's Memory Book ❤️",
  photoData: [
    { url: 'https://picsum.photos/400?random=1' },
    { url: 'https://picsum.photos/400?random=2' },
    { url: 'https://picsum.photos/400?random=3' },
    { url: 'https://picsum.photos/400?random=4' },
    { url: 'https://picsum.photos/400?random=5' },
    { url: 'https://picsum.photos/400?random=6' },
    { url: 'https://picsum.photos/400?random=7' },
    { url: 'https://picsum.photos/400?random=8' },
    { url: 'https://picsum.photos/400?random=9' },
    { url: 'https://picsum.photos/400?random=10' }
  ],
  finalMessage: "🎉 Happy Birthday Anita 🎉",
  finalWishes: "Thank you for being such an amazing person. May God bless you with love, joy, and peace. ❤️"
};

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_PROFILE, null, 2));
}

if (!fs.existsSync(BIRTHDAY_DATA_FILE)) {
  fs.writeFileSync(BIRTHDAY_DATA_FILE, JSON.stringify(DEFAULT_BIRTHDAY, null, 2));
}

app.use(express.json({ limit: '50mb' }));
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

app.post('/api/profile', (req, res) => {
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

app.get('/api/birthday', (req, res) => {
  try {
    if (!fs.existsSync(BIRTHDAY_DATA_FILE)) {
      return res.json(DEFAULT_BIRTHDAY);
    }
    const data = fs.readFileSync(BIRTHDAY_DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load birthday data' });
  }
});

app.post('/api/birthday', (req, res) => {
  const { password, ...birthdayData } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (birthdayData.theme === 'custom') {
      birthdayData.customColors = sanitizeCustomColors(birthdayData.customColors);
    }
    fs.writeFileSync(BIRTHDAY_DATA_FILE, JSON.stringify(birthdayData, null, 2));
    res.json({ success: true, message: 'Birthday page updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save birthday data' });
  }
});

// --- Personalized ("make your own") birthday pages ---
// These are separate from the single shared birthday.html/birthday-data.json
// that admin.html edits. Anyone can create one here; no admin password needed.

const THEME_KEYS = ['purple', 'roseGold', 'ocean', 'emerald', 'sunset', 'crimson', 'silver', 'custom'];

function isValidBirthdayId(id) {
  return typeof id === 'string' && /^[a-f0-9]{10}$/.test(id);
}

function isValidHexColor(c) {
  return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);
}

// A "custom" theme can carry multiple user-picked colors (not just one).
function sanitizeCustomColors(colors) {
  if (!Array.isArray(colors)) return [];
  return colors.filter(isValidHexColor).slice(0, 8);
}

app.get('/api/birthday/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidBirthdayId(id)) {
    return res.status(400).json({ error: 'Invalid page id' });
  }
  const filePath = path.join(BIRTHDAY_PAGES_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Page not found' });
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load page data' });
  }
});

app.post('/api/birthday/create', (req, res) => {
  const { name, theme, customColors, bookTitle, photoData, finalMessage, finalWishes } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const pageData = {
    name: name.trim(),
    theme: (theme && THEME_KEYS.includes(theme)) ? theme : 'purple',
    customColors: sanitizeCustomColors(customColors),
    bookTitle: (bookTitle && bookTitle.trim()) || `${name.trim()}'s Memory Book ❤️`,
    photoData: (Array.isArray(photoData) && photoData.length)
      ? photoData.filter(p => p && typeof p.url === 'string' && p.url.trim()).map(p => ({ url: p.url.trim() }))
      : DEFAULT_BIRTHDAY.photoData,
    finalMessage: (finalMessage && finalMessage.trim()) || `🎉 Happy Birthday ${name.trim()} 🎉`,
    finalWishes: (finalWishes && finalWishes.trim()) || DEFAULT_BIRTHDAY.finalWishes,
    createdAt: new Date().toISOString()
  };

  let id;
  do {
    id = crypto.randomBytes(5).toString('hex');
  } while (fs.existsSync(path.join(BIRTHDAY_PAGES_DIR, `${id}.json`)));

  try {
    fs.writeFileSync(path.join(BIRTHDAY_PAGES_DIR, `${id}.json`), JSON.stringify(pageData, null, 2));
    res.json({ success: true, id, url: `/birthday.html?id=${id}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save page data' });
  }
});

// --- Admin management of personalized birthday pages ---

app.post('/api/birthday-pages/list', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const files = fs.readdirSync(BIRTHDAY_PAGES_DIR).filter(f => f.endsWith('.json'));
    const pages = files.map(f => {
      const id = f.replace(/\.json$/, '');
      try {
        const data = JSON.parse(fs.readFileSync(path.join(BIRTHDAY_PAGES_DIR, f), 'utf8'));
        return {
          id,
          name: data.name || '',
          theme: data.theme || 'purple',
          bookTitle: data.bookTitle || '',
          createdAt: data.createdAt || null
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    res.json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list birthday pages' });
  }
});

app.post('/api/birthday-pages/delete', (req, res) => {
  const { password, id } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!isValidBirthdayId(id)) {
    return res.status(400).json({ error: 'Invalid page id' });
  }
  const filePath = path.join(BIRTHDAY_PAGES_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Page not found' });
  }
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete birthday page' });
  }
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/create-birthday.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'create-birthday.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`Profile page: http://localhost:${PORT}`);
});
