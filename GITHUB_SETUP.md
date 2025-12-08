# 🚀 GitHub Integration Setup Guide

## Overview

Your admin panel now directly commits to GitHub! This means:
- ✅ Upload files directly to your repository
- ✅ Update `assetsName.js` automatically  
- ✅ Your live site at `https://shekar-visualizer.github.io/shekar-portfolio.com/` updates immediately
- ✅ Works both locally and on GitHub Pages

## Quick Setup (One-time only)

### 1. Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Set these permissions:
   - ✅ **Contents** (read and write)
   - ✅ **Metadata** (read)
4. Copy the token (starts with `ghp_`)

### 2. First Time Usage

1. Open your admin panel: `https://shekar-visualizer.github.io/shekar-portfolio.com/admin`
2. Upload some images/videos
3. Click "🚀 Commit to GitHub"
4. Enter your GitHub token when prompted
5. Write a commit message
6. Click "🚀 Commit & Push"

**That's it!** The token is saved in your browser for future use.

## How It Works

### 🔄 **Complete Workflow:**

1. **Upload Files** → Admin panel previews them locally
2. **Click Save Changes** → Shows GitHub commit dialog
3. **Enter Commit Message** → Describe your changes
4. **Auto-commit to GitHub:**
   - Uploads all new files to correct folders
   - Updates `assetsName.js` with new file list
   - Creates a single commit with your message
   - Pushes to main branch
5. **GitHub Pages deploys** → Live site updates in ~1 minute

### 📁 **File Organization:**
- Photoshop files → `assets/img/portfolio/images/`
- Videos → `assets/img/portfolio/videos/`
- PPT slides → `assets/img/portfolio/images/`

### 🎯 **What You Get:**
- **No manual file uploads needed**
- **No manual `assetsName.js` editing needed**
- **Clean Git history with your custom messages**
- **Immediate live site updates**
- **Works from anywhere (local or GitHub Pages)**

## Security Notes

- ✅ Token is stored securely in browser localStorage
- ✅ Only has access to your portfolio repository
- ✅ You can revoke the token anytime in GitHub settings
- ✅ Token never leaves your browser (direct GitHub API calls)

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Check your token has "Contents" permission
   - Generate a new token if expired

2. **"File already exists"**
   - Admin panel handles duplicates automatically
   - Files get unique timestamps if needed

3. **"Permission denied"**
   - Ensure token has write access to the repository
   - Check repository settings allow token access

### Clear Saved Token:
```javascript
// In browser console:
localStorage.removeItem('github_token');
```

## Example Workflow

```
1. 📁 Upload 5 new portfolio images
2. 🎨 Drag to reorder them
3. 🗑️ Delete any unwanted ones
4. 🚀 Click "Commit to GitHub" 
5. ✏️ Write: "Add latest design projects from November 2024"
6. ✅ Commit → Files uploaded + assetsName.js updated
7. 🌐 Live site updates automatically!
```

Your portfolio management is now fully automated! 🎉