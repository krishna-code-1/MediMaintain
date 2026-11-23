
const Settings = require("../models/Settings");
const { sendControllerError } = require("./controllerUtils");

// GET - Get hospital settings
const getSettings = async (req, res) => {
    try {
        const hospitalId = req.session.user.hospitalId;

        let settings = await Settings.findOne({
            hospitalId
        });

        if (!settings) {
            settings = await Settings.create({
                hospitalId
            });
        }

        res.status(200).json({
            success: true,
            data: settings
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// PUT - Update hospital settings
const updateSettings = async (req, res) => {
    try {
        const hospitalId = req.session.user.hospitalId;

        const {
            hospitalName,
            contactEmail,
            contactPhone
        } = req.body || {};

        if (typeof hospitalName !== "string" || !hospitalName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Hospital name is required"
            });
        }

        if (contactEmail !== undefined && typeof contactEmail !== "string") {
            return res.status(400).json({
                success: false,
                message: "Contact email must be text"
            });
        }

        if (contactPhone !== undefined && typeof contactPhone !== "string") {
            return res.status(400).json({
                success: false,
                message: "Contact phone must be text"
            });
        }

        const values = {
            hospitalName: hospitalName.trim(),
            contactEmail: contactEmail?.trim() || "",
            contactPhone: contactPhone?.trim() || ""
        };

        const settings = await Settings.findOneAndUpdate(
            {
                hospitalId
            },
            {
                $set: values,
                $setOnInsert: {
                    hospitalId
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: settings
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


module.exports = {
    getSettings,
    updateSettings
};
