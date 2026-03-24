# Direct Connect Integration — Companion App Guide

This document describes how a companion app (like [friendlies](https://github.com/0xburn/slippi-friends)) can trigger a direct connect match via the Slippi Launcher's `slippi://` protocol handler.

## Current State of This PR

This PR adds a **`slippi://direct?code=<CONNECT_CODE>`** URI handler to the Slippi Launcher. When invoked:

1. The launcher focuses/creates its window
2. Installs netplay Dolphin if needed
3. Enables the "Boot to CSS" gecko code
4. Writes the connect code to `<userData>/temp/slippi-direct-code.json`
5. Launches Netplay Dolphin with the game ISO

**What works today:** Dolphin boots straight to the character select screen (CSS).

**What doesn't work yet:** Dolphin cannot automatically navigate to Direct mode and enter the connect code. That requires Dolphin-side changes (C++ / ASM). The connect code is written to a temp file as a contract for future Dolphin builds.

---

## Option 1: Use the `slippi://` Protocol (Recommended — Once Dolphin Support Lands)

From any Electron/Node app, trigger a direct connect with a single call:

```typescript
import { shell } from "electron";

function launchDirectConnect(connectCode: string) {
  // URL-encode the connect code (# becomes %23)
  const encoded = encodeURIComponent(connectCode);
  shell.openExternal(`slippi://direct?code=${encoded}`);
}

// Example: connect to BURN#123
launchDirectConnect("BURN#123");
```

This works on all platforms where Slippi Launcher is installed and registered as the `slippi://` protocol handler. The OS routes the URL to the launcher, which handles everything.

For a web app, this is just a link:

```html
<a href="slippi://direct?code=BURN%23123">Play BURN#123</a>
```

### Advantages
- Zero dependencies on the companion app side
- Works across Electron, web, or any app that can open URLs
- The Slippi Launcher handles all Dolphin lifecycle (install, update, launch, config)

### What's Missing (Dolphin-Side)
- A CLI flag like `--connect-code BURN#123` that Dolphin reads on startup
- ASM/gecko code changes so the game automatically enters Direct mode with the code
- Edge case handling: Dolphin already open, game in progress, user in queue

---

## Option 2: Libmelee Automation (Works Today, No Launcher Changes Needed)

[libmelee](https://github.com/vladfi1/libmelee) can automate Dolphin's menus using virtual controller inputs. This is how [slippi-ai](https://github.com/vladfi1/slippi-ai/blob/main/slippi_ai/dolphin.py#L84) handles direct connect — its `Dolphin` class accepts a `connect_code` parameter and uses `MenuHelper.menu_helper_simple()` to navigate menus.

### How It Works

1. Launch Dolphin with the game ISO
2. Connect to Dolphin via Slippi's local UDP interface
3. Use a virtual controller to navigate: Main Menu → Online → Direct → Enter Code → Start
4. libmelee's `MenuHelper` handles all the frame-by-frame button inputs

### Integration from an Electron App (e.g., friendlies)

Bundle a small Python script and invoke it from Node:

```python
# direct_connect.py
import sys
import melee

def connect_direct(dolphin_path: str, iso_path: str, connect_code: str):
    console = melee.Console(path=dolphin_path, save_replays=True)
    controller = melee.Controller(console=console, port=1, type=melee.ControllerType.STANDARD)
    menu = melee.MenuHelper()

    console.run(iso_path=iso_path)
    console.connect()
    controller.connect()

    while True:
        gamestate = console.step()
        if gamestate is None:
            break

        if gamestate.menu_state in (melee.Menu.IN_GAME, melee.Menu.SUDDEN_DEATH):
            break

        menu.menu_helper_simple(
            gamestate, controller,
            connect_code=connect_code,
            autostart=True,
            swag=False,
        )

if __name__ == "__main__":
    connect_direct(sys.argv[1], sys.argv[2], sys.argv[3])
```

From Node/Electron:

```typescript
import { execFile } from "child_process";

function launchWithLibmelee(dolphinPath: string, isoPath: string, connectCode: string) {
  execFile("python3", [
    "direct_connect.py",
    dolphinPath,
    isoPath,
    connectCode,
  ], (err, stdout, stderr) => {
    if (err) console.error("libmelee error:", err);
  });
}
```

### Advantages
- Works right now, no Dolphin or Launcher changes needed
- Full automation: navigates menus, enters code, starts match
- Proven approach (used by slippi-ai for AI training)

### Disadvantages
- Requires Python 3 and libmelee installed on the user's machine
- Needs to know the Dolphin executable path and ISO path
- Uses a virtual controller (port 1), which conflicts with the user's real controller
- Fizzi has explicitly said this isn't the approach he'd want in the Launcher itself
- More brittle — depends on menu state machine matching the current game version

### Key libmelee References
- [MenuHelper docs](https://libmelee.readthedocs.io/en/latest/menuhelper.html) — `enter_direct_code()`, `choose_direct_online()`
- [vladfi1/libmelee](https://github.com/vladfi1/libmelee) — actively maintained fork
- [slippi-ai/dolphin.py](https://github.com/vladfi1/slippi-ai/blob/main/slippi_ai/dolphin.py) — complete working example with `connect_code` parameter

---

## Option 3: Hybrid — Poll the Temp File + Clipboard (Interim UX)

Until Dolphin supports native direct connect, a companion app can provide a smoother UX:

```typescript
import { clipboard, shell } from "electron";
import { Notification } from "electron";

async function inviteToPlay(connectCode: string) {
  // Copy the connect code to clipboard
  clipboard.writeText(connectCode);

  // Try to trigger the launcher URI (boots Dolphin to CSS)
  shell.openExternal(`slippi://direct?code=${encodeURIComponent(connectCode)}`);

  // Notify the user what to do next
  new Notification({
    title: "Direct Connect",
    body: `${connectCode} copied to clipboard. In Melee: go to Direct → paste the code.`,
  }).show();
}
```

This gives users a one-click flow that:
1. Copies the connect code to their clipboard
2. Launches Dolphin to the CSS via the launcher
3. Tells them to navigate to Direct and paste

It's not full automation, but it cuts the manual steps from ~8 to ~3.

---

## File Contract: `slippi-direct-code.json`

When a direct connect is triggered via URI, the launcher writes:

```json
{
  "connectCode": "BURN#123",
  "timestamp": 1711234567890
}
```

to `<userData>/temp/slippi-direct-code.json` (where `<userData>` is the Electron `app.getPath("userData")` — typically `~/Library/Application Support/Slippi Launcher` on macOS).

A companion app or future Dolphin build can poll this file to know that a direct connect was requested. The `timestamp` field allows consumers to ignore stale requests.

---

## What Needs to Happen for Full Automation

1. **Dolphin (C++):** Add a mechanism to receive and act on a connect code — either:
   - CLI flag: `--connect-code BURN#123`
   - Read `slippi-direct-code.json` on startup
   - IPC message from the launcher

2. **Melee ASM:** The game needs to support being put directly into "Direct" matchmaking mode from Dolphin's side, without manual menu navigation. This could be:
   - A new gecko code that reads a code from a known memory address
   - An extension to the existing online mode entry point

3. **Edge Cases:** Handle Dolphin already running, game already in progress, user already in ranked queue, etc.

Per Fizzi's Discord comments, he'd review PRs for all of this. The ASM/Dolphin work likely needs collaboration with the Slippi dev community.
