#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    messages = []
    page.on("console", lambda msg: messages.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: messages.append(f"[PAGE ERROR] {err}"))

    try:
        page.goto("http://localhost:3000/simulation/neural-ca", timeout=10000)
    except:
        pass

    page.wait_for_timeout(2000)

    result = page.evaluate("""() => {
        const c = document.querySelector('canvas');
        return c ? {found:true, w:c.width, h:c.height} : {found:false};
    }""")

    webgl_msgs = [m for m in messages if 'webgl' in m.lower() or 'framebuffer' in m.lower() or 'error' in m.lower()]

    print("Canvas:", json.dumps(result))
    print("WebGL issues:", len(webgl_msgs))
    for m in webgl_msgs[:5]:
        print(m[:150])

    browser.close()
