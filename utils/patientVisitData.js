export const VISIT_DATA_FIELDS = [
    "visitId",
    "patientId",
    "visitDate",
    "visitTime",
    "cdId",
    "department",
    "priority",
    "status",
    "symptoms",
    "allergies",
    "idAdmitted",
    "admissionDate",
    "idDischarge",
    "dischargeDate",
    "bedId",
    "charge"
];

export const LEGACY_VISIT_DATA_FIELDS = VISIT_DATA_FIELDS.filter((field) => field !== "patientId");

export const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const DEFAULT_VISIT_DATA = {
    visitId: "",
    patientId: "",
    visitDate: "",
    visitTime: "",
    cdId: "",
    department: "",
    priority: "",
    status: "Waiting",
    symptoms: "",
    allergies: "",
    idAdmitted: false,
    admissionDate: "",
    idDischarge: false,
    dischargeDate: "",
    bedId: "",
    charge: undefined
};

const toPlainObject = (value) => {
    if (!value) {
        return {};
    }

    if (typeof value.toObject === "function") {
        return value.toObject();
    }

    return value;
};

const hasOwnField = (source, field) => Object.prototype.hasOwnProperty.call(source, field);

const readField = (source, field) => {
    const sourceObject = toPlainObject(source);

    if (hasOwnField(sourceObject, field)) {
        return sourceObject[field];
    }

    return undefined;
};

const fieldValue = (source, fallbackSource, field) => {
    const sourceValue = readField(source, field);

    if (sourceValue !== undefined && sourceValue !== null) {
        return sourceValue;
    }

    const fallbackValue = readField(fallbackSource, field);

    if (fallbackValue !== undefined && fallbackValue !== null) {
        return fallbackValue;
    }

    return DEFAULT_VISIT_DATA[field];
};

const isDefaultFileCharge = (fileCharge) => {
    const chargeValue = Number(fileCharge.charge);
    const typeValue = hasValue(fileCharge.type) ? String(fileCharge.type).trim().toLowerCase() : "";
    const statusValue = hasValue(fileCharge.status) ? String(fileCharge.status).trim().toLowerCase() : "";

    return (
        Object.keys(fileCharge).length === 0 ||
        (
            !Number.isNaN(chargeValue) &&
            chargeValue === 0 &&
            (
                (!typeValue && !statusValue) ||
                (typeValue === "cash" && statusValue === "paid")
            )
        )
    );
};

const normalizeFileCharge = (fileCharge) => {
    if (fileCharge === undefined || fileCharge === null) {
        return undefined;
    }

    if (typeof fileCharge === "number" || typeof fileCharge === "string") {
        return Number(fileCharge) === 0 ? undefined : { charge: fileCharge };
    }

    const fileChargeObject = toPlainObject(fileCharge);
    const normalizedFileCharge = {};

    ["transactionId", "charge", "type", "status"].forEach((field) => {
        if (hasOwnField(fileChargeObject, field) && fileChargeObject[field] !== undefined && fileChargeObject[field] !== null) {
            normalizedFileCharge[field] = fileChargeObject[field];
        }
    });

    return isDefaultFileCharge(normalizedFileCharge) ? undefined : normalizedFileCharge;
};

const addChargeAmount = (normalizedCharge, chargeObject, field) => {
    if (!hasOwnField(chargeObject, field) || chargeObject[field] === undefined || chargeObject[field] === null) {
        return;
    }

    const chargeAmount = Number(chargeObject[field]);

    if (!Number.isNaN(chargeAmount) && chargeAmount === 0) {
        return;
    }

    normalizedCharge[field] = chargeObject[field];
};

export const normalizeCharge = (charge) => {
    if (charge === undefined || charge === null) {
        return undefined;
    }

    if (typeof charge === "number" || typeof charge === "string") {
        const fileCharge = normalizeFileCharge(charge);
        return fileCharge ? { fileCharge } : undefined;
    }

    const chargeObject = toPlainObject(charge);
    const normalizedCharge = {};
    const fileCharge = normalizeFileCharge(chargeObject.fileCharge);

    if (fileCharge) {
        normalizedCharge.fileCharge = fileCharge;
    }

    addChargeAmount(normalizedCharge, chargeObject, "medicalCharge");
    addChargeAmount(normalizedCharge, chargeObject, "WardCharge");
    addChargeAmount(normalizedCharge, chargeObject, "otherCharge");

    return Object.keys(normalizedCharge).length ? normalizedCharge : undefined;
};

export const buildVisitDataObject = (source = {}, fallbackSource = {}) => {
    const status = fieldValue(source, fallbackSource, "status");
    const charge = fieldValue(source, fallbackSource, "charge");

    const visitData = {
        visitId: fieldValue(source, fallbackSource, "visitId"),
        patientId: fieldValue(source, fallbackSource, "patientId"),
        visitDate: fieldValue(source, fallbackSource, "visitDate"),
        visitTime: fieldValue(source, fallbackSource, "visitTime"),
        cdId: fieldValue(source, fallbackSource, "cdId"),
        department: fieldValue(source, fallbackSource, "department"),
        priority: fieldValue(source, fallbackSource, "priority"),
        status: hasValue(status) ? status : "Waiting",
        symptoms: fieldValue(source, fallbackSource, "symptoms"),
        allergies: fieldValue(source, fallbackSource, "allergies"),
        idAdmitted: fieldValue(source, fallbackSource, "idAdmitted"),
        admissionDate: fieldValue(source, fallbackSource, "admissionDate"),
        idDischarge: fieldValue(source, fallbackSource, "idDischarge"),
        dischargeDate: fieldValue(source, fallbackSource, "dischargeDate"),
        bedId: fieldValue(source, fallbackSource, "bedId")
    };
    const normalizedCharge = normalizeCharge(charge);

    if (normalizedCharge) {
        visitData.charge = normalizedCharge;
    }

    return visitData;
};

const hasLegacyVisitData = (patientObject) => [
    "visitDate",
    "visitTime",
    "cdId",
    "department",
    "priority",
    "symptoms",
    "allergies",
    "admissionDate",
    "dischargeDate",
    "bedId",
    "charge"
].some((field) => hasValue(patientObject[field]));

export const normalizeVisitDataArray = (patient) => {
    const patientObject = toPlainObject(patient);

    if (Array.isArray(patientObject.visitData)) {
        return patientObject.visitData.map((visit) => buildVisitDataObject(visit, patientObject));
    }

    if (hasLegacyVisitData(patientObject)) {
        return [buildVisitDataObject(patientObject)];
    }

    return [];
};

export const formatPatientWithVisitData = (patient) => {
    const patientObject = { ...toPlainObject(patient) };
    const visitData = normalizeVisitDataArray(patientObject);

    LEGACY_VISIT_DATA_FIELDS.forEach((field) => {
        delete patientObject[field];
    });

    return {
        ...patientObject,
        visitData
    };
};

export const getLatestVisitData = (patient) => {
    if (!Array.isArray(patient.visitData)) {
        patient.visitData = [];
    }

    if (!patient.visitData.length) {
        patient.visitData.unshift(buildVisitDataObject(patient));
    }

    const latestVisit = patient.visitData[0];

    if (!hasValue(latestVisit.patientId) && hasValue(patient.patientId)) {
        latestVisit.patientId = patient.patientId;
    }

    return latestVisit;
};
