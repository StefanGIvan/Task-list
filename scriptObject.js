class TaskList {
  constructor(taskListId) {
    console.log("Initializing TaskList");
    if (!taskListId) {
      console.error("taskListId is falsy");
    }
    this.taskListId = taskListId;
    this.taskArray = [];
    this.nextId = 1;
    this.loadLocalStorage();
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
    this.taskArray.forEach((task) => renderTask(task));
    this.headerVisibility();
  }

  renderTask() {}

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
  }
}

new TaskList("taskArray");
console.log("The local storage key is: ", TaskList.taskArray);

//function newTaskId()

//function headerVisibility()

//function renderTask(task)

//function appendTask(text)

//function deleteTask(id)

//function persist()

//function handleDeleteTask(taskItem, li)

//function loadLocalStorage()

//form.addEventListener("submit", (e)
