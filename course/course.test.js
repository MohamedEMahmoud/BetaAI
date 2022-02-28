const app = require(__dirname + "/../../app"),
  db = require(__dirname + "/../../models"),
  path = require("path"),
  Course = db.course,
  User = db.user,
  assert = require("assert"),
  request = require("supertest");
describe("Course Controller", () => {
  it("POST to /course for create a new course", () => {
    Course.findOne({
      slug: "introduction-to-python",
    })
      .then(async (course) => {
        const instructor = await User.findOne({ email: "root@beta.ai" });
        if (!course) {
          request(app)
            .post("/course")
            .set("Content-Type", "mime/type")
            .set("Authorization", `${instructor.tokens[0].token}`)
            .attach(
              "image",
              path.join(__dirname, "..", "..", "testFile", "download.png")
            )
            .attach(
              "preview_course",
              path.join(__dirname, "..", "..", "testFile", "1.mp4")
            )
            .field({
              title: "introduction to python",
              level: "beginner",
              price: 150,
              old_price: 300,
              rating: 5,
              brief: "to become python programing",
              points: 5,
              plan: "year",
              currency: "egp",
              type: "course",
              path: "programming",
              content: [
                "content-item#1",
                "content-item#2",
                "content-item#3",
                "content-item#4",
                "content-item#5",
              ],
              requirements: [
                "Master Machine learning on python & r",
                "Have a great intuition of many Machine Learning models",
                "Make accurate predictions",
                "Make powerful analysis",
                "Make robust Machine Learning models",
                "Create strong added value to your business",
              ],
            })
            .end((err, res) => {
              assert(res.body.success === true);
            });
        }
      })
      .catch((e) => {
        console.log(e);
      });
  });
});
