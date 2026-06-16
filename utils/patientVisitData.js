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
    charge: {
        fileCharge: {
            charge: 0,
            type: "cash",
            status: "paid"
        },
        medicalCharge: 0,
        WardCharge: 0,
        otherCharge: 0
    }
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

const readField = (source, field) => {
    const sourceObject = toPlainObject(source);

    if (Object.prototype.hasOwnProperty.call(sourceObject, field)) {
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

const normalizeFileCharge = (fileCharge = {}) => {
    if (typeof fileCharge === "number" || typeof fileCharge === "string") {
        return {
            ...DEFAULT_VISIT_DATA.charge.fileCharge,
            charge: fileCharge
        };
    }

    const fileChargeObject = toPlainObject(fileCharge);

    return {
        charge: fileChargeObject.charge ?? DEFAULT_VISIT_DATA.charge.fileCharge.charge,
        type: fileChargeObject.type ?? DEFAULT_VISIT_DATA.charge.fileCharge.type,
        status: fileChargeObject.status ?? DEFAULT_VISIT_DATA.charge.fileCharge.status
    };
};

export const normalizeCharge = (charge = {}) => {
    const chargeObject = toPlainObject(charge);

    return {
        fileCharge: normalizeFileCharge(chargeObject.fileCharge ?? DEFAULT_VISIT_DATA.charge.fileCharge),
        medicalCharge: chargeObject.medicalCharge ?? DEFAULT_VISIT_DATA.charge.medicalCharge,
        WardCharge: chargeObject.WardCharge ?? DEFAULT_VISIT_DATA.charge.WardCharge,
        otherCharge: chargeObject.otherCharge ?? DEFAULT_VISIT_DATA.charge.otherCharge
    };
};

export const buildVisitDataObject = (source = {}, fallbackSource = {}) => {
    const status = fieldValue(source, fallbackSource, "status");
    const charge = fieldValue(source, fallbackSource, "charge");

    return {
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
        bedId: fieldValue(source, fallbackSource, "bedId"),
        charge: normalizeCharge(charge)
    };
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
