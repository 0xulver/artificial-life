#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import sys

def check_simulation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_messages = []
        errors = []

        # Capture console messages
        page.on("console", lambda msg: console_messages.append({
            "type": msg.type,
            "text": msg.text
        }))

        # Capture page errors
        page.on("pageerror", lambda error: errors.append(error.message))

        try:
            print("Navigating to http://localhost:3000/simulation/neural-ca...")
            page.goto("http://localhost:3000/simulation/neural-ca", wait_until="networkidle")

            print("Waiting 3 seconds for simulation to initialize...")
            page.wait_for_timeout(3000)

            # Take screenshot
            print("Taking screenshot...")
            try:
                canvas = page.query_selector("canvas")
                if canvas:
                    canvas.screenshot(path="/home/ulver/code/ai/artificial-life/simulation_screenshot.png")
                else:
                    page.screenshot(path="/home/ulver/code/ai/artificial-life/simulation_screenshot.png")
            except Exception as e:
                print(f"Screenshot failed: {e}")
                # Try one more time with viewport only
                page.screenshot(path="/home/ulver/code/ai/artificial-life/simulation_screenshot.png", full_page=False)

            # Check if canvas is visible and has content
            canvas_info = page.evaluate("""() => {
                const canvas = document.querySelector('canvas');
                if (!canvas) {
                    return { found: false };
                }
                const rect = canvas.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                const hasWebGL2 = !!canvas.getContext('webgl2');
                const hasWebGL = !!canvas.getContext('webgl');
                return {
                    found: true,
                    width: rect.width,
                    height: rect.height,
                    isVisible: isVisible,
                    hasWebGL2: hasWebGL2,
                    hasWebGL: hasWebGL
                };
            }""")

            # Filter for WebGL-related errors
            webgl_errors = [
                msg["text"] for msg in console_messages
                if "webgl" in msg["text"].lower() or
                   "gl_" in msg["text"].lower() or
                   "framebuffer" in msg["text"].lower() or
                   "texture" in msg["text"].lower() or
                   msg["type"] == "error"
            ]

            all_errors = errors + webgl_errors

            print("\n=== RESULTS ===")
            print(f"Canvas Info: {canvas_info}")
            print(f"WebGL Errors: {all_errors if all_errors else 'None'}")
            print(f"Page Errors: {errors if errors else 'None'}")

            if webgl_errors:
                print("\nWebGL-related console output:")
                for msg in console_messages:
                    if "webgl" in msg["text"].lower() or "gl_" in msg["text"].lower() or "framebuffer" in msg["text"].lower() or "texture" in msg["text"].lower() or msg["type"] == "error":
                        print(f"  [{msg['type']}] {msg['text']}")

            print(f"\nScreenshot saved to: /home/ulver/code/ai/artificial-life/simulation_screenshot.png")

            # Overall status
            if canvas_info["found"] and canvas_info["isVisible"] and not all_errors:
                print("\nStatus: Simulation appears to be rendering correctly")
            elif canvas_info["found"] and canvas_info["isVisible"]:
                print("\nStatus: Simulation is visible but has errors")
            elif canvas_info["found"] and not canvas_info["isVisible"]:
                print("\nStatus: Canvas found but not visible (blank/broken)")
            else:
                print("\nStatus: Canvas not found on page")

            return all_errors, canvas_info

        except Exception as e:
            print(f"Error during page navigation: {e}")
            return [], {"found": False}
        finally:
            browser.close()

if __name__ == "__main__":
    errors, canvas_info = check_simulation()
    sys.exit(0 if (canvas_info.get("found") and canvas_info.get("isVisible") and not errors) else 1)
