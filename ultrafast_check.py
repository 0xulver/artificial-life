#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    msgs = []

    page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text}"))

    try:
        page.goto("http://localhost:3000/simulation/neural-ca", timeout=8000)
    except Exception as e:
        print(f"Nav error: {e}")

    page.wait_for_timeout(2000)

    info = page.evaluate("""
        () => {
            const c = document.querySelector('canvas');
            if (!c) return {f:0};
            const gl = c.getContext('webgl2') || c.getContext('webgl');
            return {f:1, w:c.width, h:c.height, gl:!!gl};
        }
    """)

    webgl_issues = [m for m in msgs if 'framebuffer' in m.lower() or 'webgl' in m.lower() or 'error' in m.lower()]

    print("Canvas:", info)
    print("WebGL issues:", len(webgl_issues))

    if webgl_issues:
        print("Sample:", webgl_issues[0][:120])
    else:
        print("No WebGL issues detected!")

    browser.close()
