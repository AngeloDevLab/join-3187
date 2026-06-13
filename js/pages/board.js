let tasks = [];
let contacts = {};
let currentDraggedElement;

async function init(){
  await loadTasks();
  await loadContacts();
  updateHtml()

console.log(tasks[3].assignedTo);
console.log(contacts["contact1"].name);

}

async function loadContacts(){
  const response = await fetch(`${DB_URL}contacts.json`);
  contacts = await response.json();

  console.log("contacts", contacts);

}

async function loadTasks(){
  const response = await fetch(`${DB_URL}tasks.json`);
   const data = await response.json();

  tasks = Object.values(data);

  console.log("tasks", tasks);
  
}

function updateHtml() {
  renderColumn("todo", "todo");
  renderColumn("inprogress", "inProgress");
  renderColumn("awaitingfeedback", "awaitFeedback");
  renderColumn("done", "done");
}


function renderColumn(columnName, ContainerId) {
  const columnTasks = tasks.filter((tasks) => tasks.column === columnName);
  const container = document.getElementById(ContainerId);
  container.innerHTML = "";

   if (columnTasks.length === 0) {
    container.innerHTML = `<div class="empty-task">No tasks</div>`;
    return;
  }

  for (let i = 0; i < columnTasks.length; i++) {
    const originalIndex = tasks.indexOf(columnTasks[i]);
    container.innerHTML += generateTodoHtml(columnTasks[i], originalIndex);
  }
}

 function generateTodoHtml(todo, index){
  const categoryClass = 
  todo.category === "userStory" ? "user-story" : "technical";

  return `
    <div class="task-card" draggable="true" ondragstart="startDragging(${index})">
      <span class="task-category ${categoryClass}">
        ${formatCategory(todo.category)}
      </span>

      <h4>${todo.title}</h4>
      <p>${todo.description}</p>

      ${generateSubtasksHtml(todo.subtasks)}

      <div class="card-bottom">
        <div>
          ${generateAssignedUsersHtml(todo.assignedTo)}
        </div>
        <span class="priority">${formatPriority(todo.priority)}</span>
      </div>
    </div>
  `;
}

function generateAssignedUsersHtml(assignedTo) {
  if (!assignedTo) return "";

  let html = "";

  for (let i = 0; i < assignedTo.length; i++) {
    const contactId = assignedTo[i];
    const contact = contacts[contactId];

    if (contact) {
      html += `<span class="avatar orange">${getInitials(contact.name)}</span>`;
    }
  }

  return html;
}

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function generateSubtasksHtml(subtasks) {
  if (!subtasks) return "";

  const subtaskArray = Object.values(subtasks);
  const doneTasks = subtaskArray.filter((subtask) => subtask.done).length;
  const allTasks = subtaskArray.length;

  return `
    <div class="progress-row">
      <div class="progress-bar">
        <div style="width: ${(doneTasks / allTasks) * 100}%"></div>
      </div>
      <span>${doneTasks}/${allTasks} Subtasks</span>
    </div>
  `;
}

function formatCategory(category) {
  if (category === "userStory") return "User Story";
  return "Technical Task";
}

function formatPriority(priority) {
  if (priority === "urgent") return "⌃";
  if (priority === "medium") return "=";
  if (priority === "low") return "⌄";
  return priority;
}

function startDragging(index) {
  currentDraggedElement = index;
}

function allowDrop(event) {
  event.preventDefault();
}

function moveTo(columnName) {
  tasks[currentDraggedElement].column = columnName;
  updateHtml();
}

init();