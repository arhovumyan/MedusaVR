import { Router } from "express";
import {listCreators,getCreator,getByUser} from "../controllers/creators.js";

const router = Router();

router
  .get("/",             listCreators)
  .get("/:id",          getCreator)
  .get("/user/:userId", getByUser);

export default router;