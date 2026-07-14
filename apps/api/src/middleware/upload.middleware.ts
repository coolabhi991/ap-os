import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Documents module (Form 58 redesign) — direct file upload, no more manually-typed URLs.
// Stored on local disk under apps/api/uploads/documents with an unguessable generated filename;
// files are only ever served back through the authenticated GET /documents/:id/file route, never
// a public static path, so a random name (rather than the readable original) is the access
// control, not just cosmetics.
export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads/documents");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error("Only PDF, JPEG, and PNG files are supported"));
      return;
    }
    cb(null, true);
  },
}).single("file");
