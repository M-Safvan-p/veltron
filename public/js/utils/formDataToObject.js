function formDataToObject(form) {
  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    // Trim string values to avoid whitespace issues
    const trimmedValue = typeof value === "string" ? value.trim() : value;

    // Handle nested keys like variants[0][color]
    if (key.includes("[")) {
      const keys = key.replace(/\]/g, "").split("[");
      let current = data;
      keys.forEach((k, i) => {
        if (i === keys.length - 1) {
          current[k] = trimmedValue;
        } else {
          current[k] = current[k] || {};
          current = current[k];
        }
      });
    } else {
      data[key] = trimmedValue;
    }
  });

  // Convert object with numeric keys to arrays
  function convertToArrays(obj) {
    if (typeof obj !== "object" || obj === null) return obj;
    if (Array.isArray(obj)) {
      return obj.map(convertToArrays);
    }
    const keys = Object.keys(obj);
    const numericKeys = keys.filter((k) => !isNaN(k));
    if (numericKeys.length > 0) {
      const arr = [];
      numericKeys.forEach((k) => {
        arr[parseInt(k)] = convertToArrays(obj[k]);
      });
      // Fill in any missing indices with undefined
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === undefined) arr[i] = {};
      }
      return arr;
    } else {
      const result = {};
      keys.forEach((k) => {
        result[k] = convertToArrays(obj[k]);
      });
      return result;
    }
  }

  return convertToArrays(data);
}
