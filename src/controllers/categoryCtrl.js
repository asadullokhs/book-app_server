const Category = require("../models/categoryModel");
const Book = require("../models/bookModel");
const Comment = require("../models/commentModel");
const path = require("path");
const { v4 } = require("uuid");
const JWT = require("jsonwebtoken");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../", "files");

const categoryCtrl = {
  add: async (req, res) => {
    try {
      const { title } = req.body;
      const { image } = req.files;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentUser = JWT.decode(token);

      if (currentUser.role === "admin" || currentUser.role === "superadmin") {
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

        const category = await Category.create({ title, image: nameImg });

        res.status(201).send({
          message: "Category added successfully",
          category,
        });
      } else {
        res.status(405).send({ message: "Not allowed" });
      }
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  get: async (req, res) => {
    try {
      const category = await Category.find();

      res.status(200).send({
        message: "Categories",
        category,
      });
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.headers;
      const currentUser = await JWT.decode(token);

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      if (currentUser.role === "superadmin") {
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
          return res.status(404).send({ message: "Not found" });
        }

        const books = await Book.find({ categoryId: id });

        books.forEach(async (book) => {
          await fs.unlink(path.join(uploadsDir, book.photo), (err) => {
            if (err) {
              return res.status(503).send({ message: err.message });
            }
          });
          await Comment.deleteMany({ bookId: book.id });
        });

        await fs.unlink(path.join(uploadsDir, category.image), (err) => {
          if (err) {
            return res.status(503).send({ message: err.message });
          }
        });

        await Book.deleteMany({ categoryId: id });
        res.status(200).send({
          message: "Category deleted successfully",
        });
      } else {
        res.status(405).send({ message: "Not alowed" });
      }
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;

      const category = await Category.findById(id);

      category.title = title ? title : category.title;

      if (req.files) {
        await fs.unlink(path.join(uploadsDir, category.image), (err) => {
          if (err) {
            return res.status(503).send({ message: err.message });
          }
        });
        const { image } = req.files;

        const format = image.mimetype.split("/")[1];

        if (format !== "png" && format !== "jpeg") {
          return res.status(403).send({ message: "Format is incorrect" });
        }

        const nameImg = `${v4()}.${format}`;

        image.mv(path.join(uploadsDir, nameImg), (error) => {
          if (error) {
            return res.status(503).send({ message: error.message });
          }
        });

        category.image = nameImg;
      }

      const updateCategory = await Category.findByIdAndUpdate(id, category, {
        new: true,
      });
      res
        .status(200)
        .send({ message: "User update sucessfully", category: updateCategory });
    } catch (error) {
      res.status(503).send({ message: "Something went wrong" });
      console.log(error);
    }
  },
  getOne: async (req, res) => {
    try {
      const { bookId } = req.params;
      let category = await Category.findById(bookId);

      if (!category) {
        return res.status(404).send({ message: "Not found" });
      }

      const books = await Book.find({ categoryId: bookId });

      category._doc.books = books;

      res.status(200).send({
        message: "Category",
        category,
      });
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
};

module.exports = categoryCtrl;
