const { error: errorResponse } = require("../helpers/responseHelper");
const HttpStatus = require("../constants/statusCodes");
const Messages = require("../constants/messages");
const cloudinary = require("cloudinary").v2;

async function processVariants(variants, files, res, existingProduct = null) {
  const processedVariants = [];
  const fileMap = {};
  const keptPublicIds = new Set();

  // ✅ Group files by variant index and image index
  files.forEach((file) => {
    const match = file.fieldname.match(/variants\[(\d+)\]\[images\]\[(\d+)\]/);
    if (match) {
      const vIndex = parseInt(match[1]);
      const imgIndex = parseInt(match[2]);
      if (!fileMap[vIndex]) fileMap[vIndex] = {};
      fileMap[vIndex][imgIndex] = file;
    }
  });

  for (const [i, variant] of variants.entries()) {
    const color = variant.color?.trim();
    if (!color) {
      errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_COLOR_REQUIRED(i + 1));
      return null;
    }

    const images = [];
    const isEdit = Boolean(existingProduct);
    const existingVariant = isEdit ? existingProduct.variants.find((v) => v._id?.toString() === variant._id) : null;

    // ✅ Process exactly 3 image slots
    for (let j = 0; j < 3; j++) {
      let image = null;

      if (fileMap[i]?.[j]) {
        // New upload
        image = {
          url: fileMap[i][j].path,
          public_id: fileMap[i][j].filename,
          filename: fileMap[i][j].originalname,
        };
      } else if (isEdit && variant.existingImages?.[j]?.trim()) {
        // Existing image
        image = existingVariant?.images[j] || {
          url: variant.existingImages[j].trim(),
          public_id: "",
          filename: "",
        };
      }

      if (image) {
        images.push({
          url: image.url,
          public_id: image.public_id || "",
          filename: image.filename || "",
        });
        if (image.public_id) keptPublicIds.add(image.public_id);
      }
    }

    if (images.length !== 3) {
      errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_IMAGE_COUNT(i + 1, 3));
      return null;
    }

    const stock = Number(variant.stock) || 0;
    if (stock < 0) {
      errorResponse(res, HttpStatus.BAD_REQUEST, Messages.VARIANT_INVALID_STOCK(i + 1));
      return null;
    }

    processedVariants.push({
      color,
      stock,
      images,
    });
  }

  // ✅ Delete orphaned Cloudinary images for edits
  if (existingProduct) {
    for (const v of existingProduct.variants) {
      for (const img of v.images) {
        if (img.public_id && !keptPublicIds.has(img.public_id)) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }
  }

  return processedVariants;
}

module.exports = { processVariants };
