export function loadLocalStorage() {
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
            "[loadLocalStorage] Task nr." + index + "is not an object: " + task
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

//Update the local storage
export function persist() {
  localStorage.setItem(this.storageKey, JSON.stringify(this.taskArray));

  this.logger.log("[persist] Local storage was updated");
}
