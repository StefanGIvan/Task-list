export function appendSubtask(task, subUlListEl, text = "") {
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

export function renderSubtask(task, subtask, subUlListEl, options = {}) {
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

export function handleDeleteSubtask(task, index, subLi) {
  this.logger.log(
    "[handleDeleteSubtask] Will delete subtask: " + task.subtasks[index].title
  );

  task.subtasks.splice(index, 1);
  this.persist();

  subLi.remove();
}
