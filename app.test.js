const app = require(__dirname + "/./app"),
  db = require(__dirname + "/./models"),
  mongoose = require("mongoose"),
  assert = require("assert"),
  request = require("supertest");

describe("The Express App ", () => {
  it("handles a GET request to /", async () => {
    try {
      request(app)
        .get("/")
        .end((err, res) => {
          assert(
            res.body.app === "betaAI-admin-core" &&
              res.body.core === "1.0.0" &&
              res.body.success === true
          );
        });
    } catch (e) {
      console.log(e);
    }
  });
});
