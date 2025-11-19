const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const cors = require('cors');
const sanitize = require('sanitize-filename');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create src directory if it doesn't exist
const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
}

// Function to resolve relative URLs
function resolveUrl(baseUrl, url) {
    try {
        return new URL(url, baseUrl).href;
    } catch (e) {
        return url;
    }
}

// Function to download an asset and return the local path
async function downloadAsset(assetUrl, baseUrl, type, pageUrl) {
    try {
        // Only download assets from the same domain as the main page
        const assetDomain = new URL(assetUrl).hostname;
        const pageDomain = new URL(pageUrl).hostname;
        
        if (assetDomain !== pageDomain) {
            console.log(`Skipping asset from different domain: ${assetUrl}`);
            return assetUrl; // Return original URL if from different domain
        }
        
        const response = await axios.get(assetUrl, {
            responseType: type === 'image' ? 'arraybuffer' : 'text',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WebpageCloner/1.0)',
                'Referer': baseUrl
            }
        });
        
        // Generate a filename based on the asset URL
        const urlPath = new URL(assetUrl).pathname;
        const filename = sanitize(path.basename(urlPath) || `${type}_${Date.now()}`);
        const filePath = path.join(srcDir, filename);
        
        // Save the asset
        if (type === 'image') {
            await fsPromises.writeFile(filePath, response.data);
        } else {
            await fsPromises.writeFile(filePath, response.data, 'utf8');
        }
        
        console.log(`Downloaded asset: ${filename}`);
        return `./src/${filename}`;
    } catch (error) {
        console.error(`Failed to download asset: ${assetUrl}`, error.message);
        return assetUrl; // Return original URL if download fails
    }
}

// Main scraping function
app.post('/api/clone', async (req, res) => {
    try {
        const { url, options = {} } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (options.ignoreRobots) {
            console.log(`Cloning webpage (ignoring robots.txt): ${url}`);
        } else {
            console.log(`Cloning webpage: ${url}`);
        }

        // Fetch the main page
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WebpageCloner/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            // By default, axios follows redirects, but we can configure this behavior
            maxRedirects: 5,
            // Allow scraping even if robots.txt disallows it (controlled by user option)
            // Note: This is for educational purposes only - always check website terms of service
        });
        
        const $ = cheerio.load(response.data);
        const baseUrl = new URL(url).origin;
        
        // Process CSS
        if (options.includeCss !== false) {
            const cssPromises = [];
            $('link[rel="stylesheet"]').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href) {
                    const fullUrl = resolveUrl(baseUrl, href);
                    cssPromises.push(
                        downloadAsset(fullUrl, baseUrl, 'css', url)
                            .then(localPath => {
                                $(elem).attr('href', localPath);
                            })
                    );
                }
            });
            
            await Promise.all(cssPromises);
        } else {
            $('link[rel="stylesheet"]').remove();
        }
        
        // Process images
        if (options.includeImages !== false) {
            const imgPromises = [];
            $('img').each((i, elem) => {
                const src = $(elem).attr('src');
                if (src) {
                    const fullUrl = resolveUrl(baseUrl, src);
                    imgPromises.push(
                        downloadAsset(fullUrl, baseUrl, 'image', url)
                            .then(localPath => {
                                $(elem).attr('src', localPath);
                            })
                    );
                }
            });
            
            await Promise.all(imgPromises);
        } else {
            $('img').remove();
        }
        
        // Process scripts
        if (options.includeScripts !== false) {
            const scriptPromises = [];
            $('script[src]').each((i, elem) => {
                const src = $(elem).attr('src');
                if (src) {
                    const fullUrl = resolveUrl(baseUrl, src);
                    scriptPromises.push(
                        downloadAsset(fullUrl, baseUrl, 'js', url)
                            .then(localPath => {
                                $(elem).attr('src', localPath);
                            })
                    );
                }
            });
            
            await Promise.all(scriptPromises);
        } else {
            $('script[src]').remove();
        }
        
        // Generate the cloned HTML
        const clonedHtml = $.html();
        
        // Save to file
        const timestamp = Date.now();
        const filename = sanitize(new URL(url).hostname + '_' + timestamp + '.html');
        const filePath = path.join(srcDir, filename);
        await fsPromises.writeFile(filePath, clonedHtml, 'utf8');
        
        console.log(`Webpage cloned successfully: ${filename}`);
        
        res.json({ 
            success: true, 
            filename: filename,
            filepath: `./src/${filename}`,
            message: 'Webpage cloned successfully'
        });
    } catch (error) {
        console.error('Error cloning webpage:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Serve the cloned file
app.get('/download/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(srcDir, filename);
        
        // Check if file exists and serve it
        await fsPromises.access(filepath);

        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Error sending file:', err.message);
                res.status(500).send('Error downloading file');
            }
        });
    } catch (error) {
        console.error('File not found:', error.message);
        res.status(404).send('File not found');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});