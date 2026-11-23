const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["1.1.1.1"]);

const connectDB = async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://${process.env.DB_USERNAME}:${encodeURIComponent(process.env.DB_PASSWORD)}@cluster0.opeh8fb.mongodb.net/medimaintain?retryWrites=true&w=majority`
        );

        console.log("MongoDB Connected Successfully");

    } catch (error) {
        console.log("MongoDB Connection Error:", error.message);
        throw error;
    }
};

module.exports = connectDB;