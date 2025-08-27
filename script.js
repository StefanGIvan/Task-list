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
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const text = input.value.trim();
  if (text === "") return;

  addTask(text);
  input.value = "";
});

function addTask(text) {
  const li = template.cloneNode(true);
  li.dataset.id = newTaskId();

  const checkbox = li.querySelector(".task-checkbox");
  checkbox.type = "checkbox";

  checkbox.addEventListener("change", () => {
    li.classList.toggle("completed", checkbox.checked);
  });

  li.querySelector(".task-title").textContent = text;

  const delBtn = li.querySelector(".delete-btn");
  delBtn.addEventListener("click", () => {
    li.remove();
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
