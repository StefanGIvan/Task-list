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
  categoryMapping = {
    //can be an array too
    low: {
      label: "Not important",
      importance: 0,
    },
    medium: {
      label: "Slightly important",
      importance: 1,
    },
    high: {
      label: "Important",
      importance: 2,
    },
  };

  categoryMappingArray = [
    //for reference
    {
      label: "Not important",
      importance: 0,
      id: "low",
    },
  ];

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

    //Selecting the widget template elements
    this.input = this.rootEl.querySelector(".task-input");
    this.ulList = this.rootEl.querySelector(".task-list");
    this.form = this.rootEl.querySelector(".task-form");
    if (this.form) {
      this.form.addEventListener("submit", (event) => this.formListener(event));
    }

    //Building category selector and populate it with options from categoryMapping
    this.categorySelect = this.rootEl.querySelector(".task-category"); //for the form <select>
    if (this.categorySelect) {
      for (const categoryKey in this.categoryMapping) {
        //using hasOwnProperty to not loop over inheritance
        if (this.categoryMapping.hasOwnProperty(categoryKey)) {
          //get the data object for this category
          const categoryData = this.categoryMapping[categoryKey];

          //create a new option element
          const optionEl = document.createElement("option");

          //set the option value to the category key
          optionEl.value = categoryKey;

          //set the visible label text
          optionEl.textContent = categoryData.label;

          //append every option to the select
          this.categorySelect.appendChild(optionEl);
        }
      }
    }

    this.currentSortKey = `${this.storageKey}:sort`; //key for the sort mode (unique per widget)
    this.currentSort = localStorage.getItem(this.currentSortKey); //take current sort key from local storage

    //Building sort selector, create options and append to sortGroup
    this.sortGroup = this.rootEl.querySelector(".sort-actions");
    if (this.sortGroup) {
      const sortOptions = {
        //mapping, put near categoryMapping
        "cat-asc": "Sort by ascending category",
        "cat-desc": "Sort by descending category",
        "date-asc": "Sort by ascending date",
        "date-desc": "Sort by descending date",
      };

      for (const sortKey in sortOptions) {
        const sortOptionEl = document.createElement("option");
        sortOptionEl.value = sortKey;
        sortOptionEl.textContent = sortOptions[sortKey];
        this.sortGroup.appendChild(sortOptionEl);
      }

      this.sortGroup.addEventListener("change", (event) =>
        this.stateToggleSort(event)
      );
    }

    this.filterKey = `${this.storageKey}:filter`; //key for the filter mode (unique per widget)
    this.currentFilter = localStorage.getItem(this.filterKey) || ""; //take current key from local storage

    //Select the category selector
    this.selectedCategory = this.rootEl.querySelector(".select-category");
    if (this.selectedCategory) {
      this.selectedCategory.value = this.currentFilter; //sync the UI value with localStorage
      this.selectedCategory.addEventListener("change", (event) =>
        this.displayCategory(event)
      );
    }

    //Selecting the Task List Bulk Actions Buttons
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
      this.logger.log("stored was false");

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

    this.applyCurrentSort();
    this.render();
  }

  //Wipe out ul so no duplicates
  //Render each task
  //Update header/empty-state visibility
  render() {
    let currentArray = this.taskArray;

    //apply our wanted label from categoryMapping using currentFilter(from selectedCategory.value)
    if (this.currentFilter) {
      //REDO*/ currentFilter is categoryId - add console.logs

      currentArray = currentArray.filter(
        (task) => task.category === this.currentFilter
      );
    }

    this.ulList.innerHTML = ""; //removing every single child element inside <ul> to not get duplicates
    currentArray.forEach((task) => this.renderTask(task));
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
    const categoryValue = selectedOption.value; //value = "high" | "medium" | "low"

    this.appendTask(text, categoryValue);
    this.input.value = "";
    this.categorySelect.selectedIndex = 0; //back to placeholder ""
  }

  //Define task and trim text
  //Push task to array, render it to DOM, update localStorage, update header visibility
  //to know who label is, folosim categoryMapping[categoryId].label*
  appendTask(text, categoryId) {
    const task = {
      title: text.trim(),
      checked: false,
      completed: false,
      createdAt: new Date().toISOString(), //create a date instance and convert to string in ISO format(lexicographically)
      category: categoryId, //variable so we can change dynamically which part of map we refer to; folosim categoryValue pentru a face referinta la categoryMapping
      subtasks: [], //create an subtask array for each task
    };

    this.taskArray.push(task);
    this.applyCurrentSort();

    this.render();
    this.persist();

    this.headerVisibility();
  }

  appendSubtask(task, subUlListEl, text = "") {
    const subtask = {
      title: "",
      checked: false,
      completed: false,
    };

    task.subtasks.push(subtask);
    this.persist();
    this.renderSubtask(task, subtask, subUlListEl, { startEditing: true });
  }

  displayCategory(event) {
    this.currentFilter = event.target.value;

    this.logger.log("Selected filter: " + this.currentFilter); //*

    localStorage.setItem(this.filterKey, this.currentFilter);

    this.render();
  }

  //Function to decide which sort should be applied after a new task has been added/page refresh
  applyCurrentSort() {
    switch (this.currentSort) {
      case "cat-asc": {
        this.sortCategAsc();
        break;
      }

      case "cat-desc": {
        this.sortCategDesc();
        break;
      }

      case "date-asc": {
        this.sortDateAsc();
        break;
      }

      case "date-desc": {
        this.sortDateDesc();
        break;
      }
    }
  }

  //Helpers for subtasks (used in bulkCompleteSelected, bulkDeleteSelected, handleDeleteTask)
  //Verify if subtasks are completed
  allSubtasksDone(task) {
    if (!task.subtasks || task.subtasks.length === 0) {
      return true;
    } else {
      return task.subtasks.every((subtask) => subtask.completed === true);
    }
  }

  //Task is only completed if subtasks are completed and it is completed too
  taskDone(task) {
    return task.completed && this.allSubtasksDone(task);
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
      this.logger.log(`Task checkbox nr. ${index} is checked`);
      this.persist();
    });

    const titleSpan = li.querySelector(".task-title");
    const labelSpan = li.querySelector(".task-label");

    titleSpan.textContent = task.title;
    labelSpan.textContent = task.category.label;

    //button and ul for the subtasks
    const addSubBtn = li.querySelector(".add-subtask-btn");
    let subUlListEl = li.querySelector(".subtask-container");

    //helper to create subtask Ul only when needed
    const createSubtaskList = () => {
      if (!subUlListEl) {
        subUlListEl = document.createElement("ul");
        subUlListEl.className = "subtask-container";
        li.appendChild(subUlListEl);
      }
      return subUlListEl;
    };

    //if subtasks do not exist, create array
    if (!Array.isArray(task.subtasks)) {
      task.subtasks = [];
    }

    //if we have any subtasks in this task, call function to create them and then renderSubtask for each
    if (task.subtasks.length > 0) {
      const subUlListEl = createSubtaskList();

      task.subtasks.forEach((subtask) =>
        this.renderSubtask(task, subtask, subUlListEl)
      );
    }

    //button for adding subtasks
    addSubBtn.addEventListener("click", () => {
      const createdUl = createSubtaskList();
      this.appendSubtask(task, createdUl, "");
    });

    const editBtn = li.querySelector(".task-edit-btn");
    editBtn.addEventListener("click", (event) => {
      if (task.completed) {
        return;
      }

      const eventEditBtn = event.currentTarget; //target btn if img is clicked
      if (!eventEditBtn) {
        this.logger.error("Edit button is false in renderTask()");
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

    const delBtn = li.querySelector(".task-delete-btn");
    delBtn.addEventListener("click", () => {
      const index = this.taskArray.indexOf(task);
      this.handleDeleteTask(index, li);
    });

    //These should apply whenever we render, so best place is here
    li.classList.toggle("completed", task.completed); //make the DOM match the object property(BulkCompleteSelected())
    editBtn.classList.toggle("low-opacity", task.completed); //add styling
    labelSpan.classList.toggle("low-opacity", task.completed);
    editBtn.disabled = task.completed; //a boolean that helps disable "on/off"

    this.ulList.appendChild(li);
  }

  renderSubtask(task, subtask, subUlListEl, options = {}) {
    //if there are no subtasks, don't render anything
    if (!subtask || typeof subtask !== "object") {
      return;
    }

    const subLi = document.createElement("li");
    subLi.className = "subtask-item";

    //Checkbox
    const subCheckbox = document.createElement("input");
    subCheckbox.type = "checkbox";
    subCheckbox.className = "subtask-checkbox";
    subCheckbox.checked = subtask.checked;

    //Title
    const subTitle = document.createElement("span");
    subTitle.className = "subtask-title";
    subTitle.textContent = subtask.title;

    //Div for actions on the subtask
    const subActions = document.createElement("div");
    subActions.className = "subtask-actions";

    //Complete Button
    const subCompleteBtn = document.createElement("button");
    subCompleteBtn.type = "button";
    subCompleteBtn.className = "subtask-complete-btn";

    //Complete icon
    const subCompleteImg = document.createElement("img");
    subCompleteImg.src = "/assets/taskCompleted.svg";
    subCompleteImg.alt = "Complete Subtask";
    subCompleteImg.className = "subtask-complete-icon";
    subCompleteBtn.appendChild(subCompleteImg);

    subCompleteBtn.disabled = !subtask.checked; //disable subCompleteBtn if the checkbox is unchecked

    //Check subtask
    subCheckbox.addEventListener("click", () => {
      subtask.checked = subCheckbox.checked;
      subCompleteBtn.disabled = !subtask.checked;
      this.logger.log(`subCheckbox is checked`);
      this.persist();
    });

    //Complete subtask only if checkbox is checked, toggle style and persist()
    subCompleteBtn.addEventListener("click", () => {
      //complete only once
      if (subtask.completed) {
        this.logger.log("Subtask is already completed");
        return;
      }
      if (!subtask.checked) {
        this.logger.error("Subtask must be checked in order to be completed");
        return;
      }
      subtask.completed = !subtask.completed;
      subLi.classList.toggle("completed", subtask.completed);
      this.persist();
    });

    //Edit button
    const subEditBtn = document.createElement("button");
    subEditBtn.type = "button";
    subEditBtn.className = "subtask-edit-btn";

    //Edit icon
    const subEditImg = document.createElement("img");
    subEditImg.src = "/assets/pencil.svg";
    subEditImg.alt = "Subtask Edit";
    subEditImg.className = "subtask-edit-icon";
    subEditBtn.appendChild(subEditImg);

    //Delete button
    const subDelBtn = document.createElement("button");
    subDelBtn.type = "button";
    subDelBtn.className = "subtask-delete-btn";

    //Delete icon
    const subDelImg = document.createElement("img");
    subDelImg.src = "/assets/trashcan.svg";
    subDelImg.alt = "Delete subtask";
    subDelImg.className = "subtask-delete-icon";
    subDelBtn.appendChild(subDelImg);

    //handle delete subtask
    subDelBtn.addEventListener("click", () => {
      const index = task.subtasks.indexOf(subtask);
      this.handleDeleteSubtask(task, index, subLi);
    });

    //toggle completed class on subtask
    subLi.classList.toggle("completed", subtask.completed);

    //Editing helpers for caret appearing at start/end
    //decide if the text already existed or not
    //function to place caret at end
    const placeCaretAtEnd = (subTitleEl) => {
      const caretPosition = document.createRange(); //create a range
      caretPosition.selectNodeContents(subTitleEl); //tell the range to cover all the text inside
      caretPosition.collapse(false); //shrink the range to the end of the text

      const currentTextSelection = window.getSelection(); //get the user's text selection in the page
      currentTextSelection.removeAllRanges(); //clear any existing caret the browser is holding
      currentTextSelection.addRange(caretPosition); //apply custom range so the caret is set where wanted
    };

    const startSubtaskEdit = (isSubtaskNew) => {
      //cannot edit a completed subtask
      if (subtask.completed) {
        return;
      }
      //if the subtask is already in edit mode, return
      if (subTitle.getAttribute("contenteditable") === "true") {
        return;
      }

      //turn the subTitle in an editable area
      subTitle.setAttribute("contenteditable", "true");
      subTitle.dataset.placeholder = "Type subtask...";

      if (isSubtaskNew) {
        subTitle.textContent = "";
      }
      subTitle.focus();

      setTimeout(() => placeCaretAtEnd(subTitle), 0);

      const finishEdit = () => {
        subTitle.setAttribute("contenteditable", "false");
        const newTitle = subTitle.textContent.trim();

        //if no title has been added, delete the subtask
        if (!newTitle) {
          const subIndex = task.subtasks.indexOf(subtask);
          if (subIndex > -1) {
            task.subtasks.splice(subIndex, 1);
          }

          this.persist();
          this.render();
          return;
        }

        subtask.title = newTitle;
        subTitle.removeEventListener("blur", finishEdit);
        subTitle.removeEventListener("keydown", onEnter);
        this.persist();
      };

      const onEnter = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finishEdit();
        }
      };

      subTitle.addEventListener("blur", finishEdit);
      subTitle.addEventListener("keydown", onEnter);
    };

    subEditBtn.addEventListener("click", () => startSubtaskEdit(false));

    //as soon as a subtask is created, edit his title(reuse code from subEditBtn.addEventListener)
    if (options.startEditing) {
      startSubtaskEdit(true);
    }

    //first append btns to subActions
    subActions.appendChild(subCompleteBtn);
    subActions.appendChild(subEditBtn);
    subActions.appendChild(subDelBtn);

    //second append groups to li
    subLi.appendChild(subCheckbox);
    subLi.appendChild(subTitle);
    subLi.appendChild(subActions);

    //third append li to ul
    subUlListEl.appendChild(subLi);
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

  stateToggleSort(event) {
    this.currentSort = event.target.value;

    //remember the current sort by storing in local storage
    localStorage.setItem(this.currentSortKey, this.currentSort); //not needed*

    this.applyCurrentSort();

    this.persist();
    this.render();
  }

  sortCategAsc() {
    this.taskArray.sort(
      (a, b) => a.category.importance - b.category.importance
    ); //*
  }

  sortCategDesc() {
    this.taskArray.sort(
      (a, b) => b.category.importance - a.category.importance
    ); //*
  }

  //Sort the array in ascending order and reflect on DOM
  sortDateAsc() {
    this.taskArray.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }

  //Sort the array in descending order and reflect on DOM
  sortDateDesc() {
    this.taskArray.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  //Assign a new array to not delete the tasks from the current one and refelct on DOM
  bulkCompleteSelected() {
    let completedTasks = 0;

    this.taskArray.forEach((task) => {
      //check for subtasks completed too
      if (task.checked && this.allSubtasksDone(task)) {
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

    this.taskArray = this.taskArray.filter(
      (task) => !(task.checked || task.allSubtasksDone(task))
    );

    const removed = before - this.taskArray.length;

    //Update the local storage and UI
    this.persist();
    this.render();

    this.logger.log("bulk-delete-btn removed: " + removed + " tasks");
  }

  //Handle the delete process of a task -> delete from array, update local storage, remove li from DOM, update headers/empty-state
  handleDeleteTask(index, li) {
    const task = this.taskArray[index];

    //check if the subtasks are completed
    if (!this.taskDone(task)) {
      this.logger.error("Subtasks are not completed, task cannot be deleted");
      return;
    }

    this.deleteTask(index);
    this.persist();
    li.remove(); //done like this because it's just for a single element, instead of calling render()
    this.headerVisibility();
  }

  handleDeleteSubtask(task, index, subLi) {
    task.subtasks.splice(index, 1);
    this.persist();
    subLi.remove();

    this.logger.log(`Deleted subtask at index: ${index}`);
  }
}

//Define new task list
new TaskList("groceryList"); //logs should retain key to see in logs where it has been done
new TaskList("toDoList");
