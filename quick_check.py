#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import sys

def check_simulation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_messages = []
        errors = []

        page.on("console", lambda msg: console_messages.append({"type": msg.type, "text": msg.text}))
        page.on("pageerror", lambda error: errors.append(error.message))

        print("Navigating to http://localhost:3000/simulation/neural-ca...")
        page.goto("http://localhost:3000/simulation/neural-ca", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        canvas_info = page.evaluate("""() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return { found: false };
            return {
                found: true,
                width: canvas.width,
                height: canvas.height,
                hasWebGL2: !!canvas.getContext('webgl2'),
                hasWebGL: !!canvas.getContext('webgl')
            };
        }""")

        webgl_errors = [msg["text"] for msg in console_messages
                       if any(x in msg["text"].lower() for x in ["webgl", "gl_", "framebuffer", "texture", "error"])]

        print(f"\n=== RESULTS ===")
        print(f"Canvas: {canvas_info}")
        print(f"WebGL Errors: {len(webgl_errors)}")

        if webgl_errors[:3]:
            print("First errors:")
            for e in webgl_errors[:3]:
                print(f"  - {e[:100]}...")

        browser.close()
        return len(webgl_errors), canvas_info

if __name__ == "__main__":
    err_count, info = check_simulation()
    print(f"\nStatus: {'FIXED' if err_count == 0 else 'STILL BROKEN'}")
