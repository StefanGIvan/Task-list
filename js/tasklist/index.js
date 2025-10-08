import { Logger } from "../logger.js";

import { loadLocalStorage, persist } from "./storage.js";

import { render, headerVisibility } from "./render.js";

import {
  formListener,
  appendTask,
  renderTask,
  deleteTask,
  handleDeleteTask,
} from "./tasks.js";

import {
  appendSubtask,
  renderSubtask,
  handleDeleteSubtask,
} from "./subtasks.js";

import {
  stateToggleSort,
  applyCurrentSort,
  sortCategAsc,
  sortCategDesc,
  sortDateAsc,
  sortDateDesc,
} from "./sorting.js";

import { buildCategoryFilterComponent } from "./filters.js";

import { bulkCompleteSelected, bulkDeleteSelected } from "./bulkActions.js";

import { allSubtasksDone, taskDone } from "./utils.js";

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
}

TaskList.prototype.loadLocalStorage = loadLocalStorage;
TaskList.prototype.persist = persist;

TaskList.prototype.render = render;
TaskList.prototype.headerVisibility = headerVisibility;

TaskList.prototype.formListener = formListener;
TaskList.prototype.appendTask = appendTask;
TaskList.prototype.renderTask = renderTask;
TaskList.prototype.deleteTask = deleteTask;
TaskList.prototype.handleDeleteTask = handleDeleteTask;

TaskList.prototype.appendSubtask = appendSubtask;
TaskList.prototype.renderSubtask = renderSubtask;
TaskList.prototype.handleDeleteSubtask = handleDeleteSubtask;

TaskList.prototype.stateToggleSort = stateToggleSort;
TaskList.prototype.applyCurrentSort = applyCurrentSort;
TaskList.prototype.sortCategAsc = sortCategAsc;
TaskList.prototype.sortCategDesc = sortCategDesc;
TaskList.prototype.sortDateAsc = sortDateAsc;
TaskList.prototype.sortDateDesc = sortDateDesc;

TaskList.prototype.buildCategoryFilterComponent = buildCategoryFilterComponent;

TaskList.prototype.bulkCompleteSelected = bulkCompleteSelected;
TaskList.prototype.bulkDeleteSelected = bulkDeleteSelected;

TaskList.prototype.allSubtasksDone = allSubtasksDone;
TaskList.prototype.taskDone = taskDone;

export { TaskList };
