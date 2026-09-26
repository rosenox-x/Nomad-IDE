# Nomad IDE

Nomad IDE is a lightweight local coding environment for Java and Python, designed for developer-focused quick prototyping and learning. It runs entirely on your machine, opens in the browser, and allows you to write, save, and execute code without needing a cloud backend.

Built for a clean explorer-first workflow, the app lets you:

- browse project files in an Explorer view
- create new Java or Python files inside the app
- open files in a fullscreen editor
- save code locally in the browser
- compile and run Java and Python programs
- review output in a collapsible output drawer

---

## Features

- Explorer-first IDE layout
- Full-screen code editor experience
- New file creation modal with file name and language selection
- Java and Python execution support
- Local browser-based file persistence using localStorage
- Output panel with execution logs
- Automatic localhost port fallback when common ports are occupied
- Lightweight Node.js + Express backend

---

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Runtime support: Python 3 and Java 17
- Browser storage: localStorage

---

## Project Goals

This project is intended to feel like a compact local IDE rather than a heavy online platform. It prioritizes:

- simplicity
- local execution
- fast iteration
- clear separation between explorer and editor
- close alignment with a minimal developer-tool aesthetic

---

## Requirements

Before running the app, make sure you have the following installed:

- Node.js 18 or newer
- Python 3
- Java 17 JDK

### Java setup

The app tries to auto-detect Java at:

- ~/.local/jdk/jdk-17.0.12+7

If Java is installed elsewhere, make sure it is available on your PATH so the app can compile Java files.

Example:

```bash
export PATH="$HOME/.local/jdk/jdk-17.0.12+7/bin:$PATH"
```

---

## Quick Start

1. Clone the repository

```bash
git clone https://github.com/rosenox-x/Nomad-IDE.git
cd Nomad-IDE
```

2. Install dependencies

```bash
npm install
```

3. Start the IDE server

```bash
npm start
```

4. Open the app in your browser

The server will print a localhost URL such as:

```text
http://127.0.0.1:3000
```

If port 3000 is unavailable, the app will automatically retry on the next available localhost port.

---

## Free Remote Compiler Server

The Android app is a client. Java and Python execution happens on the compiler server, so the phone must be able to reach the server over HTTPS or a reachable LAN URL.

This repository includes a Docker deployment for Render:

- [Dockerfile](Dockerfile) installs Node.js, Python 3, and JDK 17
- [render.yaml](render.yaml) defines the free web service and `/api/health` check
- [.dockerignore](.dockerignore) keeps Android/build/runtime files out of the image

### Deploy on Render

1. Push the repository to GitHub.
2. Open Render and choose **New → Blueprint**.
3. Connect `https://github.com/rosenox-x/Nomad-IDE`.
4. Select the repository branch containing `render.yaml`.
5. Create the service.
6. Wait for the deployment to become healthy.

Render will provide a URL similar to:

```text
https://nomad-ide-compiler.onrender.com
```

Verify it before using the Android app:

```bash
curl https://YOUR_RENDER_URL/api/health
```

Expected response:

```json
{
  "ok": true,
  "status": "running"
}
```

### Connect the Android app

1. Open the app's Settings page.
2. Open **Code execution**.
3. Enter the full Render URL, for example:

```text
https://nomad-ide-compiler.onrender.com
```

4. Tap **Test connection**.
5. Once connected, open a Java or Python file and tap Run.

The URL is stored in the app's local settings. Do not add a trailing slash.

### Free-tier uptime limitation

Render's free web services can spin down after inactivity and cold-start when requested. That means they are not guaranteed to stay continuously awake 24/7 on the free tier. The app handles the resulting delay and timeout visibly, but guaranteed always-on availability requires a paid instance or an always-free VM provider with an uptime policy that supports it.

### Security notes

The remote API executes submitted Java and Python code. Treat the deployment as a personal development server:

- do not expose it publicly with sensitive data
- do not use it for untrusted users without authentication and sandboxing
- add authentication, rate limits, CPU/memory limits, and isolated containers before public use
- keep execution timeouts enabled

---

## Usage

### Explorer view

When you launch the app, the Explorer is shown first.

From there you can:

- view saved files
- create new Java or Python files
- open a file to begin editing

### Editor workflow

When a file is selected:

- the editor opens in a full-screen workspace
- save and run controls are available in the editor header
- the output panel sits below the code editor
- output can be collapsed or expanded

### File creation

Click the New file button in the Explorer and choose:

- file name
- language: Java or Python

The new file is created and saved in the app state.

### Running code

Use the Run button in the editor header to execute the current file.

- Python files run with python3
- Java files are compiled using javac and executed with java

The result is shown in the Output panel.

---

## Project Structure

```text
Nomad-IDE/
├── index.html          # Main IDE interface and app logic
├── server.js           # Express backend and execution engine
├── package.json        # Node scripts and dependencies
├── projects/           # Generated runtime directories for execution
├── tests/
│   └── run-code.test.js
├── .gitignore
├── DESIGN.md           # UI design reference
├── architecture.md     # Architecture notes
├── ui-guidelines.md    # UI guidance document
├── Directory schema.txt
├── README.md           # Project documentation
└── Skill.yaml
```

---

## Execution Flow

The application follows a simple local architecture:

1. The browser loads the interface from the Express app.
2. User writes Java or Python code in the editor.
3. The frontend saves the current file in localStorage.
4. The browser sends code to the backend via an API request.
5. The server writes the file into a temporary runtime directory.
6. The server runs the correct language toolchain.
7. Output is returned and displayed in the Output drawer.

---

## API Endpoints

### GET /

Serves the frontend application.

### GET /api/health

Returns health status for the server.

Example response:

```json
{
  "ok": true,
  "status": "running"
}
```

### POST /api/run

Executes the provided code.

Request body:

```json
{
  "language": "python",
  "filename": "main.py",
  "code": "print('Hello from Nomad IDE')"
}
```

Response shape:

```json
{
  "exitCode": 0,
  "output": "Hello from Nomad IDE",
  "language": "python",
  "file": "/tmp/.../main.py"
}
```

### GET /api/example/:language

Returns starter code for Java or Python examples.

---

## Testing

The repo includes runtime validation tests for both Java and Python execution.

Run tests with:

```bash
npm test
```

Current checks verify that:

- Python execution works
- Java compilation and execution works

---

## Troubleshooting

### Port already in use

The application automatically retries on common fallback ports. If the app fails to start on 3000, it will continue to nearby ports such as 4173, 4174, 8000, and 8080.

### Java not found

If the app reports a Java toolchain issue, make sure Java 17 is installed and available on PATH.

Check:

```bash
java -version
javac -version
```

### Python not found

Check:

```bash
python3 --version
```

### Files not persisting

This project stores files in browser localStorage. If you clear browser storage, saved files may be lost.

---

## Notes

- This is a local development IDE, not a multi-user cloud IDE.
- Files are stored in-browser rather than in a database.
- The backend writes temporary execution files into a local projects folder on the machine.

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## License

This project is currently distributed without a formal license declaration. If you plan to publish or share it publicly, consider adding an open-source license such as MIT.

---

## Summary

Nomad IDE is a simple but functional local coding workspace for Java and Python, built to be easy to run, easy to understand, and easy to extend. It is especially useful for quick local experimentation, learning, and lightweight IDE-style editing without the overhead of a larger framework.
