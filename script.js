const form = document.getElementsByClassName("form");
const input = document.getElementsByClassName("task");
const template =
  document.getElementsByClassName("task-template").content.firstElementChild;
const ulist = document.getElementById("task-list");
console.log("widget initializing");
let tasks = [];
let count = 1;
function newTaskId() {
  return count++;
}

function getOrCreateHeader() {
  //If it already exists, we show it
  let header = document.querySelector(".list-header");
  if (header) return header;

  //Create once
  header = document.createElement("div");
  header.className = "list-header-hidden";
  header.innerHTML = `
  <span>Select</span>
  <span>Task</task>
  <span class="actions-title">Actions</span>`;

  ulist.parentElement.insertBefore(header, ulist);
  return header;
}

function headerVisibility() {
  const header = getOrCreateHeader();
  //show if we have at least one task on DOM/hide if none
  if (tasks.length > 0) header.classList.remove("hidden");
  else header.classList.add("hidden");
}

function addTask(task) {
  console.log("adding task");
  const li = template.cloneNode(true);
  li.dataset.id = task.id;

  const checkbox = li.querySelector(".task-checkbox");
  checkbox.checked = !!task.completed;

  checkbox.addEventListener("change", () => {
    const t = tasks.find((t) => t.id === task.id);
    if (t) t.completed = checkbox.checked;
    li.classList.toggle("completed", checkbox.checked);
    persist(); // keep storage persistent
  });

  const titleSpan = li.querySelector(".task-title");
  titleSpan.textContent = task.title;

  const delBtn = li.querySelector(".delete-btn");
  delBtn.addEventListener("click", () => {
    deleteTask(task.id);
    li.remove();
    persist();
  });

  const editBtn = li.querySelector(".edit-btn");
  editBtn.addEventListener("click", () => {
    titleSpan.contentEditable = true;
    titleSpan.focus();

    const finishedEditing = () => {
      titleSpan.contentEditable = false;
      const t = tasks.find((t) => t.id === task.id);
      if (t) t.title = titleSpan.textContent.trim();
      titleSpan.removeEventListener("blur", finishedEditing);
      titleSpan.removeEventListener("keydown", onEnter);
      persist();
    };

    const onEnter = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishedEditing();
      }
    };
    titleSpan.addEventListener("blur", finishedEditing);
    titleSpan.addEventListener("keydown", onEnter);
  });
  li.classList.toggle("completed", task.completed);
  ulist.appendChild(li);
  headerVisibility();
}
//update the Array
function updateArray(text) {
  const task = {
    id: newTaskId(),
    title: text.trim(),
    completed: false,
  };
  tasks.push(task);
  addTask(task);
}

//delete a certain list
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  headerVisibility();
}
//put the array in localStorage
function persist() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

//take the string array from the localStorage
function load() {
  const stored = localStorage.getItem("tasks");

  if (!stored) {
    console.log("node tasks in memory");
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      console.log("tasks in memory: " + tasks.length);
      tasks = parsed;

      const maxId = tasks.reduce(
        (acc, t) => Math.max(acc, Number(t.id) || 0),
        0
      );
      count = maxId + 1; // complexitate
      tasks.forEach((task) => addTask(task));
    }
  } catch (err) {
    console.error("Could not parse tasks from localStorage.");
  }
  headerVisibility();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  updateArray(text);
  persist();
  input.value = "";
});

load();
