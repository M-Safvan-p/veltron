// // middleware/multer.js
// const multer = require("multer");

// const upload = multer({
//   storage: multer.memoryStorage(), // Store files in memory as buffers
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//     files: 20, // Maximum 20 files
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed"), false);
//     }
//   },
// });

// module.exports = upload;
