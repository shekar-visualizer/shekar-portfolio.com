// Admin Panel for Portfolio Management
// Loads actual data from assestsName.js and provides CRUD functionality
// Uses GitHub API for direct repository updates

// GitHub Configuration
const GITHUB_CONFIG = {
    owner: 'shekar-visualizer',
    repo: 'shekar-portfolio.com',
    branch: 'main',
    // Note: For production, use GitHub Apps or OAuth. For demo, we'll use manual token input.
    token: null // Will be set via user input
};

// Base paths for different asset types (relative to admin folder)
const paths = {
    photoshop: "../assets/img/portfolio/images/",
    videos: "../assets/img/portfolio/videos/",
    ppt: "../assets/img/portfolio/images/" // PPT slides are stored as images
};

// GitHub API paths (without ../ since they're absolute in repo)
const githubPaths = {
    photoshop: "assets/img/portfolio/images/",
    videos: "assets/img/portfolio/videos/",
    ppt: "assets/img/portfolio/images/",
    assetsFile: "assestsName.js"
};

// Working copies of the arrays (loaded from assestsName.js)
let workingPhotoshopFiles = [];
let workingAftereffects = [];
let workingPPTFiles = [];

// Store actual file objects for newly uploaded files
let uploadedFileObjects = new Map(); // Maps filename to File object

// Track files that need to be deleted from repository
let filesToDelete = new Set(); // Set of file paths to delete from repo

// State management
let currentTab = "photoshop";
let sortableInstance = null;
let hasUnsavedChanges = false;
let originalData = {};

// DOM elements
const listEl = document.getElementById("list");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const copyBtn = document.getElementById("copyBtn");
const visitSiteBtn = document.getElementById("visitSiteBtn");
const saveChangesBtn = document.getElementById("saveChangesBtn");
const autoSaveBtn = document.getElementById("autoSaveBtn");
const downloadFilesBtn = document.getElementById("downloadFilesBtn");
const saveStatus = document.getElementById("saveStatus");

// Modal elements
const githubAuthModal = document.getElementById("githubAuthModal");
const commitModal = document.getElementById("commitModal");
const githubTokenInput = document.getElementById("githubToken");
const saveTokenBtn = document.getElementById("saveTokenBtn");
const cancelAuthBtn = document.getElementById("cancelAuthBtn");
const commitTitleInput = document.getElementById("commitTitle");
const commitDescriptionInput = document.getElementById("commitDescription");
const filesListElement = document.getElementById("filesList");
const confirmCommitBtn = document.getElementById("confirmCommitBtn");
const cancelCommitBtn = document.getElementById("cancelCommitBtn");

// Initialize the admin panel
function init() {
    // Load data from assestsName.js (if available)
    loadData();

    // Setup event listeners
    setupEventListeners();

    // Render initial state
    renderList();
    updateExport();
}// Load data from global variables (from assestsName.js)
function loadData() {
    try {
        // Create working copies of the arrays
        if (typeof PhotoshopFiles !== 'undefined') {
            workingPhotoshopFiles = [...PhotoshopFiles];
            originalData.PhotoshopFiles = [...PhotoshopFiles];
        }

        // Use videoFiles for the Videos tab (mapping to Aftereffects)
        if (typeof videoFiles !== 'undefined') {
            workingAftereffects = [...videoFiles];
            originalData.videoFiles = [...videoFiles];
        }

        if (typeof PPTFiles !== 'undefined') {
            workingPPTFiles = [...PPTFiles];
            originalData.PPTFiles = [...PPTFiles];
        }

        console.log('Data loaded successfully');
        console.log('Photoshop files:', workingPhotoshopFiles.length);
        console.log('Video files:', workingAftereffects.length);
        console.log('PPT files:', workingPPTFiles.length);

        // Reset unsaved changes flag
        hasUnsavedChanges = false;
        updateSaveButtons();
    } catch (error) {
        console.warn('Could not load data from assestsName.js:', error);
        // Initialize with empty arrays if data loading fails
        workingPhotoshopFiles = [];
        workingAftereffects = [];
        workingPPTFiles = [];
        originalData = { PhotoshopFiles: [], videoFiles: [], PPTFiles: [] };
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tabs button").forEach((btn) => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Upload functionality
    uploadBtn.addEventListener("click", handleUpload);

    // File input change (for better UX)
    fileInput.addEventListener("change", (e) => {
        const fileCount = e.target.files.length;
        if (fileCount > 0) {
            uploadBtn.textContent = `Upload ${fileCount} file${fileCount > 1 ? 's' : ''}`;
        } else {
            uploadBtn.textContent = 'Upload';
        }
    });

    // Copy to clipboard
    copyBtn.addEventListener("click", copyToClipboard);

    // Visit site button
    visitSiteBtn.addEventListener("click", visitPortfolioSite);

    // Save changes button
    saveChangesBtn.addEventListener("click", confirmSaveChanges);

    // Auto-save button
    autoSaveBtn.addEventListener("click", autoSaveChanges);

    // Download files button
    downloadFilesBtn.addEventListener("click", downloadNewFiles);

    // GitHub auth modal
    saveTokenBtn.addEventListener("click", saveGitHubToken);
    cancelAuthBtn.addEventListener("click", () => hideModal(githubAuthModal));

    // Commit modal
    confirmCommitBtn.addEventListener("click", executeCommit);
    cancelCommitBtn.addEventListener("click", () => hideModal(commitModal));

    // Auto-generate commit title when user types
    commitTitleInput.addEventListener('input', updateCommitPreview);
    commitDescriptionInput.addEventListener('input', updateCommitPreview);

    // Warn before leaving if there are unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}// Switch between tabs
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update current tab
    currentTab = tabName;

    // Re-render the list
    renderList();
}

// Handle file upload
function handleUpload() {
    const files = Array.from(fileInput.files);
    if (!files.length) {
        alert("Please select files to upload first!");
        return;
    }

    // Create new items from uploaded files with unique names
    const newItems = files.map(file => {
        const uniqueFileName = ensureUniqueFileName(file.name);

        // Store the actual file object for preview
        uploadedFileObjects.set(uniqueFileName, file);

        return {
            src: uniqueFileName,
            title: extractTitle(file.name),
            isNewUpload: true // Flag to identify newly uploaded files
        };
    });

    // Add to the beginning of the appropriate array
    const targetArray = getCurrentArray();
    targetArray.unshift(...newItems);

    // Mark as having unsaved changes
    markAsChanged();

    // Update UI
    renderList();
    updateExport();

    // Reset form
    fileInput.value = "";
    uploadBtn.textContent = "Upload";

    // Show feedback
    showFeedback(`Added ${newItems.length} item${newItems.length > 1 ? 's' : ''} to ${currentTab}`);
}

// Ensure filename is unique by adding timestamp if needed
function ensureUniqueFileName(filename) {
    const currentArray = getCurrentArray();
    const extension = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));

    // Check if filename already exists
    const existingNames = currentArray.map(item => item.src.toLowerCase());

    if (!existingNames.includes(filename.toLowerCase())) {
        return filename; // No conflict
    }

    // Add timestamp to make it unique
    const timestamp = Date.now();
    const uniqueName = `${nameWithoutExt}_${timestamp}${extension}`;

    showFeedback(`File renamed to ${uniqueName} to avoid conflicts`, 'warning');
    return uniqueName;
}

// Extract a clean title from filename
function extractTitle(filename) {
    // Remove file extension and clean up
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    // Capitalize first letter
    return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
}

// Show temporary feedback message
function showFeedback(message, type = 'success') {
    // Remove any existing feedback
    const existingFeedback = document.querySelector('.feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Create and show feedback
    const feedback = document.createElement('div');
    feedback.className = 'feedback';

    const bgColor = type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#27ae60';

    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    feedback.textContent = message;

    document.body.appendChild(feedback);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 4000);
}

// Render the current list
function renderList() {
    const currentArray = getCurrentArray();

    // Clear existing content
    listEl.innerHTML = "";

    // Show loading or empty state
    if (currentArray.length === 0) {
        showEmptyState();
        destroySortable();
        return;
    }

    // Render cards
    currentArray.forEach((item, index) => {
        const card = createCard(item, index);
        listEl.appendChild(card);
    });

    // Setup drag and drop
    setupSortable();

    // Add fade-in animation
    listEl.classList.add('fade-in');
    setTimeout(() => listEl.classList.remove('fade-in'), 300);
}

// Create a card element
function createCard(item, index) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.index = index;

    // Determine file path - use preview URL for newly uploaded files
    let filePath;
    if (item.isNewUpload && uploadedFileObjects.has(item.src)) {
        // Create preview URL for newly uploaded file
        const fileObject = uploadedFileObjects.get(item.src);
        filePath = URL.createObjectURL(fileObject);

        // Add a visual indicator for new uploads
        card.classList.add('new-upload');
    } else {
        // Use server path for existing files
        filePath = paths[currentTab] + item.src;
    }

    // Determine if it's a video or image
    const isVideo = currentTab === "videos" || item.src.toLowerCase().includes('.mp4');

    // Create media element with error handling
    const mediaElement = isVideo
        ? `<video src="${filePath}" controls preload="metadata" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"></video>
           <div class="media-error" style="display:none; padding:20px; text-align:center; background:#f8f9fa; color:#6c757d;">
               <div>📹</div>
               <small>Video Preview</small>
           </div>`
        : `<img src="${filePath}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
           <div class="media-error" style="display:none; padding:20px; text-align:center; background:#f8f9fa; color:#6c757d;">
               <div>🖼️</div>
               <small>Image Preview</small>
           </div>`;

    card.innerHTML = `
        ${mediaElement}
        <div class="meta">
            <span class="drag" title="Drag to reorder">☰</span>
            <span class="title" title="${item.title}">${item.title}</span>
            ${item.isNewUpload ? '<span class="new-badge" title="Newly uploaded">NEW</span>' : ''}
            <button class="delete-btn" onclick="removeItem(${index})" title="Delete item">🗑️</button>
        </div>
    `;

    return card;
}

// Show empty state
function showEmptyState() {
    listEl.innerHTML = `
        <div class="empty-state">
            <h3>No items in ${currentTab}</h3>
            <p>Upload some files to get started!</p>
        </div>
    `;
}

// Get the current working array based on active tab
function getCurrentArray() {
    switch (currentTab) {
        case "photoshop":
            return workingPhotoshopFiles;
        case "videos":
            return workingAftereffects;
        case "ppt":
            return workingPPTFiles;
        default:
            return [];
    }
}

// Convert a local src path to GitHub repository path
function getGitHubFilePath(srcPath) {
    // Remove leading ../ and convert to repository path
    if (srcPath.startsWith('../')) {
        return srcPath.substring(3); // Remove '../'
    }
    // Handle relative paths that don't start with ../
    if (srcPath.startsWith('assets/')) {
        return srcPath;
    }
    return null;
}

// Remove an item from the current array
window.removeItem = function (index) {
    if (!confirm('Are you sure you want to delete this item? This will also delete the file from the repository when you save changes.')) {
        return;
    }

    const currentArray = getCurrentArray();
    const removedItem = currentArray.splice(index, 1)[0];

    // Clean up file object if it was a new upload
    if (removedItem.isNewUpload && uploadedFileObjects.has(removedItem.src)) {
        // Revoke the object URL to free memory
        const fileObject = uploadedFileObjects.get(removedItem.src);
        uploadedFileObjects.delete(removedItem.src);
    } else if (!removedItem.isNewUpload) {
        // If it's an existing file, mark it for deletion from repository
        const filePath = getGitHubFilePath(removedItem.src);
        if (filePath) {
            filesToDelete.add(filePath);
            console.log('Marked for deletion:', filePath);
        }
    }

    // Mark as having unsaved changes
    markAsChanged();

    renderList();
    updateExport();

    showFeedback(`Deleted "${removedItem.title}" - File will be removed from repository when you save changes`);
};

// Setup drag and drop functionality
function setupSortable() {
    destroySortable();

    sortableInstance = new Sortable(listEl, {
        animation: 150,
        handle: ".drag",
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        dragClass: "sortable-drag",
        onEnd: function (evt) {
            const currentArray = getCurrentArray();

            // Move item in array
            const movedItem = currentArray.splice(evt.oldIndex, 1)[0];
            currentArray.splice(evt.newIndex, 0, movedItem);

            // Mark as having unsaved changes
            markAsChanged();

            // Update export
            updateExport();

            showFeedback('Order updated');
        }
    });
}

// Destroy sortable instance
function destroySortable() {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
}

// Update the export area with current data
function updateExport() {
    const exportData = {
        PhotoshopFiles: workingPhotoshopFiles,
        Aftereffects: workingAftereffects,
        PPTFiles: workingPPTFiles
    };

    const exportText = generateExportText(exportData);
    document.getElementById("exportArea").textContent = exportText;
}

// Generate the export text in the correct format
function generateExportText(data) {
    const formatArray = (arr, name) => {
        // Clean the items to remove internal flags like isNewUpload
        const cleanedItems = arr.map(item => ({
            src: item.src,
            title: item.title
        }));

        const items = cleanedItems.map(item => `  { src: "${item.src}", title: "${item.title}" }`).join(',\n');
        return `const ${name} = [\n${items}\n];`;
    };

    return [
        formatArray(data.PhotoshopFiles, 'PhotoshopFiles'),
        '',
        formatArray(data.Aftereffects, 'videoFiles'), // Keep original name
        '',
        formatArray(data.PPTFiles, 'PPTFiles')
    ].join('\n');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);// Mark data as changed and update UI
function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveButtons();
}

// Update save button states
function updateSaveButtons() {
    if (saveChangesBtn) {
        saveChangesBtn.disabled = !hasUnsavedChanges;
        saveChangesBtn.textContent = hasUnsavedChanges ? '💾 Save Changes *' : '💾 Save Changes';
    }

    if (autoSaveBtn) {
        autoSaveBtn.disabled = !hasUnsavedChanges;
    }
}

// Visit portfolio site
function visitPortfolioSite() {
    // Try to open the main site (going up one level from admin)
    const siteUrl = window.location.origin + window.location.pathname.replace('/admin/', '/').replace('/admin/index.html', '/');
    window.open(siteUrl, '_blank');
}

// Confirm before saving changes
function confirmSaveChanges() {
    if (!hasUnsavedChanges) {
        showSaveStatus('No changes to save', 'warning');
        return;
    }

    const newFilesCount = [...workingPhotoshopFiles, ...workingAftereffects, ...workingPPTFiles]
        .filter(item => item.isNewUpload).length;

    let confirmMessage = '🚀 GITHUB COMMIT MODE\n\n';
    confirmMessage += 'This will automatically commit your changes to GitHub:\n\n';

    if (newFilesCount > 0) {
        confirmMessage += `📁 Upload ${newFilesCount} new file${newFilesCount > 1 ? 's' : ''} to repository\n`;
    }

    confirmMessage += '📝 Update assetsName.js in repository\n';
    confirmMessage += '🌐 Your live site will update automatically\n\n';
    confirmMessage += '⚠️  You\'ll need:\n';
    confirmMessage += '• GitHub Personal Access Token (if not saved)\n';
    confirmMessage += '• Custom commit message\n\n';
    confirmMessage += 'Continue with GitHub commit?';

    const confirmed = confirm(confirmMessage);

    if (confirmed) {
        autoSaveChanges();
    }
}// Auto-save changes (now commits directly to GitHub)
async function autoSaveChanges() {
    if (!hasUnsavedChanges) {
        showSaveStatus('No changes to save', 'warning');
        return;
    }

    // Check if GitHub token is available
    if (!GITHUB_CONFIG.token) {
        // Try to load from localStorage
        const savedToken = localStorage.getItem('github_token');
        if (savedToken) {
            GITHUB_CONFIG.token = savedToken;
        } else {
            // Show GitHub auth modal
            showModal(githubAuthModal);
            return;
        }
    }

    // Show commit message modal
    prepareCommitModal();
    showModal(commitModal);
}

// Download mode auto-save (for static servers or when upload fails)
function downloadModeAutoSave() {
    try {
        autoSaveBtn.disabled = true;
        autoSaveBtn.textContent = '📥 Preparing Downloads...';

        // Automatically download files and assets
        downloadNewFiles();

        // Mark as saved (since user will manually upload)
        hasUnsavedChanges = false;
        updateSaveButtons();
        autoSaveBtn.textContent = '🔄 Auto-Save to File';

        // Remove isNewUpload flags
        workingPhotoshopFiles.forEach(item => delete item.isNewUpload);
        workingAftereffects.forEach(item => delete item.isNewUpload);
        workingPPTFiles.forEach(item => delete item.isNewUpload);

        // Re-render to show updated state
        renderList();

        showSaveStatus(
            '📥 Files and updated assetsName.js downloaded! Follow instructions to complete upload.',
            'success'
        );

        showFeedback('📥 Download complete! Check your downloads folder for files and instructions.', 'success');

    } catch (error) {
        console.error('Download error:', error);
        showSaveStatus('❌ Failed to prepare downloads: ' + error.message, 'error');
        autoSaveBtn.disabled = false;
        autoSaveBtn.textContent = '🔄 Auto-Save to File';
        showFeedback('Failed to prepare downloads: ' + error.message, 'error');
    }
}// Download new files for manual upload
function downloadNewFiles() {
    const newFiles = [];

    // Collect all new files
    [workingPhotoshopFiles, workingAftereffects, workingPPTFiles].forEach((array, arrayIndex) => {
        const tabNames = ['photoshop', 'videos', 'ppt'];
        const folderNames = ['images', 'videos', 'images']; // ppt goes to images folder
        const currentTabName = tabNames[arrayIndex];
        const folderName = folderNames[arrayIndex];

        array.forEach(item => {
            if (item.isNewUpload && uploadedFileObjects.has(item.src)) {
                newFiles.push({
                    file: uploadedFileObjects.get(item.src),
                    filename: item.src,
                    folder: folderName,
                    tab: currentTabName
                });
            }
        });
    });

    if (newFiles.length === 0) {
        showFeedback('No new files to download', 'warning');
        return;
    }

    // Create and download a zip file with instructions
    downloadFilesAsZip(newFiles);
}

// Download files as individual downloads with instructions
async function downloadFilesAsZip(files) {
    try {
        // Download each file individually (browsers don't allow direct zip creation without libraries)
        for (const fileInfo of files) {
            const blob = fileInfo.file;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileInfo.folder}_${fileInfo.filename}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Create instructions file
        const instructions = createUploadInstructions(files);
        const instructionsBlob = new Blob([instructions], { type: 'text/plain' });
        const instructionsUrl = URL.createObjectURL(instructionsBlob);
        const instructionsLink = document.createElement('a');
        instructionsLink.href = instructionsUrl;
        instructionsLink.download = 'UPLOAD_INSTRUCTIONS.txt';
        instructionsLink.style.display = 'none';
        document.body.appendChild(instructionsLink);
        instructionsLink.click();
        document.body.removeChild(instructionsLink);
        URL.revokeObjectURL(instructionsUrl);

        // Also download updated assetsName.js
        const assetsContent = generateExportText({
            PhotoshopFiles: workingPhotoshopFiles,
            Aftereffects: workingAftereffects,
            PPTFiles: workingPPTFiles
        });

        const assetsBlob = new Blob([assetsContent], { type: 'application/javascript' });
        const assetsUrl = URL.createObjectURL(assetsBlob);
        const assetsLink = document.createElement('a');
        assetsLink.href = assetsUrl;
        assetsLink.download = 'assetsName.js';
        assetsLink.style.display = 'none';
        document.body.appendChild(assetsLink);
        assetsLink.click();
        document.body.removeChild(assetsLink);
        URL.revokeObjectURL(assetsUrl);

        showFeedback(`Downloaded ${files.length} files, instructions, and updated assetsName.js`, 'success');
        showSaveStatus('Files downloaded for manual upload. Check your downloads folder.', 'success');

    } catch (error) {
        console.error('Download error:', error);
        showFeedback('Failed to download files: ' + error.message, 'error');
    }
}

// Create upload instructions text
function createUploadInstructions(files) {
    let instructions = '📁 UPLOAD INSTRUCTIONS\n';
    instructions += '====================\n\n';
    instructions += 'Please upload these files to your server:\n\n';

    const folderMap = {
        'images': 'assets/img/portfolio/images/',
        'videos': 'assets/img/portfolio/videos/'
    };

    Object.keys(folderMap).forEach(folder => {
        const folderFiles = files.filter(f => f.folder === folder);
        if (folderFiles.length > 0) {
            instructions += `📂 ${folderMap[folder]}\n`;
            folderFiles.forEach(f => {
                instructions += `   • ${f.filename}\n`;
            });
            instructions += '\n';
        }
    });

    instructions += '📝 ASSETS FILE UPDATE\n';
    instructions += '====================\n';
    instructions += '1. Replace your current assetsName.js file with the downloaded one\n';
    instructions += '2. Or copy the JSON from the admin panel and paste it into your existing file\n\n';
    instructions += '✅ VERIFICATION\n';
    instructions += '===============\n';
    instructions += '1. Upload all files to the correct folders\n';
    instructions += '2. Update assetsName.js\n';
    instructions += '3. Refresh your portfolio site to see changes\n';
    instructions += '4. Check browser console for any missing file errors\n\n';
    instructions += `Generated: ${new Date().toLocaleString()}\n`;

    return instructions;
}

// Upload new files to their respective server folders
async function uploadNewFilesToServer() {
    const filesToUpload = [];

    // Collect all new files that need uploading
    [workingPhotoshopFiles, workingAftereffects, workingPPTFiles].forEach((array, arrayIndex) => {
        const tabNames = ['photoshop', 'videos', 'ppt'];
        const currentTabName = tabNames[arrayIndex];

        array.forEach(item => {
            if (item.isNewUpload && uploadedFileObjects.has(item.src)) {
                filesToUpload.push({
                    file: uploadedFileObjects.get(item.src),
                    filename: item.src,
                    tab: currentTabName,
                    targetPath: paths[currentTabName].replace('../', '')
                });
            }
        });
    });

    if (filesToUpload.length === 0) {
        return { success: true, filesUploaded: 0 };
    }

    // In a real implementation, this would make HTTP requests to upload files
    // For now, we'll simulate the upload process
    return simulateFileUpload(filesToUpload);
}

// Simulate file upload (replace with actual server calls)
async function simulateFileUpload(files) {
    const uploadPromises = files.map(async (fileInfo) => {
        const formData = new FormData();
        formData.append('file', fileInfo.file);
        formData.append('targetPath', fileInfo.targetPath);
        formData.append('originalName', fileInfo.filename);

        try {
            const response = await fetch('upload-handler.php?action=upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            console.log(`📁 Uploaded: ${result.filename} (${result.size} bytes)`);
            return { success: true, filename: result.filename };

        } catch (error) {
            console.error(`Failed to upload ${fileInfo.filename}:`, error);
            return { success: false, filename: fileInfo.filename, error: error.message };
        }
    });

    const results = await Promise.all(uploadPromises);
    const failures = results.filter(r => !r.success);

    if (failures.length > 0) {
        return {
            success: false,
            error: `Failed to upload: ${failures.map(f => `${f.filename} (${f.error})`).join(', ')}`
        };
    }

    return {
        success: true,
        filesUploaded: files.length,
        uploadedFiles: files.map(f => f.filename)
    };
}

// Update the assetsName.js file on the server
async function updateAssetsNameFile() {
    const exportText = generateExportText({
        PhotoshopFiles: workingPhotoshopFiles,
        Aftereffects: workingAftereffects,
        PPTFiles: workingPPTFiles
    });

    try {
        const response = await fetch('upload-handler.php?action=update-assets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: exportText })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to update assets file');
        }

        console.log('📝 Assets file updated successfully');
        if (result.backup) {
            console.log('📋 Backup created:', result.backup);
        }

        return { success: true, backup: result.backup };

    } catch (error) {
        console.error('Failed to update assets file:', error);
        throw error;
    }
}

// Helper function to clean items for storage
function cleanItem(item) {
    return {
        src: item.src,
        title: item.title
    };
}

// Show save status message
function showSaveStatus(message, type = 'success') {
    if (!saveStatus) return;

    saveStatus.className = `save-status ${type}`;
    saveStatus.textContent = message;
    saveStatus.style.display = 'block';

    // Auto-hide after 10 seconds for success/info, keep errors visible
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (saveStatus.textContent === message) {
                saveStatus.style.display = 'none';
            }
        }, 10000);
    }
}

// Enhanced copy to clipboard with better feedback
async function copyToClipboard() {
    const exportText = document.getElementById("exportArea").textContent;

    try {
        // Ensure document is focused before clipboard operation
        window.focus();
        document.body.focus();

        await navigator.clipboard.writeText(exportText);

        // Update button text temporarily
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#27ae60';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);

        showFeedback('JSON copied to clipboard!');
    } catch (error) {
        console.error('Failed to copy:', error);

        // Fallback: select the text for manual copy
        try {
            const exportArea = document.getElementById("exportArea");
            const range = document.createRange();
            range.selectNode(exportArea);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);

            showFeedback('Text selected - use Ctrl+C (Cmd+C) to copy', 'warning');
        } catch (selectError) {
            console.error('Selection also failed:', selectError);
            showFeedback('Please manually copy the JSON from the text area below', 'warning');
        }
    }
}

// Add CSS for feedback animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// =============================================================================
// GITHUB API FUNCTIONS
// =============================================================================

// Show modal
function showModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Hide modal
function hideModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Save GitHub token
function saveGitHubToken() {
    const token = githubTokenInput.value.trim();

    if (!token) {
        showFeedback('Please enter a GitHub token', 'error');
        return;
    }

    if (!token.startsWith('ghp_') && !token.startsWith('gho_') && !token.startsWith('github_pat_')) {
        showFeedback('Invalid token format. Please check your GitHub token.', 'error');
        return;
    }

    // Save token
    GITHUB_CONFIG.token = token;
    localStorage.setItem('github_token', token);

    hideModal(githubAuthModal);
    githubTokenInput.value = '';

    showFeedback('GitHub token saved! You can now commit changes.', 'success');

    // Continue with commit process
    prepareCommitModal();
    showModal(commitModal);
}

// Prepare commit modal with file list
function prepareCommitModal() {
    // Generate default commit title
    const newFilesCount = [...workingPhotoshopFiles, ...workingAftereffects, ...workingPPTFiles]
        .filter(item => item.isNewUpload).length;

    const deletedFilesCount = filesToDelete.size;

    let defaultTitle = '';
    if (newFilesCount > 0 && deletedFilesCount > 0) {
        defaultTitle = `Add ${newFilesCount} and delete ${deletedFilesCount} portfolio files`;
    } else if (newFilesCount > 0) {
        defaultTitle = `Add ${newFilesCount} new portfolio ${newFilesCount === 1 ? 'file' : 'files'}`;
    } else if (deletedFilesCount > 0) {
        defaultTitle = `Delete ${deletedFilesCount} portfolio ${deletedFilesCount === 1 ? 'file' : 'files'}`;
    } else {
        defaultTitle = 'Update portfolio assets';
    }

    commitTitleInput.value = defaultTitle;
    commitDescriptionInput.value = '';

    // Update file preview
    updateCommitPreview();
}

// Update commit preview
function updateCommitPreview() {
    const filesToCommit = getFilesToCommit();

    filesListElement.innerHTML = '';

    // Show files to be added/updated
    filesToCommit.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.path;
        if (file.isNew) {
            li.style.color = '#27ae60';
            li.textContent += ' (new)';
        }
        filesListElement.appendChild(li);
    });

    // Show files to be deleted
    if (filesToDelete.size > 0) {
        filesToDelete.forEach(filePath => {
            const li = document.createElement('li');
            li.textContent = filePath + ' (deleted)';
            li.style.color = '#e74c3c';
            filesListElement.appendChild(li);
        });
    }

    // Add assetsName.js
    const assetsLi = document.createElement('li');
    assetsLi.textContent = 'assetsName.js (updated)';
    assetsLi.style.color = '#3498db';
    filesListElement.appendChild(assetsLi);
}

// Get list of files to commit
function getFilesToCommit() {
    const files = [];

    // Collect all new files that need uploading
    [workingPhotoshopFiles, workingAftereffects, workingPPTFiles].forEach((array, arrayIndex) => {
        const tabNames = ['photoshop', 'videos', 'ppt'];
        const currentTabName = tabNames[arrayIndex];

        array.forEach(item => {
            if (item.isNewUpload && uploadedFileObjects.has(item.src)) {
                files.push({
                    file: uploadedFileObjects.get(item.src),
                    filename: item.src,
                    tab: currentTabName,
                    path: githubPaths[currentTabName] + item.src,
                    isNew: true
                });
            }
        });
    });

    return files;
}

// Execute the GitHub commit
async function executeCommit() {
    const commitTitle = commitTitleInput.value.trim();
    if (!commitTitle) {
        showFeedback('Please enter a commit message', 'error');
        return;
    }

    try {
        hideModal(commitModal);

        // Show loading state
        showSaveStatus('Committing to GitHub...', 'info');
        autoSaveBtn.disabled = true;
        autoSaveBtn.textContent = '🚀 Committing...';

        // Step 1: Delete files marked for deletion
        if (filesToDelete.size > 0) {
            showSaveStatus('Deleting removed files from repository...', 'info');
            const deleteResults = await deleteFilesFromGitHub(filesToDelete);

            if (!deleteResults.success) {
                console.warn('Some files could not be deleted:', deleteResults.failedFiles);
                // Continue with the commit even if some deletions failed
                showSaveStatus('Warning: Some files could not be deleted. Continuing with commit...', 'warning');
            }
        }

        // Step 2: Upload new files to GitHub
        const filesToCommit = getFilesToCommit();
        const uploadResults = await uploadFilesToGitHub(filesToCommit);

        if (!uploadResults.success) {
            throw new Error(uploadResults.error || 'Failed to upload files to GitHub');
        }

        // Step 3: Update assetsName.js file
        const updateResults = await updateAssetsFileInGitHub();

        if (!updateResults.success) {
            throw new Error(updateResults.error || 'Failed to update assetsName.js in GitHub');
        }

        // Step 4: Mark as saved
        hasUnsavedChanges = false;
        updateSaveButtons();
        autoSaveBtn.textContent = '🚀 Commit to GitHub';

        // Step 5: Clear uploaded file objects and files to delete since they're now processed
        uploadedFileObjects.clear();
        filesToDelete.clear();

        // Step 6: Update original data to match current state
        originalData = {
            PhotoshopFiles: [...workingPhotoshopFiles.map(cleanItem)],
            videoFiles: [...workingAftereffects.map(cleanItem)],
            PPTFiles: [...workingPPTFiles.map(cleanItem)]
        };

        // Step 7: Remove isNewUpload flags since files are now saved
        workingPhotoshopFiles.forEach(item => delete item.isNewUpload);
        workingAftereffects.forEach(item => delete item.isNewUpload);
        workingPPTFiles.forEach(item => delete item.isNewUpload);

        // Step 8: Re-render to show updated state
        renderList();

        // Step 9: Show success message
        showSaveStatus(
            `✅ Successfully committed to GitHub! ${uploadResults.filesUploaded} files uploaded.`,
            'success'
        );

        showFeedback('🎉 Changes committed to GitHub successfully! Your live site will update shortly.', 'success');

    } catch (error) {
        console.error('GitHub commit error:', error);
        showSaveStatus('❌ Error: ' + error.message, 'error');
        autoSaveBtn.disabled = false;
        autoSaveBtn.textContent = '🚀 Commit to GitHub';
        showFeedback('Failed to commit to GitHub: ' + error.message, 'error');
    }
}

// Upload files to GitHub repository
// Upload files to GitHub repository
async function uploadFilesToGitHub(files) {
    if (files.length === 0) {
        return { success: true, filesUploaded: 0 };
    }

    try {
        const uploadPromises = files.map(async (fileInfo) => {
            // Convert file to base64
            const fileContent = await fileToBase64(fileInfo.file);

            // Check if file already exists to get SHA (needed for updates/overwrites)
            let sha = null;
            try {
                const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileInfo.path}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.token}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (getResponse.ok) {
                    const existingFile = await getResponse.json();
                    sha = existingFile.sha;
                    console.log(`ℹ️ File exists, using SHA: ${sha} for update`);
                }
            } catch (checkError) {
                // Ignore errors during check, proceed as new file
                console.warn(`Could not check for existing file ${fileInfo.path}:`, checkError);
            }

            // Prepare request body
            const body = {
                message: sha ? `Update ${fileInfo.filename}` : `Add ${fileInfo.filename}`,
                content: fileContent,
                branch: GITHUB_CONFIG.branch
            };

            if (sha) {
                body.sha = sha;
            }

            // Upload file to GitHub
            const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileInfo.path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to upload ${fileInfo.filename}: ${errorData.message}`);
            }

            console.log(`✅ Uploaded to GitHub: ${fileInfo.path}`);
            return { success: true, filename: fileInfo.filename };
        });

        const results = await Promise.all(uploadPromises);
        const failures = results.filter(r => !r.success);

        if (failures.length > 0) {
            return {
                success: false,
                error: `Failed to upload: ${failures.map(f => f.filename).join(', ')}`
            };
        }

        return {
            success: true,
            filesUploaded: files.length,
            uploadedFiles: files.map(f => f.filename)
        };

    } catch (error) {
        console.error('GitHub upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Update assetsName.js file in GitHub
async function updateAssetsFileInGitHub() {
    try {
        const exportText = generateExportText({
            PhotoshopFiles: workingPhotoshopFiles,
            Aftereffects: workingAftereffects,
            PPTFiles: workingPPTFiles
        });

        // Get current file SHA (required for updates)
        const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${githubPaths.assetsFile}`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
            }
        });

        let sha = null;
        if (getResponse.ok) {
            const currentFile = await getResponse.json();
            sha = currentFile.sha;
        }

        // Update file
        const updateResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${githubPaths.assetsFile}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: commitTitleInput.value + (commitDescriptionInput.value ? `\n\n${commitDescriptionInput.value}` : ''),
                content: btoa(unescape(encodeURIComponent(exportText))), // Convert to base64
                sha: sha,
                branch: GITHUB_CONFIG.branch
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`Failed to update assetsName.js: ${errorData.message}`);
        }

        console.log('✅ Updated assetsName.js in GitHub');
        return { success: true };

    } catch (error) {
        console.error('GitHub assets update error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Delete files from GitHub repository
async function deleteFilesFromGitHub(filePaths) {
    if (!filePaths || filePaths.size === 0) {
        return { success: true };
    }

    try {
        const deletedFiles = [];
        const failedFiles = [];

        for (const filePath of filePaths) {
            try {
                console.log(`🗑️ Deleting file from repository: ${filePath}`);

                // First, get the current file to get its SHA (required for deletion)
                const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.token}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (!getResponse.ok) {
                    if (getResponse.status === 404) {
                        console.log(`File not found in repository (already deleted?): ${filePath}`);
                        continue;
                    }
                    throw new Error(`Failed to get file info: ${getResponse.statusText}`);
                }

                const fileData = await getResponse.json();

                // Delete the file using its SHA
                const deleteResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `Delete ${filePath}`,
                        sha: fileData.sha,
                        branch: GITHUB_CONFIG.branch
                    })
                });

                if (!deleteResponse.ok) {
                    const errorData = await deleteResponse.json();
                    throw new Error(`Failed to delete file: ${errorData.message}`);
                }

                deletedFiles.push(filePath);
                console.log(`✅ Deleted file from repository: ${filePath}`);

            } catch (error) {
                console.error(`❌ Failed to delete file ${filePath}:`, error);
                failedFiles.push({ path: filePath, error: error.message });
            }
        }

        return {
            success: failedFiles.length === 0,
            deletedFiles,
            failedFiles
        };

    } catch (error) {
        console.error('GitHub file deletion error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove data URL prefix (data:image/jpeg;base64,)
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Helper function to clean items for storage
function cleanItem(item) {
    return {
        src: item.src,
        title: item.title
    };
}
