
const Equipment = require("../models/Equipment");
const Maintenance = require("../models/Maintenance");
const { sendControllerError } = require("./controllerUtils");

// GET - Dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const hospitalId = req.session.user.hospitalId;

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const nextSevenDays = new Date(today);
        nextSevenDays.setUTCDate(nextSevenDays.getUTCDate() + 7);

        // Equipment statistics
        const totalEquipment = await Equipment.countDocuments({
            hospitalId
        });

        const workingEquipment = await Equipment.countDocuments({
            hospitalId,
            status: "Working"
        });

        const underMaintenance = await Equipment.countDocuments({
            hospitalId,
            status: "Under Maintenance"
        });

        const outOfService = await Equipment.countDocuments({
            hospitalId,
            status: "Out of Service"
        });

        // Maintenance statistics
        const totalMaintenance = await Maintenance.countDocuments({
            hospitalId
        });

        const completedMaintenance = await Maintenance.countDocuments({
            hospitalId,
            status: "Completed"
        });

        const upcomingMaintenance = await Maintenance.countDocuments({
            hospitalId,
            maintenanceDate: {
                $gte: today,
                $lte: nextSevenDays
            },
            status: {
                $in: ["Scheduled", "In Progress"]
            }
        });

        const overdueMaintenance = await Maintenance.countDocuments({
            hospitalId,
            maintenanceDate: {
                $lt: today
            },
            status: {
                $in: ["Scheduled", "In Progress"]
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalEquipment,
                workingEquipment,
                underMaintenance,
                outOfService,
                totalMaintenance,
                completedMaintenance,
                upcomingMaintenance,
                overdueMaintenance
            }
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};

module.exports = {
    getDashboardStats
};
