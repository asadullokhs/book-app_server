const Books = require("../models/bookModel");
const Comment = require("../models/commentModel");
const path = require("path");
const { v4 } = require("uuid");
const JWT = require("jsonwebtoken");
const fs = require("fs");
const User = require("../models/userModel");

const uploadsDir = path.join(__dirname, "../", "files");

const BookCtrl = {
  add: async (req, res) => {
    try {
      const { token } = req.headers;

      if (!token) {
        res.status(403).send({ message: "Token is required" });
      }

      const ownerId = JWT.decode(token)._id;

      req.body.ownerId = ownerId;

      if (req.files) {
        const { photo } = req.files;
        const format = photo.mimetype.split("/")[1];

        if (format !== "png" && format !== "jpg" && format !== "jpeg") {
          return res.status(403).send({ message: "Format is incorrect" });
        }

        const nameImg = `${v4()}.${format}`;

        photo.mv(path.join(uploadsDir, nameImg), (err) => {
          if (err) {
            res.status(503).send(err.message);
          }
        });
        req.body.photo = nameImg;
        const book = await Books.create(req.body);
        res.status(201).send({
          message: "Book added successfully",
          book,
        });
      } else {
        res.status(403).send({ message: "Photo is required!" });
      }
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  getOne: async (req, res) => {
    try {
      const { bookId } = req.params;
      let book = await Books.findById(bookId);

      if (!book) {
        return res.status(404).send({ message: "Not found" });
      }

      let comments = await Comment.find({ bookId: bookId });

      for (const comment of comments) {
        let user = await User.findById(comment.userId);

        comment._doc.user = user.email;
      }

      book._doc.comments = comments;

      res.status(200).send({
        message: "Book",
        book,
      });
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  getAll: async (req, res) => {
    try {
      let books = await Books.find();

      books = books.map((book) => {
        const { ownerId, ...otherDetails } = book._doc;
        return otherDetails;
      });

      res.status(200).send({ message: "All books", books });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
  delete: async (req, res) => {
    try {
      const { bookId } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentBook = await JWT.decode(token);

      const book = await Books.findById(bookId);
      if (!book) {
        return res.status(404).send({ message: "Not found" });
      }
      if (
        book.ownerId == currentBook._id ||
        currentBook.role == "admin" ||
        currentBook.role == "superadmin"
      ) {
        if (book.photo) {
          await fs.unlink(path.join(uploadsDir, book.photo), (err) => {
            if (err) {
              return res.status(503).send({ message: err.message });
            }
          });
        }
        await Comment.deleteMany({ bookId: bookId });
        const deletedBook = await Books.findByIdAndDelete(bookId);

        return res
          .status(200)
          .send({ message: "Deleted succesfully", deletedBook });
      }

      res.status(405).send({ message: "Not allowed" });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
  update: async (req, res) => {
    try {
      const { bookId } = req.params;
      const { token } = req.headers;
      console.log(bookId, typeof bookId);

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentBook = await JWT.decode(token);
      const book = await Books.findById(bookId);
      console.log(book);

      if (
        book.ownerId == currentBook._id ||
        currentBook.role == "admin" ||
        currentBook.role == "superadmin"
      ) {
        console.log("ok");
        if (req.files) {
          await fs.unlink(path.join(uploadsDir, book.photo), (err) => {
            if (err) {
              return res.status(503).send({ message: err.message });
            }
          });
          const { photo } = req.files;

          const format = photo.mimetype.split("/")[1];

          if (format !== "png" && format !== "jpg" && format !== "jpeg") {
            return res.status(403).send({ message: "Format is incorrect" });
          }

          const nameImg = `${v4()}.${format}`;

          photo.mv(path.join(uploadsDir, nameImg), (err) => {
            if (err) {
              return res.status(503).send(err.message);
            }
          });

          req.body.photo = nameImg;
        }

        console.log(req.body);
        const books = await Books.findByIdAndUpdate(bookId, req.body, {
          new: true,
        });

        return res.status(200).send({ message: "Updated succesfully", books });
      }
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
  likeBook: async (req, res) => {
    try {
      const { bookId } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const userId = await JWT.decode(token)._id;

      const book = await Books.findById(bookId);

      if (!book) {
        return res.status(404).send({ message: "Not found" });
      }

      if (book.likes.includes(userId)) {
        await book.updateOne({ $pull: { likes: userId } });
        res.status(200).send({ message: "Like canceled" });
      } else {
        if (book.dislikes.includes(userId)) {
          await book.updateOne({ $pull: { dislikes: userId } });
        }
        await book.updateOne({ $push: { likes: userId } });
        res.status(200).send({ message: "Like added", book });
      }
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
  dislikeBook: async (req, res) => {
    try {
      const { bookId } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const userId = await JWT.decode(token)._id;

      const book = await Books.findById(bookId);

      if (!book) {
        return res.status(404).send({ message: "Not found" });
      }

      if (book.dislikes.includes(userId)) {
        await book.updateOne({ $pull: { dislikes: userId } });
        res.status(200).send({ message: "dislike canceled" });
      } else {
        if (book.likes.includes(userId)) {
          await book.updateOne({ $pull: { likes: userId } });
        }
        await book.updateOne({ $push: { dislikes: userId } });
        res.status(200).send({ message: "Dislike added" });
      }
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
  download: async (req, res) => {
    try {
      const { bookId } = req.params;

      const book = await Books.findById(bookId);
      if (!book) {
        return res.status(404).send({ message: "Not found" });
      }

      await book.updateOne({ $inc: { downloadCount: 1 } });

      res.status(200).download(uploadsDir + "/" + book.photo, book.title);
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
};

module.exports = BookCtrl;
