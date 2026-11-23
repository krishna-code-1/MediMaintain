
const mongoose = require("mongoose");
const Maintenance = require("../models/Maintenance");
const Equipment = require("../models/Equipment");
const { sendControllerError, isValidObjectId } = require("./controllerUtils");
const User = require("../models/User");
const MAINTENANCE_STATUSES = ["Scheduled", "In Progress", "Completed"];

// Synchronize equipment status after maintenance changes
async function syncEquipmentStatus(equipmentId, hospitalId, session, completed = false) {
    const equipment = await Equipment.findOne({
        _id: equipmentId,
        hospitalId
    }).session(session);

    if (!equipment) return;

    const activeMaintenance = await Maintenance.exists({
        equipmentId: String(equipmentId),
        hospitalId,
        status: "In Progress"
    }).session(session);

    if (activeMaintenance) {
        equipment.status = "Under Maintenance";
    } else if (equipment.status === "Under Maintenance") {
        equipment.status = "Working";
    }

    if (completed) {
        equipment.lastMaintenanceDate = new Date();
    }

    await equipment.save({ session });
}

// Automatically select technician based on department and workload
async function findAvailableTechnician(hospitalId, department) {

    const technicians = await User.find({
        hospitalId,
        assignedDepartment: department,
        role: "Technician",
        isActive: true
    }).sort({
        createdAt: 1,
        _id: 1
    });

    if (technicians.length === 0) {
        return null;
    }

    let selectedTechnician = null;
    let minimumWorkload = Infinity;

    for (const technician of technicians) {

        const workload = await Maintenance.countDocuments({
            assignedTechnician: technician._id,
            hospitalId,
            status: {
                $in: ["Scheduled", "In Progress"]
            }
        });

        if (workload < minimumWorkload) {
            minimumWorkload = workload;
            selectedTechnician = technician;
        }
    }

    return selectedTechnician;
}



// GET - Get all maintenance records belonging to hospital
const getAllMaintenance = async (req, res) => {
    try {
        const filter = {
            hospitalId: req.session.user.hospitalId
        };

        if (req.query.equipmentId) {
            if (!isValidObjectId(req.query.equipmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid equipment ID"
                });
            }

            filter.equipmentId = req.query.equipmentId;
        }

        const maintenance = await Maintenance.find(filter).sort({
            maintenanceDate: 1
        });

        res.status(200).json({
            success: true,
            data: maintenance
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// GET - Get maintenance by ID
const getMaintenanceById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid maintenance ID"
            });
        }

        const maintenance = await Maintenance.findOne({
            _id: req.params.id,
            hospitalId: req.session.user.hospitalId
        });

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: "Maintenance record not found"
            });
        }

        res.status(200).json({
            success: true,
            data: maintenance
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};



// POST - Schedule maintenance with automatic technician assignment
const addMaintenance = async (req, res) => {
    try {
        const { equipmentId, type, maintenanceDate } = req.body || {};
        const hospitalId = req.session.user.hospitalId;

        if (!equipmentId || !type || !maintenanceDate) {
            return res.status(400).json({
                success: false,
                message: "Equipment, maintenance type and date are required"
            });
        }

        if (!isValidObjectId(equipmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid equipment ID"
            });
        }

        if (typeof maintenanceDate !== "string" ||
            Number.isNaN(new Date(maintenanceDate).getTime())) {
            return res.status(400).json({
                success: false,
                message: "Maintenance date must be valid"
            });
        }

        if (!["Preventive", "Corrective"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid maintenance type"
            });
        }

        // Find equipment belonging to this hospital
        const equipment = await Equipment.findOne({
            _id: equipmentId,
            hospitalId
        });

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        // Automatically find technician from equipment department
        const technician = await findAvailableTechnician(
            hospitalId,
            equipment.department
        );

        // Create maintenance record
        const maintenance = await Maintenance.create({
            equipmentId: String(equipment._id),
            equipmentName: equipment.name,
            hospitalId,
            assignedTechnician: technician ? technician._id : null,
            type,
            maintenanceDate,
            id: `MN-${new mongoose.Types.ObjectId()}`
        });

        await maintenance.populate(
            "assignedTechnician",
            "name email assignedDepartment"
        );

        res.status(201).json({
            success: true,
            message: technician
                ? "Maintenance scheduled and technician assigned successfully"
                : "Maintenance scheduled, but no matching technician is available",
            data: maintenance
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// PUT - Update maintenance
const updateMaintenance = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid maintenance ID"
            });
        }

        const hospitalId = req.session.user.hospitalId;

        const body = req.body && typeof req.body === "object" &&
            !Array.isArray(req.body) ? req.body : {};

        const fields = {};

        if (Object.hasOwn(body, "status")) {
            if (!MAINTENANCE_STATUSES.includes(body.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maintenance status"
                });
            }

            fields.status = body.status;
        }

        if (Object.hasOwn(body, "type")) {
            fields.type = body.type;
        }

        if (Object.hasOwn(body, "maintenanceDate")) {
            if (typeof body.maintenanceDate !== "string" ||
                Number.isNaN(new Date(body.maintenanceDate).getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Maintenance date must be valid"
                });
            }

            fields.maintenanceDate = body.maintenanceDate;
        }

        if (!Object.keys(fields).length) {
            return res.status(400).json({
                success: false,
                message: "No maintenance fields provided"
            });
        }

        const session = await mongoose.startSession();
        let maintenance;

        try {
            await session.withTransaction(async () => {
                maintenance = await Maintenance.findOneAndUpdate(
                    {
                        _id: req.params.id,
                        hospitalId
                    },
                    fields,
                    {
                        new: true,
                        runValidators: true,
                        session
                    }
                );

                if (maintenance) {
                    await syncEquipmentStatus(
                        maintenance.equipmentId,
                        hospitalId,
                        session,
                        maintenance.status === "Completed"
                    );
                }
            });
        } finally {
            await session.endSession();
        }

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: "Maintenance record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Maintenance updated successfully",
            data: maintenance
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// DELETE - Delete maintenance
const deleteMaintenance = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid maintenance ID"
            });
        }

        const hospitalId = req.session.user.hospitalId;
        const session = await mongoose.startSession();
        let maintenance;

        try {
            await session.withTransaction(async () => {
                maintenance = await Maintenance.findOneAndDelete(
                    {
                        _id: req.params.id,
                        hospitalId
                    },
                    { session }
                );

                if (maintenance) {
                    await syncEquipmentStatus(
                        maintenance.equipmentId,
                        hospitalId,
                        session
                    );
                }
            });
        } finally {
            await session.endSession();
        }

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: "Maintenance record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Maintenance deleted successfully"
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};

// GET - Technician views assigned maintenance jobs
const getAssignedMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.find({
            hospitalId: req.session.user.hospitalId,
            assignedTechnician: req.session.user.id
        }).sort({
            maintenanceDate: 1
        });

        res.status(200).json({
            success: true,
            data: maintenance
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// PUT - Technician updates assigned maintenance status and notes
const updateAssignedMaintenance = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid maintenance ID"
            });
        }

        const { status, notes } = req.body || {};
        const fields = {};

        if (status !== undefined) {
            if (!MAINTENANCE_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maintenance status"
                });
            }

            fields.status = status;
        }

        if (notes !== undefined) {
            if (typeof notes !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Notes must be text"
                });
            }

            fields.notes = notes.trim();
        }

        if (!Object.keys(fields).length) {
            return res.status(400).json({
                success: false,
                message: "Status or notes are required"
            });
        }

        const hospitalId = req.session.user.hospitalId;
        const technicianId = req.session.user.id;

        const session = await mongoose.startSession();
        let maintenance;

        try {
            await session.withTransaction(async () => {
                maintenance = await Maintenance.findOneAndUpdate(
                    {
                        _id: req.params.id,
                        hospitalId,
                        assignedTechnician: technicianId
                    },
                    fields,
                    {
                        new: true,
                        runValidators: true,
                        session
                    }
                );

                if (maintenance && fields.status) {
                    await syncEquipmentStatus(
                        maintenance.equipmentId,
                        hospitalId,
                        session,
                        maintenance.status === "Completed"
                    );
                }
            });
        } finally {
            await session.endSession();
        }

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: "Assigned maintenance record not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Assigned maintenance updated successfully",
            data: maintenance
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};



module.exports = {
    getAllMaintenance,
    getMaintenanceById,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    getAssignedMaintenance,
    updateAssignedMaintenance
};
