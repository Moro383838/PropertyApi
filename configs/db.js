const mongoose = require("mongoose");
module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connection Success");
  } catch (error) {
    console.log("connection Failed", error);
  }
};
