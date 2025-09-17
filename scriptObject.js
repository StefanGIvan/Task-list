//logger class with enable, prefix and message parameters
class Logger {
  constructor(enabled = true, prefix = "") {
    this.enabled = enabled; //true = log to console, false = don't show anything
    this.prefix = prefix; //used for the constructor parameter of TaskList
  }

  log(message) {
    if (!this.enabled) {
      return;
    }
    if (this.prefix) {
      console.log(this.prefix + message);
    } else {
      console.log(message);
    }
  }

  error(message) {
    if (!this.enabled) {
      return;
    }
    if (this.prefix) {
      console.error(this.prefix + message);
    } else {
      console.error(message);
    }
  }
}

class TaskList {
  constructor(taskListId) {
    this.logger = new Logger(true, `[${taskListId}]`); //each TaskList has its own logger

    this.storageKey = taskListId; //taskListId representing storageKey

    this.rootEl = document.getElementById(taskListId); //Here we pass the element from DOM
    if (!this.rootEl) {
      this.logger.error(`No element with id: "${taskListId}" found`);
    }

    //const widgetTemplate =  target widget template node, if falsy -> error
    const widgetTemplate = document.querySelector(".tasks-widget-template");
    if (!widgetTemplate) {
      this.logger.error("Widget template not found");
      return;
    }

    //Clone widget template and add on screen in div
    const cloneWidgetTemplate =
      widgetTemplate.content.firstElementChild.cloneNode(true);
    this.rootEl.appendChild(cloneWidgetTemplate);

    //Select title for change content
    const listTitle = this.rootEl.querySelector(".task-widget-title");
    if (listTitle) {
      listTitle.textContent = taskListId;
    }

    //Check itemTemplate
    const itemTemplate = document.querySelector(".task-template");
    if (!itemTemplate) {
      this.logger.error("task-template not found");
      return;
    }
    //Take the first child of the itemTemplate
    this.itemTemplateEl = itemTemplate.content.firstElementChild;

    //Selecting the widget template elements from
    this.input = this.rootEl.querySelector(".task-input");
    this.ulList = this.rootEl.querySelector(".task-list");
    this.form = this.rootEl.querySelector(".task-form");
    if (this.form) {
      this.form.addEventListener("submit", (event) => this.formListener(event));
    }

    this.bulkCompleteBtn = this.rootEl.querySelector(".bulk-complete-btn");
    if (this.bulkCompleteBtn) {
      this.bulkCompleteBtn.addEventListener("click", () =>
        this.bulkCompleteSelected()
      );
    }
    //Select the bulk-delete-btn element and add event listener to it
    this.bulkDeleteBtn = this.rootEl.querySelector(".bulk-delete-btn");
    if (this.bulkDeleteBtn) {
      this.bulkDeleteBtn.addEventListener("click", () =>
        this.bulkDeleteSelected()
      );
    }
    //State
    this.taskArray = [];

    //Boot the App
    this.loadLocalStorage();
  }

  //Load tasks from localStorage,
  //If nothing is stored -> still update UI
  //Parse data, verify for array and render
  loadLocalStorage() {
    const stored = localStorage.getItem(this.storageKey);
    this.logger.log("Got local storage item", this.storageKey);

    if (!stored) {
      this.logger.log("stored was falsy");
      //make sure that the array is really empty so no previous tasks could appear
      this.taskArray = [];
      //UI still needs update
      this.render();
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      //verify the local storage for it being an array better
      if (Array.isArray(parsed)) {
        this.taskArray = parsed;
        this.logger.log("taskArray was loaded with the parsed version");
      }
    } catch (err) {
      this.logger.error("Could not parse taskArray from localStorage.");
    }

    this.render();
  }

  //Wipe out ul so no duplicates
  //Render each task
  //Update header/empty-state visibility
  render() {
    this.ulList.innerHTML = ""; //wipe out HTML inside the list to not get duplicates
    this.taskArray.forEach((task) => this.renderTask(task));
    this.logger.log("All tasks rendered succesfully");

    this.headerVisibility();
  }

  //Check for elements existance with if
  //If array is empty -> show empty-state and hide headers
  //If array has tasks -> hide empty-state and show headers
  headerVisibility() {
    const headerTitle = this.rootEl.querySelector(".header-title-container");
    const headerActions = this.rootEl.querySelector(
      ".header-actions-container"
    );
    const emptyStateEl = this.rootEl.querySelector(".empty-state"); //element in nume, care e  elem si care e var; too much rendering-> console.logs() - de 2 ori ar trebui rendered

    //If elements are missing, return
    if (!emptyStateEl) {
      this.logger.error(`Element ${emptyStateEl} not found`);
      return;
    }

    if (!headerTitle) {
      this.logger.error(`Element ${headerTitle} not found`);
      return;
    }

    if (!headerActions) {
      this.logger.error(`Element ${headerActions} not found`);
      return;
    }

    if (this.taskArray.length === 0) {
      emptyStateEl.classList.remove("hidden");
      this.logger.log(`${emptyStateEl} removed`);

      headerActions.classList.add("hidden");
      this.logger.log(`${headerActions.className} hidden`);

      headerTitle.classList.add("hidden");
      this.logger.log(`${headerTitle.className} hidden`);
    } else {
      emptyStateEl.classList.add("hidden");
      this.logger.log(`${emptyStateEl} added`);

      headerActions.classList.remove("hidden");
      this.logger.log(`${headerActions.className} shown`);

      headerTitle.classList.remove("hidden");
      this.logger.log(`${headerTitle.className} shown`);
    }
  }

  //Check for form existance
  //If a task is added -> prevent page refresh, trim for white spaces, verify text existance, append tasks and clear input
  formListener(event) {
    event.preventDefault();
    const text = this.input.value.trim();
    if (!text) {
      this.logger.log("text is falsy: ", typeof text);
      return;
    }
    this.appendTask(text);
    this.input.value = "";
  }

  //Define task and trim text
  //Push task to array, render it to DOM, update localStorage, update header visibility
  appendTask(text) {
    const task = {
      title: text.trim(),
      checked: false,
      completed: false,
    };

    this.taskArray.push(task);
    this.renderTask(task);
    this.persist();
    this.headerVisibility();
  }

  //Clone list
  //Attach event listeners for checkbox
  //Update DOM elements with the array fields, delete and edit button
  //Update the local storage when check, delete and edit
  //
  renderTask(task) {
    const li = this.itemTemplateEl.cloneNode(true);

    const checkbox = li.querySelector(".task-checkbox");
    checkbox.checked = task.checked;

    checkbox.addEventListener("change", () => {
      //getting the source of truth from the array
      const index = this.taskArray.indexOf(task);

      this.taskArray[index].checked = checkbox.checked;
      this.logger.log(`Object nr.: ${index} is ${task.checked}`);
      this.persist();
    });

    const titleSpan = li.querySelector(".task-title");
    titleSpan.textContent = task.title;

    const delBtn = li.querySelector(".task-delete-btn");
    delBtn.addEventListener("click", () => {
      const index = this.taskArray.indexOf(task);
      this.handleDeleteTask(index, li);
    });

    const editBtn = li.querySelector(".task-edit-btn");
    editBtn.addEventListener("click", () => {
      titleSpan.contentEditable = true;
      titleSpan.focus();

      const finishedEditing = () => {
        titleSpan.contentEditable = false;
        const index = this.taskArray.indexOf(task);

        if (task) {
          this.taskArray[index].title = titleSpan.textContent.trim();
        }

        //Remove event listeners
        titleSpan.removeEventListener("blur", finishedEditing);
        titleSpan.removeEventListener("keydown", onEnter);
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
    li.classList.toggle("completed", task.completed);
    this.ulList.appendChild(li);
  }

  //Update the local storage
  persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.taskArray));
    this.logger.log("local storage was updated");
  }

  //Delete a specific object from the array
  deleteTask(index) {
    this.taskArray.splice(index, 1);
    this.logger.log("Task at index: ", index, "was deleted");
  }

  //assign a new array to not delete the tasks from the current one
  bulkCompleteSelected() {
    let completedTasks = 0;

    this.taskArray.forEach((task) => {
      if (task.checked) {
        task.completed = true;
        completedTasks++;
      }
    });

    //Update the local storage and UI
    this.persist();
    this.render();

    this.logger.log(
      "bulk-complete-btn completed: " + completedTasks + " tasks"
    );
  }

  //filter the array and delete all tasks that are completed from it
  //update local storage and update UI
  bulkDeleteSelected() {
    const before = this.taskArray.length;

    this.taskArray = this.taskArray.filter((task) => !task.checked);

    const removed = before - this.taskArray.length;

    //Update the local storage and UI
    this.persist();
    this.render();

    this.logger.log("bulk-delete-btn removed: " + removed + " tasks");
  }

  //Handle the delete process -> delete from array, update local storage, remove li from DOM, update headers/empty-state
  handleDeleteTask(index, li) {
    this.deleteTask(index);
    this.persist();
    li.remove();
    this.headerVisibility();
  }
}

//Define new task list
new TaskList("groceryList"); //logs should retain key to see in logs where it has beeen done
new TaskList("toDoList");
