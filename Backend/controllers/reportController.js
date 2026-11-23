
const Equipment = require("../models/Equipment");
const Maintenance = require("../models/Maintenance");
const { sendControllerError } = require("./controllerUtils");

// GET - Generate equipment and maintenance reports
const getReports = async (req, res) => {
    try {
        const hospitalId = req.session.user.hospitalId;

        // Equipment statistics
        const totalEquipment = await Equipment.countDocuments({
            hospitalId
        });

        const working = await Equipment.countDocuments({
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

        const completed = await Maintenance.countDocuments({
            hospitalId,
            status: "Completed"
        });

        const scheduled = await Maintenance.countDocuments({
            hospitalId,
            status: "Scheduled"
        });

        const inProgress = await Maintenance.countDocuments({
            hospitalId,
            status: "In Progress"
        });

        // Category-wise equipment
        const categoryReport = await Equipment.aggregate([
            {
                $match: {
                    hospitalId: new Equipment.base.Types.ObjectId(hospitalId)
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Department-wise equipment
        const departmentReport = await Equipment.aggregate([
            {
                $match: {
                    hospitalId: new Equipment.base.Types.ObjectId(hospitalId)
                }
            },
            {
                $group: {
                    _id: "$department",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                equipment: {
                    totalEquipment,
                    working,
                    underMaintenance,
                    outOfService
                },
                maintenance: {
                    totalMaintenance,
                    completed,
                    scheduled,
                    inProgress
                },
                categoryReport,
                departmentReport
            }
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};

module.exports = {
    getReports
};
