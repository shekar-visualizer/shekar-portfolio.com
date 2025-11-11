# Portfolio Admin Setup Guide

## Current Setup: Static Server (Live Server)

You're currently using VS Code Live Server which serves static files only. This is why you're getting the 405 error when trying to upload files.

## Option 1: Download Mode (Current - No Setup Required) ✅

Your admin panel will automatically detect Live Server and use **Download Mode**:

1. Click "Save Changes"
2. Files will be downloaded to your computer
3. Follow the included instructions to manually upload files
4. Replace your `assetsName.js` with the downloaded version

**Pros:** Works immediately, no server setup needed
**Cons:** Manual file upload required

## Option 2: Enable PHP for Auto-Upload 🔧

To enable automatic file uploads and `assetsName.js` updates:

### A. Using XAMPP (Windows/Mac/Linux)

1. **Install XAMPP:**
   - Download from [https://www.apachefriends.org](https://www.apachefriends.org)
   - Install and start Apache

2. **Move your project:**
   - Copy your portfolio folder to `xampp/htdocs/`
   - Access via `http://localhost/your-portfolio-folder`

3. **Set permissions (Mac/Linux):**
   ```bash
   chmod 755 assets/img/portfolio/images/
   chmod 755 assets/img/portfolio/videos/
   chmod 644 assetsName.js
   ```

### B. Using MAMP (Mac)

1. **Install MAMP:**
   - Download from [https://www.mamp.info](https://www.mamp.info)
   - Start servers

2. **Configure:**
   - Put project in MAMP's `htdocs` folder
   - Access via `http://localhost:8888/your-project`

### C. Using Built-in PHP Server

1. **Open terminal in your project folder:**
   ```bash
   cd /path/to/your/portfolio
   php -S localhost:8000
   ```

2. **Access admin panel:**
   ```
   http://localhost:8000/admin/
   ```

## File Permissions Required

For auto-upload to work, ensure these folders are writable:

```
assets/img/portfolio/images/  (755 or 777)
assets/img/portfolio/videos/  (755 or 777)
assetsName.js                 (644 or 666)
```

## Security Note

The included `upload-handler.php` includes basic security:
- File type validation (only images/videos)
- Path sanitization
- Error handling

For production use, consider additional security measures.

## Troubleshooting

### Common Issues:

1. **405 Method Not Allowed**
   - You're on a static server (Live Server)
   - Switch to PHP server or use Download Mode

2. **403 Forbidden**
   - Check file/folder permissions
   - Ensure PHP has write access

3. **File Upload Failed**
   - Check `upload_max_filesize` in PHP settings
   - Verify folder exists and is writable

4. **Clipboard Errors**
   - Browser security feature
   - Admin panel will fallback to text selection

## Current Status

✅ **Working:** Download Mode with manual upload
⚠️  **Not Working:** Auto-upload (requires PHP server)

Choose the option that best fits your workflow!