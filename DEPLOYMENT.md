# 🚀 Deployment Guide - Vaporwave Snake

Your game is ready to deploy! Here are the easiest options:

## 🌟 Option 1: Netlify (Recommended)

### Method A: Drag & Drop (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Drag your entire `snake-game` folder to Netlify
4. Get instant live URL!

### Method B: Git Integration
1. Push your code to GitHub
2. Connect Netlify to your GitHub repo
3. Auto-deploy on every commit

**Build Settings for Netlify:**
- Build command: `npm run build`
- Publish directory: `.` (root)

---

## 🐙 Option 2: GitHub Pages (100% Free)

1. Push your code to GitHub
2. Go to repo Settings → Pages
3. Source: Deploy from branch `main`
4. Folder: `/ (root)`
5. Your site will be at: `https://yourusername.github.io/snake-game`

---

## ⚡ Option 3: Surge.sh (CLI)

```bash
# Install Surge globally
npm install -g surge

# Deploy (run from project root)
surge . your-domain.surge.sh
```

---

## 🔥 Option 4: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init hosting

# Deploy
firebase deploy
```

---

## 📝 Pre-deployment Checklist

✅ All snake colors are working
✅ Mobile controls are responsive  
✅ Service worker is registered
✅ Manifest.json is included
✅ Meta tags are optimized

## 🎮 Your Game Features
- 13 snake color options with personal names
- Mobile touch controls
- PWA support (installable)
- Responsive design
- High score persistence
- Smooth animations

**Recommendation:** Start with Netlify drag & drop - it's the easiest!
