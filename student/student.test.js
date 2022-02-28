const app = require(__dirname + "/../../app"),
  db = require(__dirname + "/../../models"),
  assert = require("assert"),
  request = require("supertest");

describe("Student Controller", () => {
  it("GET to /course find a course", async () => {
    try {
      request(app)
        .get("/course?slug=introduction-to-python")
        .end((err, res) => {
          assert(res.body.success === true);
        });
    } catch (e) {
      console.log(e);
    }
  });

  it("GET to /courses find all courses", async () => {
    try {
      request(app)
        .get("/courses")
        .end((err, res) => {
          assert(res.body.success === true);
        });
    } catch (e) {
      console.log(e);
    }
  });

  it("GET to /labs find all labs", async () => {
    try {
      request(app)
        .get("/labs")
        .end((err, res) => {
          assert(res.body.success === true);
        });
    } catch (e) {
      console.log(e);
    }
  });
});
