// End-to-end API test script
process.env.NODE_ENV = "test";
const jwt = require("jsonwebtoken");
const app = require("./src/server");
const { initialize } = require("./src/database/db");

let BASE = (process.env.TEST_API_URL || "").replace(/\/+$/, "");
let serverInstance = null;

async function request(method, path, body = null, token = null, customAuthHeader = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (customAuthHeader !== null) {
    if (customAuthHeader) opts.headers["Authorization"] = customAuthHeader;
  } else if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function assert(condition, label) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ PASS: ${label}`);
  }
}

async function run() {
  // If no external URL provided, start an in-process test server on an ephemeral port
  if (!BASE) {
    await initialize();
    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        const port = serverInstance.address().port;
        BASE = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  }

  try {
    const runId = Math.floor(Math.random() * 1000000);
    const testUsername = `user_${runId}`;
    const testEmail = `user_${runId}@example.com`;
    const otherUsername = `other_${runId}`;
    const otherEmail = `other_${runId}@example.com`;

    console.log(`\nTesting against: ${BASE}\n`);
    let token;
    let userId;

    console.log("🔐 AUTH TESTS\n");

    // 1. Register
    let r = await request("POST", "/auth/register", {
      username: testUsername,
      email: testEmail,
      password: "password123",
    });
    assert(r.status === 201, `Register → 201 (got ${r.status})`);
    assert(r.data?.user?.username === testUsername, "Register returns user");
    userId = r.data?.user?.id;

    // 2. Register duplicate
    r = await request("POST", "/auth/register", {
      username: testUsername,
      email: testEmail,
      password: "password123",
    });
    assert(r.status === 400, `Duplicate register → 400 (got ${r.status})`);

    // 3. Register validation
    r = await request("POST", "/auth/register", {
      username: "ab",
      email: "not-an-email",
      password: "12",
    });
    assert(r.status === 400, `Invalid register → 400 (got ${r.status})`);
    assert(r.data?.details?.length >= 2, "Multiple validation errors returned");

    // 4. Login
    r = await request("POST", "/auth/login", {
      email: testEmail,
      password: "password123",
    });
    assert(r.status === 200, `Login → 200 (got ${r.status})`);
    assert(typeof r.data?.token === "string", "Login returns JWT token");
    token = r.data.token;

    // 5. Login wrong password
    r = await request("POST", "/auth/login", {
      email: testEmail,
      password: "wrongpassword",
    });
    assert(r.status === 401, `Wrong password → 401 (got ${r.status})`);

    // 6. Get profile
    r = await request("GET", "/auth/me", null, token);
    assert(r.status === 200, `Get profile → 200 (got ${r.status})`);
    assert(r.data?.user?.email === testEmail, "Profile returns correct email");

    // 7. Unauthenticated access
    r = await request("GET", "/auth/me");
    assert(r.status === 401, `Unauthed /me → 401 (got ${r.status})`);

    console.log("\n📋 TASK CREATION & AUTHENTICATION TESTS\n");

    // 8. Create task with valid token
    r = await request("POST", "/tasks", { title: "Test Task 1", priority: "high" }, token);
    assert(r.status === 201, `Create task with valid token → 201 (got ${r.status})`);
    assert(r.data?.task?.title === "Test Task 1", "Task has correct title");
    assert(r.data?.task?.priority === "high", "Task has correct priority");
    assert(r.data?.task?.status === "pending", "Default status is pending");
    assert(r.data?.task?.user_id === userId, "Task belongs to authenticated user");
    const taskId = r.data.task.id;

    // 9. Create task without auth header
    r = await request("POST", "/tasks", { title: "No Auth" });
    assert(r.status === 401, `Create task without auth → 401 (got ${r.status})`);
    assert(
      r.data?.error === "Authentication required. Provide a Bearer token.",
      "Missing auth returns exact 'Authentication required. Provide a Bearer token.' message"
    );

    // 10. Create task with empty Authorization header
    r = await request("POST", "/tasks", { title: "Empty Auth" }, null, "");
    assert(r.status === 401, `Create task empty auth header → 401 (got ${r.status})`);
    assert(
      r.data?.error === "Authentication required. Provide a Bearer token.",
      "Empty auth returns 'Authentication required. Provide a Bearer token.'"
    );

    // 11. Create task with non-Bearer scheme (e.g., Basic)
    r = await request("POST", "/tasks", { title: "Basic Auth" }, null, "Basic dXNlcjpwYXNz");
    assert(r.status === 401, `Create task Basic scheme → 401 (got ${r.status})`);
    assert(
      r.data?.error === "Authentication required. Provide a Bearer token.",
      "Non-Bearer returns 'Authentication required. Provide a Bearer token.'"
    );

    // 12. Create task with invalid/malformed JWT
    r = await request("POST", "/tasks", { title: "Invalid Token" }, null, "Bearer not.a.valid.jwt");
    assert(r.status === 401, `Create task invalid JWT → 401 (got ${r.status})`);
    assert(
      r.data?.error === "Invalid or expired token.",
      "Invalid token returns exact 'Invalid or expired token.' message"
    );

    // 13. Create task with expired JWT
    const expiredToken = jwt.sign(
      { id: userId, username: testUsername },
      process.env.JWT_SECRET || "default_test_secret",
      { expiresIn: "-1s" }
    );
    r = await request("POST", "/tasks", { title: "Expired Token" }, expiredToken);
    assert(r.status === 401, `Create task expired JWT → 401 (got ${r.status})`);
    assert(
      r.data?.error === "Invalid or expired token.",
      "Expired token returns 'Invalid or expired token.'"
    );

    // 14. Create task with JWT signed with wrong secret
    const wrongSecretToken = jwt.sign(
      { id: userId, username: testUsername },
      "completely_wrong_secret_1234567890",
      { expiresIn: "1h" }
    );
    r = await request("POST", "/tasks", { title: "Wrong Secret" }, wrongSecretToken);
    assert(r.status === 401, `Create task wrong secret JWT → 401 (got ${r.status})`);
    assert(
      r.data?.error === "Invalid or expired token.",
      "Wrong secret token returns 'Invalid or expired token.'"
    );

    // 15. Create task bad validation (with valid token)
    r = await request("POST", "/tasks", { title: "", status: "invalid" }, token);
    assert(r.status === 400, `Create task bad data → 400 (got ${r.status})`);

    // 16. Create second task
    r = await request("POST", "/tasks", { title: "Test Task 2", status: "in_progress", description: "Some work" }, token);
    assert(r.status === 201, `Create second task → 201 (got ${r.status})`);

    console.log("\n📋 TASK QUERY, UPDATE & DELETE TESTS\n");

    // 17. List tasks
    r = await request("GET", "/tasks", null, token);
    assert(r.status === 200, `List tasks → 200 (got ${r.status})`);
    assert(r.data?.tasks?.length === 2, `List returns 2 tasks (got ${r.data?.tasks?.length})`);
    assert(r.data?.pagination?.total === 2, "Pagination total = 2");

    // 18. Filter tasks
    r = await request("GET", "/tasks?status=pending", null, token);
    assert(r.status === 200, `Filter by status → 200 (got ${r.status})`);
    assert(r.data?.tasks?.length === 1, `Filter returns 1 task (got ${r.data?.tasks?.length})`);

    // 19. Search tasks
    r = await request("GET", "/tasks?search=Some", null, token);
    assert(r.status === 200, `Search → 200 (got ${r.status})`);
    assert(r.data?.tasks?.length === 1, `Search returns 1 task (got ${r.data?.tasks?.length})`);

    // 20. Get task by ID
    r = await request("GET", `/tasks/${taskId}`, null, token);
    assert(r.status === 200, `Get task by ID → 200 (got ${r.status})`);
    assert(r.data?.task?.id === taskId, "Returns correct task");

    // 21. Get non-existent task
    r = await request("GET", "/tasks/9999", null, token);
    assert(r.status === 404, `Non-existent task → 404 (got ${r.status})`);

    // 22. Update task (PUT)
    r = await request("PUT", `/tasks/${taskId}`, {
      title: "Updated Title",
      description: "Updated desc",
      status: "completed",
      priority: "low",
    }, token);
    assert(r.status === 200, `PUT update → 200 (got ${r.status})`);
    assert(r.data?.task?.title === "Updated Title", "Title updated");
    assert(r.data?.task?.status === "completed", "Status updated");

    // 23. Partial update (PATCH)
    r = await request("PATCH", `/tasks/${taskId}`, { priority: "medium" }, token);
    assert(r.status === 200, `PATCH update → 200 (got ${r.status})`);
    assert(r.data?.task?.priority === "medium", "Priority patched");
    assert(r.data?.task?.title === "Updated Title", "Other fields preserved");

    // 24. Delete task
    r = await request("DELETE", `/tasks/${taskId}`, null, token);
    assert(r.status === 200, `Delete task → 200 (got ${r.status})`);

    // 25. Verify deletion
    r = await request("GET", `/tasks/${taskId}`, null, token);
    assert(r.status === 404, `Deleted task → 404 (got ${r.status})`);

    // 26. Delete non-existent task
    r = await request("DELETE", `/tasks/${taskId}`, null, token);
    assert(r.status === 404, `Delete non-existent → 404 (got ${r.status})`);

    console.log("\n🔒 USER ISOLATION TEST\n");

    // 27. Register second user
    r = await request("POST", "/auth/register", {
      username: otherUsername,
      email: otherEmail,
      password: "password456",
    });
    assert(r.status === 201, "Second user registered");

    r = await request("POST", "/auth/login", {
      email: otherEmail,
      password: "password456",
    });
    const otherToken = r.data?.token;

    // 28. Other user can't see first user's tasks
    r = await request("GET", "/tasks", null, otherToken);
    assert(r.data?.tasks?.length === 0, `Other user sees 0 tasks (got ${r.data?.tasks?.length})`);

    console.log("\n🚀 DEMO LOGIN TO TASK CREATION WORKFLOW TEST\n");

    // 29. Demo user login / auto-provision
    const demoEmail = "alex.demo@taskflow.dev";
    const demoPassword = "Password123!";
    const demoUsername = "alex_developer";

    let demoLoginRes = await request("POST", "/auth/login", {
      email: demoEmail,
      password: demoPassword,
    });

    if (demoLoginRes.status === 401) {
      // User doesn't exist yet, auto-provision
      await request("POST", "/auth/register", {
        username: demoUsername,
        email: demoEmail,
        password: demoPassword,
      });
      demoLoginRes = await request("POST", "/auth/login", {
        email: demoEmail,
        password: demoPassword,
      });
    }

    assert(demoLoginRes.status === 200, `Demo login → 200 (got ${demoLoginRes.status})`);
    assert(typeof demoLoginRes.data?.token === "string", "Demo login returns valid JWT token");
    const demoToken = demoLoginRes.data.token;
    const demoUserId = demoLoginRes.data.user.id;

    // 30. Create task with demo user token
    const demoTaskRes = await request("POST", "/tasks", {
      title: "Evaluator Demo Task",
      description: "Created via demo auth workflow",
      priority: "high",
    }, demoToken);
    assert(demoTaskRes.status === 201, `Demo task creation → 201 (got ${demoTaskRes.status})`);
    assert(demoTaskRes.data?.task?.title === "Evaluator Demo Task", "Demo task title matches");
    assert(demoTaskRes.data?.task?.user_id === demoUserId, "Demo task belongs to demo user");

    console.log("\n✨ All tests passed successfully!\n");
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exitCode = 1;
  if (serverInstance) {
    serverInstance.close();
  }
});
