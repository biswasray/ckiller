# Framework Reference — Unit Testing Libraries

Quick-reference for syntax, matchers, mocking, and config per testing framework.

---

## Jest (JavaScript / TypeScript)

### Basic test structure
```ts
import { add } from '../src/math';

describe('add', () => {
  it('returns the sum of two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('handles negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
  });
});
```

### Common matchers
```ts
expect(value).toBe(x)               // strict equality (===)
expect(value).toEqual(obj)          // deep equality
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toContain(item)       // array/string contains
expect(value).toHaveLength(n)
expect(fn).toThrow('message')
expect(fn).toThrow(ErrorClass)
```

### Async tests
```ts
// async/await
it('fetches user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');
});

// rejects
it('throws on bad id', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Not found');
});
```

### Mocking
```ts
// Mock a module
jest.mock('../src/db', () => ({
  query: jest.fn().mockResolvedValue([{ id: 1 }])
}));

// Spy on a method
const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
expect(spy).toHaveBeenCalledWith('hello');
spy.mockRestore();

// Mock return values
const mockFn = jest.fn()
  .mockReturnValueOnce('first')
  .mockReturnValue('default');
```

### Config (jest.config.ts)
```ts
export default {
  preset: 'ts-jest',          // for TypeScript
  testEnvironment: 'node',    // or 'jsdom' for browser
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
};
```

---

## Vitest (JavaScript / TypeScript)

API is Jest-compatible. Key differences:

```ts
import { describe, it, expect, vi } from 'vitest';
import { add } from '../src/math';

describe('add', () => {
  it('sums correctly', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

### Mocking (use `vi` instead of `jest`)
```ts
vi.mock('../src/db');
const spy = vi.spyOn(obj, 'method');
const mockFn = vi.fn().mockReturnValue(42);
```

### Config (vitest.config.ts)
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
```

---

## Mocha + Chai (JavaScript / TypeScript)

```ts
import { expect } from 'chai';
import { add } from '../src/math.js';

describe('add', () => {
  it('returns the sum', () => {
    expect(add(2, 3)).to.equal(5);
  });

  it('throws on non-number', () => {
    expect(() => add('a', 1)).to.throw(TypeError);
  });
});
```

### Chai matchers
```ts
expect(value).to.equal(x)
expect(value).to.deep.equal(obj)
expect(value).to.be.null
expect(value).to.be.undefined
expect(arr).to.include(item)
expect(arr).to.have.lengthOf(3)
expect(fn).to.throw()
```

### Async with Mocha
```ts
it('resolves user', async () => {
  const user = await fetchUser(1);
  expect(user).to.deep.equal({ id: 1, name: 'Alice' });
});
```

### Mocking with Sinon
```ts
import sinon from 'sinon';
const stub = sinon.stub(db, 'query').resolves([{ id: 1 }]);
// ... test ...
stub.restore();
```

---

## Node Test Runner (Node 18+ built-in)

```ts
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { add } from '../src/math.js';

describe('add', () => {
  test('sums two numbers', () => {
    assert.strictEqual(add(2, 3), 5);
  });

  test('async fetch', async () => {
    const result = await fetchUser(1);
    assert.deepStrictEqual(result, { id: 1 });
  });
});
```

Run: `node --test` or `node --test src/**/*.test.js`

---

## pytest (Python)

### Basic structure
```python
# tests/test_math.py
from src.math import add

def test_add_positive_numbers():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-1, 1) == 0

def test_add_returns_float():
    result = add(1.5, 2.5)
    assert result == 4.0
```

### Fixtures
```python
import pytest

@pytest.fixture
def user():
    return {"id": 1, "name": "Alice"}

def test_user_name(user):
    assert user["name"] == "Alice"
```

### Exceptions
```python
def test_raises_on_bad_input():
    with pytest.raises(ValueError, match="must be positive"):
        divide(10, 0)
```

### Parametrize
```python
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

### Mocking
```python
from unittest.mock import patch, MagicMock

def test_fetch_user(mocker):  # requires pytest-mock
    mock_get = mocker.patch("requests.get")
    mock_get.return_value.json.return_value = {"id": 1}
    result = fetch_user(1)
    assert result["id"] == 1

# Or with stdlib patch:
@patch("src.service.requests.get")
def test_api_call(mock_get):
    mock_get.return_value.status_code = 200
    ...
```

### Config (pyproject.toml)
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
```

---

## unittest (Python built-in)

```python
import unittest
from src.math import add

class TestAdd(unittest.TestCase):
    def test_sum(self):
        self.assertEqual(add(2, 3), 5)

    def test_raises(self):
        with self.assertRaises(ValueError):
            divide(1, 0)

    def setUp(self):
        # runs before each test
        self.client = AppClient()

    def tearDown(self):
        # runs after each test
        self.client.close()

if __name__ == '__main__':
    unittest.main()
```

Run: `python -m unittest discover -s tests`

---

## Common Patterns Across Frameworks

### What to mock
- HTTP clients (`fetch`, `axios`, `requests`)
- Database clients (`pg`, `mongoose`, `sqlalchemy`)
- File system (`fs`, `open`, `pathlib`)
- `Date.now()` / `datetime.now()` for time-sensitive logic
- External APIs and environment variables

### What NOT to mock
- The function you're actually testing
- Pure utility functions with no side effects
- Simple data transformations

### Naming conventions
| Language | File name | Test name |
|---|---|---|
| JS/TS | `*.test.ts` / `*.spec.ts` | `it('does X when Y')` |
| Python | `test_*.py` | `def test_does_x_when_y():` |

### Coverage command cheatsheet
```bash
# Jest
npx jest --coverage

# Vitest
npx vitest run --coverage

# pytest
pytest --cov=src --cov-report=term-missing

# Node built-in (Node 22+)
node --test --experimental-test-coverage
```