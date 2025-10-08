//Assign a new array to not delete the tasks from the current one and refelct on DOM
export function bulkCompleteSelected() {
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
export function bulkDeleteSelected() {
  const before = this.taskArray.length;

  this.taskArray = this.taskArray.filter(
    (task) => !(task.checked && this.allSubtasksDone(task))
  );

  const removed = before - this.taskArray.length;

  //Update the local storage and UI
  this.persist();
  this.render();

  this.logger.log("[bulkDeleteSelected] removed: " + removed + " tasks");
}
