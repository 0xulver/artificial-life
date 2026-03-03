#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def diagnose():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_messages = []
        page.on("console", lambda msg: console_messages.append({"type": msg.type, "text": msg.text}))
        page.on("pageerror", lambda err: console_messages.append({"type": "error", "text": str(err)}))

        try:
            print("Navigating to simulation...")
            page.goto("http://localhost:3000/simulation/neural-ca", wait_until="domcontentloaded", timeout=10000)

            print("Waiting 3 seconds for rendering...")
            page.wait_for_timeout(3000)

            # Get canvas info and sample pixels
            result = page.evaluate("""() => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return {error: 'No canvas found'};

                const rect = canvas.getBoundingClientRect();

                // Sample center pixels using 2D context (what's actually displayed)
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(rect.width // 2, rect.height // 2, 5, 5);

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
                    hasWebGL: !!canvas.getContext('webgl'),
                    pixels,
                    sampleCount: pixels.length
                };
            }""")

            print("\n=== CANVAS INFO ===")
            import json
            print(json.dumps(result, indent=2))

            # Filter WebGL errors
            webgl_messages = [m for m in console_messages
                            if any(x in m["text"].lower() for x in ["webgl", "framebuffer", "error", "warning", "gl_"])]

            print("\n=== WEBGL CONSOLE MESSAGES ===")
            if not webgl_messages:
                print("No WebGL warnings or errors")
            else:
                for m in webgl_messages[:10]:  # First 10
                    print(f"[{m['type']}] {m['text'][:200]}")

            # Analyze pixels
            print("\n=== PIXEL ANALYSIS ===")
            if result.get("pixels"):
                pixels = result["pixels"]
                avg_r = sum(p["r"] for p in pixels) / len(pixels)
                avg_g = sum(p["g"] for p in pixels) / len(pixels)
                avg_b = sum(p["b"] for p in pixels) / len(pixels)

                print(f"Average RGB: ({avg_r:.1f}, {avg_g:.1f}, {avg_b:.1f})")

                variance = sum(
                    (p["r"] - avg_r)**2 + (p["g"] - avg_g)**2 + (p["b"] - avg_b)**2
                    for p in pixels
                ) / (len(pixels) * 3)

                print(f"Color variance: {variance:.1f} (high = noisy/static)")

                # Check for specific color patterns
                extreme_pixels = [p for p in pixels if p["r"] > 200 or p["g"] > 200 or p["b"] > 200]
                print(f"Extreme bright pixels: {len(extreme_pixels)}/{len(pixels)}")

                if variance > 1000:
                    print("\n⚠️  HIGH VARIANCE DETECTED - Likely static noise pattern")
                if avg_g > 100 and avg_b > 100:
                    print("⚠️  High green/blue values detected - possible color channel issues")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

        browser.close()

if __name__ == "__main__":
    diagnose()
