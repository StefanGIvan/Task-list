export function buildCategoryFilterComponent(categoryFilterEl) {
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
  const categoryBtnEl = categoryDivEl.querySelector(".category-filter-button");
  //Button Label
  const categoryBtnLabelEl = categoryDivEl.querySelector(
    ".category-filter-label"
  );

  //Panel
  const categoryPanelEl = categoryDivEl.querySelector(".category-filter-panel");
  categoryPanelEl.hidden = true; //start closed

  //Category Rows
  const addCategoryRow = (categoryValue, categoryText) => {
    //Row Element
    const categoryRowEl = rowTemplate.content.cloneNode(true).firstElementChild;
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
    const optionRows = categoryPanelEl.querySelectorAll(".category-filter-row");

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
