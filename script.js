const form = document.getElementById("form");
const input = document.getElementById("task");
const list = document.getElementById("list");

let tasksArray = [];

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
  const li = document.createElement("li");
  li.classList.add("item");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("task-checkbox");

  const spanText = document.createElement("span");
  spanText.classList.add("task-title");
  spanText.textContent = text;

  li.appendChild(checkbox);
  li.appendChild(spanText);

  const delBtn = document.createElement("button");
  delBtn.classList.add("delete-btn");
  delBtn.innerHTML = `<img src="trashcan.svg" alt="Delete Button" class="delete-icon"/>`;

  const editBtn = document.createElement("button");
  editBtn.classList.add("edit-btn");
  editBtn.innerHTML = `<img src="pencil.svg " alt="Edit Button" class="edit-icon"/>`;

  checkbox.addEventListener("change", () => {
    li.classList.toggle("completed", checkbox.checked);
  });

  delBtn.addEventListener("click", () => {
    li.remove();
  });

  //code for editing tasks
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

  li.appendChild(delBtn);
  li.appendChild(editBtn);
  list.appendChild(li);
}
