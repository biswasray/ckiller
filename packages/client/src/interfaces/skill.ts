export interface Skill {
  name: string;
  description: string;
}

export interface SkillGroup {
  label: string;
  dir: string;
  skills: Skill[];
}
