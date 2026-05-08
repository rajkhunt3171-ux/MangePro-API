const generateUniqueId = async (model, fieldName, prefix) => {
    let id;
    let isExists = true;

    while (isExists) {
        id = prefix + Math.floor(100000 + Math.random() * 900000);
        const existingData = await model.findOne({[fieldName]: id});
        if (!existingData) {
            isExists = false;
        }
    }
    return id;
};

export default generateUniqueId;