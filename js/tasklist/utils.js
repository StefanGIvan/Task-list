//Helpers for subtasks (used in bulkCompleteSelected, bulkDeleteSelected, handleDeleteTask)
//Verify if subtasks are completed
export function allSubtasksDone(task) {
  if (!task.subtasks || task.subtasks.length === 0) {
    return true;
  } else {
    return task.subtasks.every((subtask) => subtask.completed === true);
  }
}

//Task is only completed if subtasks are completed and it is completed too
export function taskDone(task) {
  return task.checked && this.allSubtasksDone(task);
}
