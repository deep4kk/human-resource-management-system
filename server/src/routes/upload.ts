import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { upload, uploadToCloudinary } from "../lib/upload.js";

const router = Router();
router.use(requireAuth);

router.post("/avatar", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Bad Request", message: "No file provided" });
      return;
    }

    const url = await uploadToCloudinary(req.file.path);
    if (url) {
      res.json({ url });
    } else {
      res.json({ url: `/uploads/${req.file.filename}` });
    }
  } catch (err) {
    req.log.error({ err }, "Upload avatar error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/document", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Bad Request", message: "No file provided" });
      return;
    }

    const url = await uploadToCloudinary(req.file.path);
    if (url) {
      res.json({ url });
    } else {
      res.json({ url: `/uploads/${req.file.filename}` });
    }
  } catch (err) {
    req.log.error({ err }, "Upload document error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
