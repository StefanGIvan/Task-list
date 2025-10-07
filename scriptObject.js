//logger class with enable, prefix and message parameters
class Logger {
  constructor(enabled = true, prefix = "") {
    this.enabled = enabled; //true = log to console, false = don't show anything
    this.prefix = prefix; //used for the constructor parameter of TaskList
  }

  log(...args) {
    if (!this.enabled) {
      return;
    }
    if (this.prefix) {
      console.log(this.prefix, ...args);
    } else {
      console.log(...args);
    }
  }

  error(...args) {
    if (!this.enabled) {
      return;
    }
    if (this.prefix) {
      console.error(this.prefix, ...args);
    } else {
      console.error(...args);
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

  //used to build sortActionsSelect
  sortOptions = {
    "cat-asc": "Sort by ascending category",
    "cat-desc": "Sort by descending category",
    "date-asc": "Sort by ascending date",
    "date-desc": "Sort by descending date",
  };

  //for reference*
  categoryMappingArray = [
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
      this.logger.error(
        "rootEl not found: " + this.rootEl + " with ID: " + taskListId
      );
    }

    //Target widget template node, if false -> error
    const widgetTemplate = document.querySelector(".tasks-widget-template");
    if (!widgetTemplate) {
      this.logger.error("WidgeTemplate not found: " + widgetTemplate);
      return;
    }

    //Clone widget template and add on screen in div
    const cloneWidgetTemplate =
      widgetTemplate.content.firstElementChild.cloneNode(true);
    if (!cloneWidgetTemplate) {
      this.logger.error(
        "cloneWidgetTemplate not found: " + cloneWidgetTemplate
      );
    }
    this.rootEl.appendChild(cloneWidgetTemplate);

    //Select title for change content
    const listTitle = this.rootEl.querySelector(".task-widget-title");
    if (!listTitle) {
      this.logger.error("listTitle not found: " + listTitle);
    } else {
      listTitle.textContent = taskListId;
    }

    //Check itemTemplate
    const itemTemplate = document.querySelector(".task-template");
    if (!itemTemplate) {
      this.logger.error("itemTemplate not found: " + itemTemplate);
    }
    this.itemTemplateLi = itemTemplate.content.firstElementChild;

    //Selecting the widget template elements
    this.taskInputField = this.rootEl.querySelector(".task-input");
    this.taskUlList = this.rootEl.querySelector(".task-list");
    this.taskCreationForm = this.rootEl.querySelector(".task-form");
    if (this.taskCreationForm) {
      this.taskCreationForm.addEventListener("submit", (event) =>
        this.formListener(event)
      );
    }

    //Building category selector and populate it with options from categoryMapping
    this.taskCategorySelect = this.rootEl.querySelector(".task-category");
    if (this.taskCategorySelect) {
      for (const categoryKey in this.categoryMapping) {
        //get the data object for this category
        const categoryData = this.categoryMapping[categoryKey];

        const categoryOptionEl = document.createElement("option");
        categoryOptionEl.value = categoryKey;
        categoryOptionEl.textContent = categoryData.label;

        this.taskCategorySelect.appendChild(categoryOptionEl);
      }
    }

    //Building sort selector, create options and append to sortActionsSelect
    this.sortActionsSelect = this.rootEl.querySelector(".sort-actions");
    if (this.sortActionsSelect) {
      for (const sortKey in this.sortOptions) {
        const sortOptionEl = document.createElement("option");
        sortOptionEl.value = sortKey;
        sortOptionEl.textContent = this.sortOptions[sortKey];
        this.sortActionsSelect.appendChild(sortOptionEl);
      }

      this.currentSort = this.sortActionsSelect.value;

      this.sortActionsSelect.addEventListener("change", (event) =>
        this.stateToggleSort(event)
      );
    }

    this.selectedCategoriesSet = new Set(); //keep track of selected categories
    //Select, Verify El, set current selected value to "" and build component
    const categoryFilterEl = this.rootEl.querySelector(
      ".category-filter-mount"
    );
    if (categoryFilterEl) {
      this.buildCategoryFilterComponent(categoryFilterEl);
    }

    //Selecting the Bulk Actions Button
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
    this.logger.log(
      "[loadLocalStorage] Attempting to load localStorage item storageKey: ",
      this.storageKey
    );

    if (!stored) {
      this.logger.log("[loadLocalStorage] stored was false: " + stored);

      this.taskArray = []; //make sure that the array is really empty so no previous tasks could appear
      this.render(); //UI still needs update

      return;
    }

    try {
      const parsed = JSON.parse(stored);

      //Verify each task of local storage if it's false
      if (Array.isArray(parsed)) {
        const validTasks = parsed.filter((task, index) => {
          //Verify if task is an array
          if (!task || typeof task !== "object" || Array.isArray(task)) {
            this.logger.error(
              "[loadLocalStorage] Task nr." +
                index +
                "is not an object: " +
                task
            );

            return false;
          }

          if (typeof task.title !== "string") {
            this.logger.error(
              "[loadLocalStorage] task.title property of task nr. " +
                index +
                " is not a string: " +
                task.title
            );

            return false;
          }

          if (typeof task.checked !== "boolean") {
            this.logger.error(
              "[loadLocalStorage] task.checked property of task nr. " +
                index +
                " is not an boolean: ",
              task.checked
            );

            return false;
          }

          if (typeof task.completed !== "boolean") {
            this.logger.error(
              "[loadLocalStorage] task.completed property of task nr. " +
                index +
                " is not an boolean: ",
              task.completed
            );

            return false;
          }

          return true;
        });
        this.taskArray = validTasks;

        this.logger.log(
          "[loadLocalStorage] taskArray was loaded with the parsed & verified version"
        );
      } else {
        this.logger.error("[loadLocalStorage] Parsed data is not an array");
      }
    } catch (err) {
      this.logger.error(
        "[loadLocalStorage] Could not parse taskArray from localStorage."
      );
    }

    this.applyCurrentSort();
    this.render();
  }

  buildCategoryFilterComponent(categoryFilterEl) {
    this.logger.log(
      "[buildCategoryFilterComponent] Initializing buildCategoryFilterComponent()"
    );
    //template* - cloningNode from html
    //template for each html element - js for checkbox, value row, row label

    const filterTemplate = document.querySelector(".category-filter-template");
    const rowTemplate = document.querySelector(".category-row-template");

    categoryFilterEl.innerHTML = "";

    //take the content of the template, clone it, and then take the first element of the clone
    const categoryDivEl =
      filterTemplate.content.cloneNode(true).firstElementChild;

    //Button
    const categoryBtnEl = categoryDivEl.querySelector(
      ".category-filter-button"
    );
    //Button Label
    const categoryBtnLabelEl = categoryDivEl.querySelector(
      ".category-filter-label"
    );

    //Panel
    const categoryPanelEl = categoryDivEl.querySelector(
      ".category-filter-panel"
    );
    categoryPanelEl.hidden = true; //start closed

    //Category Rows
    const addCategoryRow = (categoryValue, categoryText) => {
      //Row Element
      const categoryRowEl =
        rowTemplate.content.cloneNode(true).firstElementChild;
      categoryRowEl.dataset.value = categoryValue;

      //Row Label
      const categoryLabelEl = categoryRowEl.querySelector(
        ".category-filter-text"
      );
      categoryLabelEl.textContent = categoryText;

      this.logger.log(
        "[buildCategoryFilterComponent][addCategoryRow] categoryValue = " +
          categoryValue +
          " text = " +
          categoryText
      );

      //for a row clicked we set the currentCategoryFilter and we render() and then set up
      categoryRowEl.addEventListener("click", (event) => {
        event.stopPropagation(); //don't close dropdown when you click inside it
        const rowValue = categoryRowEl.dataset.value;

        this.logger.log(
          "[buildCategoryFilterComponent][addCategoryRow] click row -> rowValue = " +
            rowValue +
            " before selectedCategoriesSet is mutated: " +
            this.selectedCategoriesSet
        );

        if (rowValue === "") {
          //All was clicked -> clear selectedCategoriesSet
          this.selectedCategoriesSet.clear();

          this.logger.log(
            "[buildCategoryFilterComponent][addCategoryRow] All selected -> cleared selectedCategoriesSet: " +
              this.selectedCategoriesSet
          );
        } else {
          //if we have that row value in Set (as we clicked the row) remove it, else add it
          if (this.selectedCategoriesSet.has(rowValue)) {
            this.selectedCategoriesSet.delete(rowValue);

            this.logger.log(
              "[buildCategoryFilterComponent][addCategoryRow] removed " +
                rowValue +
                " from selectedCategoriesSet"
            );
          } else {
            this.selectedCategoriesSet.add(rowValue);

            this.logger.log(
              "[buildCategoryFilterComponent][addCategoryRow] added " +
                rowValue +
                " to selectedCategoriesSet"
            );
          }
        }

        this.logger.log(
          "[buildCategoryFilterComponent][addCategoryRow] after categoryRowEl clicked -> selected = " +
            Array.from(this.selectedCategoriesSet).join(", ")
        );

        syncChecks();
        updateButtonLabel();
        this.render();
      });
      categoryPanelEl.appendChild(categoryRowEl);
    };

    //added separately
    addCategoryRow("", "All");

    //Build row items from categoryMapping
    for (const [categoryKey, categoryData] of Object.entries(
      this.categoryMapping
    )) {
      addCategoryRow(categoryKey, categoryData.label);
    }

    //Close Panel
    const closeCategoryPanel = () => {
      categoryPanelEl.hidden = true;

      this.logger.log(
        "[buildCategoryFilterComponent][closeCategoryPanel] panel closed"
      );
    };

    //Toggle Open/Close Panel. If it's hidden -> open, visible -> close
    const toggleCategoryPanel = () => {
      categoryPanelEl.hidden = !categoryPanelEl.hidden;

      this.logger.log(
        "[buildCategoryFilterComponent] toggle: " + categoryPanelEl.hidden
      );
    };

    //Close panel when clicking outside of Div
    const onDocClick = (event) => {
      if (!categoryDivEl.contains(event.target)) {
        closeCategoryPanel();

        this.logger.log(
          "[buildCategoryFilterComponent] outside click -> panel closed"
        );
      }
    };

    //Update the label of the button by the currentFilter
    const updateButtonLabel = () => {
      //Turn the Set into an Array
      const selectedCategoriesArray = Array.from(this.selectedCategoriesSet); //could also use an array
      console.log(
        "[buildCategoryFilterComponent][updateButtonLabel] " +
          this.selectedCategoriesSet
      );

      //Remove empty "" (refering to the All option)
      const filteredCategories = selectedCategoriesArray.filter(
        (value) => value !== ""
      );

      let displayText;

      //if nothing is chosen, show All
      if (filteredCategories.length === 0) {
        displayText = "All";
      } else {
        //otherwise map each value to its label and join with commas
        const categoryLabels = filteredCategories.map(
          (value) => this.categoryMapping[value].label
        );
        displayText = categoryLabels.join(", ");
      }

      //update the text
      categoryBtnLabelEl.textContent = displayText;

      this.logger.log(
        "[buildCategoryFilterComponent][updateButtonLabel] button label is " +
          displayText
      );
    };

    //sync the checkbox with the current category filter
    const syncChecks = () => {
      //Find all the option rows inside the Panel
      const optionRows = categoryPanelEl.querySelectorAll(
        ".category-filter-row"
      );

      this.logger.log(
        "[buildCategoryFilterComponent][syncChecks] Nr. of rows = " +
          optionRows.length
      );

      //Loop through them
      optionRows.forEach((optionRow) => {
        //take the value of that row
        const optionValue = optionRow.dataset.value;
        //find the checkbox of that row
        const checkboxEl = optionRow.querySelector(".category-filter-checkbox");

        //case for All, remains selected if none is selected
        if (optionValue === "") {
          checkboxEl.checked = this.selectedCategoriesSet.size === 0;
        } else {
          checkboxEl.checked = this.selectedCategoriesSet.has(optionValue);
        }

        this.logger.log(
          "[buildCategoryFilterComponent][syncChecks] optionValue = " +
            optionValue +
            " checkbox.checked = " +
            checkboxEl.checked
        );
      });
    };

    //wiring events
    categoryBtnEl.addEventListener("click", (event) => {
      event.stopPropagation();

      this.logger.log("[buildCategoryFilterComponent] category button clicked");

      toggleCategoryPanel();
    });

    document.addEventListener("click", onDocClick);

    //update labels and sync checkboxes
    updateButtonLabel();
    syncChecks();

    categoryFilterEl.appendChild(categoryDivEl);

    this.logger.log("[buildCategoryFilterComponent] mounted");
  }

  //Wipe out ul so no duplicates
  //Render each task
  //Update header/empty-state visibility
  render() {
    let currentArray = this.taskArray;

    //filtering by selectedCategoriesSet
    if (this.selectedCategoriesSet && this.selectedCategoriesSet.size > 0) {
      currentArray = currentArray.filter((task) =>
        this.selectedCategoriesSet.has(task.category)
      );

      this.logger.log(
        "[render] Filtering by categories = " +
          Array.from(this.selectedCategoriesSet).join(", ")
      );
    }

    this.taskUlList.innerHTML = ""; //removing every single child element inside <ul> to not get duplicates
    currentArray.forEach((task) => this.renderTask(task));

    this.logger.log("[render] All tasks rendered succesfully");

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
      this.logger.error(
        "[headerVisibility] Element emptyStateEl: " + emptyStateEl + "not found"
      );
      return;
    }

    if (!headerTitle) {
      this.logger.error(
        "[headerVisibility] Element headerTitle: " + headerTitle + "not found"
      );
      return;
    }

    if (!headerActions) {
      this.logger.error(
        "[headerVisibility] Element headerActions: " +
          headerActions +
          "not found"
      );
      return;
    }

    if (this.taskArray.length === 0) {
      emptyStateEl.classList.remove("hidden");
      this.logger.log(
        "[headerVisibility] emptyStateEl: " + emptyStateEl + " added"
      );

      headerActions.classList.add("hidden");
      this.logger.log(
        "[headerVisibility] headerActions: " + headerActions + " hidden"
      );

      headerTitle.classList.add("hidden");
      this.logger.log(
        "[headerVisibility] headerTitle: " + headerTitle + " hidden"
      );
    } else {
      emptyStateEl.classList.add("hidden");
      this.logger.log(
        "[headerVisibility] emptyStateEl: " + emptyStateEl + " hidden"
      );

      headerActions.classList.remove("hidden");
      this.logger.log(
        "[headerVisibility] headerActions: " + headerActions + " added"
      );

      headerTitle.classList.remove("hidden");
      this.logger.log(
        "[headerVisibility] headerTitle: " + headerTitle + " added"
      );
    }
  }

  //Check for form existance
  //If a task is added -> prevent page refresh, trim for white spaces, verify text existance, append tasks and clear input
  formListener(event) {
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

  //Define task and trim text
  //Push task to array, render it to DOM, update localStorage, update header visibility
  appendTask(text, categoryId) {
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

  appendSubtask(task, subUlListEl, text = "") {
    const subtask = {
      title: "",
      checked: false,
      completed: false,
    };

    task.subtasks.push(subtask);

    this.persist();

    this.renderSubtask(task, subtask, subUlListEl, {
      startEditing: true,
    });
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

      default: {
        this.logger.error("[applyCurrentSort] Using default sort: date-asc");
        this.sortDateAsc();
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
    //li
    const taskLi = this.itemTemplateLi.cloneNode(true);

    //checkbox
    const taskCheckbox = taskLi.querySelector(".task-checkbox");
    taskCheckbox.checked = task.checked;

    taskCheckbox.addEventListener("change", () => {
      //getting the source of truth from the array
      const index = this.taskArray.indexOf(task);

      this.taskArray[index].checked = taskCheckbox.checked;

      this.logger.log(
        "[renderTask] Task checkbox nr. " + index + " is checked"
      );

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

      this.logger.log(
        "[renderSubtask] subCompleteBtn is: " + subCompleteBtn.disabled
      );

      this.persist();
    });

    //Complete subtask only if checkbox is checked, toggle style and persist()
    subCompleteBtn.addEventListener("click", () => {
      //complete only once
      if (subtask.completed) {
        this.logger.log("[renderSubtask] Subtask is already completed");
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

      subEditBtn.classList.add("active");

      //turn the subTitle in an editable area
      subTitle.setAttribute("contenteditable", "true");
      subTitle.dataset.placeholder = "Type subtask...";

      if (isSubtaskNew) {
        subTitle.textContent = "";

        this.logger.log("[renderSubtask][startSubtaskEdit] Subtask is new");
      }
      subTitle.focus();

      setTimeout(() => placeCaretAtEnd(subTitle), 0);

      const finishEdit = () => {
        subTitle.setAttribute("contenteditable", "false");

        subEditBtn.classList.remove("active");

        const newTitle = subTitle.textContent.trim();

        //if empty title has been added, delete the subtask
        if (!newTitle) {
          const subIndex = task.subtasks.indexOf(subtask);

          this.logger.log(
            "[renderSubtask][finishEdit] Empty title detected, subtask will be deleted: " +
              task.subtasks[subIndex]
          );

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

    //as soon as a subtask is created, edit his title
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

    this.logger.log("[persist] Local storage was updated");
  }

  //Delete a specific object from the array
  deleteTask(index) {
    this.logger.log(
      "[deleteTask] Task: " + this.taskArray[index] + " will be deleted"
    );

    this.taskArray.splice(index, 1);
  }

  stateToggleSort(event) {
    this.currentSort = event.target.value;

    this.applyCurrentSort();

    this.render();
  }

  sortCategAsc() {
    this.taskArray.sort((a, b) => {
      return (
        this.categoryMapping[a.category].importance -
        this.categoryMapping[b.category].importance
      );
    });

    this.logger.log("[sortCategAsc] taskArray sorted by asc categ");
  }

  sortCategDesc() {
    this.taskArray.sort((a, b) => {
      return (
        this.categoryMapping[b.category].importance -
        this.categoryMapping[a.category].importance
      );
    });

    this.logger.log("[sortCategDesc] taskArray sorted by desc categ");
  }

  //Sort the array in ascending order and reflect on DOM
  sortDateAsc() {
    this.taskArray.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    this.logger.log("[sortDateAsc] taskArray sorted by asc date");
  }

  //Sort the array in descending order and reflect on DOM
  sortDateDesc() {
    this.taskArray.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    this.logger.log("[sortDateDesc] taskArray sorted by desc date");
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
      "[bulkCompleteSelected] completed: " + completedTasks + " tasks"
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

    this.logger.log("[bulkDeleteSelected] removed: " + removed + " tasks");
  }

  //Handle the delete process of a task -> delete from array, update local storage, remove li from DOM, update headers/empty-state
  handleDeleteTask(index, li) {
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

  handleDeleteSubtask(task, index, subLi) {
    this.logger.log(
      "[handleDeleteSubtask] Will delete subtask: " + task.subtasks[index].title
    );

    task.subtasks.splice(index, 1);
    this.persist();

    subLi.remove();
  }
}

//Define new task list
window.firstWidget = new TaskList("groceryList"); //logs should retain key to see in logs where it has been done
new TaskList("toDoList");
