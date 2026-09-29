
/** Shared student progression stats (current or target). */
export interface StudentProgress {
    level: number;
    stars: number;
    weaponStars: number;
    weaponLevel: number;
    /** EX skill level */
    exSkill: number;
    /** Basic / normal skill level */
    basicSkill: number;
    /** Passive skill level */
    passiveSkill: number;
    /** Sub skill level */
    subSkill: number;
    /** Relationship / bond level */
    affection: number;
    /** Relationship experience (yuzutrends current only) */
    affectionExp?: number;
    /** Eleph level (yuzutrends current only) */
    eleph?: number;
    /** ATK equipment level */
    equipmentAtk: number;
    /** DEF equipment level */
    equipmentDef: number;
    /** Heal equipment level */
    equipmentHeal: number;
    /** Unique gear / equipment 4 level */
    gear: number;
    potentialHp: number;
    potentialAtk: number;
    potentialHeal: number;
}

export interface EligmaInfo {
    price: number;
    stock: number;
}

/** Format-agnostic student model. */
export interface Student {
    id: number;
    current: StudentProgress;
    /** Target progression (yuzutrends). */
    target?: StudentProgress;
    uuid?: string;
    includedInEvents?: string[];
    useEligmaForStar?: boolean;
    eligmaInfo?: EligmaInfo;
    isSelected?: boolean;
}
