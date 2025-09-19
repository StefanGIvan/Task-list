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

    //Target widget template node, if false -> error
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

    //Selecting the Task List Actions Category Buttons
    this.categorySelect = this.rootEl.querySelector(".task-category"); //for the <select>
    this.categoryOrder = { high: 2, medium: 1, low: 0 }; //map the labels to the numbers so we can sort by category

    this.categorySortAsc = this.rootEl.querySelector(".categ-sort-asc"); //select the sort by categ asc btn
    if (this.categorySortAsc) {
      this.categorySortAsc.addEventListener("click", () => this.sortCategAsc());
    }

    this.categorySortDesc = this.rootEl.querySelector(".categ-sort-desc"); //select the sort by categ desc btn
    if (this.categorySortDesc) {
      this.categorySortDesc.addEventListener("click", () =>
        this.sortCategDesc()
      );
    }

    //Selecting the Task List Actions Date Buttons
    this.dateSortAscBtn = this.rootEl.querySelector(".date-sort-asc");
    if (this.dateSortAscBtn) {
      this.dateSortAscBtn.addEventListener("click", () => this.sortDateAsc());
    }

    this.dateSortDescBtn = this.rootEl.querySelector(".date-sort-desc");
    if (this.dateSortDescBtn) {
      this.dateSortDescBtn.addEventListener("click", () => this.sortDateDesc());
    }

    this.bulkCompleteBtn = this.rootEl.querySelector(".bulk-complete-btn");
    if (this.bulkCompleteBtn) {
      this.bulkCompleteBtn.addEventListener("click", () =>
        this.bulkCompleteSelected()
      );
    }

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

      this.taskArray = []; //make sure that the array is really empty so no previous tasks could appear
      this.render(); //UI still needs update

      return;
    }

    try {
      const parsed = JSON.parse(stored);

      //Verify each task of local storage if it's falsy itself or for falsy properties
      if (Array.isArray(parsed)) {
        const validTasks = parsed.filter((task, index) => {
          //Verify is task is an object
          if (!task || typeof task !== "object") {
            this.logger.error(`Task nr. ${index} is not an object`, task);
            return false;
          }

          if (typeof task.title !== "string") {
            this.logger.error(
              `${task.title} property of task nr. ${index} is not a string`,
              task
            );
            return false;
          }

          if (typeof task.checked !== "boolean") {
            this.logger.error(
              `${task.checked} property of task nr. ${index} is not an boolean`,
              task
            );
            return false;
          }

          if (typeof task.completed !== "boolean") {
            this.logger.error(
              `${task.completed} property of task nr. ${index} is not an boolean`,
              task
            );
            return false;
          }
          return true;
        });
        this.taskArray = validTasks;
        this.logger.log(
          "taskArray was loaded with the parsed & filtered version"
        );
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
    this.ulList.innerHTML = ""; //removing every single child element inside <ul> to not get duplicates
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
    const emptyStateEl = this.rootEl.querySelector(".empty-state");

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
      this.logger.log(`${text} is false: , ${typeof text}`);
      return;
    }

    //For the <select>
    const selectedOption =
      this.categorySelect.options[this.categorySelect.selectedIndex]; //take the index of the option selected
    const categoryValue = selectedOption.value || "low"; //value = "high" | "medium" | "low" and fallback "low" if not selected
    const categoryLabel = selectedOption.value
      ? selectedOption.text
      : "Not important"; //if the text selected has a value, retain the text, else retain "Not important"

    this.appendTask(text, categoryValue, categoryLabel);
    this.input.value = "";
    this.categorySelect.selectedIndex = 0; //back to placeholder ""
  }

  //Define task and trim text
  //Push task to array, render it to DOM, update localStorage, update header visibility
  appendTask(text, categoryValue, categoryLabel) {
    const task = {
      title: text.trim(),
      checked: false,
      completed: false,
      createdAt: new Date().toISOString(), //create a date instance and convert to string in ISO format(lexicographically)
      categoryLevel: categoryValue, //store the value
      categoryLabel: categoryLabel, //store the label
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
    const titleLabel = task.categoryLabel;
    titleSpan.textContent = `${task.title} (${titleLabel})`; //show the label(the importance level) also

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
    li.classList.toggle("completed", task.completed); //make the DOM match the object property
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

  sortCategAsc() {
    this.taskArray.sort(
      (a, b) =>
        this.categoryOrder[a.categoryLevel] -
        this.categoryOrder[b.categoryLevel]
    );

    //Update the UI
    this.persist();
    this.render();
  }

  sortCategDesc() {
    this.taskArray.sort(
      (a, b) =>
        this.categoryOrder[b.categoryLevel] -
        this.categoryOrder[a.categoryLevel]
    );

    //Update the UI
    this.persist();
    this.render();
  }

  //Sort the array in ascending order and reflect on DOM
  sortDateAsc() {
    this.taskArray.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    ); //if a is smaller than b, a remains in place

    //Update the local storage and UI
    this.persist();
    this.render();

    this.logger.log("Tasks sorted ascending by date");
  }

  //Sort the array in descending order and reflect on DOM
  sortDateDesc() {
    this.taskArray.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ); //if b is greater, b swaps with a

    //Update the local storage and UI
    this.persist();
    this.render();

    this.logger.log("Tasks sorted descending by date");
  }

  //Assign a new array to not delete the tasks from the current one and refelct on DOM
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

  //Filter the array and delete all tasks that are completed from it
  //Update local storage and update UI
  bulkDeleteSelected() {
    const before = this.taskArray.length;

    this.taskArray = this.taskArray.filter((task) => !task.checked);

    const removed = before - this.taskArray.length;

    //Update the local storage and UI
    this.persist();
    this.render();

    this.logger.log("bulk-delete-btn removed: " + removed + " tasks");
  }

  //Handle the delete process of a task -> delete from array, update local storage, remove li from DOM, update headers/empty-state
  handleDeleteTask(index, li) {
    this.deleteTask(index);
    this.persist();
    li.remove(); //done like this because it's just for a single element, instead of calling render()
    this.headerVisibility();
  }
}

//Define new task list
new TaskList("groceryList"); //logs should retain key to see in logs where it has beeen done
new TaskList("toDoList");
