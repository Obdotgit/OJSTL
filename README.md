# OJSTL — Obdotgit’s JavaScript Tool Library v1.0.2

[![License: CC0-1.0](https://img.shields.io/badge/License-CC0%201.0-lightgrey.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Author: Obdotgit](https://img.shields.io/badge/Author-Obdotgit-blue.svg)](https://github.com/Obdotgit)
[![Version: 1.0.2](https://img.shields.io/badge/Version-1.0.2-red.svg)](https://github.com/Obdotgit/OJSTL)

OJSTL is a lightweight, dependency-free JavaScript utility library that provides a collection of tools for user interface modals, precise delta-timing, and asynchronous waits.  
It’s written in pure vanilla JS and can be used in both **browser** and **Node.js (browser-emulated)** environments.

---

## ✨ Features

- **No dependencies** — just drop it in and use.
- **Accessible modal dialogs** with ARIA support, focus trapping, and keyboard navigation.
- **Promise-based APIs** for modal handling and asynchronous waits.
- **Delta timing utilities** for animation or simulation loops.
- **Compact and readable** — designed to be easily extended.

---

## 📦 Installation

### Option 1 — Direct include
```html
<script src="OJSTL-v1-0-2.js"></script>
````

### Option 2 — Local import (ESM)

```js
import './OJSTL-v1-0-2.js';
```

After loading, the following globals become available:

```js
modal   // Modal dialog API
delta   // Delta timing utilities
wait    // Async wait utilities
ir      // Math constants (φ, π, e)
```

---

## 🧩 Modules Overview

### 🪟 `modal` — Accessible Modal Dialogs

Create, control, and handle custom modals with keyboard accessibility, focus management, and animations.

#### Example

```js
// Show a modal
const myModal = modal.show('<p>Hello, world!</p>', {
  title: 'My Modal',
  closeButtonText: 'Dismiss',
  onClose: (result) => console.log('Modal closed', result)
});

// Hide manually
myModal.hide();

// Promise-style handling (if resolveOnClose = true)
myModal.promise?.then(result => console.log('Modal result:', result));
```

#### API

| Method                           | Description                                                                                                          |         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| `modal.show(content, options)`   | Displays a new modal with given HTML content or DOM node. Returns a modal instance `{ hide(), promise?, update() }`. |         |
| `modal.closeAll()`               | Closes all open modals immediately.                                                                                  |         |
| `modal.getOpenCount()`           | Returns the number of open modals.                                                                                   |         |
| `modal.getAll()`                 | Returns an array of all open modal instances.                                                                        |         |
| `modal.prompt(message, options)` | Opens a modal with an input field. Returns a `Promise<string                                                         | null>`. |

##### `modal.prompt()` Example

```js
const name = await modal.prompt('Enter your name:', {
  title: 'Who are you?',
  inputPlaceholder: 'John Doe',
  theme: 'dark'
});

console.log('You entered:', name);
```

##### Modal Options

| Option                  | Type                | Default                    | Description                           |
| ----------------------- | ------------------- | -------------------------- | ------------------------------------- |
| `title`                 | `string`            | `"Modal Title"`            | Title text for the modal              |
| `closeButtonText`       | `string`            | `"Close"`                  | Text for the footer close button      |
| `onClose(result)`       | `function`          | `null`                     | Callback fired when modal closes      |
| `onOpen(instance)`      | `function`          | `null`                     | Callback fired when modal opens       |
| `animation`             | `boolean`           | `true`                     | Enables fade/slide animation          |
| `animationDuration`     | `number`            | `240`                      | Animation time (ms)                   |
| `width`, `height`       | `string`            | `"480px"`, `"auto"`        | Modal dimensions                      |
| `maxWidth`, `maxHeight` | `string`            | CSS expressions for limits |                                       |
| `className`             | `string`            | `""`                       | Extra CSS class for modal container   |
| `closeOnEsc`            | `boolean`           | `true`                     | Allow closing via `Esc` key           |
| `closeOnOverlayClick`   | `boolean`           | `true`                     | Close modal on overlay click          |
| `showCloseButton`       | `boolean`           | `true`                     | Display close icon/button             |
| `zIndex`                | `number`            | `1000`                     | Base z-index                          |
| `autoFocusSelector`     | `string`            | `null`                     | CSS selector for initial focus        |
| `resolveOnClose`        | `boolean`           | `false`                    | Return Promise that resolves on close |
| `trapFocus`             | `boolean`           | `true`                     | Keep focus inside modal               |
| `restoreScroll`         | `boolean`           | `true`                     | Restore scroll after close            |
| `theme`                 | `"light" \| "dark"` | `"light"`                  | Switch between light/dark styles      |

---

### ⏱️ `delta` — Delta Timing Utilities

Provides tools for frame-based or continuous time updates.

#### Example

```js
delta.tick(
  (dt) => console.log('update', dt),  // update function
  (dt) => console.log('render', dt)   // render function
);
```

#### API

| Method                       | Description                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `delta.tick(update, render)` | Runs a timing loop, calling both functions every frame (using `setInterval`). Returns an interval ID. |
| `delta.toString(dt)`         | Converts a millisecond delta to a human-readable string (e.g., `"1h 3m 22s 120ms"`).                  |

---

### ⏳ `wait` — Asynchronous Wait Helpers

Promise-based delay utilities for use in async functions.

#### Example

```js
await wait.s(2);  // wait for 2 seconds
await wait.frames(3); // wait 3 animation frames
console.log('Done!');
```

#### API

| Method                | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `wait.ms(ms)`         | Waits for `ms` milliseconds.                          |
| `wait.s(seconds)`     | Waits for seconds.                                    |
| `wait.m(minutes)`     | Waits for minutes.                                    |
| `wait.h(hours)`       | Waits for hours.                                      |
| `wait.frames(frames)` | Waits for a number of `requestAnimationFrame` cycles. |

---

### 🧮 `ir` — Mathematical Constants

Provides a few commonly used mathematical constants.

| Constant | Value          | Description      |
| -------- | -------------- | ---------------- |
| `ir.phi` | ≈ 1.6180339887 | Golden ratio (φ) |
| `ir.pi`  | ≈ 3.1415926535 | Pi constant      |
| `ir.e`   | ≈ 2.7182818284 | Euler’s number   |

#### Example

```js
console.log(ir.phi * ir.pi);  // ≈ 5.08
```

---

## 🧠 Usage Tips

* Use `modal.prompt()` for quick user input dialogs.
* Combine `delta.tick()` with `wait.frames()` for smooth game or animation loops.
* The library is dependency-free and safe for embedding directly in static pages.

---

## 🤝 Contributing

Contributions, issues, and feature suggestions are welcome!
To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/my-update`.
3. Make your changes and test them.
4. Submit a pull request with a clear description.

---

## 🪪 License

**CC0 1.0 Universal (Public Domain Dedication)**
See [LICENSE](https://creativecommons.org/publicdomain/zero/1.0/) for full details.

---

## 👤 Author

**Oliver "Obdotgit" W.**
📁 [GitHub: Obdotgit](https://github.com/Obdotgit)

---

> *OJSTL v1.0.2 — a minimal but mighty JS utility toolkit.*
