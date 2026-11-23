
const Maintenance = require("../models/Maintenance");
const { sendControllerError } = require("./controllerUtils");

// GET - Get upcoming and overdue maintenance alerts
const getMaintenanceAlerts = async (req, res) => {
    try {
        const hospitalId = req.session.user.hospitalId;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextSevenDays = new Date(today);
        nextSevenDays.setDate(nextSevenDays.getDate() + 7);

        const pendingStatuses = ["Scheduled", "In Progress"];

        const [upcomingAlerts, overdueAlerts] = await Promise.all([

            Maintenance.find({
                hospitalId,
                maintenanceDate: {
                    $gte: today,
                    $lte: nextSevenDays
                },
                status: { $in: pendingStatuses }
            })
                .populate("assignedTechnician", "name email")
                .sort({ maintenanceDate: 1 }),

            Maintenance.find({
                hospitalId,
                maintenanceDate: { $lt: today },
                status: { $in: pendingStatuses }
            })
                .populate("assignedTechnician", "name email")
                .sort({ maintenanceDate: 1 })

        ]);

        const upcoming = upcomingAlerts.map(task => ({
            ...task.toObject(),
            alertType: "Upcoming",
            severity: "Warning"
        }));

        const overdue = overdueAlerts.map(task => ({
            ...task.toObject(),
            alertType: "Overdue",
            severity: "Critical"
        }));

        res.status(200).json({
            success: true,
            data: {
                upcoming,
                overdue,
                totalUpcoming: upcoming.length,
                totalOverdue: overdue.length,
                totalAlerts: upcoming.length + overdue.length
            }
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};

module.exports = {
    getMaintenanceAlerts
};
