const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./model/User");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
//const { sendReminderEmail } = require('./reminder');
const http = require("http");
const socketIo = require("socket.io");
const verifyToken = require("./verifyToken");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const users = {}; // To keep track of online users

io.on("connection", (socket) => {
  // Ask for username on connection
  socket.on("username", (username) => {
    users[socket.id] = username;
    io.emit("is_online", { username, status: "connected" });
    console.log("User connected:", username);
  });

  // Listen for messages from clients
  socket.on("chat_message", ({ text, username }) => {
    console.log("Received chat message:", { text, username });
    io.emit("chat_message", { text, username }); // Broadcast the message to all clients
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];
    if (username) {
      io.emit("is_online", { username, status: "disconnected" });
      console.log("User disconnected:", username);
    }
  });
});

const PORT = 8080;

mongoose
  .connect("mongodb://127.0.0.1:27017/chatAppDb")
  .then(() => {
    console.log("Database connected...");
  })
  .catch((e) => {
    console.log(e);
  });

//sendReminderEmail();

const client = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "asutoshshukla951@gmail.com",
    pass: "sggygvefoioogcyq",
  },
});

const otp = Math.floor(100000 + Math.random() * 900000).toString();

const generateOtp = async () =>{
  const hashedOtp = await bcrypt.hash(otp, 10); // Hash the OTP using bcrypt
  return hashedOtp;
}

app.post("/signup", async (req, res) => {
  const newUser = new User(req.body);
  try {
    const hashedOtp = await generateOtp();
    newUser.password = hashedOtp;
    await newUser.save();
    await client.sendMail({
      from: "sender",
      to: newUser.email,
      subject: "Welcome to WebChat App",
      text: `Thank you for signing up! Your OTP for signup is: ${otp}`,
    });
    console.log("User saved:", newUser);
    res.status(201).json({
      status: "Success",
      data: {
        newUser,
      },
      message: "OTP sent successfully",
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.email) {
      res.status(400).json({ message: "Email is already in use" });
    } else {
      console.error("Error during sign up:", err);
      res.status(500).json({
        status: "Failed",
        message: err.message,
      });
    }
  }
});

app.post("/login", async (req, res) => {
  console.log("Heyyaaaa");
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email});
    console.log(user);
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if(isPasswordValid){
        const token = jwt.sign({ email }, "webchatapp-secret-key", {
          expiresIn: "1h",
        });
        res.status(200).json({ token });
      }else{
        res.status(401).json({ message: "Invalid Email or Password" });
      }
    }else{
      res.status(401).json({ message: "No User found with the given email. Please sign up." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/chat/:username", verifyToken, (req, res) => {
  console.log("verification started");
  res.json({ message: "Protected route accessed", user: req.user });
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
