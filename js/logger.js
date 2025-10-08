//logger class with enable, prefix and message parameters
export class Logger {
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
