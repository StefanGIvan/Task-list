const form = document.getElementById("form");
const input = document.getElementById("task");
const template =
  document.getElementById("task-template").content.firstElementChild;
const ulist = document.getElementById("task-list");

const tasks = [];
let count = 1;
function newTaskId() {
  return count++;
}

// const modelTask = {
//   title: "Sample Task",
//   completed: false,
// };

//todo: array JS to keep state
//template model

function addTask(text) {
  const li = template.cloneNode(true);
  li.dataset.id = newTaskId(); //count & assign id

  const checkbox = li.querySelector(".task-checkbox");
  checkbox.type = "checkbox";

  checkbox.addEventListener("change", () => {
    tasks.completed = checkbox.checked;
    li.classList.toggle("completed", checkbox.checked);
    persist(); // keep storage persistent
  });

  li.querySelector(".task-title").textContent = text;

  const delBtn = li.querySelector(".delete-btn");
  delBtn.addEventListener("click", () => {
    deleteTask(tasks.id); //
    li.remove();
    persist(); //
  });

  const editBtn = li.querySelector(".edit-btn");
  editBtn.addEventListener("click", () => {
    const span = li.querySelector(".task-title");
    span.contentEditable = true;
    span.focus();

    const finishedEditing = () => {
      span.contentEditable = false;
      span.removeEventListener("blur", finishedEditing);
      span.removeEventListener("keydown", onEnter);
      task.title = span.textContent.trim(); //
    };

    const onEnter = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishedEditing();
      }
    };
    span.addEventListener("blur", finishedEditing);
    span.addEventListener("keydown", onEnter);
  });
  ulist.appendChild(li);
}
//update the Array
function updateArray(text) {
  const task = {
    id: count,
    title: text.trim(),
    completed: false,
  };
  tasks.push(task);
  addTask(task);
}

//delete a certain list
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
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
      tasks.forEach((task) => addTask(task));
    }
  } catch (_) {
    console.error("Could not parse tasks from localStorage.");
  }
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
