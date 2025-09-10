class TaskList {
  constructor(taskListId) {
    if (!taskListId) {
      console.error("taskListId is falsy");
    } else {
      console.log("Initializing TaskList");
    }

    this.taskListId = taskListId;
    this.taskArray = [];
    this.nextId = 1;

    this.form = document.querySelector(".task-form"); //
    this.input = document.querySelector(".task-input");
    this.template =
      document.querySelector(".task-template").content.firstElementChild;
    this.ulist = document.querySelector(".task-list");

    this.loadLocalStorage();
    this.formListener();
  }

  loadLocalStorage() {
    const stored = localStorage.getItem(this.taskListId);
    console.log("Got local storage item", this.taskListId);

    if (!stored) {
      console.log("stored was falsy");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      console.log("local storage was parsed");

      if (Array.isArray(parsed)) {
        this.taskArray = parsed;
        console.log("taskArray was loaded with the parsed version");
      }
    } catch (err) {
      console.error("Could not parse taskArray from localStorage.");
    }
    const id = Math.floor(Math.random() * 1000000);
    this.nextId = id;
    console.log("Allocated nextId");
    this.render();
  }

  render() {
    this.ulist.innerHTML = ""; //wipe out HTML inside the list to not get duplicates
    this.taskArray.forEach((task) => this.renderTask(task));
    console.log("All tasks rendered succesfully");

    this.headerVisibility();
  }

  newTaskId() {
    return this.nextId++;
  }

  deleteTask(id) {
    this.taskArray = this.taskArray.filter((task) => task.id !== id);
    console.log("An object was deleted");
    this.headerVisibility();
  }

  headerVisibility() {
    const header = document.querySelector(".header-container");
    if (!header) {
      console.log("header is falsy");
      return;
    }

    if (this.taskArray.length > 0) {
      header.classList.remove("header-container-hidden");
      console.log("header NOT hidden");
    } else {
      header.classList.add("header-container-hidden");
      console.log("header hidden removed");
    }
  }

  persist() {
    localStorage.setItem(this.taskListId, JSON.stringify(this.taskArray));
    console.log("local storage was updated");
  }

  handleDeleteTask(taskItem, li) {
    this.deleteTask(taskItem);
    this.persist();
    li.remove();
  }

  renderTask(task) {
    const li = this.template.cloneNode(true);
    li.dataset.id = task.id;

    const checkbox = li.querySelector(".task-checkbox");
    checkbox.checked = !!task.completed;

    checkbox.addEventListener("change", () => {
      const foundTask = this.taskArray.find(
        (taskItem) => taskItem.id === task.id
      );
      if (foundTask) {
        foundTask.completed = checkbox.checked;
        console.log("Object nr.:" + foundTask.id + " completed");
      }
      this.persist();
    });

    const titleSpan = li.querySelector(".task-title");
    titleSpan.textContent = task.title;

    const delBtn = li.querySelector(".task-delete-btn");
    delBtn.addEventListener("click", () => this.handleDeleteTask(task.id, li));

    const editBtn = li.querySelector(".task-edit-btn");
    editBtn.addEventListener("click", () => {
      titleSpan.contentEditable = true;
      titleSpan.focus();

      const finishedEditing = () => {
        titleSpan.contentEditable = false;
        const foundTask = this.taskArray.find(
          (taskItem) => taskItem.id === task.id
        );
        if (foundTask) {
          foundTask.title = titleSpan.textContent.trim();
        }
        titleSpan.removeEventListener("blur", finishedEditing);
        titleSpan.removeEventListener("keydown", onEnter);
        this.persist();
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
    this.ulist.appendChild(li);
    this.headerVisibility();
  }

  appendTask(text) {
    const task = {
      id: this.newTaskId(),
      title: text.trim(),
      completed: false,
    };

    this.taskArray.push(task);
    this.renderTask(task);
    this.persist();
    this.headerVisibility();
  }

  formListener() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) {
        console.log("text is falsy: ", typeof text);
        return;
      }
      this.appendTask(text);
      this.input.value = "";
    });
  }
}

new TaskList("taskArray");
