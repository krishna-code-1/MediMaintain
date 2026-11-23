
const Equipment = require("../models/Equipment");
const Maintenance = require("../models/Maintenance");
const mongoose = require("mongoose");
const { sendControllerError, isValidObjectId } = require("./controllerUtils");

const EQUIPMENT_FIELDS = [
    "name",
    "category",
    "department",
    "status",
    "manufacturer",
    "modelNumber",
    "serialNumber",
    "purchaseDate",
    "lastMaintenanceDate",
    "nextMaintenanceDate",
    "assignedTechnician",
    "notes"
];

function getEquipmentFields(body) {
    return Object.fromEntries(
        EQUIPMENT_FIELDS
            .filter(field => Object.hasOwn(body || {}, field))
            .map(field => [
                field,
                ["purchaseDate", "lastMaintenanceDate", "nextMaintenanceDate"].includes(field) &&
                    body[field] === ""
                    ? null
                    : body[field]
            ])
    );
}

function validateEquipmentDates(fields) {
    const dates = [
        ["purchaseDate", fields.purchaseDate],
        ["lastMaintenanceDate", fields.lastMaintenanceDate],
        ["nextMaintenanceDate", fields.nextMaintenanceDate]
    ].filter(([, value]) => value !== undefined && value !== null && value !== "");

    for (const [field, value] of dates) {
        if (Number.isNaN(new Date(value).getTime())) {
            const error = new Error(`${field} must be a valid date`);
            error.name = "ValidationError";
            throw error;
        }
    }

    const values = Object.fromEntries(
        dates.map(([field, value]) => [field, new Date(value).getTime()])
    );

    if (values.lastMaintenanceDate && values.purchaseDate &&
        values.lastMaintenanceDate < values.purchaseDate) {
        const error = new Error("Last maintenance cannot be before purchase date");
        error.name = "ValidationError";
        throw error;
    }

    if (values.nextMaintenanceDate && values.lastMaintenanceDate &&
        values.nextMaintenanceDate < values.lastMaintenanceDate) {
        const error = new Error("Next maintenance cannot be before last maintenance");
        error.name = "ValidationError";
        throw error;
    }
}

// GET - Get all equipment belonging to logged-in hospital
const getAllEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.find({
            hospitalId: req.session.user.hospitalId
        });

        res.status(200).json({
            success: true,
            data: equipment
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// GET - Get equipment by ID
const getEquipmentById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid equipment ID"
            });
        }

        const equipment = await Equipment.findOne({
            _id: req.params.id,
            hospitalId: req.session.user.hospitalId
        });

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        res.status(200).json({
            success: true,
            data: equipment
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// POST - Add new equipment
const addEquipment = async (req, res) => {
    try {
        const fields = getEquipmentFields(req.body);
        validateEquipmentDates(fields);

        const equipment = await Equipment.create({
            ...fields,
            hospitalId: req.session.user.hospitalId,
            id: `EQ-${new mongoose.Types.ObjectId()}`
        });

        res.status(201).json({
            success: true,
            message: "Equipment added successfully",
            data: equipment
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// PUT - Update equipment
const updateEquipment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid equipment ID"
            });
        }

        const hospitalId = req.session.user.hospitalId;
        const fields = getEquipmentFields(req.body);

        if (!Object.keys(fields).length) {
            return res.status(400).json({
                success: false,
                message: "No equipment fields provided"
            });
        }

        const existingEquipment = await Equipment.findOne({
            _id: req.params.id,
            hospitalId
        });

        if (!existingEquipment) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        validateEquipmentDates({
            ...existingEquipment.toObject(),
            ...fields
        });

        const equipment = await Equipment.findOneAndUpdate(
            {
                _id: req.params.id,
                hospitalId
            },
            fields,
            {
                new: true,
                runValidators: true
            }
        );

        await Maintenance.updateMany(
            {
                equipmentId: String(equipment._id),
                hospitalId
            },
            {
                equipmentName: equipment.name
            }
        );

        res.status(200).json({
            success: true,
            message: "Equipment updated successfully",
            data: equipment
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


// DELETE - Delete equipment
const deleteEquipment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid equipment ID"
            });
        }

        const hospitalId = req.session.user.hospitalId;
        const session = await mongoose.startSession();
        let equipment;

        try {
            await session.withTransaction(async () => {
                equipment = await Equipment.findOneAndDelete(
                    {
                        _id: req.params.id,
                        hospitalId
                    },
                    { session }
                );

                if (equipment) {
                    await Maintenance.deleteMany(
                        {
                            equipmentId: String(equipment._id),
                            hospitalId
                        },
                        { session }
                    );
                }
            });
        } finally {
            await session.endSession();
        }

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Equipment deleted successfully"
        });

    } catch (error) {
        sendControllerError(res, error);
    }
};


module.exports = {
    getAllEquipment,
    getEquipmentById,
    addEquipment,
    updateEquipment,
    deleteEquipment
};
