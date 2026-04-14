// lib/timetable/generator.ts
// ASC-style Genetic Algorithm timetable generator
// Replaces the previous greedy implementation.
// Export signature is unchanged: generateTimetable(input: GeneratorInput): GenerationResult

import { DayOfWeek, SlotType } from "@prisma/client";
import type {
  GeneratorInput,
  GenerationResult,
  GenerationConflict,
  PlacedSlot,
  SchoolDayConfigWithSlots,
  TeacherAvailabilityMap,
  ApprovedLeave,
} from "./types";

// ─── GA Configuration ─────────────────────────────────────────────────────────

const GA_CONFIG = {
  POPULATION_SIZE:       80,
  MAX_GENERATIONS:       500,
  ELITE_COUNT:           5,
  CROSSOVER_RATE:        0.85,
  MUTATION_RATE:         0.05,
  TOURNAMENT_SIZE:       5,
  CONVERGENCE_THRESHOLD: 1.0,
  NO_IMPROVEMENT_LIMIT:  80,
} as const;

// Soft penalty weights
const PENALTY = {
  HARD:                        1000,
  SUBJECT_TWICE_IN_ONE_DAY:    5,
  TEACHER_GAPS:                2,
  DOUBLE_NOT_CONSECUTIVE:      3,
  PREFERRED_DAY_IGNORED:       1,
  DIFFICULT_SUBJECT_LAST_SLOT: 2,
  SAME_SUBJECT_CONSECUTIVE:    1,
} as const;

// ─── Internal types ───────────────────────────────────────────────────────────

type SlotOption = {
  dayOfWeek:  string;
  slotNumber: number;
  startTime:  string;
  endTime:    string;
  slotType:   string;
};

type PlacementRequirement = {
  reqId:           string;   // streamId + ":" + classSubjectId
  streamId:        string;
  classSubjectId:  string;
  streamSubjectId: string;   // primary stream subject id (for PlacedSlot)
  subjectId:       string;
  teacherId:       string;
  periodsPerWeek:  number;
  allowDoubles:    boolean;
  maxPerDay:       number;
  preferredDays:   string[];
  requiresPrepSlot: boolean;
};

type Gene = {
  reqId:           string;
  streamSubjectId: string;
  streamId:        string;
  classSubjectId:  string;
  subjectId:       string;
  teacherId:       string;
  dayOfWeek:       string;
  slotNumber:      number;
  startTime:       string;
  endTime:         string;
  slotType:        string;
  isDouble:        boolean;
};

type Chromosome = {
  id:             string;
  genes:          Gene[];
  fitness:        number;
  hardViolations: number;
  softPenalty:    number;
};

// ─── Main entry point ─────────────────────────────────────────────────────────

export function generateTimetable(input: GeneratorInput): GenerationResult {
  // ── Step 1: Build slot pool ────────────────────────────────────────────────
  const allSlots:    SlotOption[] = [];
  const lessonSlots: SlotOption[] = [];
  const prepSlots:   SlotOption[] = [];

  for (const dc of input.dayConfigs) {
    if (!dc.isActive) continue;
    for (const s of dc.slots) {
      const opt: SlotOption = {
        dayOfWeek:  dc.dayOfWeek,
        slotNumber: s.slotNumber,
        startTime:  s.startTime,
        endTime:    s.endTime,
        slotType:   s.slotType,
      };
      if (s.slotType === SlotType.LESSON || s.slotType === SlotType.PREP) {
        allSlots.push(opt);
        if (s.slotType === SlotType.LESSON) lessonSlots.push(opt);
        else prepSlots.push(opt);
      }
    }
  }

  if (allSlots.length === 0) {
    return {
      placed: [],
      conflicts: [{
        conflictType: "INSUFFICIENT_SLOTS",
        severity:     "ERROR",
        description:  "No LESSON or PREP slots found in day configuration.",
      }],
      success: false,
    };
  }

  // ── Step 2: Build placement requirements ──────────────────────────────────
  const hc7Conflicts: GenerationConflict[] = [];
  const requirements  = buildRequirements(input, hc7Conflicts);

  if (requirements.length === 0) {
    return {
      placed:    [],
      conflicts: hc7Conflicts,
      success:   false,
    };
  }

  // Cache valid slots per requirement (they don't change during the run)
  const validSlotsCache = new Map<string, SlotOption[]>();
  for (const req of requirements) {
    const slots = getValidSlots(req, input.teacherAvailability, input.approvedLeaves, allSlots, lessonSlots, prepSlots);
    validSlotsCache.set(req.reqId, slots);
  }

  // ── Step 3: Initial population ────────────────────────────────────────────
  console.log(`[Timetable Gen] Starting: ${GA_CONFIG.POPULATION_SIZE} chromosomes, ${GA_CONFIG.MAX_GENERATIONS} max generations`);

  let population: Chromosome[] = [];
  for (let i = 0; i < GA_CONFIG.POPULATION_SIZE; i++) {
    const c = createRandomChromosome(requirements, validSlotsCache, input.dayConfigs);
    evaluateFitness(c, requirements, input);
    population.push(c);
  }

  // ── Step 4–5: Evolution loop ──────────────────────────────────────────────
  let generation        = 0;
  let bestFitness       = 0;
  let noImprovementCount = 0;
  let stoppedReason: "CONVERGED" | "NO_IMPROVEMENT" | "MAX_GENERATIONS" = "MAX_GENERATIONS";

  population.sort((a, b) => b.fitness - a.fitness);
  bestFitness = population[0].fitness;

  while (generation < GA_CONFIG.MAX_GENERATIONS) {
    if (bestFitness >= GA_CONFIG.CONVERGENCE_THRESHOLD) {
      stoppedReason = "CONVERGED";
      console.log(`[Timetable Gen] Gen ${String(generation).padStart(4)} | Best fitness: ${bestFitness.toFixed(4)} | Hard violations: ${population[0].hardViolations} ✓ CONVERGED`);
      break;
    }
    if (noImprovementCount >= GA_CONFIG.NO_IMPROVEMENT_LIMIT) {
      stoppedReason = "NO_IMPROVEMENT";
      break;
    }

    // Log every 10 generations
    if (generation % 10 === 0) {
      process.stdout.write(`[Timetable Gen] Gen ${String(generation).padStart(4)} | Best fitness: ${bestFitness.toFixed(4)} | Hard violations: ${population[0].hardViolations}\n`);
    }

    const newPopulation: Chromosome[] = [];

    // Elitism
    population.sort((a, b) => b.fitness - a.fitness);
    for (let i = 0; i < GA_CONFIG.ELITE_COUNT && i < population.length; i++) {
      newPopulation.push(cloneChromosome(population[i]));
    }

    // Fill rest with offspring
    while (newPopulation.length < GA_CONFIG.POPULATION_SIZE) {
      const parent1 = tournamentSelect(population);
      const parent2 = tournamentSelect(population);

      let child1: Chromosome;
      let child2: Chromosome;

      if (Math.random() < GA_CONFIG.CROSSOVER_RATE) {
        [child1, child2] = crossover(parent1, parent2, requirements);
      } else {
        child1 = cloneChromosome(parent1);
        child2 = cloneChromosome(parent2);
      }

      child1 = mutate(child1, requirements, validSlotsCache, input.dayConfigs);
      child2 = mutate(child2, requirements, validSlotsCache, input.dayConfigs);

      evaluateFitness(child1, requirements, input);
      evaluateFitness(child2, requirements, input);

      newPopulation.push(child1);
      if (newPopulation.length < GA_CONFIG.POPULATION_SIZE) newPopulation.push(child2);
    }

    population = newPopulation.slice(0, GA_CONFIG.POPULATION_SIZE);
    population.sort((a, b) => b.fitness - a.fitness);

    const newBest = population[0].fitness;
    if (newBest > bestFitness) {
      bestFitness = newBest;
      noImprovementCount = 0;
    } else {
      noImprovementCount++;
    }

    generation++;
  }

  if (stoppedReason === "MAX_GENERATIONS") {
    process.stdout.write(`[Timetable Gen] Gen ${String(generation).padStart(4)} | Best fitness: ${bestFitness.toFixed(4)} | Hard violations: ${population[0].hardViolations}\n`);
  }

  // ── Step 9: Convert best chromosome to GenerationResult ───────────────────
  population.sort((a, b) => b.fitness - a.fitness);
  const best = population[0];

  console.log(`[Timetable Gen] Complete: ${generation} generations, fitness ${bestFitness.toFixed(4)}, ${best.hardViolations} hard violations`);

  const placed    = genesToPlacedSlots(best.genes);
  const { hardDetails, softDetails } = buildConflictDetails(best.genes, requirements, input);
  const allConflicts: GenerationConflict[] = [...hc7Conflicts, ...hardDetails, ...softDetails];

  return {
    placed,
    conflicts: allConflicts,
    success:   best.hardViolations === 0,
    generationStats: {
      generationsRun:   generation,
      finalBestFitness: bestFitness,
      populationSize:   GA_CONFIG.POPULATION_SIZE,
      stoppedEarly:     generation < GA_CONFIG.MAX_GENERATIONS,
      stoppedReason,
    },
  };
}

// ─── Step 2: Build requirements ───────────────────────────────────────────────

function buildRequirements(
  input:        GeneratorInput,
  hc7Conflicts: GenerationConflict[],
): PlacementRequirement[] {
  // Deduplicate by (streamId + classSubjectId) — multiple papers share one config
  const seen = new Map<string, PlacementRequirement>();

  for (const ss of input.streamSubjects) {
    const rid = requirementId(ss.streamId, ss.classSubjectId);
    if (seen.has(rid)) continue;

    const teacher = ss.teacherAssignments.find(ta => ta.status === "ACTIVE")?.teacherId ?? null;
    if (!teacher) {
      hc7Conflicts.push({
        conflictType: "NO_TEACHER_ASSIGNED",
        severity:     "WARNING",
        description:  `No active teacher for stream subject ${ss.id} — skipped`,
        streamId:     ss.streamId,
        subjectId:    ss.subjectId,
      });
      continue;
    }

    const cfg = ss.classSubject.timetableConfig;
    seen.set(rid, {
      reqId:           rid,
      streamId:        ss.streamId,
      classSubjectId:  ss.classSubjectId,
      streamSubjectId: ss.id,
      subjectId:       ss.subjectId,
      teacherId:       teacher,
      periodsPerWeek:  cfg?.lessonsPerWeek ?? 3,
      allowDoubles:    cfg?.allowDoubles   ?? false,
      maxPerDay:       1,
      preferredDays:   [],
      requiresPrepSlot: false,
    });
  }

  // Sort hardest to place first (most periods per week)
  return [...seen.values()].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);
}

// ─── Step 3: Random chromosome ────────────────────────────────────────────────

function createRandomChromosome(
  requirements:   PlacementRequirement[],
  validSlotsCache: Map<string, SlotOption[]>,
  dayConfigs:     SchoolDayConfigWithSlots[],
): Chromosome {
  const genes: Gene[] = [];

  for (const req of requirements) {
    const slots = validSlotsCache.get(req.reqId) ?? [];
    if (slots.length === 0) continue;

    let placed = 0;
    const needed = req.periodsPerWeek;

    // Try double period first (30% chance when allowed)
    if (req.allowDoubles && needed >= 2 && Math.random() < 0.3) {
      const lessonOnly = slots.filter(s => s.slotType === SlotType.LESSON);
      const doubled    = tryPickDouble(lessonOnly, dayConfigs);
      if (doubled) {
        genes.push(makeGene(req, doubled[0], true));
        genes.push(makeGene(req, doubled[1], false));
        placed += 2;
      }
    }

    // Fill remaining periods with random slots
    const shuffled = shuffle([...slots]);
    for (const slot of shuffled) {
      if (placed >= needed) break;
      genes.push(makeGene(req, slot, false));
      placed++;
    }

    // If not enough valid slots, repeat random picks (initial pop can have conflicts)
    while (placed < needed) {
      const slot = slots[Math.floor(Math.random() * slots.length)];
      genes.push(makeGene(req, slot, false));
      placed++;
    }
  }

  return { id: uid(), genes, fitness: 0, hardViolations: 0, softPenalty: 0 };
}

function tryPickDouble(
  lessonSlots: SlotOption[],
  dayConfigs:  SchoolDayConfigWithSlots[],
): [SlotOption, SlotOption] | null {
  // Group by day
  const byDay = new Map<string, SlotOption[]>();
  for (const s of lessonSlots) {
    const arr = byDay.get(s.dayOfWeek) ?? [];
    arr.push(s);
    byDay.set(s.dayOfWeek, arr);
  }
  const days = [...byDay.keys()];
  shuffle(days);
  for (const day of days) {
    const daySlots = (byDay.get(day) ?? []).sort((a, b) => a.slotNumber - b.slotNumber);
    for (let i = 0; i < daySlots.length - 1; i++) {
      if (daySlots[i + 1].slotNumber === daySlots[i].slotNumber + 1) {
        return [daySlots[i], daySlots[i + 1]];
      }
    }
  }
  return null;
}

// ─── Step 4: Fitness evaluation ───────────────────────────────────────────────

function evaluateFitness(
  c:            Chromosome,
  requirements: PlacementRequirement[],
  input:        GeneratorInput,
): void {
  const hard = countHardViolations(c.genes, requirements, input);
  const soft = countSoftPenalty(c.genes, requirements, input.dayConfigs);
  c.hardViolations = hard;
  c.softPenalty    = soft;
  c.fitness        = 1 / (1 + hard * PENALTY.HARD + soft);
}

function countHardViolations(
  genes:        Gene[],
  requirements: PlacementRequirement[],
  input:        GeneratorInput,
): number {
  let count = 0;

  // HC1 — teacher double-booked
  const teacherSlot = new Map<string, number>();
  for (const g of genes) {
    const k = `${g.teacherId}:${g.dayOfWeek}:${g.slotNumber}`;
    teacherSlot.set(k, (teacherSlot.get(k) ?? 0) + 1);
  }
  for (const v of teacherSlot.values()) if (v > 1) count += v - 1;

  // HC2 — stream double-booked
  const streamSlot = new Map<string, number>();
  for (const g of genes) {
    const k = `${g.streamId}:${g.dayOfWeek}:${g.slotNumber}`;
    streamSlot.set(k, (streamSlot.get(k) ?? 0) + 1);
  }
  for (const v of streamSlot.values()) if (v > 1) count += v - 1;

  // HC3 — frequency not met
  const reqCount = new Map<string, number>();
  for (const g of genes) reqCount.set(g.reqId, (reqCount.get(g.reqId) ?? 0) + 1);
  for (const req of requirements) {
    const actual = reqCount.get(req.reqId) ?? 0;
    if (actual !== req.periodsPerWeek) count += Math.abs(actual - req.periodsPerWeek);
  }

  // HC4 — part-time violation
  for (const g of genes) {
    if (isTeacherBlockedOnDay(g.teacherId, g.dayOfWeek, input.teacherAvailability, input.approvedLeaves)) {
      count++;
    }
  }

  // HC6 — slot type mismatch (lesson in wrong slot type)
  for (const g of genes) {
    if (g.slotType !== SlotType.LESSON && g.slotType !== SlotType.PREP) count++;
  }

  return count;
}

function countSoftPenalty(
  genes:        Gene[],
  requirements: PlacementRequirement[],
  dayConfigs:   SchoolDayConfigWithSlots[],
): number {
  let penalty = 0;

  // SC1 — subject twice in one day
  const subjectDayCount = new Map<string, number>();
  for (const g of genes) {
    const k = `${g.streamId}:${g.classSubjectId}:${g.dayOfWeek}`;
    subjectDayCount.set(k, (subjectDayCount.get(k) ?? 0) + 1);
  }
  for (const [, count] of subjectDayCount) {
    if (count > 1) penalty += PENALTY.SUBJECT_TWICE_IN_ONE_DAY * (count - 1);
  }

  // SC2 — teacher gaps
  const teacherDaySlots = new Map<string, number[]>();
  for (const g of genes) {
    const k = `${g.teacherId}:${g.dayOfWeek}`;
    const arr = teacherDaySlots.get(k) ?? [];
    arr.push(g.slotNumber);
    teacherDaySlots.set(k, arr);
  }
  for (const slots of teacherDaySlots.values()) {
    const sorted = slots.sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) penalty += PENALTY.TEACHER_GAPS;
    }
  }

  // SC3 — double period not consecutive
  const reqGenes = new Map<string, Gene[]>();
  for (const g of genes) {
    const arr = reqGenes.get(g.reqId) ?? [];
    arr.push(g);
    reqGenes.set(g.reqId, arr);
  }
  for (const req of requirements) {
    if (!req.allowDoubles) continue;
    const gs = reqGenes.get(req.reqId) ?? [];
    const doubles = gs.filter(g => g.isDouble);
    for (const d of doubles) {
      const partner = gs.find(g =>
        !g.isDouble && g.dayOfWeek === d.dayOfWeek && g.slotNumber === d.slotNumber + 1
      );
      if (!partner) penalty += PENALTY.DOUBLE_NOT_CONSECUTIVE;
    }
  }

  // SC4 — preferred day ignored
  for (const req of requirements) {
    if (req.preferredDays.length === 0) continue;
    const gs = reqGenes.get(req.reqId) ?? [];
    for (const g of gs) {
      if (!req.preferredDays.includes(g.dayOfWeek)) penalty += PENALTY.PREFERRED_DAY_IGNORED;
    }
  }

  // SC5 — difficult subject in last slot
  const lastSlotPerDay = new Map<string, number>();
  for (const dc of dayConfigs) {
    const lessonSlots = dc.slots.filter(s => s.slotType === SlotType.LESSON);
    if (lessonSlots.length > 0) {
      lastSlotPerDay.set(dc.dayOfWeek, Math.max(...lessonSlots.map(s => s.slotNumber)));
    }
  }
  for (const req of requirements) {
    if (req.periodsPerWeek < 5) continue;
    const gs = reqGenes.get(req.reqId) ?? [];
    for (const g of gs) {
      if (g.slotNumber === lastSlotPerDay.get(g.dayOfWeek)) {
        penalty += PENALTY.DIFFICULT_SUBJECT_LAST_SLOT;
      }
    }
  }

  // SC6 — same subject on consecutive days
  for (const req of requirements) {
    if (req.periodsPerWeek > 2) continue;
    const gs = reqGenes.get(req.reqId) ?? [];
    const days = gs.map(g => g.dayOfWeek);
    const dayOrder = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
    const indices  = days.map(d => dayOrder.indexOf(d)).sort((a, b) => a - b);
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] - indices[i - 1] === 1) penalty += PENALTY.SAME_SUBJECT_CONSECUTIVE;
    }
  }

  return penalty;
}

// ─── Step 6: Tournament selection ────────────────────────────────────────────

function tournamentSelect(population: Chromosome[]): Chromosome {
  const competitors = pickRandom(population, GA_CONFIG.TOURNAMENT_SIZE);
  return competitors.sort((a, b) => b.fitness - a.fitness)[0];
}

// ─── Step 7: Crossover ────────────────────────────────────────────────────────

function crossover(
  p1:           Chromosome,
  p2:           Chromosome,
  requirements: PlacementRequirement[],
): [Chromosome, Chromosome] {
  const point = Math.floor(Math.random() * requirements.length);

  const p1ByReq = groupGenesByReq(p1.genes);
  const p2ByReq = groupGenesByReq(p2.genes);

  const c1Genes: Gene[] = [];
  const c2Genes: Gene[] = [];

  for (let i = 0; i < requirements.length; i++) {
    const rid = requirements[i].reqId;
    if (i < point) {
      c1Genes.push(...(p1ByReq.get(rid) ?? []).map(g => ({ ...g })));
      c2Genes.push(...(p2ByReq.get(rid) ?? []).map(g => ({ ...g })));
    } else {
      c1Genes.push(...(p2ByReq.get(rid) ?? []).map(g => ({ ...g })));
      c2Genes.push(...(p1ByReq.get(rid) ?? []).map(g => ({ ...g })));
    }
  }

  return [
    { id: uid(), genes: c1Genes, fitness: 0, hardViolations: 0, softPenalty: 0 },
    { id: uid(), genes: c2Genes, fitness: 0, hardViolations: 0, softPenalty: 0 },
  ];
}

// ─── Step 8: Mutation ─────────────────────────────────────────────────────────

function mutate(
  c:             Chromosome,
  requirements:  PlacementRequirement[],
  validSlotsCache: Map<string, SlotOption[]>,
  dayConfigs:    SchoolDayConfigWithSlots[],
): Chromosome {
  const genes = c.genes.map(g => ({ ...g }));

  for (let i = 0; i < genes.length; i++) {
    if (Math.random() >= GA_CONFIG.MUTATION_RATE) continue;

    const roll = Math.random();

    if (roll < 0.60) {
      // Type A — random slot
      const slots = validSlotsCache.get(genes[i].reqId) ?? [];
      if (slots.length > 0) {
        const s = slots[Math.floor(Math.random() * slots.length)];
        genes[i] = { ...genes[i], dayOfWeek: s.dayOfWeek, slotNumber: s.slotNumber, startTime: s.startTime, endTime: s.endTime, slotType: s.slotType };
      }
    } else if (roll < 0.85) {
      // Type B — swap with same subject
      const sameSubject = genes.filter((g, j) => j !== i && g.classSubjectId === genes[i].classSubjectId);
      if (sameSubject.length > 0) {
        const partner = sameSubject[Math.floor(Math.random() * sameSubject.length)];
        const partnerIdx = genes.indexOf(partner);
        [genes[i].dayOfWeek, partner.dayOfWeek] = [partner.dayOfWeek, genes[i].dayOfWeek];
        [genes[i].slotNumber, partner.slotNumber] = [partner.slotNumber, genes[i].slotNumber];
        [genes[i].startTime, partner.startTime] = [partner.startTime, genes[i].startTime];
        [genes[i].endTime, partner.endTime] = [partner.endTime, genes[i].endTime];
        [genes[i].slotType, partner.slotType] = [partner.slotType, genes[i].slotType];
        genes[partnerIdx] = partner;
      }
    } else {
      // Type C — swap with same teacher
      const sameTeacher = genes.filter((g, j) => j !== i && g.teacherId === genes[i].teacherId);
      if (sameTeacher.length > 0) {
        const partner = sameTeacher[Math.floor(Math.random() * sameTeacher.length)];
        const partnerIdx = genes.indexOf(partner);
        [genes[i].dayOfWeek, partner.dayOfWeek] = [partner.dayOfWeek, genes[i].dayOfWeek];
        [genes[i].slotNumber, partner.slotNumber] = [partner.slotNumber, genes[i].slotNumber];
        [genes[i].startTime, partner.startTime] = [partner.startTime, genes[i].startTime];
        [genes[i].endTime, partner.endTime] = [partner.endTime, genes[i].endTime];
        [genes[i].slotType, partner.slotType] = [partner.slotType, genes[i].slotType];
        genes[partnerIdx] = partner;
      }
    }
  }

  return { ...c, id: uid(), genes };
}

// ─── Step 9: Convert to GenerationResult ─────────────────────────────────────

function genesToPlacedSlots(genes: Gene[]): PlacedSlot[] {
  return genes.map(g => ({
    streamId:        g.streamId,
    streamSubjectId: g.streamSubjectId,
    teacherId:       g.teacherId,
    dayOfWeek:       g.dayOfWeek as DayOfWeek,
    slotNumber:      g.slotNumber,
    startTime:       g.startTime,
    endTime:         g.endTime,
    slotType:        g.slotType as SlotType,
    isDouble:        g.isDouble,
  }));
}

function buildConflictDetails(
  genes:        Gene[],
  requirements: PlacementRequirement[],
  input:        GeneratorInput,
): { hardDetails: GenerationConflict[]; softDetails: GenerationConflict[] } {
  const hardDetails: GenerationConflict[] = [];
  const softDetails: GenerationConflict[] = [];

  // HC1
  const teacherSlot = new Map<string, Gene[]>();
  for (const g of genes) {
    const k = `${g.teacherId}:${g.dayOfWeek}:${g.slotNumber}`;
    const arr = teacherSlot.get(k) ?? [];
    arr.push(g);
    teacherSlot.set(k, arr);
  }
  for (const [k, gs] of teacherSlot) {
    if (gs.length > 1) {
      const [tid, day, slot] = k.split(":");
      hardDetails.push({
        conflictType: "TEACHER_DOUBLE_BOOKED",
        severity:     "ERROR",
        description:  `Teacher ${tid} double-booked on ${day} slot ${slot} (${gs.length} subjects)`,
        dayOfWeek:    day as DayOfWeek,
        slotNumber:   Number(slot),
        teacherId:    tid,
      });
    }
  }

  // HC2
  const streamSlot = new Map<string, Gene[]>();
  for (const g of genes) {
    const k = `${g.streamId}:${g.dayOfWeek}:${g.slotNumber}`;
    const arr = streamSlot.get(k) ?? [];
    arr.push(g);
    streamSlot.set(k, arr);
  }
  for (const [k, gs] of streamSlot) {
    if (gs.length > 1) {
      const [sid, day, slot] = k.split(":");
      hardDetails.push({
        conflictType: "STREAM_DOUBLE_BOOKED",
        severity:     "ERROR",
        description:  `Stream ${sid} has ${gs.length} subjects in ${day} slot ${slot}`,
        dayOfWeek:    day as DayOfWeek,
        slotNumber:   Number(slot),
        streamId:     sid,
      });
    }
  }

  // HC3
  const reqCount = new Map<string, number>();
  for (const g of genes) reqCount.set(g.reqId, (reqCount.get(g.reqId) ?? 0) + 1);
  for (const req of requirements) {
    const actual = reqCount.get(req.reqId) ?? 0;
    if (actual !== req.periodsPerWeek) {
      hardDetails.push({
        conflictType: "FREQUENCY_NOT_MET",
        severity:     "ERROR",
        description:  `Subject placed ${actual}/${req.periodsPerWeek} times for stream ${req.streamId}`,
        streamId:     req.streamId,
        subjectId:    req.subjectId,
      });
    }
  }

  // HC4
  for (const g of genes) {
    if (isTeacherBlockedOnDay(g.teacherId, g.dayOfWeek, input.teacherAvailability, input.approvedLeaves)) {
      hardDetails.push({
        conflictType: "PART_TIME_VIOLATION",
        severity:     "ERROR",
        description:  `Teacher ${g.teacherId} scheduled on unavailable day ${g.dayOfWeek}`,
        dayOfWeek:    g.dayOfWeek as DayOfWeek,
        teacherId:    g.teacherId,
      });
    }
  }

  // SC1
  const subjectDayCount = new Map<string, number>();
  for (const g of genes) {
    const k = `${g.streamId}:${g.classSubjectId}:${g.dayOfWeek}`;
    subjectDayCount.set(k, (subjectDayCount.get(k) ?? 0) + 1);
  }
  for (const [k, count] of subjectDayCount) {
    if (count > 1) {
      const [sid, , day] = k.split(":");
      softDetails.push({
        conflictType: "SUBJECT_TWICE_IN_ONE_DAY",
        severity:     "WARNING",
        description:  `Subject appears ${count}x on ${day} for stream ${sid}`,
        dayOfWeek:    day as DayOfWeek,
        streamId:     sid,
      });
    }
  }

  // SC2 — teacher gaps
  const teacherDaySlots = new Map<string, number[]>();
  for (const g of genes) {
    const k = `${g.teacherId}:${g.dayOfWeek}`;
    const arr = teacherDaySlots.get(k) ?? [];
    arr.push(g.slotNumber);
    teacherDaySlots.set(k, arr);
  }
  for (const [k, slots] of teacherDaySlots) {
    const sorted = slots.sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) {
        const [tid, day] = k.split(":");
        softDetails.push({
          conflictType: "TEACHER_GAPS",
          severity:     "WARNING",
          description:  `Teacher ${tid} has a gap on ${day} between slots ${sorted[i-1]} and ${sorted[i]}`,
          dayOfWeek:    day as DayOfWeek,
          teacherId:    tid,
        });
      }
    }
  }

  return { hardDetails, softDetails };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requirementId(streamId: string, classSubjectId: string): string {
  return `${streamId}:${classSubjectId}`;
}

function groupGenesByReq(genes: Gene[]): Map<string, Gene[]> {
  const map = new Map<string, Gene[]>();
  for (const g of genes) {
    const arr = map.get(g.reqId) ?? [];
    arr.push(g);
    map.set(g.reqId, arr);
  }
  return map;
}

function getValidSlots(
  req:             PlacementRequirement,
  availabilityMap: TeacherAvailabilityMap,
  approvedLeaves:  ApprovedLeave[],
  allSlots:        SlotOption[],
  lessonSlots:     SlotOption[],
  prepSlots:       SlotOption[],
): SlotOption[] {
  const pool = req.requiresPrepSlot ? prepSlots : allSlots;
  return pool.filter(s =>
    !isTeacherBlockedOnDay(req.teacherId, s.dayOfWeek, availabilityMap, approvedLeaves)
  );
}

function isTeacherBlockedOnDay(
  teacherId:       string,
  dayOfWeek:       string,
  availabilityMap: TeacherAvailabilityMap,
  approvedLeaves:  ApprovedLeave[],
): boolean {
  // Check availability map
  const dayMap = availabilityMap.get(teacherId);
  if (dayMap) {
    const avail = dayMap.get(dayOfWeek as DayOfWeek);
    if (avail && !avail.isAvailable) return true;
  }
  // Check approved leaves (day-of-week based — leaves block the whole day)
  const dayOrder = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const targetDow = dayOrder.indexOf(dayOfWeek);
  for (const leave of approvedLeaves) {
    if (leave.teacherId !== teacherId) continue;
    const start = new Date(leave.startDate);
    const end   = new Date(leave.endDate);
    const cur   = new Date(start);
    while (cur <= end) {
      if (cur.getDay() === targetDow) return true;
      cur.setDate(cur.getDate() + 1);
    }
  }
  return false;
}

function makeGene(req: PlacementRequirement, slot: SlotOption, isDouble: boolean): Gene {
  return {
    reqId:           req.reqId,
    streamSubjectId: req.streamSubjectId,
    streamId:        req.streamId,
    classSubjectId:  req.classSubjectId,
    subjectId:       req.subjectId,
    teacherId:       req.teacherId,
    dayOfWeek:       slot.dayOfWeek,
    slotNumber:      slot.slotNumber,
    startTime:       slot.startTime,
    endTime:         slot.endTime,
    slotType:        slot.slotType,
    isDouble,
  };
}

function cloneChromosome(c: Chromosome): Chromosome {
  return { ...c, id: uid(), genes: c.genes.map(g => ({ ...g })) };
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * (copy.length - i));
    result.push(copy[idx]);
    copy[idx] = copy[copy.length - 1 - i];
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let _uidCounter = 0;
function uid(): string {
  return `c${Date.now()}-${++_uidCounter}`;
}
