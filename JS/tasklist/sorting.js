export function stateToggleSort(event) {
  this.currentSort = event.target.value;

  this.applyCurrentSort();

  this.render();
}

export function applyCurrentSort() {
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

export function sortCategAsc() {
  this.taskArray.sort((a, b) => {
    return (
      this.categoryMapping[a.category].importance -
      this.categoryMapping[b.category].importance
    );
  });

  this.logger.log("[sortCategAsc] taskArray sorted by asc categ");
}

export function sortCategDesc() {
  this.taskArray.sort((a, b) => {
    return (
      this.categoryMapping[b.category].importance -
      this.categoryMapping[a.category].importance
    );
  });

  this.logger.log("[sortCategDesc] taskArray sorted by desc categ");
}

//Sort the array in ascending order and reflect on DOM
export function sortDateAsc() {
  this.taskArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  this.logger.log("[sortDateAsc] taskArray sorted by asc date");
}

//Sort the array in descending order and reflect on DOM
export function sortDateDesc() {
  this.taskArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  this.logger.log("[sortDateDesc] taskArray sorted by desc date");
}
