import { getAllSkills } from "@ckiller/universe";
import express from "express";
const skillRouter = express.Router();

skillRouter.get("/all", (req, res) => {
  const skills = getAllSkills();
  res.json(skills);
});

export default skillRouter;
