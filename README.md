# @osmn-byhn/changelog-github-updater

This library is an OS-agnostic auto-updater for your Node.js or Electron-based applications (Windows, macOS, Linux) that allows you to easily perform automatic updates via **Github Releases**.

Powered by `@osmn-byhn/changelog-github-core`, it checks for the latest release in your GitHub repository, automatically detects the correct asset depending on the user's operating system, downloads it, and initiates the installation process. Throughout this flow, your application's user data (such as `userData`, cache) is kept completely safe.

## Features

- **Cross-Platform Support:** Automatically detects `win32`, `darwin` (macOS), and `linux` operating systems.
- **Smart Extension Matching:** Finds and downloads the appropriate installation file depending on the OS (`.exe`, `.dmg`, `.zip`, `.deb`, `.AppImage`).
- **Preserves User Data:** Downloaded files are moved to a secure temporary folder and triggered for installation from there, ensuring your application settings and user data remain untouched.
- **Flexible Configuration:** Pass your own temporary directory (`tempPath`), fallback to current package version (`currentVersion`), or prevent auto-install (`autoInstall: false`) if you prefer to customize the flow.
- **Middleware Support:** Allows defining asynchronous functions (middleware) to execute arbitrary code before the downloaded update is applied (e.g., displaying a notification or backing up databases).

---

## Installation

You can include the project via npm:

```bash
npm install @osmn-byhn/changelog-github-updater
```

---

## Usage Example

The library supports both TypeScript and CommonJS environments seamlessly. The core functionality is provided through the `updateIfNeeded` method.

### 1. TypeScript / ES Modules Usage
If you are using TypeScript or a modern toolchain (like Vite):

```typescript
import { updateIfNeeded } from "@osmn-byhn/changelog-github-updater";
import { app } from "electron"; // Electron example

async function checkUpdates() {
    try {
        const result = await updateIfNeeded({
            owner: "YourUsername", // GitHub Username/Organization
            repo: "YourRepo",      // GitHub Repository Name
            currentVersion: app.getVersion(), // (Optional) The current version of your application
            autoInstall: true                 // Automatically install the update when downloaded
        });

        if (result.updated) {
            console.log(`Update downloaded and installation started! Version: ${result.from} -> ${result.to}`);
        } else {
            console.log("Your application is up to date.");
        }
    } catch (error) {
        console.error("An error occurred while checking for updates:", error);
    }
}

checkUpdates();
```

### 2. Standard Native JavaScript (CommonJS/Node.js) Usage
If you are developing a standard Node.js script or setting up `main.js` inside an older Electron boilerplate without Webpack/Vite:

```javascript
const { updateIfNeeded } = require("@osmn-byhn/changelog-github-updater");
const { app } = require("electron");

async function checkUpdates() {
    try {
        const result = await updateIfNeeded({
            owner: "YourUsername",
            repo: "YourRepo",
            currentVersion: app.getVersion(), 
            autoInstall: true
        });

        if (result.updated) {
            console.log(`Update applied! Version: ${result.from} -> ${result.to}`);
        } else {
            console.log("Up to date.");
        }
    } catch (error) {
        console.error("Update error:", error);
    }
}

checkUpdates();
```

### Parameters (`UpdaterOptions`)

The options you can pass directly to `updateIfNeeded`:

| Parameter        | Type      | Description |
|-----------------|-----------|-------------|
| **`owner`**     | `string`  | _Required._ The owner of the GitHub repository. (e.g., `"osmn-byhn"`) |
| **`repo`**      | `string`  | _Required._ The name of the GitHub repository. (e.g., `"my-electron-app"`) |
| **`currentVersion`** | `string` | _Optional._ If you want to explicitly provide the current version. If omitted, the library checks its stored current version. |
| **`tempPath`**  | `string` | _Optional._ By default `os.tmpdir()` is used. You can override where the downloaded file is temporarily placed. |
| **`autoInstall`** | `boolean` | _Optional._ Set to `false` if you want to download but not execute the installer. Defaults to `true`. |

### Using Middleware (Optional)

If you need to intercept the installation process when an update is found but before files are downloaded/installed:

```typescript
const myMiddleware = async (oldVersion: string, newVersion: string) => {
    console.log(`Updating version. Old: ${oldVersion}, New: ${newVersion}`);
    // e.g. Send a notification, take a database backup...
};

await updateIfNeeded({ owner: "osmn-byhn", repo: "my-app" }, myMiddleware);
```

---

## Under the Hood (Platform Execution Behavior)

Once the file is safely downloaded, the library invokes these processes:

- **Windows (`.exe`):** Executed in the background (`detached: true`) and exits the main Node process.
- **macOS (`.dmg`, `.zip`):** Executed via the OS's native `open` command to mount/run the image or archive.
- **Linux (`.deb`, etc.):** `pkexec dpkg -i` is fired for deb packages (which might prompt a GUI for the user's sudo password). `.AppImage` files are marked as executable and are spawned directly.

> **Important Note:** In order for the library to work properly, you must publish your release binaries (`.exe`, `.deb`, etc.) as **Assets** inside your [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) page.

## Contributing

If you want to build the project locally in your own environment:

```bash
# Install dependencies
npm install

# Compile TypeScript files
npm run build
```

---
**License:** ISC
