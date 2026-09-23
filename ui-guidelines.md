# Project Architecture and Core Logic

## Tech Stack
- **UI Framework:** Kotlin with Jetpack Compose. Do not use legacy XML layouts unless absolutely necessary for third-party library integration.
- **Python Execution:** We are using Chaquopy (or an equivalent embedded Python runtime) to execute Python scripts locally on the Android device.
- **Java Execution:** We will utilize an embedded compiler (like ECJ - Eclipse Compiler for Java) or rely on Dexing to run Java natively.
- **Editor Engine:** The text editor must support syntax highlighting, auto-indentation, and line numbering.

## State Management
- Use modern Android architecture (MVVM or MVI).
- Code editor state must be hoisted and handle large files efficiently without causing UI lag (UI thread must not block during compilation).

## File System
- All user scripts (Java and Python) must be saved in the app's scoped storage directory under `Documents/IDE_Projects/`.