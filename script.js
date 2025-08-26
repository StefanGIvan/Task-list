const form = document.getElementById("form");
const input = document.getElementById("task");
const list = document.getElementById("list");

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

  const label = document.createElement("label");
  label.classList.add("task");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("task-checkbox");

  const spanText = document.createElement("span");
  spanText.classList.add("task-title");
  spanText.textContent = text;

  label.appendChild(checkbox);
  label.appendChild(spanText);

  const delBtn = document.createElement("button");
  delBtn.classList.add("delete-btn");
  delBtn.innerHTML = `<img src="trashcan.svg" alt="Delete Button" class="delete-icon"/>`;

  checkbox.addEventListener("change", () => {
    li.classList.toggle("completed", checkbox.checked);
  });

  delBtn.addEventListener("click", () => {
    li.remove();
  });

  li.appendChild(label);
  li.appendChild(delBtn);
  list.appendChild(li);
}
