const Comments = require("../models/commentModel");
const JWT = require("jsonwebtoken");

const commentCtrl = {
  add: async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.headers;

      if (!token) {
        res.status(403).send({ message: "Token is required" });
      }

      const currentUser = JWT.decode(token).id;

      req.body.userId = currentUser;
      req.body.bookId = id;

      const comment = await Comments.create(req.body);

      res.status(201).send({
        message: "Comment added successfully",
        comment,
      });
    } catch (error) {
      console.log(error);
      res.status(503).send(error.message);
    }
  },
  delete: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentUser = await JWT.decode(token);

      const comment = await Comments.findById(commentId);
      if (!comment) {
        return res.status(404).send({ message: "Not found" });
      }
      if (
        comment.userId == currentUser.id ||
        currentUser.role == "admin" ||
        currentUser.role == "superadmin"
      ) {
        const deletedComment = await Comments.findByIdAndDelete(commentId);

        return res
          .status(200)
          .send({ message: "Deleted succesfully", deletedComment });
      }

      res.status(405).send({ message: "Not allowed" });
    } catch (error) {
      res.status(503).send(error.message);
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.headers;

      if (!token) {
        return res.status(403).send({ message: "Token is required" });
      }

      const currentUser = await JWT.decode(token);
      const comment = await Comments.findById(id);

      if (
        comment.ownerId == currentUser.id ||
        currentUser.role == "admin" ||
        currentUser.role == "superadmin"
      ) {
        const comments = await Comments.findByIdAndUpdate(id, req.body, {
          new: true,
        });

        return res
          .status(200)
          .send({ message: "Updated succesfully", comments });
      }
    } catch (error) {
      res.status(503).send({ message: error.message });
    }
  },
};

module.exports = commentCtrl;
