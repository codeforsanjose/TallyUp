import express, { Router } from "express";
// import { logger } from "./logging/logger";
const router = Router();

router.get("/", (req, res) => {
  res.send("Hello, health!");
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

const port = 3006;
app.listen(port, () => {
  // logger.warn(`Server listening on port ${port}`);
  console.log(`Server listening on port ${port}`);
});
