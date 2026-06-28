import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Enable geolocation simulation
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:5173/', ['geolocation']);
  await page.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

  // Listen for console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    console.log('Navigating to http://localhost:5173/?mock=true...');
    await page.goto('http://localhost:5173/?mock=true', { waitUntil: 'networkidle2' });
    
    // Wait for geolocation to fire
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Capture screenshot
    const screenshotPath = '/Users/dietrichschmidt/.gemini/antigravity/brain/fc8184c9-0327-441d-be95-4feb3a97e1c6/hud_screenshot.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

  } catch (err) {
    console.error('Error during browser test:', err);
  } finally {
    await browser.close();
  }
})();
