const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const DEFAULT_PORTS = [Number(process.env.PORT) || 3000, 4173, 4174, 8000, 8080, 0];
const PROJECTS_DIR = path.join(__dirname, 'projects');
const LOCAL_JDK_DIR = path.join(process.env.HOME || '', '.local', 'jdk');
const JAVA_HOME = fs.existsSync(path.join(LOCAL_JDK_DIR, 'jdk-17.0.12+7'))
  ? path.join(LOCAL_JDK_DIR, 'jdk-17.0.12+7')
  : (process.env.JAVA_HOME || '');
const JAVA_BIN = JAVA_HOME ? path.join(JAVA_HOME, 'bin') : '';

fs.mkdirSync(PROJECTS_DIR, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

function ensureProjectDir() {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

function buildToolEnvironment() {
  const env = { ...process.env };
  if (JAVA_BIN) {
    env.JAVA_HOME = JAVA_HOME;
    env.PATH = `${JAVA_BIN}:${env.PATH || ''}`;
  }
  return env;
}

async function runCode({ language, filename, code }) {
  ensureProjectDir();

  const cleanName = filename || `Main.${language === 'python' ? 'py' : 'java'}`;
  const ext = path.extname(cleanName).toLowerCase();
  const baseName = path.basename(cleanName, ext);
  const workDir = path.join(PROJECTS_DIR, `run-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(workDir, { recursive: true });

  if (language === 'python') {
    const filePath = path.join(workDir, cleanName.endsWith('.py') ? cleanName : `${baseName}.py`);
    fs.writeFileSync(filePath, code || '');

    return await new Promise((resolve) => {
      const child = spawn('python3', [filePath], { cwd: workDir, shell: false, env: buildToolEnvironment() });
      let output = '';
      let error = '';

      child.stdout.on('data', (chunk) => { output += chunk.toString(); });
      child.stderr.on('data', (chunk) => { error += chunk.toString(); });
      child.on('error', (err) => {
        resolve({ exitCode: 1, output: err.message, language, file: filePath });
      });
      child.on('close', (code) => {
        resolve({
          exitCode: code ?? 1,
          output: output || error || '',
          language,
          file: filePath,
        });
      });
    });
  }

  if (language === 'java') {
    const javaFile = path.join(workDir, cleanName.endsWith('.java') ? cleanName : `${baseName}.java`);
    fs.writeFileSync(javaFile, code || '');

    return await new Promise((resolve) => {
      const env = buildToolEnvironment();
      const javacPath = JAVA_BIN ? path.join(JAVA_BIN, 'javac') : 'javac';
      const javaPath = JAVA_BIN ? path.join(JAVA_BIN, 'java') : 'java';
      const compile = spawn(javacPath, [javaFile], { cwd: workDir, shell: false, env });
      let compileOut = '';
      let compileErr = '';

      compile.stdout.on('data', (chunk) => { compileOut += chunk.toString(); });
      compile.stderr.on('data', (chunk) => { compileErr += chunk.toString(); });
      compile.on('error', (err) => {
        resolve({ exitCode: 1, output: `Java toolchain missing: ${err.message}`, language, file: javaFile });
      });

      compile.on('close', (compileCode) => {
        if (compileCode !== 0) {
          resolve({
            exitCode: compileCode ?? 1,
            output: compileErr || compileOut || 'Compilation failed.',
            language,
            file: javaFile,
          });
          return;
        }

        const className = path.basename(javaFile, '.java');
        const child = spawn(javaPath, ['-cp', workDir, className], { cwd: workDir, shell: false, env });
        let output = '';
        let error = '';

        child.stdout.on('data', (chunk) => { output += chunk.toString(); });
        child.stderr.on('data', (chunk) => { error += chunk.toString(); });
        child.on('error', (err) => {
          resolve({ exitCode: 1, output: `Java runtime missing: ${err.message}`, language, file: javaFile });
        });
        child.on('close', (runCode) => {
          resolve({
            exitCode: runCode ?? 1,
            output: output || error || '',
            language,
            file: javaFile,
          });
        });
      });
    });
  }

  return {
    exitCode: 1,
    output: 'Unsupported language selected.',
    language,
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'running' });
});

app.post('/api/run', async (req, res) => {
  const { language, filename, code } = req.body || {};

  if (!language || !code) {
    return res.status(400).json({ error: 'Missing language or code.' });
  }

  try {
    const result = await runCode({ language, filename, code });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Execution failed.' });
  }
});

app.get('/api/example/:language', (req, res) => {
  const language = req.params.language;
  if (language === 'python') {
    res.json({
      filename: 'main.py',
      code: 'print("Hello from Nomad IDE")\nfor i in range(3):\n    print(i)\n'
    });
  } else if (language === 'java') {
    res.json({
      filename: 'Main.java',
      code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Nomad IDE");\n  }\n}\n'
    });
  } else {
    res.status(404).json({ error: 'Language not supported.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function startServer() {
  let portIndex = 0;

  const tryListen = () => {
    const port = DEFAULT_PORTS[portIndex];
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`Nomad IDE running at http://127.0.0.1:${server.address().port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        portIndex += 1;
        if (portIndex < DEFAULT_PORTS.length) {
          console.warn(`Port ${port} is busy. Retrying on the next available localhost port.`);
          tryListen();
          return;
        }
      }
      throw err;
    });
  };

  tryListen();
}

if (require.main === module) {
  startServer();
}

module.exports = { app, runCode };
