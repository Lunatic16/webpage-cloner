document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cloner-form');
    const urlInput = document.getElementById('url-input');
    const cloneBtn = document.getElementById('clone-btn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');
    const successDiv = document.getElementById('success');
    const downloadLink = document.getElementById('download-link');
    const previewFrame = document.getElementById('preview-frame');
    const ignoreRobotsCheckbox = document.getElementById('ignore-robots');
    const robotsWarning = document.getElementById('robots-warning');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        if (!url) {
            showError('Please enter a valid URL');
            return;
        }
        
        // Get selected options
        const includeCss = document.getElementById('include-css').checked;
        const includeImages = document.getElementById('include-images').checked;
        const includeScripts = document.getElementById('include-scripts').checked;
        const ignoreRobots = document.getElementById('ignore-robots').checked;
        
        // Show loading, hide other messages
        showLoading();
        hideError();
        hideSuccess();
        
        try {
            const response = await fetch('/api/clone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    options: {
                        includeCss: includeCss,
                        includeImages: includeImages,
                        includeScripts: includeScripts,
                        ignoreRobots: ignoreRobots
                    }
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccess(data.filename);
                // Update the download link
                downloadLink.href = `/download/${encodeURIComponent(data.filename)}`;
                
                // Load the cloned page in the preview iframe
                previewFrame.src = `/src/${encodeURIComponent(data.filename)}`;
            } else {
                showError(data.error || 'An error occurred while cloning the webpage');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred while processing your request: ' + error.message);
        }
    });
    
    function showLoading() {
        loadingDiv.classList.remove('hidden');
        cloneBtn.disabled = true;
        cloneBtn.textContent = 'Cloning...';
    }
    
    function hideLoading() {
        loadingDiv.classList.add('hidden');
        cloneBtn.disabled = false;
        cloneBtn.textContent = 'Clone Webpage';
    }
    
    function showError(message) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        hideLoading();
    }
    
    function hideError() {
        errorDiv.classList.add('hidden');
    }
    
    function showSuccess(filename) {
        successDiv.classList.remove('hidden');
        hideLoading();
    }
    
    function hideSuccess() {
        successDiv.classList.add('hidden');
    }
    
    // Validate URL format as user types
    // Show/hide warning based on ignore robots checkbox
    ignoreRobotsCheckbox.addEventListener('change', function() {
        if (ignoreRobotsCheckbox.checked) {
            robotsWarning.classList.remove('hidden');
        } else {
            robotsWarning.classList.add('hidden');
        }
    });

    urlInput.addEventListener('input', function() {
        const value = urlInput.value.trim();
        if (value && !isValidUrl(value)) {
            urlInput.setCustomValidity('Please enter a valid URL (e.g., https://example.com)');
        } else {
            urlInput.setCustomValidity('');
        }
    });
    
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
});