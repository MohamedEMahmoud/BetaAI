const app = require(__dirname + "/../../app"),
  db = require(__dirname + "/../../models"),
  path = require("path"),
  User = db.user,
  assert = require("assert"),
  request = require("supertest");

describe("Auth Controller", () => {
  it("POST to /auth/signup for signup User", () => {
    User.findOne({ email: "root@beta.ai" })
      .then((user) => {
        if (!user) {
          request(app)
            .post("/auth/signup")
            .set("Content-Type", "mime/type")
            .field({
              role: ["instructor", "admin"],
              name: "Root Beta Ai #99",
              email: "root@beta.ai",
              password: "elkingking99*",
              username: "root-beta-ai-99",
              day: 26,
              month: 7,
              year: 1999,
              government: "eg",
              country: "egypt",
              sex: "male",
              phone: "01022801821",
            })
            .attach(
              "image",
              path.join(__dirname, "..", "..", "testFile", "download.png")
            )
            .end((err, res) => {
              assert(res.body.success === true);
            });
        }
      })
      .catch((e) => {
        console.log(e);
      });
  });

  it("POST to /auth/login for signIn User", () => {
    User.findOne({ email: "root@beta.ai" })
      .then((user) => {
        if (user) {
          request(app)
            .post("/auth/login")
            .set("Content-Type", "mime/type")
            .field({
              email: "root@beta.ai",
              password: "elkingking99*",
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

  it("POST to /auth/logout for signOut User", () => {
    User.findOne({ email: "root@beta.ai" })
      .then((user) => {
        if (user && user.tokens.length > 0) {
          request(app)
            .post("/auth/logout")
            .set("Content-Type", "mime/type")
            .set("Authorization", `${user.tokens[0].token}`)
            .end((err, res) => {
              assert(res.body.success === true);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

  it("PATCH to /auth/user for Edit User", () => {
    User.findOne({ email: "mohamed.romyo99@gmail.com" })
      .then((user) => {
        if (user) {
          request(app)
            .patch("/auth/user")
            .set("content-type", "mime/type")
            .set("Authorization", `${user.tokens[0].token}`)
            .field({
              name:
                user.name === "Mohamed_Emad"
                  ? "mohamedEmad-99"
                  : "Mohamed_Emad",
              phone: "01066998855",
            })
            .attach(
              "image",
              path.join(
                __dirname,
                "..",
                "..",
                "testFile",
                "Image-Files-Blog-Vector.jpg"
              )
            )
            .end((err, res) => {
              assert(res.body.success === true);
            });
        }
      })
      .catch((e) => {
        console.log(e);
      });
  });

  it("DELETE to /auth/user for remove User", () => {
    User.findOne({ email: "mohamed.romyo99888@gmail.com" }).then((user) => {
      if (user) {
        request(app)
          .delete("/auth/user")
          .set("Authorization", `${user.tokens[0].token}`)
          .end((err, res) => {
            console.log(res.body);
            assert(Object.keys(res.body).length === 0);
          });
      }
    });
  });
});
