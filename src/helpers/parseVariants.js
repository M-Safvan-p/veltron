//parseVariants.js
function parseVariantsFromBodyAndFiles(body, files) {
  const variants = [];

  // Parse text fields from body
  const regexBody = /^variants\[(\d+)\]\[(\w+)\]$/;
  Object.keys(body).forEach((key) => {
    const match = key.match(regexBody);
    if (match) {
      const idx = Number(match[1]);
      const prop = match[2];
      if (!variants[idx]) variants[idx] = {};
      variants[idx][prop] = body[key];
    }
  });

  // Parse files
  const regexFiles = /^variants\[(\d+)\]\[images\]\[(\d+)\]$/;
  (files || []).forEach((file) => {
    const match = file.fieldname.match(regexFiles);
    if (match) {
      const vIdx = Number(match[1]);
      const iIdx = Number(match[2]);
      if (!variants[vIdx]) variants[vIdx] = {};
      if (!variants[vIdx].images) variants[vIdx].images = [];
      variants[vIdx].images[iIdx] = file;
    }
  });

  return variants;
}

module.exports = parseVariantsFromBodyAndFiles;
