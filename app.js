import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import flash from "connect-flash";
import requestIp from "request-ip";

import { authRoutes } from "./routes/authRoutes.js";
import { taskRoutes } from "./routes/taskRoutes.js";
import { subtaskRoutes } from "./routes/subtaskRoutes.js";

import { verifyAuthentication } from "./middlewares/authMiddleware.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";

const app = express();

app.set('view engine', 'ejs');
app.set('views');

app.use(cookieParser());
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: true,
  saveUninitialized: false
}))

app.use(flash());

app.use(requestIp.mw());

app.use(verifyAuthentication);

app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
})

app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/task");
})

app.use("/auth", authRoutes);
app.use("/task", taskRoutes);
app.use("/task/subtask", subtaskRoutes);
app.use("/dashboard", dashboardRoutes);
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});