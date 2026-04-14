



// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Plus,
//   Users,
//   BookOpen,
//   User,
//   Search,
//   Edit,
//   Trash2,
//   MoreVertical,
//   Eye,
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import CreateStreamDialog from "./create-stream-dialog";
// import BulkCreateStreamsDialog from "./bulk-create-streams-dialog";
// import EditStreamDialog from "./edit-stream-dialog";
// import DeleteStreamDialog from "./dellete-stream-dialog";

// type Stream = {
//   id: string;
//   name: string;
//   classYear: {
//     id: string;
//     classTemplate: { name: string };
//     academicYear: { year: string };
//   };
//   classHead?: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     staffNo: string;
//   } | null;
//   _count: {
//     enrollments: number;
//     streamSubjects: number;
//   };
// };

// interface StreamsManagementProps {
//   streams: Stream[];
//   schoolId: string;
// }

// export default function StreamsManagement({
//   streams,
//   schoolId,
// }: StreamsManagementProps) {
//   const router = useRouter();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
//   const [dialogOpen, setDialogOpen] = useState<
//     "create" | "edit" | "delete" | "bulk" | null
//   >(null);

//   const filteredStreams = streams.filter(
//     (stream) =>
//       stream.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       stream.classYear.classTemplate.name
//         .toLowerCase()
//         .includes(searchQuery.toLowerCase())
//   );

//   const handleEdit = (stream: Stream) => {
//     setSelectedStream(stream);
//     setDialogOpen("edit");
//   };

//   const handleDelete = (stream: Stream) => {
//     setSelectedStream(stream);
//     setDialogOpen("delete");
//   };

//   // ✅ Navigate to detailed page instead of opening dialog
//   const handleView = (streamId: string) => {
//     router.push(`/dashboard/streams/${streamId}`);
//   };

//   const closeDialog = () => {
//     setDialogOpen(null);
//     setSelectedStream(null);
//   };

//   return (
//     <div className="space-y-4">
//       {/* Header Actions */}
//       <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
//         <div className="relative w-full sm:w-64">
//           <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search streams..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="pl-8"
//           />
//         </div>
//         <div className="flex gap-2">
//           <Button onClick={() => setDialogOpen("bulk")} variant="outline">
//             <Plus className="h-4 w-4 mr-2" />
//             Bulk Create
//           </Button>
//           <Button onClick={() => setDialogOpen("create")}>
//             <Plus className="h-4 w-4 mr-2" />
//             Create Stream
//           </Button>
//         </div>
//       </div>

//       {/* Summary Stats */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Streams
//             </CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{streams.length}</div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               With Class Heads
//             </CardTitle>
//             <User className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {streams.filter((s) => s.classHead).length}
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Students
//             </CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {streams.reduce((acc, s) => acc + (s._count?.enrollments || 0), 0)}
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Subject Assignments
//             </CardTitle>
//             <BookOpen className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {streams.reduce((acc, s) => acc + (s._count?.streamSubjects || 0), 0)}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Streams Grid */}
//       {filteredStreams.length === 0 ? (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <Users className="h-12 w-12 text-muted-foreground mb-4" />
//             <h3 className="text-lg font-semibold mb-2">
//               {searchQuery ? "No streams found" : "No streams yet"}
//             </h3>
//             <p className="text-sm text-muted-foreground mb-4">
//               {searchQuery
//                 ? "Try adjusting your search"
//                 : "Create your first stream to get started"}
//             </p>
//             {!searchQuery && (
//               <Button onClick={() => setDialogOpen("create")}>
//                 <Plus className="h-4 w-4 mr-2" />
//                 Create Stream
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//           {filteredStreams.map((stream) => (
//             <Card
//               key={stream.id}
//               className="hover:shadow-md transition-shadow cursor-pointer"
//               onClick={() => handleView(stream.id)} // ✅ Navigate on card click
//             >
//               <CardHeader>
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1 min-w-0">
//                     <CardTitle className="truncate">{stream.name}</CardTitle>
//                     <p className="text-sm text-muted-foreground">
//                       {stream.classYear.classTemplate.name} -{" "}
//                       {stream.classYear.academicYear.year}
//                     </p>
//                   </div>
//                   <DropdownMenu>
//                     <DropdownMenuTrigger
//                       asChild
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <Button variant="ghost" size="icon" className="h-8 w-8">
//                         <MoreVertical className="h-4 w-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuItem
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleView(stream.id); // ✅ Navigate from dropdown
//                         }}
//                       >
//                         <Eye className="h-4 w-4 mr-2" />
//                         View Details
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleEdit(stream);
//                         }}
//                       >
//                         <Edit className="h-4 w-4 mr-2" />
//                         Edit
//                       </DropdownMenuItem>
//                       <DropdownMenuSeparator />
//                       <DropdownMenuItem
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDelete(stream);
//                         }}
//                         className="text-destructive"
//                       >
//                         <Trash2 className="h-4 w-4 mr-2" />
//                         Delete
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center text-muted-foreground">
//                       <User className="h-4 w-4 mr-2" />
//                       Class Head
//                     </span>
//                     <span className="font-medium truncate ml-2">
//                       {stream.classHead
//                         ? `${stream.classHead.firstName} ${stream.classHead.lastName}`
//                         : "Not assigned"}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center text-muted-foreground">
//                       <Users className="h-4 w-4 mr-2" />
//                       Students
//                     </span>
//                     <Badge variant="secondary">
//                       {stream._count.enrollments}
//                     </Badge>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center text-muted-foreground">
//                       <BookOpen className="h-4 w-4 mr-2" />
//                       Subjects
//                     </span>
//                     <Badge variant="secondary">
//                       {stream._count.streamSubjects}
//                     </Badge>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Dialogs */}
//       <CreateStreamDialog
//         open={dialogOpen === "create"}
//         onOpenChange={(open) => !open && closeDialog()}
//         schoolId={schoolId}
//       />

//       <BulkCreateStreamsDialog
//         open={dialogOpen === "bulk"}
//         onOpenChange={(open) => !open && closeDialog()}
//         schoolId={schoolId}
//       />

//       {selectedStream && (
//         <>
//           <EditStreamDialog
//             open={dialogOpen === "edit"}
//             onOpenChange={(open) => !open && closeDialog()}
//             stream={selectedStream}
//           />

//           <DeleteStreamDialog
//             open={dialogOpen === "delete"}
//             onOpenChange={(open) => !open && closeDialog()}
//             stream={selectedStream}
//           />
//         </>
//       )}
//     </div>
//   );
// }







"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Users,
  BookOpen,
  User,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  CalendarDays,
  Layers,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateStreamDialog from "./create-stream-dialog";
import BulkCreateStreamsDialog from "./bulk-create-streams-dialog";
import EditStreamDialog from "./edit-stream-dialog";
import DeleteStreamDialog from "./dellete-stream-dialog";

type Stream = {
  id: string;
  name: string;
  classYear: {
    id: string;
    classTemplate: { name: string };
    academicYear: { id: string; year: string; isActive: boolean };
  };
  classHead?: {
    id: string;
    firstName: string;
    lastName: string;
    staffNo: string;
  } | null;
  _count: {
    enrollments: number;
    streamSubjects: number;
  };
};

type AcademicYear = { id: string; year: string; isActive: boolean };

interface StreamsManagementProps {
  streams: Stream[];
  schoolId: string;
  academicYears?: AcademicYear[];
  currentYearId?: string;
}

export default function StreamsManagement({
  streams,
  schoolId,
  academicYears = [],
  currentYearId = "",
}: StreamsManagementProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [dialogOpen, setDialogOpen] = useState<
    "create" | "edit" | "delete" | "bulk" | null
  >(null);

  // Unique class names for the class filter
  const classOptions = Array.from(
    new Set(streams.map((s) => s.classYear.classTemplate.name))
  ).sort();

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch =
      stream.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.classYear.classTemplate.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesClass =
      classFilter === "all" ||
      stream.classYear.classTemplate.name === classFilter;
    return matchesSearch && matchesClass;
  });

  const hasActiveFilters = classFilter !== "all" || searchQuery !== "";

  function handleYearChange(yearId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("yearId", yearId);
    router.push(url.pathname + url.search);
  }

  function clearFilters() {
    setSearchQuery("");
    setClassFilter("all");
  }

  const handleEdit = (stream: Stream) => {
    setSelectedStream(stream);
    setDialogOpen("edit");
  };

  const handleDelete = (stream: Stream) => {
    setSelectedStream(stream);
    setDialogOpen("delete");
  };

  // ✅ Navigate to detailed page with correct route structure
  const handleView = (streamId: string) => {
    router.push(`/school/${slug}/academics/streams/${streamId}`);
  };

  const closeDialog = () => {
    setDialogOpen(null);
    setSelectedStream(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter + Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Academic Year */}
          {academicYears.length > 0 && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={currentYearId} onValueChange={handleYearChange}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.year}{y.isActive ? " (Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Class filter */}
          {classOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classOptions.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => setDialogOpen("bulk")} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Bulk Create
          </Button>
          <Button onClick={() => setDialogOpen("create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Stream
          </Button>
        </div>
      </div>

      {/* Active filter summary */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredStreams.length} of {streams.length} streams
          {classFilter !== "all" && <span> · Class: <strong>{classFilter}</strong></span>}
          {searchQuery && <span> · Search: <strong>"{searchQuery}"</strong></span>}
        </p>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streams.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Class Heads</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {streams.filter((s) => s.classHead).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {streams.reduce((acc, s) => acc + (s._count?.enrollments || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subject Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {streams.reduce((acc, s) => acc + (s._count?.streamSubjects || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streams Grid */}
      {filteredStreams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No streams found" : "No streams yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first stream to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setDialogOpen("create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Stream
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStreams.map((stream) => (
            <Card
              key={stream.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleView(stream.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{stream.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {stream.classYear.classTemplate.name} -{" "}
                      {stream.classYear.academicYear.year}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(stream.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(stream);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(stream);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      Class Head
                    </span>
                    <span className="font-medium truncate ml-2">
                      {stream.classHead
                        ? `${stream.classHead.firstName} ${stream.classHead.lastName}`
                        : "Not assigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      Students
                    </span>
                    <Badge variant="secondary">
                      {stream._count.enrollments}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Subjects
                    </span>
                    <Badge variant="secondary">
                      {stream._count.streamSubjects}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateStreamDialog
        open={dialogOpen === "create"}
        onOpenChange={(open) => !open && closeDialog()}
        schoolId={schoolId}
      />

      <BulkCreateStreamsDialog
        open={dialogOpen === "bulk"}
        onOpenChange={(open) => !open && closeDialog()}
        schoolId={schoolId}
      />

      {selectedStream && (
        <>
          <EditStreamDialog
            open={dialogOpen === "edit"}
            onOpenChange={(open) => !open && closeDialog()}
            stream={selectedStream}
          />

          <DeleteStreamDialog
            open={dialogOpen === "delete"}
            onOpenChange={(open) => !open && closeDialog()}
            stream={selectedStream}
          />
        </>
      )}
    </div>
  );
}