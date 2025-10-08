export function formListener(event) {
  event.preventDefault();
  this.logger.log("[formListener] Form submitted");

  const text = this.taskInputField.value.trim();
  if (!text) {
    this.logger.log("[formListener] text is false: " + text);
    return;
  }

  const selectedOption =
    this.taskCategorySelect.options[this.taskCategorySelect.selectedIndex]; //take the index of the option selected
  const categoryId = selectedOption.value; //value = "high" | "medium" | "low"

  this.logger.log(
    "[formListener] Adding task: " + text + " with category: " + categoryId
  );

  this.appendTask(text, categoryId); //same name everywhere*

  this.logger.log("[formListener] Task appended successfully");

  this.taskInputField.value = "";
  this.taskCategorySelect.selectedIndex = 0; //back to placeholder ""
}

export function appendTask(text, categoryId) {
  const task = {
    title: text.trim(), //*title or text everywhere/2 words in name
    checked: false,
    completed: false,
    createdAt: new Date().toISOString(), //create a date instance and convert to string in ISO format(lexicographically)
    category: categoryId, //variable so we can change dynamically which part of map we refer to; we use categoryValue for reference at categoryMapping
    subtasks: [], //create a subtask array for each task
  };

  this.taskArray.push(task);
  this.applyCurrentSort();

  this.render();
  this.persist();

  this.headerVisibility();
}

export function renderTask(task) {
  //li
  const taskLi = this.itemTemplateLi.cloneNode(true);

  //checkbox
  const taskCheckbox = taskLi.querySelector(".task-checkbox");
  taskCheckbox.checked = task.checked;

  taskCheckbox.addEventListener("change", () => {
    //getting the source of truth from the array
    const index = this.taskArray.indexOf(task);

    this.taskArray[index].checked = taskCheckbox.checked;

    this.logger.log("[renderTask] Task checkbox nr. " + index + " is checked");

    this.persist();
  });

  //span and label
  const titleSpan = taskLi.querySelector(".task-title");
  const labelSpan = taskLi.querySelector(".task-label");

  titleSpan.textContent = task.title;
  labelSpan.textContent = this.categoryMapping[task.category].label;

  //add button and ul for the subtasks
  const addSubBtn = taskLi.querySelector(".add-subtask-btn");

  //helper to create subtask Ul only when needed
  const createSubtaskContainer = () => {
    const subUlListEl = document.createElement("ul");
    subUlListEl.className = "subtask-container";

    taskLi.appendChild(subUlListEl);

    return subUlListEl;
  };

  //if subtasks do not exist, create array
  if (!Array.isArray(task.subtasks)) {
    task.subtasks = [];
  }

  //if we have any subtasks in this task, call function to create them and then renderSubtask for each
  if (task.subtasks.length > 0) {
    const subUlListEl = createSubtaskContainer();

    task.subtasks.forEach((subtask) =>
      this.renderSubtask(task, subtask, subUlListEl)
    );
  }

  //button for adding subtasks
  addSubBtn.addEventListener("click", () => {
    const createdUl = createSubtaskContainer();
    this.appendSubtask(task, createdUl, "");
  });

  const editBtn = taskLi.querySelector(".task-edit-btn");
  editBtn.addEventListener("click", (event) => {
    if (task.completed) {
      return;
    }

    const eventEditBtn = event.currentTarget; //target btn if img is clicked
    if (!eventEditBtn) {
      this.logger.error("[renderTask] Edit button is false: " + eventEditBtn);
    }
    eventEditBtn.classList.add("active");

    titleSpan.contentEditable = true;
    titleSpan.focus();

    const finishedEditing = () => {
      eventEditBtn.classList.remove("active");

      titleSpan.contentEditable = false;
      const index = this.taskArray.indexOf(task);

      if (task) {
        this.taskArray[index].title = titleSpan.textContent.trim();
      }

      //Remove event listeners
      titleSpan.removeEventListener("blur", finishedEditing);
      titleSpan.removeEventListener("keydown", onEnter);

      this.logger.log("[renderTask][finishedEditing] Task edited");

      this.persist();
    };

    //If enter is hit, end the editing process
    const onEnter = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishedEditing();
      }
    };

    //Add event listeners
    titleSpan.addEventListener("blur", finishedEditing);
    titleSpan.addEventListener("keydown", onEnter);
  });

  const delBtn = taskLi.querySelector(".task-delete-btn");
  delBtn.addEventListener("click", () => {
    const index = this.taskArray.indexOf(task);
    this.handleDeleteTask(index, taskLi);
  });

  //These should apply whenever we render, so best place is here
  taskLi.classList.toggle("completed", task.completed);
  editBtn.classList.toggle("low-opacity", task.completed);
  labelSpan.classList.toggle("low-opacity", task.completed);
  editBtn.disabled = task.completed;

  this.taskUlList.appendChild(taskLi);
}

//Delete a specific object from the array
export function deleteTask(index) {
  this.logger.log(
    "[deleteTask] Task: " + this.taskArray[index] + " will be deleted"
  );

  this.taskArray.splice(index, 1);
}

export function handleDeleteTask(index, li) {
  const task = this.taskArray[index];

  //check if the subtasks are completed
  if (!this.taskDone(task)) {
    this.logger.error(
      "[handleDeleteTask] Subtasks are not completed, task cannot be deleted"
    );
    return;
  }

  this.deleteTask(index);

  this.logger.log("[handleDeleteTask] Task deleted successfully");

  this.persist();
  li.remove(); //done like this because it's just for a single element, instead of calling render()
  this.headerVisibility();
}
