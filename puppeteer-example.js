const puppeteer = require('puppeteer');

async function example() {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    devtools: false
  });

  try {
    // Create new page
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate to a website
    await page.goto('https://example.com', { 
      waitUntil: 'networkidle2' 
    });
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'example-screenshot.png',
      fullPage: true 
    });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Example: Extract text content
    const content = await page.$eval('h1', el => el.textContent);
    console.log('Main heading:', content);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Always close browser
    await browser.close();
  }
}

// Run the example
example().catch(console.error);