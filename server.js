const express = require("express");
const db = require("./configs/db");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

db();
const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/properties", require("./routes/propertyRoutes"));
app.use("/api/booking", require("./routes/BookingRoutes"));

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
