const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const { v4 } = require("uuid");

const SECRET_KEY = "maxf1y";
const uploadsDir = path.join(__dirname, "../", "files");

const userCtrl = {
  signUp: async (req, res) => {
    try {
      const { name, surname, email, password, role } = req.body;

      const oldUser = await User.findOne({ email });

      if (oldUser) {
        return res
          .status(400)
          .send({ message: "User with this email is already registered!" });
      }

      const hashdedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        surname,
        email,
        password: hashdedPassword,
        role,
      });

      const token = JWT.sign(
        {
          name: user.name,
          _id: user._id,
          role: user.role,
        },
        SECRET_KEY
      );

      res.status(201).send({
        message: "Successfully registered",
        user: {
          name: user.name,
          _id: user._id,
          role: user.role,
          surname: user.surname,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      if (email && password) {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
          return res.status(404).send({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(
          req.body.password,
          oldUser.password
        );
        if (!isPasswordCorrect) {
          return res
            .status(400)
            .send({ message: "Email or password is incorrect" });
        }

        const token = JWT.sign(
          { email: oldUser.email, _id: oldUser._id, role: oldUser.role },
          SECRET_KEY
        );

        const { password, ...otherDetails } = oldUser._doc;
        res
          .status(200)
          .send({ message: "Login successfully", user: otherDetails, token });
      } else {
        res.status(403).send({ message: "Please fill all fields" });
      }
    } catch (error) {
      res.status(500).send({ message: error.message });
      console.log(error);
    }
  },
  getAll: async (req, res) => {
    try {
      let users = await User.find();

      users = users.map((user) => {
        const { password, role, ...otherDetails } = user._doc;
        return otherDetails;
      });

      res.status(200).send({ message: "All users", users });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
  getOne: async (req, res) => {
    try {
      const { userId } = req.params;

      let users = await User.findById(userId);

      const { password, ...otherDetails } = users._doc;

      res.status(200).send({ message: "User info", user: otherDetails });
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
  delete: async (req, res) => {
    try {
      const { userId } = req.params;
      const { token } = req.headers;

      if (!token) {
        res.status(403).send({ message: "Token is required" });
      }

      const currentUser = JWT.decode(token);
      console.log(currentUser);

      if (
        userId == currentUser._id ||
        currentUser.role == "admin" ||
        currentUser.role == "superadmin"
      ) {
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
          res.status(404).send({ message: "Not found" });
        }
        if (deletedUser.avatar) {
          await fs.unlink(path.join(uploadsDir, deletedUser.avatar), (err) => {
            if (err) {
              return res.status(503).send({ message: err.message });
            }
          });
        }

        return res
          .status(200)
          .send({ message: "Deleted succesfully", deletedUser });
      }

      res.status(405).send({ message: "Not allowed" });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
  update: async (req, res) => {
    try {
      const { password } = req.body;
      const { userId } = req.params;
      const { token } = req.headers;

      if (!token) {
        res.status(403).send({ message: "Token is required" });
      }

      const currentUser = JWT.decode(token);

      if (
        userId == currentUser._id ||
        currentUser.role == "admin" ||
        currentUser.role == "superadmin"
      ) {
        if (password && password !== "") {
          const hashdedPassword = await bcrypt.hash(password, 10);

          req.body.password = hashdedPassword;
        } else {
          delete req.body.password;
        }

        if (req.files) {
          const { image } = req.files;

          const format = image.mimetype.split("/")[1];

          if (format !== "png" && format !== "jpg" && format !== "jpeg") {
            return res.status(403).send({ message: "Format is incorrect" });
          }

          const nameImg = `${v4()}.${format}`;

          image.mv(path.join(uploadsDir, nameImg), (err) => {
            if (err) {
              res.status(503).send(err.message);
            }
          });

          req.body.avatar = nameImg;
        }

        const user = await User.findByIdAndUpdate(userId, req.body, {
          new: true,
        });

        return res.status(200).send({ message: "Updated succesfully", user });
      }

      res.status(405).send({ message: "Not allowed" });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
};

module.exports = userCtrl;
