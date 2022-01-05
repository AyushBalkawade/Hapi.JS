const Hapi = require("@hapi/hapi");
const Jwt = require("jsonwebtoken");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");
const Pack = require("./package");
const Joi = require("joi");
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/hapi-user");

async function validate(decoded, req, h) {
  const user = await User.findOne({ _id: decoded });
  if (user) {
    return { isValid: true, credentials: { user } };
  } else {
    return { isValid: false };
  }
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
});
const User = mongoose.model("User", userSchema);
(async () => {
  const server = new Hapi.Server({
    host: "localhost",
    port: 3000,
  });

  const swaggerOptions = {
    info: {
      title: "Test API Documentation",
      version: Pack.version,
    },
  };

  await server.register([
    Inert,
    Vision,
    require("hapi-auth-jwt2"),
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);

  server.auth.strategy("jwt", "jwt", {
    key: "Dua-main-yaad-rakhna",
    validate,
  });

  server.auth.default("jwt");

  server.route({
    method: "GET",
    path: "/users",
    options: {
      handler: async function (req, res) {
        return req.auth.credentials.user;
      },
      auth: "jwt",
      description: "Used GET method to retrieve users.",
      notes: "Returns a GET function",
      tags: ["api"],
      validate: {
        query: Joi.object({
          token: Joi.string(),
        }),
      }, // ADD THIS TAG
    },
  });

  server.route({
    method: "POST",
    path: "/users",
    options: {
      handler: async function (req, res) {
        const { name, email, age } = req.payload;
        const newUser = await User.create({ name, email, age });
        const token = Jwt.sign(newUser.id, "Dua-main-yaad-rakhna");
        return token;
      },
      auth: false,
      description: "Used GET method to retrieve users.",
      notes: "Returns a GET function",
      tags: ["api"],
      validate: {
        payload: Joi.object({
          name: Joi.string(),
          email: Joi.string(),
          age: Joi.number(),
        }),
      }, // ADD THIS TAG
    },
  });

  server.route({
    method: "GET",
    path: "/",
    options: {
      handler: async function (req, res) {
        return "You have visited unrestricted route";
      },
      auth: false,
      description: "Used GET method to retrieve users.",
      notes: "Returns a GET function",
      tags: ["api"], // ADD THIS TAG
    },
  });

  server.route({
    method: "POST",
    path: "/",
    options: {
      handler: async function (req, res) {
        const user = await User.create({
          name: req.payload.name,
          email: req.payload.email,
          age: req.payload.age,
        });
        return user;
      },
      description: "Used POST method to save user.",
      notes: "Returns a POST function",
      tags: ["api"], // ADD THIS TAG,
      validate: {
        payload: Joi.object({
          name: Joi.string().allow("a", "b", "c").required(),
          email: Joi.string(),
          age: Joi.number(),
        }),
        // failAction: (request, reply, source, error) => {
        //   throw err;
        // },
      },
    },
  });

  server.route({
    method: "DELETE",
    path: "/",
    options: {
      handler: async function (req, res) {
        await User.deleteOne({ name: req.payload.name });
        return "Delete is Successfull";
      },
      description: "Used DELETE method to delete user.",
      notes: "Returns a DELETE function",
      tags: ["api"], // ADD THIS TAG
      validate: {
        payload: Joi.object({
          name: Joi.string(),
        }),
      },
    },
  });

  server.route({
    method: "PUT",
    path: "/",
    options: {
      handler: async function (req, res) {
        await User.findOneAndUpdate(
          { name: req.payload.currentName },
          { name: req.payload.updatedName }
        );
        return "Update is Successfull";
      },
      description: "Used PUT method to update user.",
      notes: "Returns a PUT function",
      tags: ["api"], // ADD THIS TAG
      validate: {
        payload: Joi.object({
          currentName: Joi.string(),
          updatedName: Joi.string(),
        }),
      },
    },
  });

  try {
    await server.start();
    console.log("Server running at:", server.info.uri);
  } catch (err) {
    console.log(err);
  }
})();
