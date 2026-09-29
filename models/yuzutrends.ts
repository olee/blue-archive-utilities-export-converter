import type * as BA from './generic.ts';

export interface Potential {
    /** Potential HP */
    hp: number;
    /** Potential ATK */
    atk: number;
    /** Potential healing */
    heal: number;
}

export interface StudentProgress {
    /** Level */
    level: number;
    /** Stars */
    star: number;
    /** Weapon stars */
    uw: number;
    /** Weapon level */
    uwLevel: number;
    /** EX skill level */
    ex: number;
    /** Basic skill level */
    normal: number;
    /** Passive skill level */
    passive: number;
    /** Sub skill level */
    sub: number;
    /** Eleph level (current only) */
    eleph?: number;
    /** Relationship level */
    affection: number;
    /** Relationship experience (current only) */
    affectionExp?: number;
    /** Equipment 1–3 levels */
    equipment: [number, number, number];
    /** Equipment 4 level */
    gear: number;
    potential: Potential;
}

export interface EligmaInfo {
    price: number;
    stock: number;
}

export interface Student {
    uuid: string;
    /** Student id */
    studentId: number;
    current: StudentProgress;
    target: StudentProgress;
    includedInEvents: string[];
    useEligmaForStar: boolean;
    eligmaInfo: EligmaInfo;
    isSelected: boolean;
}

export interface YuzutrendsExport {
    eventPlans: Record<string, any>;
    globalPlans: Student[];
    ownedGifts: Record<string, any>;
    materialInventory: Record<string, any>;
    equipmentPlan: Record<string, any>;
    timestamp: string;
    version: string;
}

function toProgress(progress: StudentProgress): BA.StudentProgress {
    const [equipmentAtk, equipmentDef, equipmentHeal] = progress.equipment;
    const result: BA.StudentProgress = {
        level: progress.level,
        stars: progress.star,
        weaponStars: progress.uw,
        weaponLevel: progress.uwLevel,
        exSkill: progress.ex,
        basicSkill: progress.normal,
        passiveSkill: progress.passive,
        subSkill: progress.sub,
        affection: progress.affection,
        equipmentAtk,
        equipmentDef,
        equipmentHeal,
        gear: progress.gear,
        potentialHp: progress.potential.hp,
        potentialAtk: progress.potential.atk,
        potentialHeal: progress.potential.heal,
    };
    if (progress.eleph !== undefined) result.eleph = progress.eleph;
    if (progress.affectionExp !== undefined) result.affectionExp = progress.affectionExp;
    return result;
}

function fromProgress(progress: BA.StudentProgress): StudentProgress {
    const result: StudentProgress = {
        level: progress.level,
        star: progress.stars,
        uw: progress.weaponStars,
        uwLevel: progress.weaponLevel,
        ex: progress.exSkill,
        normal: progress.basicSkill,
        passive: progress.passiveSkill,
        sub: progress.subSkill,
        affection: progress.affection,
        equipment: [
            progress.equipmentAtk,
            progress.equipmentDef,
            progress.equipmentHeal,
        ],
        gear: progress.gear,
        potential: {
            hp: progress.potentialHp,
            atk: progress.potentialAtk,
            heal: progress.potentialHeal,
        },
    };
    if (progress.eleph !== undefined) result.eleph = progress.eleph;
    if (progress.affectionExp !== undefined) result.affectionExp = progress.affectionExp;
    return result;
}

function defaultUuid(id: number): string {
    return `import-${id}-${Date.now()}`;
}

/** Convert a yuzutrends student into the generic model. */
export function toGenericStudent(student: Student): BA.Student {
    return {
        id: student.studentId,
        current: toProgress(student.current),
        target: toProgress(student.target),
        uuid: student.uuid,
        includedInEvents: student.includedInEvents,
        useEligmaForStar: student.useEligmaForStar,
        eligmaInfo: student.eligmaInfo,
        isSelected: student.isSelected,
    };
}

/** Convert a generic student back into a yuzutrends record. */
export function fromGenericStudent(student: BA.Student): Student {
    const current = fromProgress(student.current);
    const targetSource = student.target ?? student.current;
    const { eleph: _eleph, affectionExp: _affectionExp, ...target } =
        fromProgress(targetSource);

    return {
        uuid: student.uuid ?? defaultUuid(student.id),
        studentId: student.id,
        current,
        target,
        includedInEvents: student.includedInEvents ?? [],
        useEligmaForStar: student.useEligmaForStar ?? false,
        eligmaInfo: student.eligmaInfo ?? { price: 1, stock: 20 },
        isSelected: student.isSelected ?? false,
    };
}

export function toGeneric(data: YuzutrendsExport): BA.Student[] {
    return data.globalPlans.map(toGenericStudent);
}

export function fromGeneric(data: BA.Student[]): YuzutrendsExport {
    return {
        eventPlans: {},
        globalPlans: data.map(fromGenericStudent),
        ownedGifts: {},
        materialInventory: {},
        equipmentPlan: {
            runCounts: {},
            farmingDays: 1,
            normalMultiplier: 3,
            hardMultiplier: 1,
            campaignSource: "jp"
        },
        timestamp: new Date().toISOString(),
        version: '2.0.1',
    };
}

function mergeStudent(prev: Student, generic: BA.Student): Student {
    const converted = fromGenericStudent({
        ...generic,
        uuid: prev.uuid,
        includedInEvents: prev.includedInEvents,
        useEligmaForStar: prev.useEligmaForStar,
        eligmaInfo: prev.eligmaInfo,
        isSelected: prev.isSelected,
    });

    const eleph = generic.current.eleph ?? prev.current.eleph;
    const affectionExp =
        generic.current.affectionExp ?? prev.current.affectionExp;

    const current: StudentProgress = { ...converted.current };
    if (eleph !== undefined) current.eleph = eleph;
    if (affectionExp !== undefined) current.affectionExp = affectionExp;

    return {
        ...converted,
        current,
        target: prev.target,
    };
}

/**
 * Merge generic student progress into an existing yuzutrends export.
 * Updates matching `current` stats; keeps exclusive yuzutrends fields and
 * students not present in `students`.
 */
export function mergeWithGeneric(
    existing: YuzutrendsExport,
    students: BA.Student[],
): YuzutrendsExport {
    const incoming = new Map(students.map((s) => [s.id, s]));
    const seen = new Set<number>();

    const globalPlans: Student[] = existing.globalPlans.map((prev) => {
        const generic = incoming.get(prev.studentId);
        if (!generic) return prev;
        seen.add(prev.studentId);
        return mergeStudent(prev, generic);
    });

    for (const generic of students) {
        if (!seen.has(generic.id)) {
            globalPlans.push(fromGenericStudent(generic));
        }
    }

    return {
        ...existing,
        globalPlans,
        timestamp: new Date().toISOString(),
    };
}
