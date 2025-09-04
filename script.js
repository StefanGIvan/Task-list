const form = document.querySelector(".task-form");
const input = document.querySelector(".task-input");
const template =
  document.querySelector(".task-template").content.firstElementChild;
const ulist = document.querySelector(".task-list");

let tasks = [];
let count = 1;
function newTaskId() {
  return count++;
}

function headerVisibility() {
  const header = document.querySelector(".task-header");
  if (!header) return;
  //show if we have at least one task on DOM/hide if none
  if (tasks.length > 0) header.classList.remove("task-header-hidden");
  else header.classList.add("task-header-hidden");
}

function addTask(task) {
  const li = template.cloneNode(true);
  li.dataset.id = task.id;

  const checkbox = li.querySelector(".task-checkbox");
  checkbox.checked = !!task.completed;

  checkbox.addEventListener("change", () => {
    const t = tasks.find((t) => t.id === task.id);
    if (t) t.completed = checkbox.checked;
    persist(); // keep storage persistent
  });

  const titleSpan = li.querySelector(".task-title");
  titleSpan.textContent = task.title;

  const delBtn = li.querySelector(".task-delete-btn");
  delBtn.addEventListener("click", () => {
    deleteTask(task.id);
    li.remove();
    persist();
  });

  const editBtn = li.querySelector(".task-edit-btn");
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
  headerVisibility(); //check
}
//put the array in localStorage
function persist() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

//take the string array from the localStorage
function load() {
  const stored = localStorage.getItem("tasks");

  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
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
