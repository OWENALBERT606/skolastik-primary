



// // components/dashboard/subjects/subject-detail-modal.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Book,
//   BookOpen,
//   Calendar,
//   Check,
//   ChevronDown,
//   ChevronUp,
//   Edit2,
//   FileText,
//   Hash,
//   Loader2,
//   MoreVertical,
//   Pencil,
//   Plus,
//   Trash2,
//   User,
//   Users,
//   X,
// } from "lucide-react";
// import { toast } from "sonner";
// import { SubjectPaperModal } from "./subject-papaer-model";
// import { SubjectFormModal } from "./subbject-form-model";
// import { deleteSubjectPaper, getSubjectWithPapers, togglePaperStatus } from "@/actions/subject-papers";
// import { deleteSubject } from "@/actions/subjects";
// import { bulkAssignSubjectsToClassYear, removeSubjectFromClassYear } from "@/actions/class-subject-assignment";

// // ═════════════════════════════════════════════════════════════════════════════
// // TYPES
// // ═════════════════════════════════════════════════════════════════════════════

// type Teacher = {
//   id: string;
//   firstName: string;
//   lastName: string;
//   staffNo: string;
// };

// type ClassTemplateInfo = {
//   id: string;
//   name: string;
//   code: string | null;
//   level: number | null;
// };

// type AcademicYearInfo = {
//   id: string;
//   year: string;
//   isActive: boolean;
// };

// type ClassSubject = {
//   id: string;
//   classYearId: string;
//   classYear: {
//     id: string;
//     classTemplateId: string;
//     academicYearId: string;
//     classTemplate: ClassTemplateInfo;
//     academicYear: AcademicYearInfo;
//   };
// };

// // ✅ ENHANCED: Include paper code and AOI count
// type SubjectPaper = {
//   id: string;
//   paperNumber: number;
//   name: string;
//   description: string | null;
//   paperCode: string | null; // ✅ Add paper code
//   maxMarks: number;
//   weight: number;
//   isActive: boolean;
//   aoiCount?: number; // ✅ Add AOI count
//   _count?: {
//     aoiTopics: number;
//     aoiUnits: number;
//     examMarks: number;
//     paperResults: number;
//   };
// };

// type Subject = {
//   id: string;
//   name: string;
//   code: string | null;
//   description: string | null;
//   schoolId: string;
//   headTeacherId: string | null;
//   headTeacher: Teacher | null;
//   classSubjects: ClassSubject[];
//   papers?: SubjectPaper[];
//   _count: {
//     classSubjects: number;
//     streamSubjects: number;
//   };
// };

// type AvailableClassYear = {
//   id: string;
//   classTemplateId: string;
//   academicYearId: string;
//   classTemplate: ClassTemplateInfo;
//   streams: { id: string }[];
// };

// type AcademicYear = {
//   id: string;
//   year: string;
// };

// interface SubjectDetailModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   subject: Subject;
//   availableTeachers: Teacher[];
//   availableClassYears: AvailableClassYear[];
//   academicYear: AcademicYear;
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // COMPONENT
// // ═════════════════════════════════════════════════════════════════════════════

// export function SubjectDetailModal({
//   isOpen,
//   onClose,
//   subject: initialSubject,
//   availableTeachers,
//   availableClassYears,
//   academicYear,
// }: SubjectDetailModalProps) {
//   const router = useRouter();
//   const [subject, setSubject] = useState(initialSubject);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showAssignClassesModal, setShowAssignClassesModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showAddPaperModal, setShowAddPaperModal] = useState(false);
//   const [showEditPaperModal, setShowEditPaperModal] = useState<SubjectPaper | null>(null);
//   const [showDeletePaperModal, setShowDeletePaperModal] = useState<SubjectPaper | null>(null);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [isAssigningClasses, setIsAssigningClasses] = useState(false);
//   const [removingClassSubjectId, setRemovingClassSubjectId] = useState<string | null>(null);
//   const [selectedClassYearIds, setSelectedClassYearIds] = useState<string[]>([]);
//   const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);
//   const [togglingPaperId, setTogglingPaperId] = useState<string | null>(null);
//   const [deletingPaperId, setDeletingPaperId] = useState<string | null>(null);

//   // ───────────────────────────────────────────────────────────────────────────
//   // Refresh subject data from the server
//   // ───────────────────────────────────────────────────────────────────────────
//   const refreshSubjectData = async () => {
//     setIsRefreshing(true);
//     try {
//       const result = await getSubjectWithPapers(subject.id);
//       // Uncomment when the action returns proper data
//       // if (result.success && result.data) {
//       //   setSubject(result.data as unknown as Subject);
//       // } else {
//       //   toast.error("Failed to refresh subject data");
//       // }
      
//       // For now, just refresh the page
//       router.refresh();
//     } catch (error) {
//       console.error("❌ Error refreshing subject:", error);
//       toast.error("Failed to refresh subject data");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // ───────────────────────────────────────────────────────────────────────────
//   // Derived state
//   // ───────────────────────────────────────────────────────────────────────────

//   // Filter class subjects for current academic year
//   const currentYearClassSubjects = subject.classSubjects.filter(
//     (cs) => cs.classYear.academicYearId === academicYear.id
//   );

//   // Get assigned class year IDs for the current academic year
//   const assignedClassYearIds = new Set(
//     currentYearClassSubjects.map((cs) => cs.classYearId)
//   );

//   // Filter unassigned class years
//   const unassignedClassYears = availableClassYears.filter(
//     (cy) => !assignedClassYearIds.has(cy.id)
//   );

//   // Safely handle papers array
//   const hasPapers = subject.papers && subject.papers.length > 0;
//   const sortedPapers = subject.papers
//     ? [...subject.papers].sort((a, b) => a.paperNumber - b.paperNumber)
//     : [];

//   // ✅ Calculate paper statistics
//   const activePapers = sortedPapers.filter((p) => p.isActive).length;
//   const totalPapers = sortedPapers.length;
//   const hasMultiplePapers = totalPapers > 1;

//   // ───────────────────────────────────────────────────────────────────────────
//   // Handlers
//   // ───────────────────────────────────────────────────────────────────────────

//   const handleDelete = async () => {
//     setIsDeleting(true);
//     try {
//       const result = await deleteSubject(subject.id);
//       if (result?.ok) {
//         toast.success(result.message);
//         onClose();
//         router.refresh();
//       } else {
//         toast.error(result?.message || "Failed to delete subject");
//       }
//     } catch (error) {
//       toast.error("An unexpected error occurred");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const handleAssignClasses = async () => {
//     if (selectedClassYearIds.length === 0) return;
//     setIsAssigningClasses(true);
//     try {
//       for (const classYearId of selectedClassYearIds) {
//         const result = await bulkAssignSubjectsToClassYear({
//           classYearId: classYearId,
//           subjectIds: [subject.id],
//         });

//         if (!result?.ok) {
//           toast.error(result?.message || `Failed to assign subject to class`);
//           setIsAssigningClasses(false);
//           return;
//         }
//       }

//       toast.success(`Subject assigned to ${selectedClassYearIds.length} class(es) successfully`);
//       setShowAssignClassesModal(false);
//       setSelectedClassYearIds([]);
//       await refreshSubjectData();
//     } catch (error) {
//       toast.error("An unexpected error occurred");
//     } finally {
//       setIsAssigningClasses(false);
//     }
//   };

//   const handleRemoveFromClass = async (classSubjectId: string) => {
//     setRemovingClassSubjectId(classSubjectId);
//     try {
//       const result = await removeSubjectFromClassYear(classSubjectId);
//       if (result?.ok) {
//         toast.success(result.message);
//         await refreshSubjectData();
//       } else {
//         toast.error(result?.message || "Failed to remove subject from class");
//       }
//     } catch (error) {
//       toast.error("An unexpected error occurred");
//     } finally {
//       setRemovingClassSubjectId(null);
//     }
//   };

//   const handleTogglePaperStatus = async (paperId: string) => {
//     setTogglingPaperId(paperId);
//     try {
//       const result = await togglePaperStatus(paperId);
//       if (result?.ok) {
//         toast.success(result.message);
//         await refreshSubjectData();
//       } else {
//         toast.error(result?.message || "Failed to toggle paper status");
//       }
//     } catch (error) {
//       toast.error("An unexpected error occurred");
//     } finally {
//       setTogglingPaperId(null);
//     }
//   };

//   const handleDeletePaper = async (paper: SubjectPaper) => {
//     setDeletingPaperId(paper.id);
//     try {
//       const result = await deleteSubjectPaper(paper.id);
//       if (result?.ok) {
//         toast.success(result.message);
//         setShowDeletePaperModal(null);
//         await refreshSubjectData();
//       } else {
//         toast.error(result?.message || "Failed to delete paper");
//       }
//     } catch (error) {
//       toast.error("An unexpected error occurred");
//     } finally {
//       setDeletingPaperId(null);
//     }
//   };

//   const toggleClassYearSelection = (classYearId: string) => {
//     setSelectedClassYearIds((prev) =>
//       prev.includes(classYearId)
//         ? prev.filter((id) => id !== classYearId)
//         : [...prev, classYearId]
//     );
//   };

//   // ───────────────────────────────────────────────────────────────────────────
//   // Render
//   // ───────────────────────────────────────────────────────────────────────────

//   if (!isOpen) return null;

//   return (
//     <>
//       {/* Main Modal Backdrop */}
//       <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
//         <div className="bg-white dark:bg-slate-900 rounded-xl max-w-6xl w-full shadow-xl border border-slate-200 dark:border-slate-700 my-8 max-h-[90vh] overflow-y-auto">

//           {/* ─── Modal Header ─────────────────────────────────────────────── */}
//           <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] rounded-xl shadow-lg">
//                 <BookOpen className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <div className="flex items-center gap-3 flex-wrap">
//                   <h2 className="text-xl font-bold text-slate-900 dark:text-white">
//                     {subject.name}
//                   </h2>
//                   {subject.code && (
//                     <span className="px-2.5 py-1 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 text-[#5B9BD5] text-sm font-medium rounded-lg">
//                       {subject.code}
//                     </span>
//                   )}
//                   {/* ✅ Show multi-paper badge */}
//                   {hasMultiplePapers && (
//                     <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg">
//                       {totalPapers} Papers
//                     </span>
//                   )}
//                   {isRefreshing && (
//                     <Loader2 className="w-4 h-4 animate-spin text-[#5B9BD5]" />
//                   )}
//                 </div>
//                 <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
//                   {subject.description || "No description provided"}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setShowEditModal(true)}
//                 className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//                 title="Edit Subject"
//               >
//                 <Pencil className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={() => setShowDeleteModal(true)}
//                 className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
//                 title="Delete Subject"
//               >
//                 <Trash2 className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={onClose}
//                 className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
//                 title="Close"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           {/* ─── Modal Body ───────────────────────────────────────────────── */}
//           <div className="p-6 space-y-6">

//             {/* Academic Year Banner */}
//             <div className="bg-gradient-to-r from-[#5B9BD5]/10 to-[#4A8BC2]/10 dark:from-[#5B9BD5]/20 dark:to-[#4A8BC2]/20 rounded-xl border border-[#5B9BD5]/20 dark:border-[#5B9BD5]/30 p-4">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
//                   <Calendar className="w-5 h-5 text-[#5B9BD5]" />
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
//                     Viewing assignments for
//                   </p>
//                   <p className="text-lg font-bold text-slate-900 dark:text-white">
//                     Academic Year {academicYear.year}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
//                     <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-600 dark:text-slate-400">
//                       Classes ({academicYear.year})
//                     </p>
//                     <p className="text-2xl font-bold text-slate-900 dark:text-white">
//                       {currentYearClassSubjects.length}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
//                     <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-600 dark:text-slate-400">Stream Assignments</p>
//                     <p className="text-2xl font-bold text-slate-900 dark:text-white">
//                       {subject._count.streamSubjects}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
//                     <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-600 dark:text-slate-400">Subject Papers</p>
//                     <p className="text-2xl font-bold text-slate-900 dark:text-white">
//                       {sortedPapers.length}
//                     </p>
//                     {/* ✅ Show active vs total */}
//                     {totalPapers > 0 && (
//                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
//                         {activePapers} active
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Subject Papers Section */}
//             <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
//               <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
//                 <div>
//                   <h3 className="font-semibold text-slate-900 dark:text-white">
//                     Subject Papers/Components
//                   </h3>
//                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
//                     Manage papers for this subject (e.g., Paper 1, Paper 2, Practical)
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setShowAddPaperModal(true)}
//                   disabled={isRefreshing}
//                   className="text-sm text-[#5B9BD5] hover:text-[#4A8BC2] font-medium flex items-center gap-1 disabled:opacity-50"
//                 >
//                   <Plus className="w-4 h-4" />
//                   Add Paper
//                 </button>
//               </div>
//               <div className="p-5">
//                 {hasPapers ? (
//                   <div className="space-y-3">
//                     {sortedPapers.map((paper) => (
//                       <PaperCard
//                         key={paper.id}
//                         paper={paper}
//                         isExpanded={expandedPaperId === paper.id}
//                         onToggleExpand={() =>
//                           setExpandedPaperId(
//                             expandedPaperId === paper.id ? null : paper.id
//                           )
//                         }
//                         onEdit={() => setShowEditPaperModal(paper)}
//                         onDelete={() => setShowDeletePaperModal(paper)}
//                         onToggleStatus={() => handleTogglePaperStatus(paper.id)}
//                         isToggling={togglingPaperId === paper.id}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
//                     <p className="text-slate-600 dark:text-slate-400 mb-3">
//                       No papers added yet. This subject will use a single assessment.
//                     </p>
//                     <button
//                       onClick={() => setShowAddPaperModal(true)}
//                       disabled={isRefreshing}
//                       className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
//                     >
//                       <Plus className="w-4 h-4" />
//                       Add First Paper
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Head Teacher + Assigned Classes row */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//               {/* Head Teacher */}
//               <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
//                 <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
//                   <h3 className="font-semibold text-slate-900 dark:text-white">Head Teacher</h3>
//                 </div>
//                 <div className="p-5">
//                   {subject.headTeacher ? (
//                     <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
//                         {subject.headTeacher.firstName[0]}
//                         {subject.headTeacher.lastName[0]}
//                       </div>
//                       <div>
//                         <p className="font-semibold text-slate-900 dark:text-white">
//                           {subject.headTeacher.firstName} {subject.headTeacher.lastName}
//                         </p>
//                         <p className="text-sm text-slate-600 dark:text-slate-400">
//                           Staff No: {subject.headTeacher.staffNo}
//                         </p>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-center py-4">
//                       <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
//                         <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
//                       </div>
//                       <p className="text-slate-600 dark:text-slate-400 text-sm">
//                         No head teacher assigned
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Assigned Classes */}
//               <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
//                 <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
//                   <div>
//                     <h3 className="font-semibold text-slate-900 dark:text-white">
//                       Assigned Classes for {academicYear.year}
//                     </h3>
//                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
//                       {currentYearClassSubjects.length} of {availableClassYears.length} classes assigned
//                     </p>
//                   </div>
//                   {unassignedClassYears.length > 0 && (
//                     <button
//                       onClick={() => setShowAssignClassesModal(true)}
//                       className="text-sm text-[#5B9BD5] hover:text-[#4A8BC2] font-medium flex items-center gap-1"
//                     >
//                       <Plus className="w-4 h-4" />
//                       Assign Classes
//                     </button>
//                   )}
//                 </div>
//                 <div className="p-5">
//                   {currentYearClassSubjects.length > 0 ? (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                       {currentYearClassSubjects.map((cs) => (
//                         <div
//                           key={cs.id}
//                           className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 group hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
//                         >
//                           <div className="flex items-center gap-3">
//                             <div className="p-2 bg-slate-50 dark:bg-slate-600 rounded-lg shadow-sm">
//                               <Book className="w-4 h-4 text-[#5B9BD5]" />
//                             </div>
//                             <div>
//                               <p className="font-medium text-slate-900 dark:text-white">
//                                 {cs.classYear.classTemplate.name}
//                               </p>
//                               {cs.classYear.classTemplate.level && (
//                                 <p className="text-xs text-slate-500 dark:text-slate-400">
//                                   Level {cs.classYear.classTemplate.level}
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                           <button
//                             onClick={() => handleRemoveFromClass(cs.id)}
//                             disabled={removingClassSubjectId === cs.id}
//                             className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
//                             title="Remove from class"
//                           >
//                             {removingClassSubjectId === cs.id ? (
//                               <Loader2 className="w-4 h-4 animate-spin" />
//                             ) : (
//                               <X className="w-4 h-4" />
//                             )}
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center py-8">
//                       <Book className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
//                       <p className="text-slate-600 dark:text-slate-400 mb-3">
//                         This subject is not assigned to any classes for {academicYear.year}
//                       </p>
//                       {unassignedClassYears.length > 0 && (
//                         <button
//                           onClick={() => setShowAssignClassesModal(true)}
//                           className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors text-sm"
//                         >
//                           <Plus className="w-4 h-4" />
//                           Assign to Classes
//                         </button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ═══════════════════════════════════════════════════════════════════════
//           NESTED MODALS
//           ═══════════════════════════════════════════════════════════════════════ */}

//       {/* Edit Subject Modal */}
//       <SubjectFormModal
//         isOpen={showEditModal}
//         onClose={() => setShowEditModal(false)}
//         schoolId={subject.schoolId}
//         subject={subject}
//         teachers={availableTeachers}
//         mode="edit"
//       />

//       {/* Add Paper Modal */}
//       <SubjectPaperModal
//         isOpen={showAddPaperModal}
//         onClose={() => setShowAddPaperModal(false)}
//         onSuccess={() => refreshSubjectData()}
//         subjectId={subject.id}
//         subjectName={subject.name}
//         existingPapers={sortedPapers}
//         mode="create"
//       />

//       {/* Edit Paper Modal */}
//       {showEditPaperModal && (
//         <SubjectPaperModal
//           isOpen={true}
//           onClose={() => setShowEditPaperModal(null)}
//           onSuccess={() => refreshSubjectData()}
//           subjectId={subject.id}
//           subjectName={subject.name}
//           existingPapers={sortedPapers}
//           paper={showEditPaperModal}
//           mode="edit"
//         />
//       )}

//       {/* ─── Delete Subject Confirmation ──────────────────────────────────── */}
//       {showDeleteModal && (
//         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
//           <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
//             <div className="flex items-center gap-4 mb-4">
//               <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
//                 <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
//                   Delete Subject
//                 </h3>
//                 <p className="text-sm text-slate-600 dark:text-slate-400">
//                   This action cannot be undone
//                 </p>
//               </div>
//             </div>
//             <p className="text-slate-600 dark:text-slate-400 mb-2">
//               Are you sure you want to delete{" "}
//               <span className="font-semibold text-slate-900 dark:text-white">
//                 {subject.name}
//               </span>
//               ?
//             </p>
//             {subject._count.classSubjects > 0 && (
//               <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
//                 <p className="text-sm text-amber-800 dark:text-amber-400">
//                   ⚠️ This subject is assigned to {subject._count.classSubjects} class(es) across different academic years. All assignments will be permanently removed.
//                 </p>
//               </div>
//             )}
//             {/* ✅ Show paper deletion warning */}
//             {totalPapers > 0 && (
//               <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                 <p className="text-sm text-blue-800 dark:text-blue-400">
//                   📄 This subject has {totalPapers} paper(s) that will also be deleted.
//                 </p>
//               </div>
//             )}
//             <div className="flex gap-3 justify-end mt-6">
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 disabled={isDeleting}
//                 className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDelete}
//                 disabled={isDeleting}
//                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
//               >
//                 {isDeleting ? (
//                   <>
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   <>
//                     <Trash2 className="w-4 h-4" />
//                     Delete Subject
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ─── Delete Paper Confirmation ────────────────────────────────────── */}
//       {showDeletePaperModal && (
//         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
//           <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
//             <div className="flex items-center gap-4 mb-4">
//               <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
//                 <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
//                   Delete Paper
//                 </h3>
//                 <p className="text-sm text-slate-600 dark:text-slate-400">
//                   This action cannot be undone
//                 </p>
//               </div>
//             </div>
//             <p className="text-slate-600 dark:text-slate-400 mb-2">
//               Are you sure you want to delete{" "}
//               <span className="font-semibold text-slate-900 dark:text-white">
//                 {showDeletePaperModal.name}
//               </span>
//               {showDeletePaperModal.paperCode && (
//                 <span className="font-mono text-[#5B9BD5]">
//                   {" "}({showDeletePaperModal.paperCode})
//                 </span>
//               )}
//               ?
//             </p>
//             {showDeletePaperModal._count &&
//               (showDeletePaperModal._count.aoiUnits > 0 ||
//                 showDeletePaperModal._count.examMarks > 0 ||
//                 showDeletePaperModal._count.paperResults > 0) && (
//                 <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
//                   <p className="text-sm text-amber-800 dark:text-amber-400">
//                     ⚠️ This paper has marks recorded. All marks will be permanently removed.
//                   </p>
//                 </div>
//               )}
//             <div className="flex gap-3 justify-end mt-6">
//               <button
//                 onClick={() => setShowDeletePaperModal(null)}
//                 disabled={deletingPaperId === showDeletePaperModal.id}
//                 className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleDeletePaper(showDeletePaperModal)}
//                 disabled={deletingPaperId === showDeletePaperModal.id}
//                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
//               >
//                 {deletingPaperId === showDeletePaperModal.id ? (
//                   <>
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   <>
//                     <Trash2 className="w-4 h-4" />
//                     Delete Paper
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ─── Assign Classes Modal ─────────────────────────────────────────── */}
//       {showAssignClassesModal && (
//         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
//           <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex items-center gap-4 mb-4">
//               <div className="p-3 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 rounded-full">
//                 <Plus className="w-6 h-6 text-[#5B9BD5]" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
//                   Assign to Classes
//                 </h3>
//                 <p className="text-sm text-slate-600 dark:text-slate-400">
//                   Assign {subject.name} to classes for {academicYear.year}
//                 </p>
//               </div>
//             </div>
//             <div className="mb-4 flex-1 overflow-y-auto">
//               <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
//                 Select one or more classes:
//               </p>
//               {unassignedClassYears.length > 0 ? (
//                 <div className="space-y-2">
//                   {unassignedClassYears.map((cy) => (
//                     <label
//                       key={cy.id}
//                       className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
//                         selectedClassYearIds.includes(cy.id)
//                           ? "border-[#5B9BD5] bg-[#5B9BD5]/5 dark:bg-[#5B9BD5]/10"
//                           : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
//                       }`}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={selectedClassYearIds.includes(cy.id)}
//                         onChange={() => toggleClassYearSelection(cy.id)}
//                         className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#5B9BD5] focus:ring-[#5B9BD5]/20 dark:focus:ring-[#5B9BD5]/30 bg-white dark:bg-slate-800"
//                       />
//                       <div className="flex items-center gap-2 flex-1">
//                         <Book className="w-4 h-4 text-slate-400 dark:text-slate-500" />
//                         <div className="flex-1">
//                           <span className="font-medium text-slate-900 dark:text-white">
//                             {cy.classTemplate.name}
//                           </span>
//                           {cy.streams.length > 0 && (
//                             <p className="text-xs text-slate-500 dark:text-slate-400">
//                               {cy.streams.length} stream{cy.streams.length !== 1 ? "s" : ""}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </label>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <Book className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
//                   <p className="text-slate-600 dark:text-slate-400">
//                     All classes already have this subject assigned for {academicYear.year}
//                   </p>
//                 </div>
//               )}
//               {selectedClassYearIds.length > 0 && (
//                 <p className="mt-3 text-sm text-[#5B9BD5] font-medium">
//                   {selectedClassYearIds.length} class(es) selected
//                 </p>
//               )}
//             </div>
//             <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
//               <button
//                 onClick={() => {
//                   setShowAssignClassesModal(false);
//                   setSelectedClassYearIds([]);
//                 }}
//                 disabled={isAssigningClasses}
//                 className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAssignClasses}
//                 disabled={isAssigningClasses || selectedClassYearIds.length === 0}
//                 className="px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
//               >
//                 {isAssigningClasses ? (
//                   <>
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                     Assigning...
//                   </>
//                 ) : (
//                   <>
//                     <Check className="w-4 h-4" />
//                     Assign to {selectedClassYearIds.length} Class(es)
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// // ═════════════════════════════════════════════════════════════════════════════
// // PAPER CARD - ENHANCED WITH PAPER CODE
// // ═════════════════════════════════════════════════════════════════════════════

// function PaperCard({
//   paper,
//   isExpanded,
//   onToggleExpand,
//   onEdit,
//   onDelete,
//   onToggleStatus,
//   isToggling,
// }: {
//   paper: SubjectPaper;
//   isExpanded: boolean;
//   onToggleExpand: () => void;
//   onEdit: () => void;
//   onDelete: () => void;
//   onToggleStatus: () => void;
//   isToggling: boolean;
// }) {
//   const [showMenu, setShowMenu] = useState(false);

//   return (
//     <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
//       <div className="p-4 bg-white dark:bg-slate-700 flex items-center justify-between">
//         <div className="flex items-center gap-3 flex-1">
//           <div className="p-2 bg-slate-50 dark:bg-slate-600 rounded-lg shadow-sm">
//             <FileText className="w-5 h-5 text-[#5B9BD5]" />
//           </div>
//           <div className="flex-1">
//             <div className="flex items-center gap-2 flex-wrap">
//               <h3 className="font-semibold text-slate-900 dark:text-white">
//                 {paper.name}
//               </h3>
//               {/* ✅ Show paper code badge */}
//               {paper.paperCode && (
//                 <span className="font-mono text-xs px-2 py-0.5 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 text-[#5B9BD5] rounded">
//                   {paper.paperCode}
//                 </span>
//               )}
//               <span
//                 className={`px-2 py-0.5 text-xs font-medium rounded ${
//                   paper.isActive
//                     ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
//                     : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
//                 }`}
//               >
//                 {paper.isActive ? "Active" : "Inactive"}
//               </span>
//             </div>
//             <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
//               <span>Max: {paper.maxMarks} marks</span>
//               <span>•</span>
//               <span>Weight: {paper.weight}x</span>
//               {/* ✅ Show AOI count if available */}
//               {paper.aoiCount !== undefined && paper.aoiCount > 0 && (
//                 <>
//                   <span>•</span>
//                   <span>{paper.aoiCount} AOI units</span>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={onToggleExpand}
//             className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
//           >
//             {isExpanded ? (
//               <ChevronUp className="w-5 h-5" />
//             ) : (
//               <ChevronDown className="w-5 h-5" />
//             )}
//           </button>
//           <div className="relative">
//             <button
//               onClick={() => setShowMenu(!showMenu)}
//               className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
//             >
//               <MoreVertical className="w-5 h-5" />
//             </button>
//             {showMenu && (
//               <>
//                 <div
//                   className="fixed inset-0 z-10"
//                   onClick={() => setShowMenu(false)}
//                 />
//                 <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
//                   <button
//                     onClick={() => {
//                       setShowMenu(false);
//                       onEdit();
//                     }}
//                     className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full"
//                   >
//                     <Edit2 className="w-4 h-4" />
//                     Edit Paper
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowMenu(false);
//                       onToggleStatus();
//                     }}
//                     disabled={isToggling}
//                     className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full disabled:opacity-50"
//                   >
//                     {isToggling ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : paper.isActive ? (
//                       <X className="w-4 h-4" />
//                     ) : (
//                       <Check className="w-4 h-4" />
//                     )}
//                     {paper.isActive ? "Deactivate" : "Activate"}
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowMenu(false);
//                       onDelete();
//                     }}
//                     className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                     Delete
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ✅ ENHANCED: Expanded detail with paper code */}
//       {isExpanded && (
//         <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
//           {paper.description && (
//             <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
//               {paper.description}
//             </p>
//           )}
          
//           {/* ✅ Paper metadata card */}
//           <div className="mb-3 p-3 bg-white dark:bg-slate-700 rounded-lg">
//             <div className="grid grid-cols-2 gap-3 text-sm">
//               <div>
//                 <span className="text-slate-500 dark:text-slate-400">Paper Code:</span>
//                 <span className="ml-2 font-mono text-slate-900 dark:text-white">
//                   {paper.paperCode || "Not set"}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-slate-500 dark:text-slate-400">Paper Number:</span>
//                 <span className="ml-2 font-semibold text-slate-900 dark:text-white">
//                   {paper.paperNumber}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-slate-500 dark:text-slate-400">Max Marks:</span>
//                 <span className="ml-2 font-semibold text-slate-900 dark:text-white">
//                   {paper.maxMarks}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-slate-500 dark:text-slate-400">Weight:</span>
//                 <span className="ml-2 font-semibold text-slate-900 dark:text-white">
//                   {paper.weight}x
//                 </span>
//               </div>
//             </div>
//           </div>
          
//           {/* Statistics grid */}
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//             <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
//               <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">AOI Topics</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-white">
//                 {paper._count?.aoiTopics || 0}
//               </p>
//             </div>
//             <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
//               <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">AOI Units</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-white">
//                 {paper._count?.aoiUnits || 0}
//               </p>
//             </div>
//             <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
//               <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Exam Marks</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-white">
//                 {paper._count?.examMarks || 0}
//               </p>
//             </div>
//             <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
//               <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Results</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-white">
//                 {paper._count?.paperResults || 0}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// components/dashboard/subjects/subject-detail-modal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Book,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SubjectFormModal }    from "./subbject-form-model";
import { getSubjectWithPapers } from "@/actions/subject-papers";
import { deleteSubject } from "@/actions/subjects";
import { removeSubjectFromClassYear } from "@/actions/class-subject-assignment";
import { AssignClassesModal } from "./assign-class-model";

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

type Teacher = {
  id:        string;
  firstName: string;
  lastName:  string;
  staffNo:   string;
};

type ClassTemplateInfo = {
  id:    string;
  name:  string;
  code:  string | null;
  level: number | null;
};

type AcademicYearInfo = {
  id:       string;
  year:     string;
  isActive: boolean;
};

type ClassSubject = {
  id:          string;
  classYearId: string;
  classYear: {
    id:              string;
    classTemplateId: string;
    academicYearId:  string;
    classTemplate:   ClassTemplateInfo;
    academicYear:    AcademicYearInfo;
  };
};

type SubjectPaper = {
  id:          string;
  paperNumber: number;
  name:        string;
  description: string | null;
  paperCode:   string | null;
  maxMarks:    number;
  weight:      number;
  isActive:    boolean;
  aoiCount?:   number;
  _count?: {
    aoiTopics:    number;
    aoiUnits:     number;
    examMarks:    number;
    paperResults: number;
  };
};

type Subject = {
  id:            string;
  name:          string;
  code:          string | null;
  description:   string | null;
  schoolId:      string;
  headTeacherId: string | null;
  headTeacher:   Teacher | null;
  classSubjects: ClassSubject[];
  papers?:       SubjectPaper[];
  _count: {
    classSubjects:  number;
    streamSubjects: number;
  };
};

type AvailableClassYear = {
  id:              string;
  classTemplateId: string;
  academicYearId:  string;
  classTemplate:   ClassTemplateInfo;
  streams:         { id: string }[];
};

type AcademicYear = {
  id:   string;
  year: string;
};

interface SubjectDetailModalProps {
  isOpen:               boolean;
  onClose:              () => void;
  subject:              Subject;
  availableTeachers:    Teacher[];
  availableClassYears:  AvailableClassYear[];
  academicYear:         AcademicYear;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export function SubjectDetailModal({
  isOpen,
  onClose,
  subject:         initialSubject,
  availableTeachers,
  availableClassYears,
  academicYear,
}: SubjectDetailModalProps) {
  const router = useRouter();

  const [subject,               setSubject]               = useState(initialSubject);
  const [isRefreshing,          setIsRefreshing]          = useState(false);
  const [showDeleteModal,       setShowDeleteModal]       = useState(false);
  const [showAssignClassesModal,setShowAssignClassesModal]= useState(false);
  const [showEditModal,         setShowEditModal]         = useState(false);
  const [isDeleting,            setIsDeleting]            = useState(false);
  const [removingClassSubjectId,setRemovingClassSubjectId]= useState<string | null>(null);
  const [expandedPaperId,       setExpandedPaperId]       = useState<string | null>(null);
  const [togglingPaperId,       setTogglingPaperId]       = useState<string | null>(null);

  // ── Refresh ────────────────────────────────────────────────────────────────

  const refreshSubjectData = async () => {
    setIsRefreshing(true);
    try {
      await getSubjectWithPapers(subject.id);
      router.refresh();
    } catch (error) {
      console.error("❌ Error refreshing subject:", error);
      toast.error("Failed to refresh subject data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentYearClassSubjects = subject.classSubjects.filter(
    (cs) => cs.classYear.academicYearId === academicYear.id
  );

  const assignedClassYearIds = new Set(
    currentYearClassSubjects.map((cs) => cs.classYearId)
  );

  const unassignedClassYears = availableClassYears.filter(
    (cy) => !assignedClassYearIds.has(cy.id)
  );

  const hasPapers   = (subject.papers?.length ?? 0) > 0;
  const sortedPapers = subject.papers
    ? [...subject.papers].sort((a, b) => a.paperNumber - b.paperNumber)
    : [];
  const activePapers    = sortedPapers.filter((p) => p.isActive).length;
  const totalPapers     = sortedPapers.length;
  const hasMultiplePapers = totalPapers > 1;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSubject(subject.id);
      if (result?.ok) {
        toast.success(result.message);
        onClose();
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to delete subject");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveFromClass = async (classSubjectId: string) => {
    setRemovingClassSubjectId(classSubjectId);
    try {
      const result = await removeSubjectFromClassYear(classSubjectId);
      if (result?.ok) {
        toast.success(result.message);
        await refreshSubjectData();
      } else {
        toast.error(result?.message || "Failed to remove subject from class");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setRemovingClassSubjectId(null);
    }
  };

  const handleTogglePaperStatus = async (paperId: string) => {
    setTogglingPaperId(paperId);
    try {
      const result = await togglePaperStatus(paperId);
      if (result?.ok) {
        toast.success(result.message);
        await refreshSubjectData();
      } else {
        toast.error(result?.message || "Failed to toggle paper status");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setTogglingPaperId(null);
    }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <>
      {/* ── Main Modal ──────────────────────────────────────────────────── */}
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-xl max-w-6xl w-full shadow-xl border border-slate-200 dark:border-slate-700 my-8 max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {subject.name}
                  </h2>
                  {subject.code && (
                    <span className="px-2.5 py-1 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 text-[#5B9BD5] text-sm font-medium rounded-lg">
                      {subject.code}
                    </span>
                  )}
                  {hasMultiplePapers && (
                    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg">
                      {totalPapers} Papers
                    </span>
                  )}
                  {isRefreshing && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#5B9BD5]" />
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {subject.description || "No description provided"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Edit Subject"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Subject"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">

            {/* Academic Year Banner */}
            <div className="bg-gradient-to-r from-[#5B9BD5]/10 to-[#4A8BC2]/10 dark:from-[#5B9BD5]/20 dark:to-[#4A8BC2]/20 rounded-xl border border-[#5B9BD5]/20 dark:border-[#5B9BD5]/30 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-[#5B9BD5]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Viewing assignments for
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    Academic Year {academicYear.year}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Classes ({academicYear.year})
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {currentYearClassSubjects.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Stream Assignments</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {subject._count.streamSubjects}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Assessment</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">Single</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">BOT / MTE / EOT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Head Teacher + Assigned Classes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Head Teacher */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Head Teacher</h3>
                </div>
                <div className="p-5">
                  {subject.headTeacher ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC2] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                        {subject.headTeacher.firstName[0]}
                        {subject.headTeacher.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {subject.headTeacher.firstName} {subject.headTeacher.lastName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Staff No: {subject.headTeacher.staffNo}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        No head teacher assigned
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Classes */}
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Assigned Classes for {academicYear.year}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentYearClassSubjects.length} of {availableClassYears.length} classes assigned
                    </p>
                  </div>
                  {unassignedClassYears.length > 0 && (
                    <button
                      onClick={() => setShowAssignClassesModal(true)}
                      className="text-sm text-[#5B9BD5] hover:text-[#4A8BC2] font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Assign Classes
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {currentYearClassSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentYearClassSubjects.map((cs) => (
                        <div
                          key={cs.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 group hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 dark:bg-slate-600 rounded-lg shadow-sm">
                              <Book className="w-4 h-4 text-[#5B9BD5]" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {cs.classYear.classTemplate.name}
                              </p>
                              {cs.classYear.classTemplate.level && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Level {cs.classYear.classTemplate.level}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromClass(cs.id)}
                            disabled={removingClassSubjectId === cs.id}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Remove from class"
                          >
                            {removingClassSubjectId === cs.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Book className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-400 mb-3">
                        This subject is not assigned to any classes for {academicYear.year}
                      </p>
                      {unassignedClassYears.length > 0 && (
                        <button
                          onClick={() => setShowAssignClassesModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9BD5] hover:bg-[#4A8BC2] text-white font-medium rounded-lg transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Assign to Classes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          NESTED MODALS
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* Edit Subject */}
      <SubjectFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        schoolId={subject.schoolId}
        subject={subject}
        teachers={availableTeachers}
        mode="edit"
      />

      {/* ── Assign Classes — now uses the two-step modal ──────────────────── */}
      <AssignClassesModal
        isOpen={showAssignClassesModal}
        onClose={() => setShowAssignClassesModal(false)}
        onSuccess={refreshSubjectData}
        subject={{
          id:       subject.id,
          name:     subject.name,
          schoolId: subject.schoolId,
          papers:   sortedPapers,
        }}
        unassignedClassYears={unassignedClassYears}
        academicYearLabel={academicYear.year}
      />

      {/* ── Delete Subject ────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Subject</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{subject.name}</span>?
            </p>
            {subject._count.classSubjects > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  ⚠️ This subject is assigned to {subject._count.classSubjects} class(es). All assignments will be permanently removed.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Delete Subject</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAPER CARD
// ═════════════════════════════════════════════════════════════════════════════

function PaperCard({
  paper,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleStatus,
  isToggling,
}: {
  paper:           SubjectPaper;
  isExpanded:      boolean;
  onToggleExpand:  () => void;
  onEdit:          () => void;
  onDelete:        () => void;
  onToggleStatus:  () => void;
  isToggling:      boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="p-4 bg-white dark:bg-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-slate-50 dark:bg-slate-600 rounded-lg shadow-sm">
            <FileText className="w-5 h-5 text-[#5B9BD5]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-white">{paper.name}</h3>
              {paper.paperCode && (
                <span className="font-mono text-xs px-2 py-0.5 bg-[#5B9BD5]/10 dark:bg-[#5B9BD5]/20 text-[#5B9BD5] rounded">
                  {paper.paperCode}
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                paper.isActive
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
                {paper.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span>Max: {paper.maxMarks} marks</span>
              <span>•</span>
              <span>Weight: {paper.weight}x</span>
              {paper.aoiCount !== undefined && paper.aoiCount > 0 && (
                <><span>•</span><span>{paper.aoiCount} AOI units</span></>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
                  <button
                    onClick={() => { setShowMenu(false); onEdit(); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Paper
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onToggleStatus(); }}
                    disabled={isToggling}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full disabled:opacity-50"
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : paper.isActive ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {paper.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onDelete(); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          {paper.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{paper.description}</p>
          )}
          <div className="mb-3 p-3 bg-white dark:bg-slate-700 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Paper Code:</span>
                <span className="ml-2 font-mono text-slate-900 dark:text-white">
                  {paper.paperCode || "Not set"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Paper Number:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">{paper.paperNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Max Marks:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">{paper.maxMarks}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Weight:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">{paper.weight}x</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "AOI Topics",  value: paper._count?.aoiTopics    ?? 0 },
              { label: "AOI Units",   value: paper._count?.aoiUnits     ?? 0 },
              { label: "Exam Marks",  value: paper._count?.examMarks    ?? 0 },
              { label: "Results",     value: paper._count?.paperResults ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}