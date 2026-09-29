import type * as BA from './generic.ts';

/** SchaleDB student record (keyed by student id in the root object). */
export interface Student {
    /** Stars */
    s: number;
    /** Level */
    l: number;
    /** Equipment 1 level */
    e1: number;
    /** Equipment 2 level */
    e2: number;
    /** Equipment 3 level */
    e3: number;
    /** Equipment 4 level */
    e4: number;
    /** Weapon stars */
    ws: number;
    /** Weapon level */
    wl: number;
    /** Relationship level */
    b: number;
    /** EX skill level */
    s1: number;
    /** Basic skill level */
    s2: number;
    /** Sub skill level */
    s3: number;
    /** Passive skill level */
    s4: number;
    /** Potential HP */
    pm: number;
    /** Potential ATK */
    pa: number;
    /** Potential healing */
    ph: number;
    /** Collection locked (default to false) */
    lock: boolean;
}

/** Full SchaleDB export: student id string → student data. */
export type SchaleDbExport = Record<string, Student>;

function toProgress(student: Student): BA.StudentProgress {
    return {
        level: student.l,
        stars: student.s,
        weaponStars: student.ws,
        weaponLevel: student.wl,
        exSkill: student.s1,
        basicSkill: student.s2,
        subSkill: student.s3,
        passiveSkill: student.s4,
        affection: student.b,
        equipmentAtk: student.e1,
        equipmentDef: student.e2,
        equipmentHeal: student.e3,
        gear: student.e4,
        potentialHp: student.pm,
        potentialAtk: student.pa,
        potentialHeal: student.ph,
    };
}

function fromProgress(progress: BA.StudentProgress): Omit<Student, 'lock'> {
    return {
        s: progress.stars,
        l: progress.level,
        e1: progress.equipmentAtk,
        e2: progress.equipmentDef,
        e3: progress.equipmentHeal,
        e4: progress.gear,
        ws: progress.weaponStars,
        wl: progress.weaponLevel,
        b: progress.affection,
        s1: progress.exSkill,
        s2: progress.basicSkill,
        s3: progress.subSkill,
        s4: progress.passiveSkill,
        pm: progress.potentialHp,
        pa: progress.potentialAtk,
        ph: progress.potentialHeal,
    };
}

/** Convert a SchaleDB student (plus its id key) into the generic model. */
export function toGeneric(studentId: number | string, student: Student): BA.Student {
    const result: BA.Student = {
        id: typeof studentId === 'string' ? Number(studentId) : studentId,
        current: toProgress(student),
    };
    return result;
}

/** Convert a generic student back into a SchaleDB record (uses `current`). */
export function fromGeneric(student: BA.Student): Student {
    return {
        ...fromProgress(student.current),
        lock: false,
    };
}

/** Convert an entire SchaleDB export into generic students. */
export function schaleDbToBa(db: SchaleDbExport): BA.Student[] {
    return Object.entries(db).map(([id, student]) => toGeneric(id, student));
}

/** Convert generic students into a SchaleDB export map. */
export function baToSchaleDb(students: BA.Student[]): SchaleDbExport {
    return Object.fromEntries(
        students.map((student) => [String(student.id), fromGeneric(student)]),
    );
}

/**
 * Merge generic student progress into an existing SchaleDB export.
 * Updates matching records; preserves `lock` and students not in `students`.
 */
export function mergeWithGeneric(
    existing: SchaleDbExport,
    students: BA.Student[],
): SchaleDbExport {
    const result: SchaleDbExport = { ...existing };

    for (const student of students) {
        const id = String(student.id);
        const prev = existing[id];
        result[id] = {
            ...fromGeneric(student),
            lock: prev?.lock ?? false,
        };
    }

    return result;
}
