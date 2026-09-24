class CredentialNotFoundException extends Error {
  constructor(message) {
    super(message); // call parent constructor
    this.name = this.constructor.name; // show custom name in stack trace
    Error.captureStackTrace(this, this.constructor); // optional, cleaner stack trace
  }
}

module.exports = CredentialNotFoundException;
