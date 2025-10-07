export function render() {
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

export function headerVisibility() {
  const headerTitle = this.rootEl.querySelector(".header-title-container");
  const headerActions = this.rootEl.querySelector(".header-actions-container");
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
      "[headerVisibility] Element headerActions: " + headerActions + "not found"
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
