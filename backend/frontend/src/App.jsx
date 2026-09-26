
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://smartops.fastapicloud.dev";

function App() {
  // =========================================================
  // Authentication
  // =========================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [activePage, setActivePage] = useState("Dashboard");

  // =========================================================
  // Dashboard
  // =========================================================

  const [stats, setStats] = useState({
    total_users: 0,
    total_tasks: 0,
    pending_tasks: 0,
    completed_tasks: 0,
  });

  // =========================================================
  // Employees
  // =========================================================

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // =========================================================
  // Tasks
  // =========================================================

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
  });

  // =========================================================
  // Workflows
  // =========================================================

  const [workflows, setWorkflows] = useState([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [workflowStepsLoading, setWorkflowStepsLoading] =
    useState(false);

  const [showWorkflowForm, setShowWorkflowForm] = useState(false);

  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    description: "",
  });

  const [showStepForm, setShowStepForm] = useState(false);

  const [stepForm, setStepForm] = useState({
    task_id: "",
    step_number: 1,
    title: "",
    description: "",
    assigned_to: "",
  });

  // =========================================================
  // AI Assistant
  // =========================================================

  const [aiSelectedTask, setAiSelectedTask] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // =========================================================
  // Restore Login
  // =========================================================

  useEffect(() => {
    const savedUser = localStorage.getItem("smartops_user");
    const savedToken = localStorage.getItem("smartops_token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("smartops_user");
        localStorage.removeItem("smartops_token");
      }
    }
  }, []);

  // =========================================================
  // Load Dashboard / Tasks After Login
  // =========================================================

  useEffect(() => {
    if (user) {
      loadDashboard();
      loadTasks();
    }
  }, [user]);

  // =========================================================
  // Page Based Loading
  // =========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    if (
      user.role === "admin" &&
      activePage === "Employees"
    ) {
      loadEmployees();
    }

    if (activePage === "Tasks") {
      loadTasks();
    }

    if (activePage === "Workflows") {
      loadEmployees();
      loadTasks();
      loadWorkflows();
    }

    if (activePage === "AI Assistant") {
      loadTasks();
    }
  }, [activePage, user]);

  // =========================================================
  // Token
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("smartops_token");
  };

  // =========================================================
  // Login
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        );
      }

      const token = data.access_token;

      const profileResponse = await fetch(
        `${API_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.detail ||
            "Could not load profile"
        );
      }

      localStorage.setItem(
        "smartops_token",
        token
      );

      localStorage.setItem(
        "smartops_user",
        JSON.stringify(profileData)
      );

      setUser(profileData);
      setMessage("Login successful!");
      setPassword("");
    } catch (error) {
      setMessage(
        error.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Dashboard
  // =========================================================

  const loadDashboard = async () => {
    const token = getToken();

    if (!token || !user) {
      return;
    }

    try {
      const endpoint =
        user.role === "admin"
          ? `${API_URL}/dashboard/admin`
          : `${API_URL}/dashboard/employee`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setStats({
  total_users:
    data.users?.total_users || 0,

  total_tasks:
    data.tasks?.total_tasks || 0,

  pending_tasks:
    data.tasks?.pending || 0,

  completed_tasks:
    data.tasks?.completed || 0,
});

      
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    }
  };

  // =========================================================
  // Employees
  // =========================================================

  const loadEmployees = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setEmployeesLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not load employees"
        );
      }

      setEmployees(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Employees error:",
        error
      );

      setMessage(
        error.message ||
          "Could not load employees"
      );
    } finally {
      setEmployeesLoading(false);
    }
  };

  // =========================================================
  // Tasks
  // =========================================================

  const loadTasks = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setTasksLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/tasks/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not load tasks"
        );
      }

      setTasks(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Tasks error:",
        error
      );

      setMessage(
        error.message ||
          "Could not load tasks"
      );
    } finally {
      setTasksLoading(false);
    }
  };

  // =========================================================
  // Task Form
  // =========================================================

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      assigned_to: "",
    });

    setEditingTask(null);
    setShowTaskForm(false);
  };

  const handleTaskInput = (e) => {
    const { name, value } = e.target;

    setTaskForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // Create / Update Task
  // =========================================================

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      return;
    }

    if (!taskForm.title.trim()) {
      setMessage(
        "Task title is required."
      );
      return;
    }

    try {
      const payload = {
        title: taskForm.title.trim(),

        description:
          taskForm.description.trim() ||
          null,

        priority: taskForm.priority,

        due_date: taskForm.due_date
          ? new Date(
              taskForm.due_date
            ).toISOString()
          : null,

        assigned_to:
          taskForm.assigned_to
            ? Number(
                taskForm.assigned_to
              )
            : null,
      };

      const url = editingTask
        ? `${API_URL}/tasks/${editingTask.id}`
        : `${API_URL}/tasks/`;

      const method = editingTask
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not save task"
        );
      }

      setMessage(
        editingTask
          ? "Task updated successfully!"
          : "Task created successfully!"
      );

      resetTaskForm();

      await loadTasks();
      await loadDashboard();
    } catch (error) {
      console.error(
        "Save task error:",
        error
      );

      setMessage(
        error.message ||
          "Could not save task"
      );
    }
  };

  const startEditTask = (task) => {
    setEditingTask(task);

    let formattedDate = "";

    if (task.due_date) {
      const date = new Date(
        task.due_date
      );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        formattedDate =
          date
            .toISOString()
            .slice(0, 16);
      }
    }

    setTaskForm({
      title: task.title || "",

      description:
        task.description || "",

      priority:
        task.priority || "medium",

      due_date: formattedDate,

      assigned_to:
        task.assigned_to
          ? String(
              task.assigned_to
            )
          : "",
    });

    setShowTaskForm(true);
  };

  // =========================================================
  // Delete Task
  // =========================================================

  const handleDeleteTask = async (
    taskId
  ) => {
    const token = getToken();

    if (!token) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/tasks/${taskId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not delete task"
        );
      }

      setMessage(
        "Task deleted successfully!"
      );

      await loadTasks();
      await loadDashboard();
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      setMessage(
        error.message ||
          "Could not delete task"
      );
    }
  };

  // =========================================================
  // Task Status
  // =========================================================

  const handleStatusChange = async (
    taskId,
    newStatus
  ) => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/tasks/${taskId}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not update status"
        );
      }

      setMessage(
        "Task status updated successfully!"
      );

      await loadTasks();
      await loadDashboard();
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      setMessage(
        error.message ||
          "Could not update status"
      );

      await loadTasks();
    }
  };

  // =========================================================
  // Workflow: Load All Workflows
  // =========================================================

  const loadWorkflows = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setWorkflowsLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/workflow/`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not load workflows"
        );
      }

      const workflowList =
        Array.isArray(
          data.workflows
        )
          ? data.workflows
          : [];

      setWorkflows(
        workflowList
      );

      if (
        selectedWorkflow &&
        !workflowList.some(
          (workflow) =>
            workflow.id ===
            selectedWorkflow.id
        )
      ) {
        setSelectedWorkflow(null);
        setWorkflowSteps([]);
      }
    } catch (error) {
      console.error(
        "Workflows error:",
        error
      );

      setMessage(
        error.message ||
          "Could not load workflows"
      );
    } finally {
      setWorkflowsLoading(false);
    }
  };

  // =========================================================
  // Workflow: Load Steps
  // =========================================================

  const loadWorkflowSteps =
    async (workflowId) => {
      const token = getToken();

      if (!token || !workflowId) {
        return;
      }

      setWorkflowStepsLoading(
        true
      );

      try {
        const response =
          await fetch(
            `${API_URL}/workflow/${workflowId}/steps`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Could not load workflow steps"
          );
        }

        setWorkflowSteps(
          Array.isArray(
            data.steps
          )
            ? data.steps
            : []
        );
      } catch (error) {
        console.error(
          "Workflow steps error:",
          error
        );

        setMessage(
          error.message ||
            "Could not load workflow steps"
        );

        setWorkflowSteps([]);
      } finally {
        setWorkflowStepsLoading(
          false
        );
      }
    };

  // =========================================================
  // Select Workflow
  // =========================================================

  const handleSelectWorkflow =
    async (workflow) => {
      setSelectedWorkflow(
        workflow
      );

      setWorkflowSteps([]);

      setShowStepForm(false);

      setStepForm({
        task_id: "",
        step_number: 1,
        title: "",
        description: "",
        assigned_to: "",
      });

      await loadWorkflowSteps(
        workflow.id
      );
    };

  // =========================================================
  // Workflow Form
  // =========================================================

  const handleWorkflowInput = (
    e
  ) => {
    const { name, value } =
      e.target;

    setWorkflowForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const resetWorkflowForm =
    () => {
      setWorkflowForm({
        name: "",
        description: "",
      });

      setShowWorkflowForm(
        false
      );
    };

  // =========================================================
  // Create Workflow
  // =========================================================

  const handleCreateWorkflow =
    async (e) => {
      e.preventDefault();

      const token = getToken();

      if (!token) {
        return;
      }

      if (
        !workflowForm.name.trim()
      ) {
        setMessage(
          "Workflow name is required."
        );
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/workflow/`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                name:
                  workflowForm.name.trim(),

                description:
                  workflowForm.description.trim() ||
                  null,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Could not create workflow"
          );
        }

        setMessage(
          "Workflow created successfully!"
        );

        resetWorkflowForm();

        await loadWorkflows();
      } catch (error) {
        console.error(
          "Create workflow error:",
          error
        );

        setMessage(
          error.message ||
            "Could not create workflow"
        );
      }
    };

  // =========================================================
  // Workflow Step Form
  // =========================================================

  const handleStepInput = (e) => {
    const { name, value } =
      e.target;

    setStepForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const resetStepForm = () => {
    setStepForm({
      task_id: "",

      step_number:
        workflowSteps.length + 1,

      title: "",
      description: "",
      assigned_to: "",
    });

    setShowStepForm(false);
  };

  // =========================================================
  // Create Workflow Step
  // =========================================================

  const handleCreateWorkflowStep =
    async (e) => {
      e.preventDefault();

      const token = getToken();

      if (
        !token ||
        !selectedWorkflow
      ) {
        return;
      }

      if (!stepForm.title.trim()) {
        setMessage(
          "Step title is required."
        );
        return;
      }

      try {
        const payload = {
          workflow_id:
            selectedWorkflow.id,

          task_id:
            stepForm.task_id
              ? Number(
                  stepForm.task_id
                )
              : null,

          step_number:
            Number(
              stepForm.step_number
            ),

          title:
            stepForm.title.trim(),

          description:
            stepForm.description.trim() ||
            null,

          assigned_to:
            stepForm.assigned_to
              ? Number(
                  stepForm.assigned_to
                )
              : null,
        };

        const response =
          await fetch(
            `${API_URL}/workflow/steps`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify(
                payload
              ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Could not create workflow step"
          );
        }

        setMessage(
          "Workflow step created successfully!"
        );

        resetStepForm();

        await loadWorkflowSteps(
          selectedWorkflow.id
        );
      } catch (error) {
        console.error(
          "Create workflow step error:",
          error
        );

        setMessage(
          error.message ||
            "Could not create workflow step"
        );
      }
    };

  // =========================================================
  // Workflow Step Status
  // =========================================================

  const handleWorkflowStepStatusChange =
    async (
      stepId,
      newStatus
    ) => {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/workflow/steps/${stepId}/status`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                status: newStatus,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Could not update workflow step"
          );
        }

        setMessage(
          "Workflow step status updated successfully!"
        );

        if (selectedWorkflow) {
          await loadWorkflowSteps(
            selectedWorkflow.id
          );
        }
      } catch (error) {
        console.error(
          "Workflow step status error:",
          error
        );

        setMessage(
          error.message ||
            "Could not update workflow step"
        );

        if (selectedWorkflow) {
          await loadWorkflowSteps(
            selectedWorkflow.id
          );
        }
      }
    };

  // =========================================================
  // AI Assistant
  // =========================================================

  const handleAnalyzeTask = async () => {
    const token = getToken();

    if (!token) {
      setMessage(
        "Please login again."
      );
      return;
    }

    if (!aiSelectedTask) {
      setMessage(
        "Please select a task first."
      );
      return;
    }

    setAiLoading(true);
    setAiAnalysis("");
    setMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/ai/analyze-task/${aiSelectedTask}`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "AI analysis failed"
        );
      }

      setAiAnalysis(
        data.ai_analysis ||
          "No AI analysis received."
      );

      setMessage(
        "AI analysis generated successfully!"
      );
    } catch (error) {
      console.error(
        "AI analysis error:",
        error
      );

      setMessage(
        error.message ||
          "Could not generate AI analysis"
      );
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiAnalysis = () => {
    setAiSelectedTask("");
    setAiAnalysis("");
    setMessage("");
  };

  // =========================================================
  // Logout
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "smartops_token"
    );

    localStorage.removeItem(
      "smartops_user"
    );

    setUser(null);
    setEmail("");
    setPassword("");
    setMessage("");
    setActivePage("Dashboard");

    setWorkflows([]);
    setSelectedWorkflow(null);
    setWorkflowSteps([]);

    setAiSelectedTask("");
    setAiAnalysis("");
  };

  // =========================================================
  // Helpers
  // =========================================================

  const getEmployeeName = (
    employeeId
  ) => {
    if (!employeeId) {
      return "Unassigned";
    }

    const employee =
      employees.find(
        (item) =>
          item.id === employeeId
      );

    return employee
      ? employee.name
      : `User #${employeeId}`;
  };

  const getTaskTitle = (
    taskId
  ) => {
    if (!taskId) {
      return "No task linked";
    }

    const task = tasks.find(
      (item) =>
        item.id === taskId
    );

    return task
      ? `#${task.id} - ${task.title}`
      : `Task #${taskId}`;
  };

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "No due date";
    }

    const date = new Date(
      dateValue
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Invalid date";
    }

    return date.toLocaleString();
  };

  // =========================================================
  // Dashboard
  // =========================================================

  const renderDashboard = () => {
    return (
      <div className="main-content">
        <div className="topbar">
          <div>
            <h1>Dashboard</h1>

            <p>
              Welcome back,{" "}
              {user?.name}
            </p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>
              {stats.total_users}
            </p>
          </div>

          <div className="stat-card">
            <h3>Total Tasks</h3>
            <p>
              {stats.total_tasks}
            </p>
          </div>

          <div className="stat-card">
            <h3>Pending Tasks</h3>
            <p>
              {stats.pending_tasks}
            </p>
          </div>

          <div className="stat-card">
            <h3>Completed Tasks</h3>
            <p>
              {stats.completed_tasks}
            </p>
          </div>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <h2>
              SmartOps Management System
            </h2>

            <p>
              AI-powered employee task
              and workflow management
              system.
            </p>
          </div>

          <div className="content-card">
            <h2>Account</h2>

            <p>
              <strong>Name:</strong>{" "}
              {user?.name}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {user?.email}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // Employees
  // =========================================================

  const renderEmployees = () => {
    return (
      <div className="main-content">
        <div className="topbar">
          <div>
            <h1>Employees</h1>

            <p>
              Manage SmartOps employees
            </p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <div className="content-card">
          <h2>Employee List</h2>

          {employeesLoading ? (
            <p>
              Loading employees...
            </p>
          ) : employees.length ===
            0 ? (
            <p>
              No employees found.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map(
                    (employee) => (
                      <tr
                        key={
                          employee.id
                        }
                      >
                        <td>
                          {employee.id}
                        </td>

                        <td>
                          {
                            employee.name
                          }
                        </td>

                        <td>
                          {
                            employee.email
                          }
                        </td>

                        <td>
                          {
                            employee.role
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // Tasks
  // =========================================================

  const renderTasks = () => {
    return (
      <div className="main-content">
        <div className="topbar">
          <div>
            <h1>Tasks</h1>

            <p>
              Manage employee tasks
            </p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {user?.role ===
          "admin" && (
          <div className="content-card">
            <div className="task-header">
              <div>
                <h2>
                  {editingTask
                    ? "Edit Task"
                    : "Create New Task"}
                </h2>
              </div>

              <button
                className="secondary-btn"
                onClick={() => {
                  if (
                    showTaskForm
                  ) {
                    resetTaskForm();
                  } else {
                    setShowTaskForm(
                      true
                    );
                  }
                }}
              >
                {showTaskForm
                  ? "Cancel"
                  : "+ Create Task"}
              </button>
            </div>

            {showTaskForm && (
              <form
                className="task-form"
                onSubmit={
                  handleCreateOrUpdateTask
                }
              >
                <div className="form-group">
                  <label>
                    Task Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={
                      taskForm.title
                    }
                    onChange={
                      handleTaskInput
                    }
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      taskForm.description
                    }
                    onChange={
                      handleTaskInput
                    }
                    placeholder="Enter task description"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Priority
                    </label>

                    <select
                      name="priority"
                      value={
                        taskForm.priority
                      }
                      onChange={
                        handleTaskInput
                      }
                    >
                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Due Date
                    </label>

                    <input
                      type="datetime-local"
                      name="due_date"
                      value={
                        taskForm.due_date
                      }
                      onChange={
                        handleTaskInput
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Assign Employee
                    </label>

                    <select
                      name="assigned_to"
                      value={
                        taskForm.assigned_to
                      }
                      onChange={
                        handleTaskInput
                      }
                    >
                      <option value="">
                        Unassigned
                      </option>

                      {employees
                        .filter(
                          (
                            employee
                          ) =>
                            employee.role ===
                            "employee"
                        )
                        .map(
                          (
                            employee
                          ) => (
                            <option
                              key={
                                employee.id
                              }
                              value={
                                employee.id
                              }
                            >
                              {
                                employee.name
                              }
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-btn"
                  >
                    {editingTask
                      ? "Update Task"
                      : "Create Task"}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={
                      resetTaskForm
                    }
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="content-card">
          <div className="task-header">
            <div>
              <h2>Task List</h2>

              <p>
                {user?.role ===
                "admin"
                  ? "All tasks"
                  : "Your assigned tasks"}
              </p>
            </div>

            <button
              className="secondary-btn"
              onClick={
                loadTasks
              }
            >
              Refresh
            </button>
          </div>

          {tasksLoading ? (
            <p>
              Loading tasks...
            </p>
          ) : tasks.length ===
            0 ? (
            <div className="empty-state">
              <h3>
                No tasks found
              </h3>

              {user?.role ===
              "admin" ? (
                <p>
                  Click "+ Create
                  Task" to create
                  your first task.
                </p>
              ) : (
                <p>
                  No task has been
                  assigned to you
                  yet.
                </p>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>
                      Assigned To
                    </th>
                    <th>
                      Due Date
                    </th>

                    {user?.role ===
                      "admin" && (
                      <th>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {tasks.map(
                    (task) => (
                      <tr
                        key={
                          task.id
                        }
                      >
                        <td>
                          {task.id}
                        </td>

                        <td>
                          <strong>
                            {
                              task.title
                            }
                          </strong>

                          {task.description && (
                            <div className="task-description">
                              {
                                task.description
                              }
                            </div>
                          )}
                        </td>

                        <td>
                          <span
                            className={`priority-badge ${task.priority}`}
                          >
                            {
                              task.priority
                            }
                          </span>
                        </td>

                        <td>
                          {user?.role ===
                            "employee" &&
                          task.assigned_to ===
                            user.id ? (
                            <select
                              value={
                                task.status
                              }
                              onChange={(
                                e
                              ) =>
                                handleStatusChange(
                                  task.id,
                                  e
                                    .target
                                    .value
                                )
                              }
                            >
                              <option value="pending">
                                Pending
                              </option>

                              <option value="in_progress">
                                In Progress
                              </option>

                              <option value="completed">
                                Completed
                              </option>
                            </select>
                          ) : (
                            <span
                              className={`status-badge ${task.status}`}
                            >
                              {task.status.replace(
                                "_",
                                " "
                              )}
                            </span>
                          )}
                        </td>

                        <td>
                          {getEmployeeName(
                            task.assigned_to
                          )}
                        </td>

                        <td>
                          {formatDate(
                            task.due_date
                          )}
                        </td>

                        {user?.role ===
                          "admin" && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="edit-btn"
                                onClick={() =>
                                  startEditTask(
                                    task
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  handleDeleteTask(
                                    task.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // Workflows
  // =========================================================

  const renderWorkflows = () => {
    return (
      <div className="main-content">
        <div className="topbar">
          <div>
            <h1>Workflows</h1>

            <p>
              Manage employee
              workflows and workflow
              steps
            </p>
          </div>

          <button
            className="logout-btn"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {user?.role ===
          "admin" && (
          <div className="content-card">
            <div className="task-header">
              <div>
                <h2>
                  Create Workflow
                </h2>

                <p>
                  Create a process
                  containing
                  multiple workflow
                  steps.
                </p>
              </div>

              <button
                className="secondary-btn"
                onClick={() => {
                  if (
                    showWorkflowForm
                  ) {
                    resetWorkflowForm();
                  } else {
                    setShowWorkflowForm(
                      true
                    );
                  }
                }}
              >
                {showWorkflowForm
                  ? "Cancel"
                  : "+ Create Workflow"}
              </button>
            </div>

            {showWorkflowForm && (
              <form
                className="task-form"
                onSubmit={
                  handleCreateWorkflow
                }
              >
                <div className="form-group">
                  <label>
                    Workflow Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      workflowForm.name
                    }
                    onChange={
                      handleWorkflowInput
                    }
                    placeholder="e.g. Employee Onboarding"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      workflowForm.description
                    }
                    onChange={
                      handleWorkflowInput
                    }
                    placeholder="Describe this workflow"
                    rows="4"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-btn"
                  >
                    Create Workflow
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={
                      resetWorkflowForm
                    }
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="content-grid">
          <div className="content-card">
            <div className="task-header">
              <div>
                <h2>
                  Workflow List
                </h2>

                <p>
                  Select a workflow
                  to view its
                  steps.
                </p>
              </div>

              <button
                className="secondary-btn"
                onClick={
                  loadWorkflows
                }
              >
                Refresh
              </button>
            </div>

            {workflowsLoading ? (
              <p>
                Loading
                workflows...
              </p>
            ) : workflows.length ===
              0 ? (
              <div className="empty-state">
                <h3>
                  No workflows
                  found
                </h3>

                {user?.role ===
                  "admin" && (
                  <p>
                    Create your
                    first workflow
                    using "+ Create
                    Workflow".
                  </p>
                )}
              </div>
            ) : (
              <div className="workflow-list">
                {workflows.map(
                  (
                    workflow
                  ) => (
                    <div
                      key={
                        workflow.id
                      }
                      className="content-card"
                      style={{
                        cursor:
                          "pointer",

                        marginBottom:
                          "12px",

                        border:
                          selectedWorkflow?.id ===
                          workflow.id
                            ? "2px solid #2563eb"
                            : undefined,
                      }}
                      onClick={() =>
                        handleSelectWorkflow(
                          workflow
                        )
                      }
                    >
                      <h3>
                        #
                        {
                          workflow.id
                        }{" "}
                        {
                          workflow.name
                        }
                      </h3>

                      <p>
                        {workflow.description ||
                          "No description"}
                      </p>

                      <small>
                        Status:{" "}
                        {
                          workflow.status
                        }
                      </small>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="content-card">
            <div className="task-header">
              <div>
                <h2>
                  {selectedWorkflow
                    ? `Workflow Steps: ${selectedWorkflow.name}`
                    : "Workflow Steps"}
                </h2>

                <p>
                  {selectedWorkflow
                    ? "Manage the steps of the selected workflow."
                    : "Select a workflow from the list."}
                </p>
              </div>

              {selectedWorkflow &&
                user?.role ===
                  "admin" && (
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      if (
                        showStepForm
                      ) {
                        resetStepForm();
                      } else {
                        setStepForm({
                          task_id:
                            "",

                          step_number:
                            workflowSteps.length +
                            1,

                          title:
                            "",

                          description:
                            "",

                          assigned_to:
                            "",
                        });

                        setShowStepForm(
                          true
                        );
                      }
                    }}
                  >
                    {showStepForm
                      ? "Cancel"
                      : "+ Add Step"}
                  </button>
                )}
            </div>

            {selectedWorkflow &&
              showStepForm &&
              user?.role ===
                "admin" && (
                <form
                  className="task-form"
                  onSubmit={
                    handleCreateWorkflowStep
                  }
                >
                  <div className="form-group">
                    <label>
                      Step Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={
                        stepForm.title
                      }
                      onChange={
                        handleStepInput
                      }
                      placeholder="e.g. Complete documentation"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        stepForm.description
                      }
                      onChange={
                        handleStepInput
                      }
                      placeholder="Describe this workflow step"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Step Number
                      </label>

                      <input
                        type="number"
                        name="step_number"
                        min="1"
                        value={
                          stepForm.step_number
                        }
                        onChange={
                          handleStepInput
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Link Task
                      </label>

                      <select
                        name="task_id"
                        value={
                          stepForm.task_id
                        }
                        onChange={
                          handleStepInput
                        }
                      >
                        <option value="">
                          No Task
                        </option>

                        {tasks.map(
                          (task) => (
                            <option
                              key={
                                task.id
                              }
                              value={
                                task.id
                              }
                            >
                              #
                              {
                                task.id
                              }{" "}
                              -{" "}
                              {
                                task.title
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Assign Employee
                      </label>

                      <select
                        name="assigned_to"
                        value={
                          stepForm.assigned_to
                        }
                        onChange={
                          handleStepInput
                        }
                      >
                        <option value="">
                          Unassigned
                        </option>

                        {employees
                          .filter(
                            (
                              employee
                            ) =>
                              employee.role ===
                              "employee"
                          )
                          .map(
                            (
                              employee
                            ) => (
                              <option
                                key={
                                  employee.id
                                }
                                value={
                                  employee.id
                                }
                              >
                                {
                                  employee.name
                                }
                              </option>
                            )
                          )}
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="primary-btn"
                    >
                      Add Workflow
                      Step
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={
                        resetStepForm
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

            {!selectedWorkflow ? (
              <div className="empty-state">
                <h3>
                  No workflow
                  selected
                </h3>

                <p>
                  Select a workflow
                  to view its
                  steps.
                </p>
              </div>
            ) : workflowStepsLoading ? (
              <p>
                Loading workflow
                steps...
              </p>
            ) : workflowSteps.length ===
              0 ? (
              <div className="empty-state">
                <h3>
                  No steps found
                </h3>

                {user?.role ===
                  "admin" && (
                  <p>
                    Click "+ Add
                    Step" to create
                    the first step.
                  </p>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Step</th>
                      <th>Task</th>
                      <th>
                        Assigned To
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {workflowSteps.map(
                      (step) => (
                        <tr
                          key={
                            step.id
                          }
                        >
                          <td>
                            {
                              step.step_number
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                step.title
                              }
                            </strong>

                            {step.description && (
                              <div className="task-description">
                                {
                                  step.description
                                }
                              </div>
                            )}
                          </td>

                          <td>
                            {getTaskTitle(
                              step.task_id
                            )}
                          </td>

                          <td>
                            {getEmployeeName(
                              step.assigned_to
                            )}
                          </td>

                          <td>
                            {user?.role ===
                              "employee" &&
                            step.assigned_to ===
                              user.id ? (
                              <select
                                value={
                                  step.status
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleWorkflowStepStatusChange(
                                    step.id,
                                    e
                                      .target
                                      .value
                                  )
                                }
                              >
                                <option value="pending">
                                  Pending
                                </option>

                                <option value="in_progress">
                                  In Progress
                                </option>

                                <option value="completed">
                                  Completed
                                </option>
                              </select>
                            ) : (
                              <span
                                className={`status-badge ${step.status}`}
                              >
                                {step.status.replace(
                                  "_",
                                  " "
                                )}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // AI Assistant
  // =========================================================

  const renderAIAssistant =
    () => {
      return (
        <div className="main-content">
          <div className="topbar">
            <div>
              <h1>
                AI Assistant
              </h1>

              <p>
                Analyze employee
                tasks using Gemini AI
              </p>
            </div>

            <button
              className="logout-btn"
              onClick={
                handleLogout
              }
            >
              Logout
            </button>
          </div>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <div className="content-card">
            <div className="task-header">
              <div>
                <h2>
                  🤖 SmartOps AI
                  Assistant
                </h2>

                <p>
                  Select a task and
                  let Gemini analyze
                  its priority, effort,
                  breakdown and advice.
                </p>
              </div>

              <button
                className="secondary-btn"
                onClick={
                  loadTasks
                }
              >
                Refresh Tasks
              </button>
            </div>

            <div className="task-form">
              <div className="form-group">
                <label>
                  Select Task
                </label>

                <select
                  value={
                    aiSelectedTask
                  }
                  onChange={(e) => {
                    setAiSelectedTask(
                      e.target.value
                    );
                    setAiAnalysis("");
                    setMessage("");
                  }}
                >
                  <option value="">
                    Select a task
                  </option>

                  {tasks.map(
                    (task) => (
                      <option
                        key={
                          task.id
                        }
                        value={
                          task.id
                        }
                      >
                        #{task.id} -{" "}
                        {task.title}
                      </option>
                    )
                  )}
                </select>
              </div>

              {aiSelectedTask && (
                <div className="content-card">
                  {(() => {
                    const selectedTask =
                      tasks.find(
                        (task) =>
                          String(
                            task.id
                          ) ===
                          String(
                            aiSelectedTask
                          )
                      );

                    if (
                      !selectedTask
                    ) {
                      return null;
                    }

                    return (
                      <>
                        <h3>
                          {
                            selectedTask.title
                          }
                        </h3>

                        <p>
                          <strong>
                            Description:
                          </strong>{" "}
                          {selectedTask.description ||
                            "No description"}
                        </p>

                        <p>
                          <strong>
                            Priority:
                          </strong>{" "}
                          {
                            selectedTask.priority
                          }
                        </p>

                        <p>
                          <strong>
                            Status:
                          </strong>{" "}
                          {
                            selectedTask.status
                          }
                        </p>

                        <p>
                          <strong>
                            Due Date:
                          </strong>{" "}
                          {formatDate(
                            selectedTask.due_date
                          )}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="primary-btn"
                  onClick={
                    handleAnalyzeTask
                  }
                  disabled={
                    aiLoading ||
                    !aiSelectedTask
                  }
                >
                  {aiLoading
                    ? "Analyzing with Gemini..."
                    : "✨ Analyze Task with AI"}
                </button>

                {aiAnalysis && (
                  <button
                    className="secondary-btn"
                    onClick={
                      clearAiAnalysis
                    }
                  >
                    Clear Analysis
                  </button>
                )}
              </div>
            </div>
          </div>

          {aiLoading && (
            <div className="content-card">
              <h2>
                🤖 Gemini is analyzing
                the task...
              </h2>

              <p>
                Please wait while
                SmartOps generates the
                task analysis.
              </p>
            </div>
          )}

          {aiAnalysis && (
            <div className="content-card">
              <h2>
                🧠 AI Analysis
              </h2>

              <div
                style={{
                  whiteSpace:
                    "pre-wrap",
                  lineHeight:
                    "1.7",
                }}
              >
                {aiAnalysis}
              </div>
            </div>
          )}

          {!aiAnalysis &&
            !aiLoading &&
            tasks.length > 0 && (
              <div className="content-card">
                <h2>
                  How AI Assistant
                  works
                </h2>

                <p>
                  1. Select an
                  employee task.
                </p>

                <p>
                  2. Click
                  <strong>
                    {" "}
                    Analyze Task
                    with AI
                  </strong>
                  .
                </p>

                <p>
                  3. Gemini analyzes
                  the task.
                </p>

                <p>
                  4. SmartOps displays
                  priority, estimated
                  effort, task breakdown
                  and helpful advice.
                </p>
              </div>
            )}

          {!tasksLoading &&
            tasks.length === 0 && (
              <div className="content-card">
                <h2>
                  No tasks available
                </h2>

                <p>
                  Create or assign a
                  task first, then
                  return here for AI
                  analysis.
                </p>
              </div>
            )}
        </div>
      );
    };

  // =========================================================
  // Profile
  // =========================================================

  const renderProfile = () => {
    return (
      <div className="main-content">
        <div className="topbar">
          <div>
            <h1>
              Profile
            </h1>

            <p>
              Your SmartOps account
              information
            </p>
          </div>

          <button
            className="logout-btn"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <div className="content-card">
          <h2>
            Account Information
          </h2>

          <p>
            <strong>
              User ID:
            </strong>{" "}
            {user?.user_id}
          </p>

          <p>
            <strong>
              Name:
            </strong>{" "}
            {user?.name}
          </p>

          <p>
            <strong>
              Email:
            </strong>{" "}
            {user?.email}
          </p>

          <p>
            <strong>
              Role:
            </strong>{" "}
            {user?.role}
          </p>
        </div>
      </div>
    );
  };

  // =========================================================
  // Login Screen
  // =========================================================

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>
            SmartOps
          </h1>

          <div className="sidebar-subtitle">
            AI-Powered Employee Task
            Management System
          </div>

          <form
            onSubmit={
              handleLogin
            }
          >
            <div className="form-group">
              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Password
              </label>

              <input
                type="password"
                value={
                  password
                }
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={
                loading
              }
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>
          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // Main Dashboard Layout
  // =========================================================

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>
            SmartOps
          </h2>

          <div className="sidebar-subtitle">
            Management System
          </div>
        </div>

        <nav>
          <button
            className={
              activePage ===
              "Dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Dashboard"
              )
            }
          >
            Dashboard
          </button>

          {user.role ===
            "admin" && (
            <button
              className={
                activePage ===
                "Employees"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActivePage(
                  "Employees"
                )
              }
            >
              Employees
            </button>
          )}

          <button
            className={
              activePage ===
              "Tasks"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Tasks"
              )
            }
          >
            Tasks
          </button>

          <button
            className={
              activePage ===
              "Workflows"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Workflows"
              )
            }
          >
            Workflows
          </button>

          <button
            className={
              activePage ===
              "AI Assistant"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "AI Assistant"
              )
            }
          >
            AI Assistant
          </button>

          <button
            className={
              activePage ===
              "Profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Profile"
              )
            }
          >
            Profile
          </button>
        </nav>

        <div className="sidebar-footer">
          <div>
            {user.name}
          </div>

          <small>
            {user.role}
          </small>
        </div>
      </aside>

      {activePage ===
        "Dashboard" &&
        renderDashboard()}

      {activePage ===
        "Employees" &&
        user.role ===
          "admin" &&
        renderEmployees()}

      {activePage ===
        "Tasks" &&
        renderTasks()}

      {activePage ===
        "Workflows" &&
        renderWorkflows()}

      {activePage ===
        "AI Assistant" &&
        renderAIAssistant()}

      {activePage ===
        "Profile" &&
        renderProfile()}
    </div>
  );
}

export default App;
