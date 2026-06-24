---
name: unit-test
description: >
  Generate unit tests for a given file or folder path. Use this skill whenever the user
  wants to write, generate, create, or add unit tests, test coverage, or specs for their
  code. Triggers include: "write unit tests", "generate tests", "add test coverage",
  "test this file/folder", "write specs for", or any request mentioning unit testing,
  test suites, or coverage for a file or directory. Also trigger when a user pastes
  code and asks to "make sure it's tested" or "cover this with tests". Covers JavaScript,
  TypeScript, Python, and other common languages. Always use this skill when tests need
  to be written — do not attempt to write tests ad hoc without following this workflow.
---

# Unit Test Skill

Generate comprehensive unit tests for a given file or folder, detecting the environment
and existing tooling automatically before writing any tests.

---

## Step 1 — Identify the Target

The user provides a file path or folder path. If not provided, ask:
> "What file or folder would you like me to write unit tests for?"

Resolve the path and read the relevant source files. For folders, list contents first
and identify which files are testable (skip config files, assets, type-only files, etc.).

---

## Step 2 — Detect Language & Package Manager

Inspect the project root for:
- `package.json` → JavaScript / TypeScript project (Node)
- `pyproject.toml` / `setup.py` / `requirements.txt` → Python project
- `go.mod` → Go project
- `Cargo.toml` → Rust project
- `pom.xml` / `build.gradle` → Java/Kotlin project

Read the relevant config file to confirm the language and collect dependency info.

---

## Step 3 — Detect Installed Testing Library

### JavaScript / TypeScript

Read `package.json` and look in `dependencies`, `devDependencies`, and `scripts` for known testing libraries:

| Library | Detection Key |
|---|---|
| Jest | `jest` |
| Vitest | `vitest` |
| Mocha + Chai | `mocha`, `chai` |
| Jasmine | `jasmine` |
| AVA | `ava` |
| Node Test Runner | `node:test` (Node 18+) |

Also check for companion libraries: `@testing-library/react`, `@testing-library/vue`, `supertest`, `nock`, etc.

### Python

Look in `pyproject.toml` or `requirements*.txt` for:

| Library | Detection Key |
|---|---|
| pytest | `pytest` |
| unittest | built-in (always available) |
| nose2 | `nose2` |

### If no testing library is found

Present options to the user based on the detected language. **Do not install anything without user confirmation.**

#### For JavaScript / TypeScript projects:
Ask the user:
> "I didn't find a testing library in your project. Which would you like to use?"

Options (use `ask_user_input_v0` if available):
- **Jest** — most popular, batteries-included, great for React/Node
- **Vitest** — fast, Vite-native, Jest-compatible API
- **Mocha + Chai** — flexible, widely used for APIs and Node services
- **Node Test Runner** — zero-install, built into Node 18+

#### For Python projects:
- **pytest** — recommended, rich plugin ecosystem
- **unittest** — built-in, no install needed

After the user picks, install the library:

```bash
# JS example
npm install --save-dev jest   # or vitest, mocha+chai, etc.

# Python example
pip install pytest
```

Then add a test script to `package.json` if missing:
```json
"scripts": {
  "test": "jest"
}
```

---

## Step 4 — Detect or Confirm Test Output Folder

Look for a standard test directory in the project:

**Common conventions:**
- `__tests__/` (Jest default)
- `tests/` or `test/`
- `spec/` (Jasmine/Mocha)
- `src/__tests__/` (co-located with source)
- Same directory as source with `.test.ts` / `.spec.py` suffix

Check the testing library's config (e.g., `jest.config.*`, `vitest.config.*`, `pytest.ini`, `pyproject.toml [tool.pytest.ini_options]`) for a configured `testMatch`, `testDir`, or `testpaths`.

**If no test directory exists or can be inferred**, ask the user:
> "Where would you like me to put the test files?"

Options:
- `__tests__/` folder at project root (Jest default)
- `tests/` folder at project root
- Co-located alongside source files (e.g., `src/utils.test.ts`)
- Custom path (let user type one)

---

## Step 5 — Read the Source Code

Read each target file fully. Identify:
- Exported functions, classes, methods
- Side effects, I/O operations, async behavior
- Dependencies (to mock/stub)
- Edge cases: empty input, null/undefined, error paths, boundary values

For large files (>300 lines), focus on the public API surface first.

---

## Step 6 — Write the Unit Tests

Follow the framework's idioms and conventions (see references below).

### General principles:
- **Describe blocks** group related tests logically
- **One assertion focus** per test — tests should have a single reason to fail
- **Cover the happy path first**, then edge cases, then error paths
- **Mock external dependencies** (DB, network, file system) — don't test third parties
- **Avoid test interdependence** — each test should be runnable in isolation
- **Use descriptive test names**: `"returns null when input is empty"` not `"test1"`

### Test structure template (AAA pattern):
```
Arrange  – set up inputs, mocks, preconditions
Act      – call the function/method under test
Assert   – verify the output or side effect
```

### Coverage targets:
- All exported functions and public methods
- Each distinct branch (if/else, switch, try/catch)
- Boundary values (0, -1, empty string, null, max int)
- Async success and failure paths
- Error thrown / rejected promise cases

See `references/frameworks.md` for framework-specific syntax and patterns.

---

## Step 7 — Write the Files

For each source file, create a corresponding test file in the confirmed test directory.

Name the test file to match the source:
- `utils.ts` → `utils.test.ts` or `__tests__/utils.test.ts`
- `auth.py` → `test_auth.py` or `tests/test_auth.py`

Write all test files. After writing:
1. Show the user the file paths created
2. Run the tests if a test runner is available:

```bash
# JS
npx jest --no-coverage  # or npx vitest run

# Python
python -m pytest -v
```

3. If tests fail due to import/config issues (not logic), fix the config. If they fail due to unclear source behavior, flag for the user.

---

## Step 8 — Summary

After writing tests, provide a brief summary:
- Files tested
- Number of test cases written
- Libraries/mocks used
- Any untestable areas (and why)
- How to run the tests

---

## Reference

Read `references/frameworks.md` when you need framework-specific syntax, matchers,
mock patterns, or config snippets for a specific testing library.