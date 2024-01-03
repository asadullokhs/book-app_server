const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const mongoose = require("mongoose");

// Core module
const path = require("path");

// Routes
const userRouter = require("./src/routes/userRouter");
const categoryRouter = require("./src/routes/categoryRouter");
const bookRouter = require("./src/routes/bookRoute");
const commentRouter = require("./src/routes/commentRoute");

// App e'lon qilish
const app = express();
const PORT = process.env.PORT || 4002;

// Static folder
app.use(express.static(path.join(__dirname, "src", "files")));

// Middlewear
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(cors());

// Routers
app.use("/api", userRouter);
app.use("/api", categoryRouter);
app.use("/api", bookRouter);
app.use("/api", commentRouter);

const start = async () => {
  try {
    await mongoose.connect(
      "mongodb://localhost:27017/bookApp"
      // , {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
      // }
    );
    app.listen(PORT, () => {
      console.log(`Server responded at ${PORT} port...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
