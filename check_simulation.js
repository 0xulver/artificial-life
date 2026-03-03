const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages = [];
  const errors = [];

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    console.log('Navigating to http://localhost:3000/simulation/neural-ca...');
    await page.goto('http://localhost:3000/simulation/neural-ca', { waitUntil: 'networkidle' });

    console.log('Waiting 3 seconds for simulation to initialize...');
    await page.waitForTimeout(3000);

    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: '/home/ulver/code/ai/artificial-life/simulation_screenshot.png', fullPage: true });

    // Check if canvas is visible and has content
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return { found: false };
      }
      const rect = canvas.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return {
        found: true,
        width: rect.width,
        height: rect.height,
        isVisible: isVisible,
        hasWebGL2: !!canvas.getContext('webgl2'),
        hasWebGL: !!context
      };
    });

    // Filter for WebGL-related errors
    const webglErrors = consoleMessages.filter(msg =>
      msg.text.toLowerCase().includes('webgl') ||
      msg.text.toLowerCase().includes('gl_') ||
      msg.text.toLowerCase().includes('framebuffer') ||
      msg.text.toLowerCase().includes('texture') ||
      msg.type === 'error'
    );

    const allErrors = [...errors, ...webglErrors.map(m => m.text)];

    console.log('\n=== RESULTS ===');
    console.log('Canvas Info:', JSON.stringify(canvasInfo, null, 2));
    console.log('WebGL Errors:', allErrors.length > 0 ? allErrors : 'None');
    console.log('All Console Errors:', errors.length > 0 ? errors : 'None');

    if (allErrors.length > 0) {
      console.log('\nWebGL-related console output:');
      webglErrors.forEach(m => console.log(`  [${m.type}] ${m.text}`));
    }

    console.log('\nScreenshot saved to: /home/ulver/code/ai/artificial-life/simulation_screenshot.png');

    // Overall status
    if (canvasInfo.found && canvasInfo.isVisible && allErrors.length === 0) {
      console.log('\nStatus: Simulation appears to be rendering correctly');
    } else if (canvasInfo.found && canvasInfo.isVisible) {
      console.log('\nStatus: Simulation is visible but has errors');
    } else if (canvasInfo.found && !canvasInfo.isVisible) {
      console.log('\nStatus: Canvas found but not visible (blank/broken)');
    } else {
      console.log('\nStatus: Canvas not found on page');
    }

  } catch (error) {
    console.error('Error during page navigation:', error.message);
  }

  await browser.close();
})();
