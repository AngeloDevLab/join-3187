

let todos = [
  {
    id: 0,
    title: "Kochwelt Page & Recipe Recommender",
    description: "Build start page with recipe recommendation...",
    type: "User Story",
    category: "inProgress",
    subtasks: "1/2 Subtasks",
    priority: "=",
  },
  {
    id: 1,
    title: "HTML Base Template Creation",
    description: "Create reusable HTML base templates...",
    type: "Technical Task",
    category: "awaitFeedback",
    subtasks: "",
    priority: "⌄",
  },
  {
    id: 2,
    title: "Daily Kochwelt Recipe",
    description: "Implement daily recipe and portion calculator...",
    type: "User Story",
    category: "awaitFeedback",
    subtasks: "",
    priority: "=",
  },
  {
    id: 3,
    title: "CSS Architecture Planning",
    description: "Define CSS naming conventions and structure...",
    type: "Technical Task",
    category: "done",
    subtasks: "2/2 Subtasks",
    priority: "⌃",
  },
];

let currentDraggedElement;

function updateHtml() {
  renderColumn("todo");
  renderColumn("inProgress");
  renderColumn("awaitFeedback");
  renderColumn("done");
}

function renderColumn(category) {
  const column = todos.filter((todo) => todo.category === category);
  const container = document.getElementById(category);

  container.innerHTML = "";

  if (column.length === 0 && category === "todo") {
    container.innerHTML = `<div class="empty-task">No tasks To do</div>`;
    return;
  }

  for (let i = 0; i < column.length; i++) {
    container.innerHTML += generateTodoHtml(column[i]);
  }
}

function generateTodoHtml(todo) {
  const categoryClass =
    todo.type === "User Story" ? "user-story" : "technical";

  return `
    <div class="task-card" draggable="true" ondragstart="startDragging(${todo.id})">
      <span class="task-category ${categoryClass}">${todo.type}</span>
      <h4>${todo.title}</h4>
      <p>${todo.description}</p>

      ${
        todo.subtasks
          ? `
          <div class="progress-row">
            <div class="progress-bar"><div></div></div>
            <span>${todo.subtasks}</span>
          </div>
        `
          : ""
      }

      <div class="card-bottom">
        <div>
          <span class="avatar orange">AM</span>
          <span class="avatar green">EM</span>
          <span class="avatar purple">MB</span>
        </div>
        <span class="priority">${todo.priority}</span>
      </div>
    </div>
  `;
}

function startDragging(id) {
  currentDraggedElement = id;
}

function allowDrop(event) {
  event.preventDefault();
}

function moveTo(category) {
  const todo = todos.find((todo) => todo.id === currentDraggedElement);
  todo.category = category;
  updateHtml();
}