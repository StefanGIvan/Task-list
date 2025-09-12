class TaskList {
  constructor(taskListId) {
    //taskListId representing storageKey
    this.storageKey = taskListId;
    //Here we pass the element from DOM
    this.rootEl = document.getElementById(taskListId);
    if (!this.rootEl) {
      console.error(`No element with id: "${taskListId}" found`);
    }

    //const widgetTemplate =  target widget template node, if falsy -> error
    const widgetTemplate = document.querySelector(".tasks-widget-template");
    if (!widgetTemplate) {
      console.error("Widget template not found");
      return;
    }

    //Clone widget template and add on screen in div
    const cloneWidgetTemplate =
      widgetTemplate.content.firstElementChild.cloneNode(true);
    this.rootEl.appendChild(cloneWidgetTemplate);

    //Check itemTemplate
    const itemTemplate = document.querySelector(".task-template");
    if (!itemTemplate) {
      //de completat
      console.error("task-template not found");
      return;
    }
    //Take the first child of the itemTemplate
    this.itemTemplateEl = itemTemplate.content.firstElementChild;

    //Selecting the widget template elements from
    this.form = this.rootEl.querySelector(".task-form");
    this.input = this.rootEl.querySelector(".task-input");
    this.ulist = this.rootEl.querySelector(".task-list");

    //State
    this.taskArray = [];
    this.nextId = 1;

    //Boot the App
    this.loadLocalStorage();
    this.formListener();
  }

  loadLocalStorage() {
    const stored = localStorage.getItem(this.storageKey);
    console.log("Got local storage item", this.storageKey);

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

  headerVisibility() {
    const header = this.rootEl.querySelector(".header-container");
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

  formListener() {
    if (!this.form) {
      return;
    }
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

  newTaskId() {
    return this.nextId++;
  }

  renderTask(task) {
    const li = this.itemTemplateEl.cloneNode(true);
    li.dataset.id = task.id;

    const checkbox = li.querySelector(".task-checkbox");
    checkbox.checked = !!task.completed;

    checkbox.addEventListener("change", () => {
      const foundTask = this.taskArray.find(
        (taskItem) => taskItem.id === task.id
      );
      if (foundTask) {
        foundTask.completed = checkbox.checked;
        console.log(
          `Object nr.: ${foundTask.id} completed = ${foundTask.completed}`
        );
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
          console.log("titleSpan was trimmed");
        } else {
          console.log("titleSpan was NOT trimmed");
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

  persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.taskArray));
    console.log("local storage was updated");
  }

  deleteTask(id) {
    this.taskArray = this.taskArray.filter((task) => task.id !== id);
    console.log("An object was deleted");
    this.headerVisibility();
  }

  handleDeleteTask(taskItem, li) {
    this.deleteTask(taskItem);
    this.persist();
    li.remove();
  }
}

new TaskList("groceryList");
new TaskList("toDoList");
