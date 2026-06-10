export const VISIT_DATA_FIELDS = [
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
    "bedId"
];

export const LEGACY_VISIT_DATA_FIELDS = VISIT_DATA_FIELDS.filter((field) => field !== "patientId");

export const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const DEFAULT_VISIT_DATA = {
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
    bedId: ""
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

export const buildVisitDataObject = (source = {}, fallbackSource = {}) => {
    const status = fieldValue(source, fallbackSource, "status");

    return {
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
    "bedId"
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
        patient.visitData.push(buildVisitDataObject(patient));
    }

    const latestVisit = patient.visitData[patient.visitData.length - 1];

    if (!hasValue(latestVisit.patientId) && hasValue(patient.patientId)) {
        latestVisit.patientId = patient.patientId;
    }

    return latestVisit;
};
