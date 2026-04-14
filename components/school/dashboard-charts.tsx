// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   LineChart,
//   Line,
// } from "recharts"

// const gradeDistribution = [
//   { grade: "A", count: 156, percentage: 12.5 },
//   { grade: "B", count: 312, percentage: 25.0 },
//   { grade: "C", count: 468, percentage: 37.5 },
//   { grade: "D", count: 234, percentage: 18.8 },
//   { grade: "F", count: 77, percentage: 6.2 },
// ]

// const attendanceData = [
//   { month: "Sep", attendance: 94 },
//   { month: "Oct", attendance: 92 },
//   { month: "Nov", attendance: 96 },
//   { month: "Dec", attendance: 89 },
//   { month: "Jan", attendance: 93 },
// ]

// const classPerformance = [
//   { class: "P.1", average: 82 },
//   { class: "P.2", average: 78 },
//   { class: "P.3", average: 85 },
//   { class: "S.1", average: 76 },
//   { class: "S.2", average: 79 },
//   { class: "S.3", average: 81 },
// ]

// const COLORS = [
//   "hsl(var(--chart-1))",
//   "hsl(var(--chart-2))",
//   "hsl(var(--chart-3))",
//   "hsl(var(--chart-4))",
//   "hsl(var(--chart-5))",
// ]

// export function DashboardCharts() {
//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <CardTitle className="text-card-foreground">Grade Distribution</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={200}>
//             <PieChart>
//               <Pie
//                 data={gradeDistribution}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={40}
//                 outerRadius={80}
//                 paddingAngle={5}
//                 dataKey="count"
//               >
//                 {gradeDistribution.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="flex flex-wrap gap-2 mt-4">
//             {gradeDistribution.map((item, index) => (
//               <div key={item.grade} className="flex items-center gap-1 text-xs">
//                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
//                 <span className="text-muted-foreground">
//                   {item.grade}: {item.percentage}%
//                 </span>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="bg-card border-border">
//         <CardHeader>
//           <CardTitle className="text-card-foreground">Attendance Trend</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={200}>
//             <LineChart data={attendanceData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
//               <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
//               <YAxis stroke="hsl(var(--muted-foreground))" />
//               <Line
//                 type="monotone"
//                 dataKey="attendance"
//                 stroke="hsl(var(--primary))"
//                 strokeWidth={2}
//                 dot={{ fill: "hsl(var(--primary))" }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       <Card className="bg-card border-border">
//         <CardHeader>
//           <CardTitle className="text-card-foreground">Class Performance</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={200}>
//             <BarChart data={classPerformance}>
//               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
//               <XAxis dataKey="class" stroke="hsl(var(--muted-foreground))" />
//               <YAxis stroke="hsl(var(--muted-foreground))" />
//               <Bar dataKey="average" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }


import React from 'react'

export default function DashboardCharts() {
  return (
    <div>dashboard-charts</div>
  )
}
