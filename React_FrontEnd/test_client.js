// Frontend API client unit test suite
import assert from 'node:assert';

// Mock localStorage and window
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

const dispatchedEvents = [];
globalThis.window = {
  localStorage: globalThis.localStorage,
  dispatchEvent: (event) => {
    dispatchedEvents.push(event);
    return true;
  },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, details) {
    this.type = type;
    this.details = details;
  }
};

let lastFetchCall = null;
globalThis.fetch = async (url, options) => {
  lastFetchCall = { url, options };

  if (url.includes('/auth/login')) {
    const body = JSON.parse(options.body || '{}');
    if (body.email === 'alex.demo@taskflow.dev' && body.password === 'Password123!') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => 'application/json' },
        json: async () => ({
          message: 'Login successful.',
          token: 'demo_jwt_header_payload_signature',
          user: { id: 3, username: 'alex_developer', email: 'alex.demo@taskflow.dev' },
        }),
      };
    }
    return {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Invalid email or password.' }),
    };
  }

  if (url.includes('/unauthorized-test')) {
    return {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Invalid or expired token.' }),
    };
  }

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'success', task: { id: 1, title: 'Sample' } }),
  };
};

const {
  getStoredToken,
  setStoredToken,
  loginUser,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
  fetchTasks,
  ApiError,
} = await import('./src/api/client.js');

console.log('🧪 Running Frontend API Client Tests...\n');

// 1. Token storage test
setStoredToken('test_token_123');
assert.strictEqual(getStoredToken(), 'test_token_123', 'Token is properly stored in localStorage');
setStoredToken('');
assert.strictEqual(getStoredToken(), '', 'Empty token clears storage');
console.log('  ✅ PASS: getStoredToken & setStoredToken update taskflow_token correctly');

// 2. Reject unauthenticated task creation without sending network request
lastFetchCall = null;
dispatchedEvents.length = 0;
let caughtError = null;
try {
  await createTask({ title: 'Unauthenticated Task' });
} catch (err) {
  caughtError = err;
}
assert(caughtError instanceof ApiError, 'createTask throws ApiError when unauthenticated');
assert.strictEqual(caughtError.status, 401, 'Error status is 401');
assert.strictEqual(
  lastFetchCall,
  null,
  'No network request sent when token is missing (preserves security)'
);
assert(
  dispatchedEvents.some((e) => e.type === 'taskflow:unauthorized'),
  'taskflow:unauthorized event was dispatched'
);
console.log('  ✅ PASS: createTask without token rejected without sending network request');

// 3. Reject other task operations without sending network request
for (const [name, fn] of [
  ['updateTask', () => updateTask(1, { title: 'T' })],
  ['patchTask', () => patchTask(1, { title: 'T' })],
  ['deleteTask', () => deleteTask(1)],
  ['fetchTasks', () => fetchTasks()],
]) {
  lastFetchCall = null;
  let err = null;
  try {
    await fn();
  } catch (e) {
    err = e;
  }
  assert(err instanceof ApiError && err.status === 401, `${name} throws 401 without token`);
  assert.strictEqual(lastFetchCall, null, `${name} did not send unauthenticated request`);
}
console.log('  ✅ PASS: All protected endpoints reject without token and avoid sending request');

// 4. Authenticated task creation attaches Authorization Bearer header
setStoredToken('valid_jwt_sample_abc123');
lastFetchCall = null;
const createRes = await createTask({ title: 'Authenticated Task', priority: 'high' });
assert(lastFetchCall !== null, 'Network request sent for authenticated user');
assert.strictEqual(
  lastFetchCall.options.headers['Authorization'],
  'Bearer valid_jwt_sample_abc123',
  'Authorization: Bearer <token> header correctly attached to task creation request'
);
assert.strictEqual(createRes.message, 'success', 'Task creation returned response');
console.log('  ✅ PASS: createTask with token includes Authorization: Bearer <token>');

// 5. Complete Login-to-Task-Creation End-to-End Workflow
storage.clear();
assert.strictEqual(getStoredToken(), '', 'Storage starts clean with no token');

// Step A: Perform Login (e.g., Demo Login)
const loginRes = await loginUser('alex.demo@taskflow.dev', 'Password123!');
assert(loginRes && loginRes.token, 'loginUser returns token');
assert.strictEqual(
  loginRes.token,
  'demo_jwt_header_payload_signature',
  'Token matches backend response'
);
assert.strictEqual(
  getStoredToken(),
  'demo_jwt_header_payload_signature',
  'JWT token is automatically saved into localStorage under taskflow_token'
);

// Step B: Perform Task Creation using the stored token
lastFetchCall = null;
const taskRes = await createTask({
  title: 'Evaluator Verified Task',
  description: 'Testing login-to-create pipeline',
  priority: 'high',
});
assert(lastFetchCall !== null, 'Network request was sent for task creation');
assert(
  lastFetchCall.url.endsWith('/tasks'),
  'Request targets /tasks endpoint'
);
assert.strictEqual(
  lastFetchCall.options.headers['Authorization'],
  'Bearer demo_jwt_header_payload_signature',
  'Task creation request contains exact Authorization: Bearer <valid-token>'
);
assert.strictEqual(taskRes.message, 'success', 'Task created successfully');
console.log('  ✅ PASS: Complete Login-to-Task-Creation flow stores JWT and attaches Bearer header');

console.log('\n✨ All frontend API client tests passed successfully!\n');
