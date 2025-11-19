# Webpage Cloner

This project is a web application that allows users to scrape and clone webpages. It provides a user-friendly interface for entering URLs and downloading complete HTML copies of webpages with their assets.

## Features

- Clean, responsive user interface
- Options to include/exclude CSS, images, and scripts
- Real-time preview of cloned content
- Download functionality for cloned webpages
- Asset handling (downloads and embeds CSS, images)
- Cross-origin security measures
- Option to bypass robots.txt with appropriate warnings

## Architecture

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Dependencies**: axios, cheerio, cors, sanitize-filename

## Files

- `public/index.html` - Main HTML interface
- `public/styles.css` - Styling for the UI
- `public/script.js` - Frontend JavaScript functionality
- `server.js` - Backend server with scraping functionality
- `package.json` - Project dependencies and configuration
- `src/` - Directory for storing cloned pages and assets

## Setup and Usage

1. Install dependencies: `npm install`
2. Start the server: `node server.js`
3. Access the UI at `http://localhost:3000`
4. Enter a URL and click "Clone Webpage"
5. Download or preview the cloned webpage

## Security Considerations

- Only processes assets from the same domain as the main page
- Sanitizes filenames to prevent directory traversal attacks
- Uses a sandboxed iframe for content preview