// components/.../enter-aoi-scores-dialog.tsx
"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input }      from "@/components/ui/input";
import { Button }     from "@/components/ui/button";
import { Badge }      from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast }      from "sonner";
import { Loader2, Save, Award, Info, Lock } from "lucide-react";
import { saveAOIScores } from "@/actions/marks-entry";

type AOITopic = { id: string; topicNumber: number; topicName: string; competence: string | null; maxPoints: number };

type StudentEnrollment = {
  id: string;
  enrollment: { student: { id: string; admissionNo: string; firstName: string; lastName: string } };
  aoiScores:  Array<{ id: string; score: number; remarks: string | null; genericSkills: string | null; aoiTopic: { id: string } }>;
};

type Props = {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  paperStreamSubject: {
    id: string;
    studentEnrollments: StudentEnrollment[];
    subjectPaper?: { name: string } | null;
  };
  aoiTopics:    AOITopic[];
  schoolId:     string;
  userId:       string;
  aoiMaxPoints: number;  // from ClassAssessmentConfig, default 3
  aoiWeight:    number;  // e.g. 20
  isLocked:     boolean;
};

// Raw (0–100) ↔ converted (0–aoiMaxPoints)
const toConverted = (raw: number, maxPts: number) => (raw / 100) * maxPts;
const toRaw       = (conv: number, maxPts: number) => (conv / maxPts) * 100;
const fmt2        = (n: number) => parseFloat(n.toFixed(2));

export default function EnterAOIScoresDialog({
  open, onOpenChange, paperStreamSubject, aoiTopics,
  schoolId, userId: _userId, aoiMaxPoints, aoiWeight, isLocked,
}: Props) {
  const [isLoading,     setIsLoading]     = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<AOITopic | null>(null);

  // rawScores[enrollmentId] = string the teacher typed (0–100)
  const [rawScores,     setRawScores]     = useState<Record<string, string>>({});
  // per-student remarks and generic skills
  const [remarks,       setRemarks]       = useState<Record<string, string>>({});
  const [genericSkills, setGenericSkills] = useState<Record<string, string>>({});

  const handleTopicSelect = (topic: AOITopic) => {
    setSelectedTopic(topic);
    const nextScores:  Record<string, string> = {};
    const nextRemarks: Record<string, string> = {};
    const nextSkills:  Record<string, string> = {};
    paperStreamSubject.studentEnrollments.forEach(se => {
      const existing = se.aoiScores.find(s => s.aoiTopic.id === topic.id);
      if (existing) {
        nextScores[se.id]  = String(Math.round(toRaw(existing.score, aoiMaxPoints)));
        nextRemarks[se.id] = existing.remarks       ?? "";
        nextSkills[se.id]  = existing.genericSkills ?? "";
      }
    });
    setRawScores(nextScores);
    setRemarks(nextRemarks);
    setGenericSkills(nextSkills);
  };

  // Derived: converted scores
  const converted = useMemo(() => {
    const out: Record<string, number | null> = {};
    paperStreamSubject.studentEnrollments.forEach(se => {
      const raw = parseFloat(rawScores[se.id] ?? "");
      out[se.id] = isNaN(raw) ? null : fmt2(toConverted(raw, aoiMaxPoints));
    });
    return out;
  }, [rawScores, aoiMaxPoints]);

  const classAvg = useMemo(() => {
    const vals = Object.values(converted).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [converted]);

  const aoiContrib = (conv: number) => fmt2((conv / aoiMaxPoints) * aoiWeight).toFixed(2);

  const onSubmit = async () => {
    if (!selectedTopic) { toast.error("Select a topic first"); return; }
    if (isLocked)       { toast.error("Marks are locked for this class/term"); return; }

    const scores = paperStreamSubject.studentEnrollments
      .map(se => {
        const raw = parseFloat(rawScores[se.id] ?? "");
        if (isNaN(raw) || raw < 0 || raw > 100) return null;
        return {
          studentSubjectEnrollmentId: se.id,
          score:         fmt2(toConverted(raw, aoiMaxPoints)),
          remarks:       remarks[se.id]       || undefined,
          genericSkills: genericSkills[se.id] || undefined,
        };
      })
      .filter(Boolean) as Array<{ studentSubjectEnrollmentId: string; score: number; remarks?: string; genericSkills?: string }>;

    if (scores.length === 0) { toast.error("No valid scores to save (enter 0–100)"); return; }

    setIsLoading(true);
    try {
      const result = await saveAOIScores({
        aoiTopicId:      selectedTopic.id,
        streamSubjectId: paperStreamSubject.id,
        scores,
        teacherId: null,
        schoolId,
      });
      if (result.ok) { toast.success(result.message); onOpenChange(false); }
      else             toast.error(result.message);
    } catch { toast.error("Failed to save AOI scores"); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            AOI Scores — {paperStreamSubject.subjectPaper?.name ?? ""}
            {isLocked && (
              <Badge className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Lock className="h-3 w-3 mr-1" /> Locked
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Enter raw marks out of <strong>100</strong>. System auto-converts to out of <strong>{aoiMaxPoints}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Conversion info */}
        <div className="flex items-start gap-2.5 px-6 py-3 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 shrink-0">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>Formula:</strong> Raw ÷ 100 × {aoiMaxPoints} = score out of {aoiMaxPoints}
            &ensp;|&ensp; e.g. 50 → <strong>{toConverted(50, aoiMaxPoints).toFixed(2)}/{aoiMaxPoints}</strong>
            &ensp;|&ensp; AOI weight = <strong>{aoiWeight}%</strong> of total mark
            &ensp;|&ensp; Max AOI contribution = <strong>{aoiWeight} marks</strong>
          </p>
        </div>

        {/* Topic selector */}
        <div className="px-6 py-3 border-b shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Select Topic</p>
          <div className="flex flex-wrap gap-2">
            {aoiTopics.map(topic => (
              <button key={topic.id} onClick={() => handleTopicSelect(topic)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selectedTopic?.id === topic.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600"
                }`}
              >
                T{topic.topicNumber}: {topic.topicName}
              </button>
            ))}
            {aoiTopics.length === 0 && (
              <p className="text-sm text-slate-400">No AOI topics configured for this subject.</p>
            )}
          </div>
          {/* Competence banner */}
          {selectedTopic?.competence && (
            <p className="mt-2 text-xs text-blue-700 dark:text-blue-300 italic bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg px-3 py-1.5">
              <span className="font-semibold not-italic">Competence:</span> {selectedTopic.competence}
            </p>
          )}
        </div>

        {/* Class average */}
        {selectedTopic && classAvg !== null && (
          <div className="flex items-center gap-6 px-6 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 shrink-0 text-sm">
            <span className="text-blue-700 dark:text-blue-300">
              Class avg: <strong>{classAvg.toFixed(2)}/{aoiMaxPoints}</strong>
            </span>
            <span className="text-blue-700 dark:text-blue-300">
              Avg AOI contribution: <strong>{aoiContrib(classAvg)}/{aoiWeight}</strong>
            </span>
          </div>
        )}

        {/* Table */}
        <ScrollArea className="flex-1 min-h-0">
          {!selectedTopic ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              ← Choose a topic above to enter scores
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Adm No</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Raw Mark<br/><span className="font-normal normal-case opacity-70">(0–100)</span>
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Converted<br/><span className="font-normal normal-case opacity-70">(/{aoiMaxPoints})</span>
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    AOI Contrib<br/><span className="font-normal normal-case opacity-70">(/{aoiWeight})</span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[160px]">Generic Skills</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[160px]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paperStreamSubject.studentEnrollments.map((se, i) => {
                  const rawStr = rawScores[se.id] ?? "";
                  const rawVal = parseFloat(rawStr);
                  const conv   = converted[se.id];
                  const isInvalid = rawStr !== "" && (isNaN(rawVal) || rawVal < 0 || rawVal > 100);

                  return (
                    <tr key={se.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 text-xs tabular-nums">{i + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {se.enrollment.student.firstName} {se.enrollment.student.lastName}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-slate-500">
                        {se.enrollment.student.admissionNo}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col items-center gap-0.5">
                          <Input
                            type="number" min={0} max={100} step={0.5}
                            value={rawStr}
                            onChange={e => !isLocked && setRawScores(p => ({ ...p, [se.id]: e.target.value }))}
                            disabled={isLocked}
                            placeholder="0–100"
                            className={`text-center w-24 mx-auto h-8 ${isInvalid ? "border-blue-400" : ""}`}
                          />
                          {isInvalid && <p className="text-xs text-blue-500">0–100</p>}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {conv !== null
                          ? <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{conv.toFixed(2)}<span className="text-xs font-normal text-slate-400">/{aoiMaxPoints}</span></span>
                          : <span className="text-slate-300 dark:text-slate-600">—</span>
                        }
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {conv !== null
                          ? <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{aoiContrib(conv)}<span className="text-xs font-normal text-slate-400">/{aoiWeight}</span></span>
                          : <span className="text-slate-300 dark:text-slate-600">—</span>
                        }
                      </td>
                      <td className="py-2 px-3">
                        <textarea
                          rows={2}
                          value={genericSkills[se.id] ?? ""}
                          onChange={e => !isLocked && setGenericSkills(p => ({ ...p, [se.id]: e.target.value }))}
                          disabled={isLocked}
                          placeholder="e.g. Critical thinking, teamwork…"
                          className="w-full text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <textarea
                          rows={2}
                          value={remarks[se.id] ?? ""}
                          onChange={e => !isLocked && setRemarks(p => ({ ...p, [se.id]: e.target.value }))}
                          disabled={isLocked}
                          placeholder="Teacher remarks…"
                          className="w-full text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-background shrink-0">
          <p className="text-xs text-muted-foreground">
            {selectedTopic
              ? `T${selectedTopic.topicNumber}: ${selectedTopic.topicName}`
              : "Select a topic to begin entering scores"
            }
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={onSubmit} disabled={isLoading || isLocked || !selectedTopic}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Scores</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}