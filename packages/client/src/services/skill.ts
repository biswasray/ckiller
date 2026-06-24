import { SkillGroup } from "../interfaces";
import { apiGet } from "./client";

export const skillService = {
  /** GET /skill/all — returns local + global skill groups. */
  getAll: () => apiGet<SkillGroup[]>("/skill/all"),
};
