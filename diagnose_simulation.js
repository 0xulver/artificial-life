const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    console.log('Navigating to simulation...');
    await page.goto('http://localhost:3000/simulation/neural-ca', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    console.log('Waiting 3 seconds for rendering...');
    await page.waitForTimeout(3000);

    // Get canvas info and sample pixels
    const result = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };

      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const rect = canvas.getBoundingClientRect();

      // Sample center pixels
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(rect.width / 2, rect.height / 2, 5, 5);

      const pixels = [];
      for (let i = 0; i < Math.min(25, imageData.data.length / 4); i++) {
        pixels.push({
          r: imageData.data[i * 4],
          g: imageData.data[i * 4 + 1],
          b: imageData.data[i * 4 + 2],
          a: imageData.data[i * 4 + 3]
        });
      }

      return {
        found: true,
        width: rect.width,
        height: rect.height,
        hasWebGL2: !!canvas.getContext('webgl2'),
        hasWebGL: !!gl,
        pixels,
        sampleCount: pixels.length
      };
    });

    console.log('\n=== CANVAS INFO ===');
    console.log(JSON.stringify(result, null, 2));

    // Filter WebGL errors
    const webglErrors = consoleMessages.filter(m =>
      m.text.toLowerCase().includes('webgl') ||
      m.text.toLowerCase().includes('framebuffer') ||
      m.text.toLowerCase().includes('error') ||
      m.text.toLowerCase().includes('warning')
    );

    console.log('\n=== WEBGL CONSOLE MESSAGES ===');
    if (webglErrors.length === 0) {
      console.log('No WebGL warnings or errors');
    } else {
      webglErrors.forEach(m => console.log(`[${m.type}] ${m.text}`));
    }

    // Analyze pixels
    console.log('\n=== PIXEL ANALYSIS ===');
    if (result.pixels) {
      const avgR = result.pixels.reduce((a, p) => a + p.r, 0) / result.pixels.length;
      const avgG = result.pixels.reduce((a, p) => a + p.g, 0) / result.pixels.length;
      const avgB = result.pixels.reduce((a, p) => a + p.b, 0) / result.pixels.length;
      console.log(`Average RGB: (${avgR.toFixed(1)}, ${avgG.toFixed(1)}, ${avgB.toFixed(1)})`);

      const variance = result.pixels.reduce((sum, p) => {
        return sum + Math.pow(p.r - avgR, 2) + Math.pow(p.g - avgG, 2) + Math.pow(p.b - avgB, 2);
      }, 0) / (result.pixels.length * 3);

      console.log(`Color variance: ${variance.toFixed(1)} (high = noisy/static)`);

      if (variance > 1000) {
        console.log('\n⚠️  HIGH VARIANCE DETECTED - Likely static noise pattern');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
