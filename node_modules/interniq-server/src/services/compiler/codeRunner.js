/**
 * codeRunner.js — Real code execution via local child_process sandbox
 *
 * Runs code by writing it to a temp file and executing it with the
 * appropriate runtime on the host machine. For languages not installed
 * locally, falls back to a helpful error message rather than a mock response.
 *
 * Supported languages (if runtime is installed on server):
 *   - JavaScript (Node.js)  ← always available since the server itself runs on Node
 *   - Python 3
 *   - Java (javac + java)
 *   - C++ (g++)
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import logger from '../../utils/logger.js';

const execAsync = promisify(exec);

const EXECUTION_TIMEOUT_MS = parseInt(process.env.CODE_EXEC_TIMEOUT_MS || '10000', 10);

/** Runtime config per language */
const LANG_CONFIG = {
  javascript: {
    ext: 'js',
    compile: null,
    run: (file) => `node "${file}"`,
  },
  python: {
    ext: 'py',
    compile: null,
    run: (file) => `python "${file}"`,
  },
  java: {
    ext: 'java',
    // Java's class name must match the filename — we always write Main.java
    filename: 'Main.java',
    compile: (file, dir) => `javac "${file}"`,
    run: (file, dir) => `java -cp "${dir}" Main`,
  },
  cpp: {
    ext: 'cpp',
    compile: (file, dir) => `g++ "${file}" -o "${path.join(dir, 'solution')}"`,
    run: (file, dir) => `"${path.join(dir, 'solution')}"`,
  },
};

/**
 * Run code with optional stdin using local child_process.
 *
 * @param {object} params
 * @param {string} params.code      - Source code
 * @param {string} params.language  - 'javascript' | 'python' | 'java' | 'cpp'
 * @param {string} [params.input]   - stdin
 * @returns {Promise<{ stdout, stderr, exitCode, time, error? }>}
 */
export const runCode = async ({ code, language, input = '' }) => {
  const lang = language?.toLowerCase().replace(/\s+/g, '');
  const config = LANG_CONFIG[lang];

  if (!config) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 1,
      error: `Unsupported language: "${language}". Supported: ${Object.keys(LANG_CONFIG).join(', ')}`,
    };
  }

  const tmpDir = path.join(os.tmpdir(), `iq_${randomUUID()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const filename = config.filename || `solution.${config.ext}`;
  const filePath = path.join(tmpDir, filename);

  // For Java, wrap in Main class if not already wrapped
  const finalCode = lang === 'java' && !code.includes('class Main')
    ? `public class Main {\n  public static void main(String[] args) {\n${code}\n  }\n}`
    : code;

  fs.writeFileSync(filePath, finalCode, 'utf8');

  const startMs = Date.now();

  try {
    // ── Compile (if needed) ─────────────────────────────────
    if (config.compile) {
      const compileCmd = config.compile(filePath, tmpDir);
      logger.info(`⚙️  Compiling: ${compileCmd}`);
      try {
        await execAsync(compileCmd, { timeout: EXECUTION_TIMEOUT_MS, cwd: tmpDir });
      } catch (compileErr) {
        cleanup(tmpDir);
        return {
          stdout: '',
          stderr: compileErr.stderr || compileErr.message,
          exitCode: 1,
          error: null,
          time: Date.now() - startMs,
        };
      }
    }

    // ── Run ─────────────────────────────────────────────────
    const runCmd = config.run(filePath, tmpDir);
    logger.info(`▶  Running (${lang}): ${runCmd}`);

    const result = await execAsync(runCmd, {
      timeout: EXECUTION_TIMEOUT_MS,
      cwd: tmpDir,
      input: input || undefined,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    }).catch((err) => ({
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message,
      code: err.code ?? 1,
    }));

    const elapsed = Date.now() - startMs;
    const exitCode = typeof result.code === 'number' ? result.code : 0;

    logger.info(`✅ Execution done in ${elapsed}ms — exit ${exitCode}`);

    cleanup(tmpDir);

    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode,
      time: elapsed,
    };
  } catch (err) {
    cleanup(tmpDir);

    if (err.killed || err.signal === 'SIGTERM') {
      return { stdout: '', stderr: '', exitCode: 1, error: 'Execution timed out. Please optimise your code.' };
    }

    logger.error(`Code execution failed: ${err.message}`);
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? err.message, exitCode: 1 };
  }
};

/**
 * Run code against multiple test cases and return pass/fail results.
 */
export const runTestCases = async (code, language, testCases = []) => {
  const results = [];
  let passed = 0;

  for (const tc of testCases) {
    const result = await runCode({ code, language, input: tc.input });
    const actualOutput = (result.stdout ?? '').trim();
    const expectedOutput = (tc.output ?? '').trim();
    const isCorrect = !result.error && result.exitCode === 0 && actualOutput === expectedOutput;

    if (isCorrect) passed++;

    results.push({
      input: tc.input,
      expected: expectedOutput,
      actual: actualOutput,
      correct: isCorrect,
      stderr: result.stderr,
      exitCode: result.exitCode,
      error: result.error ?? null,
    });
  }

  return { passed, failed: testCases.length - passed, total: testCases.length, results };
};

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (err) { console.error('Cleanup err:', err); }
}

export default { runCode, runTestCases };
