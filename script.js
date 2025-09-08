const form = document.querySelector(".task-form");
const input = document.querySelector(".task-input");
const template =
  document.querySelector(".task-template").content.firstElementChild;
const ulist = document.querySelector(".task-list");

let taskArray = [];
let nextId = 1;
function newTaskId() {
  return nextId++;
}

function headerVisibility() {
  const header = document.querySelector(".header-container");
  if (!header) {
    return;
  }

  if (taskArray.length > 0) {
    header.classList.remove("header-container-hidden");
  } else {
    header.classList.add("header-container-hidden");
  }
}

function renderTask(task) {
  const li = template.cloneNode(true);
  li.dataset.id = task.id;

  const checkbox = li.querySelector(".task-checkbox");
  checkbox.checked = !!task.completed;

  checkbox.addEventListener("change", () => {
    const foundTask = taskArray.find((taskItem) => taskItem.id === task.id);
    if (foundTask) {
      foundTask.completed = checkbox.checked;
    }
    persist();
  });

  const titleSpan = li.querySelector(".task-title");
  titleSpan.textContent = task.title;

  const delBtn = li.querySelector(".task-delete-btn");
  delBtn.addEventListener("click", () => handleDeleteTask(task.id, li));

  const editBtn = li.querySelector(".task-edit-btn");
  editBtn.addEventListener("click", () => {
    titleSpan.contentEditable = true;
    titleSpan.focus();

    const finishedEditing = () => {
      titleSpan.contentEditable = false;
      const foundTask = taskArray.find((taskItem) => taskItem.id === task.id);
      if (foundTask) {
        foundTask.title = titleSpan.textContent.trim();
      }
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
  ulist.appendChild(li);
  headerVisibility();
}

function appendTask(text) {
  const task = {
    id: newTaskId(),
    title: text.trim(),
    completed: false,
  };
  taskArray.push(task);
  renderTask(task);
}

function deleteTask(id) {
  taskArray = taskArray.filter((task) => task.id !== id);
  headerVisibility();
}

function persist() {
  localStorage.setItem("taskArray", JSON.stringify(taskArray));
}

function handleDeleteTask(taskItem, li) {
  deleteTask(taskItem);
  persist();
  li.remove();
}

function load() {
  const stored = localStorage.getItem("taskArray");

  if (!stored) return;

  try {
    const parsed = JSON.parse(stored); //what kind of objects are in the array
    if (Array.isArray(parsed)) {
      taskArray = parsed;

      let maxId = 0;
      taskArray.forEach((task) => {
        const idNum = Number(task.id);
        if (idNum > maxId) {
          maxId = idNum;
        }
      });
      nextId = maxId + 1;
      taskArray.forEach((task) => renderTask(task));
    }
  } catch (err) {
    console.error("Could not parse taskArray from localStorage.");
  }
  headerVisibility();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  appendTask(text);
  persist();
  input.value = "";
});

load();
