"use server";

import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// ============================
// TYPE DEFINITIONS
// ============================

type CreateParentPayload = {
  // Required fields
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  schoolId: string;

  // Optional parent fields
  title?: string | null;
  relationship?: string | null;
  gender?: string | null;
  dob?: string | null; // "yyyy-mm-dd" from input[type=date]
  altNo?: string | null;
  idNo?: string | null;
  occupation?: string | null;
  address?: string | null;
  village?: string | null;
  country?: string | null;
  religion?: string | null;
  imageUrl?: string | null;
};

type UpdateParentPayload = {
  firstName?: string;
  lastName?: string;
  title?: string | null;
  relationship?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone?: string;
  altNo?: string | null;
  email?: string | null;
  idNo?: string | null;
  occupation?: string | null;
  address?: string | null;
  village?: string | null;
  country?: string | null;
  religion?: string | null;
  imageUrl?: string | null;
};

type AssignStudentToParentPayload = {
  parentId: string;
  studentId: string;
};

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Convert string date to Date object or null
 */
function toDateOrNull(d?: string | null): Date | null {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
}

/**
 * Convert Date object to ISO string date (yyyy-mm-dd)
 */
function toISODateString(date: Date | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================
// CREATE PARENT
// ============================

/**
 * Create a new parent with associated user account
 * Parents can login via parent portal and view their children's information
 */
export async function createParentWithUser(data: CreateParentPayload) {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      password,
      schoolId,
      title,
      relationship,
      gender,
      dob,
      altNo,
      idNo,
      occupation,
      address,
      village,
      country,
      religion,
      imageUrl,
    } = data;

    // Validate required fields
    if (!email || !phone || !firstName || !lastName || !password || !schoolId) {
      return { 
        ok: false, 
        message: "Missing required fields: email, phone, firstName, lastName, password, schoolId" 
      };
    }

    // Check if user already exists (email or phone)
    const existingUser = await db.user.findFirst({
      where: { 
        OR: [
          { email: email.toLowerCase() }, 
          { phone }
        ] 
      },
    });

    if (existingUser) {
      return { 
        ok: false, 
        message: "A user with this email or phone number already exists." 
      };
    }

    // Check if parent already exists by phone
    const existingParentByPhone = await db.parent.findUnique({ 
      where: { phone } 
    });
    
    if (existingParentByPhone) {
      return { 
        ok: false, 
        message: "A parent with this phone number already exists." 
      };
    }

    // Check if parent already exists by email
    if (email) {
      const existingParentByEmail = await db.parent.findUnique({ 
        where: { email: email.toLowerCase() } 
      });
      
      if (existingParentByEmail) {
        return { 
          ok: false, 
          message: "A parent with this email already exists." 
        };
      }
    }

    // Check if ID number already exists
    if (idNo) {
      const existingParentById = await db.parent.findUnique({ 
        where: { idNo } 
      });
      
      if (existingParentById) {
        return { 
          ok: false, 
          message: "A parent with this ID/Passport number already exists." 
        };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`.trim();

    // Create parent and user in transaction
    const result = await db.$transaction(async (tx) => {
      // Ensure "parent" role exists
      const parentRole = await tx.role.upsert({
        where: { roleName: "parent" },
        create: { 
          roleName: "parent", 
          displayName: "Parent", 
          description: "Parent role with access to view their children's information",
          permissions: ["view_own_children", "view_reports", "view_attendance"] 
        },
        update: {},
      });

      // Create user account
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          phone,
          firstName,
          lastName,
          name,
          password: hashedPassword,
          status: true,
          isVerfied: false, // Can be verified later via email
          roles: { connect: [{ id: parentRole.id }] },
        },
        select: { id: true, email: true, name: true },
      });

      // Create parent record
      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          schoolId,
          firstName,
          lastName,
          name,
          phone,
          email: email.toLowerCase(),
          idNo: idNo || null,
          gender: gender || null,
          title: title || null,
          relationship: relationship || null,
          altNo: altNo || null,
          occupation: occupation || null,
          address: address || null,
          village: village || null,
          country: country || null,
          religion: religion || null,
          imageUrl: imageUrl || null,
          dob: toDateOrNull(dob),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              status: true,
            }
          },
          school: true,
        }
      });

      return parent;
    });

    revalidatePath("/dashboard/parents");
    return { 
      ok: true, 
      data: result,
      message: "Parent created successfully. Login credentials have been set up." 
    };

  } catch (error: any) {
    console.error("❌ Error creating parent with user:", error);
    return { 
      ok: false, 
      message: error.message || "Something went wrong while creating parent!" 
    };
  }
}

// ============================
// GET PARENTS
// ============================

/**
 * Get all parents for a specific school
 */
export async function getParentsBySchool(schoolId: string) {
  try {
    const parents = await db.parent.findMany({
      where: { schoolId },
      include: {
        students: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE"
              },
              include: {
                classYear: {
                  include: {
                    classTemplate: true
                  }
                },
                stream: true,
                term: true,
              },
              orderBy: { createdAt: "desc" },
              take: 1, // Get most recent enrollment
            },
            school: true,
          },
          orderBy: { createdAt: "desc" },
        },
        school: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            status: true,
            isVerfied: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return parents;
  } catch (error) {
    console.error("❌ Error fetching parents by school:", error);
    return [];
  }
}

/**
 * Get single parent by ID with complete information
 */
export async function getParentById(id: string) {
  try {
    const parent = await db.parent.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            enrollments: {
              include: {
                classYear: {
                  include: {
                    classTemplate: true,
                  }
                },
                stream: true,
                term: {
                  include: {
                    academicYear: true,
                  }
                },
                academicYear: true,
                subjectEnrollments: {
                  // include: {
                  //   streamSubjectTeacher: {
                  //     include: {
                  //       subject: true,
                  //       teacher: {
                  //         select: {
                  //           id: true,
                  //           firstName: true,
                  //           lastName: true,
                  //           staffNo: true,
                  //         }
                  //       }
                  //     }
                  //   }
                  // }
                },
                reportCard: true,
              },
              orderBy: { createdAt: "desc" },
            },
            school: true,
          },
          orderBy: { createdAt: "desc" },
        },
        school: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            status: true,
            isVerfied: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
    });

    return parent;
  } catch (error) {
    console.error("❌ Error fetching parent by ID:", error);
    return null;
  }
}

/**
 * Get parent by user ID (for parent portal login)
 */
export async function getParentByUserId(userId: string) {
  try {
    const parent = await db.parent.findUnique({
      where: { userId },
      include: {
        students: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE"
              },
              include: {
                classYear: {
                  include: {
                    classTemplate: true,
                  }
                },
                stream: true,
                term: {
                  include: {
                    academicYear: true,
                  }
                },
                subjectEnrollments: {
                  include: {
                    // streamSubjectTeacher: {
                    //   include: {
                    //     subject: true,
                    //     teacher: {
                    //       select: {
                    //         id: true,
                    //         firstName: true,
                    //         lastName: true,
                    //         staffNo: true,
                    //       }
                    //     }
                    //   }
                    // },
                    subjectResult: true,
                  }
                },
                reportCard: true,
              },
              orderBy: { createdAt: "desc" },
            },
            school: true,
          }
        },
        school: true,
      },
    });

    return parent;
  } catch (error) {
    console.error("❌ Error fetching parent by user ID:", error);
    return null;
  }
}

/**
 * Search parents by name, phone, or email
 */
export async function searchParents(schoolId: string, searchTerm: string) {
  try {
    const parents = await db.parent.findMany({
      where: {
        schoolId,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { idNo: { contains: searchTerm } },
        ]
      },
      include: {
        students: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                classYear: {
                  include: {
                    classTemplate: true
                  }
                },
                stream: true,
              },
              take: 1,
              orderBy: { createdAt: "desc" },
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit results
    });

    return parents;
  } catch (error) {
    console.error("❌ Error searching parents:", error);
    return [];
  }
}

// ============================
// UPDATE PARENT
// ============================

/**
 * Update parent information
 */
export async function updateParent(id: string, data: UpdateParentPayload) {
  try {
    // Check if parent exists
    const existingParent = await db.parent.findUnique({ 
      where: { id },
      include: { user: true }
    });

    if (!existingParent) {
      return { ok: false, message: "Parent not found" };
    }

    // Check for duplicate phone (if changing)
    if (data.phone && data.phone !== existingParent.phone) {
      const duplicatePhone = await db.parent.findFirst({
        where: { 
          phone: data.phone,
          id: { not: id }
        }
      });
      
      if (duplicatePhone) {
        return { ok: false, message: "Phone number already in use by another parent" };
      }
    }

    // Check for duplicate email (if changing)
    if (data.email && data.email !== existingParent.email) {
      const duplicateEmail = await db.parent.findFirst({
        where: { 
          email: data.email.toLowerCase(),
          id: { not: id }
        }
      });
      
      if (duplicateEmail) {
        return { ok: false, message: "Email already in use by another parent" };
      }
    }

    // Check for duplicate ID number (if changing)
    if (data.idNo && data.idNo !== existingParent.idNo) {
      const duplicateId = await db.parent.findFirst({
        where: { 
          idNo: data.idNo,
          id: { not: id }
        }
      });
      
      if (duplicateId) {
        return { ok: false, message: "ID/Passport number already in use by another parent" };
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    // Handle name update
    if (data.firstName || data.lastName) {
      const firstName = data.firstName || existingParent.firstName;
      const lastName = data.lastName || existingParent.lastName;
      updateData.name = `${firstName} ${lastName}`.trim();
      updateData.firstName = firstName;
      updateData.lastName = lastName;
    }

    // Handle date of birth
    if (data.dob !== undefined) {
      updateData.dob = toDateOrNull(data.dob);
    }

    // Handle other fields
    const fieldsToUpdate = [
      'title', 'relationship', 'gender', 'phone', 'altNo', 
      'email', 'idNo', 'occupation', 'address', 'village', 
      'country', 'religion', 'imageUrl'
    ];

    for (const field of fieldsToUpdate) {
      if (data[field as keyof UpdateParentPayload] !== undefined) {
        updateData[field] = data[field as keyof UpdateParentPayload];
      }
    }

    // Update parent and user in transaction
    const result = await db.$transaction(async (tx) => {
      // Update parent
      const updatedParent = await tx.parent.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              status: true,
            }
          },
          students: {
            include: {
              enrollments: {
                where: { status: "ACTIVE" },
                include: {
                  classYear: {
                    include: {
                      classTemplate: true
                    }
                  },
                  stream: true,
                },
                take: 1,
              }
            }
          }
        }
      });

      // Update user if email, phone, or name changed
      const userUpdateData: any = {};
      if (data.email) userUpdateData.email = data.email.toLowerCase();
      if (data.phone) userUpdateData.phone = data.phone;
      if (updateData.name) userUpdateData.name = updateData.name;
      if (updateData.firstName) userUpdateData.firstName = updateData.firstName;
      if (updateData.lastName) userUpdateData.lastName = updateData.lastName;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingParent.userId },
          data: userUpdateData,
        });
      }

      return updatedParent;
    });

    revalidatePath("/dashboard/parents");
    revalidatePath(`/dashboard/parents/${id}`);
    
    return { 
      ok: true, 
      data: result,
      message: "Parent updated successfully" 
    };

  } catch (error: any) {
    console.error("❌ Error updating parent:", error);
    return { 
      ok: false, 
      message: error.message || "Failed to update parent" 
    };
  }
}

/**
 * Update parent's password
 */
export async function updateParentPassword(parentId: string, newPassword: string) {
  try {
    const parent = await db.parent.findUnique({ 
      where: { id: parentId },
      select: { userId: true }
    });

    if (!parent) {
      return { ok: false, message: "Parent not found" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: parent.userId },
      data: { password: hashedPassword }
    });

    revalidatePath(`/dashboard/parents/${parentId}`);
    
    return { 
      ok: true, 
      message: "Password updated successfully" 
    };

  } catch (error) {
    console.error("❌ Error updating parent password:", error);
    return { 
      ok: false, 
      message: "Failed to update password" 
    };
  }
}

/**
 * Toggle parent account status (active/inactive)
 */
export async function toggleParentStatus(parentId: string) {
  try {
    const parent = await db.parent.findUnique({ 
      where: { id: parentId },
      include: { user: true }
    });

    if (!parent) {
      return { ok: false, message: "Parent not found" };
    }

    const newStatus = !parent.user.status;

    await db.user.update({
      where: { id: parent.userId },
      data: { status: newStatus }
    });

    revalidatePath("/dashboard/parents");
    revalidatePath(`/dashboard/parents/${parentId}`);
    
    return { 
      ok: true, 
      message: `Parent account ${newStatus ? 'activated' : 'deactivated'} successfully` 
    };

  } catch (error) {
    console.error("❌ Error toggling parent status:", error);
    return { 
      ok: false, 
      message: "Failed to update parent status" 
    };
  }
}

// ============================
// DELETE PARENT
// ============================

/**
 * Delete parent and optionally their user account
 */
export async function deleteParent(id: string, deleteUser: boolean = true) {
  try {
    const parent = await db.parent.findUnique({
      where: { id },
      include: { 
        students: true,
        user: true 
      }
    });

    if (!parent) {
      return { ok: false, message: "Parent not found" };
    }

    // Check if parent has students
    if (parent.students.length > 0) {
      return { 
        ok: false, 
        message: `Cannot delete parent. They have ${parent.students.length} student(s) registered. Please reassign students first.` 
      };
    }

    await db.$transaction(async (tx) => {
      // Delete parent
      await tx.parent.delete({ where: { id } });

      // Delete associated user account if requested
      if (deleteUser && parent.userId) {
        // First delete any sessions
        await tx.session.deleteMany({ where: { userId: parent.userId } });
        
        // Then delete accounts
        await tx.account.deleteMany({ where: { userId: parent.userId } });
        
        // Finally delete user
        await tx.user.delete({ where: { id: parent.userId } });
      }
    });

    revalidatePath("/dashboard/parents");
    
    return { 
      ok: true, 
      message: "Parent deleted successfully" 
    };

  } catch (error: any) {
    console.error("❌ Error deleting parent:", error);
    return { 
      ok: false, 
      message: error.message || "Failed to delete parent" 
    };
  }
}

// ============================
// STUDENT ASSIGNMENT
// ============================

/**
 * Assign a student to a parent
 */
export async function assignStudentToParent(data: AssignStudentToParentPayload) {
  try {
    const { parentId, studentId } = data;

    // Verify parent exists
    const parent = await db.parent.findUnique({ where: { id: parentId } });
    if (!parent) {
      return { ok: false, message: "Parent not found" };
    }

    // Verify student exists and doesn't already have a parent
    const student = await db.student.findUnique({ 
      where: { id: studentId },
      include: { parent: true }
    });

    if (!student) {
      return { ok: false, message: "Student not found" };
    }

    if (student.parent && student.parentId !== parentId) {
      return { 
        ok: false, 
        message: `Student is already assigned to ${student.parent.firstName} ${student.parent.lastName}` 
      };
    }

    // Assign student to parent
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: { parentId },
      include: {
        parent: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            classYear: {
              include: {
                classTemplate: true
              }
            },
            stream: true,
          },
          take: 1,
        }
      }
    });

    revalidatePath("/dashboard/parents");
    revalidatePath(`/dashboard/parents/${parentId}`);
    revalidatePath(`/dashboard/students/${studentId}`);
    
    return { 
      ok: true, 
      data: updatedStudent,
      message: "Student assigned to parent successfully" 
    };

  } catch (error: any) {
    console.error("❌ Error assigning student to parent:", error);
    return { 
      ok: false, 
      message: error.message || "Failed to assign student to parent" 
    };
  }
}

/**
 * Unassign a student from their parent
 */
export async function unassignStudentFromParent(studentId: string) {
  try {
    const student = await db.student.findUnique({ 
      where: { id: studentId },
      select: { parentId: true }
    });

    if (!student) {
      return { ok: false, message: "Student not found" };
    }

    if (!student.parentId) {
      return { ok: false, message: "Student is not assigned to any parent" };
    }

    const parentId = student.parentId;

    // Remove parent assignment (this will fail due to the schema constraint)
    // You need to either:
    // 1. Make parentId optional in Student model, OR
    // 2. Assign to a default "unassigned" parent
    
    // For now, return error indicating the constraint
    return { 
      ok: false, 
      message: "Cannot unassign student from parent. Student must have a parent. Please reassign to a different parent instead." 
    };

    // If parentId is made optional in schema, use this code:
    // await db.student.update({
    //   where: { id: studentId },
    //   data: { parentId: null }
    // });
    //
    // revalidatePath("/dashboard/parents");
    // revalidatePath(`/dashboard/parents/${parentId}`);
    // revalidatePath(`/dashboard/students/${studentId}`);
    //
    // return { 
    //   ok: true, 
    //   message: "Student unassigned from parent successfully" 
    // };

  } catch (error: any) {
    console.error("❌ Error unassigning student from parent:", error);
    return { 
      ok: false, 
      message: error.message || "Failed to unassign student from parent" 
    };
  }
}

/**
 * Reassign student from one parent to another
 */
export async function reassignStudent(studentId: string, newParentId: string) {
  try {
    const student = await db.student.findUnique({ 
      where: { id: studentId },
      include: { parent: true }
    });

    if (!student) {
      return { ok: false, message: "Student not found" };
    }

    const newParent = await db.parent.findUnique({ 
      where: { id: newParentId } 
    });

    if (!newParent) {
      return { ok: false, message: "New parent not found" };
    }

    const oldParentId = student.parentId;

    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: { parentId: newParentId },
      include: {
        parent: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            classYear: {
              include: {
                classTemplate: true
              }
            },
            stream: true,
          },
          take: 1,
        }
      }
    });

    revalidatePath("/dashboard/parents");
    revalidatePath(`/dashboard/parents/${oldParentId}`);
    revalidatePath(`/dashboard/parents/${newParentId}`);
    revalidatePath(`/dashboard/students/${studentId}`);
    
    return { 
      ok: true, 
      data: updatedStudent,
      message: `Student reassigned from ${student.parent.firstName} ${student.parent.lastName} to ${newParent.firstName} ${newParent.lastName}` 
    };

  } catch (error: any) {
    console.error("❌ Error reassigning student:", error);
    return { 
      ok: false, 
      message: error.message || "Failed to reassign student" 
    };
  }
}

// ============================
// STATISTICS
// ============================

/**
 * Get parent statistics for a school
 */
export async function getParentStatistics(schoolId: string) {
  try {
    const [
      totalParents,
      activeParents,
      inactiveParents,
      parentsWithMultipleChildren,
      parentsWithoutChildren,
    ] = await Promise.all([
      // Total parents
      db.parent.count({ where: { schoolId } }),
      
      // Active parents (with active user accounts)
      db.parent.count({
        where: {
          schoolId,
          user: { status: true }
        }
      }),
      
      // Inactive parents
      db.parent.count({
        where: {
          schoolId,
          user: { status: false }
        }
      }),
      
      // Parents with multiple children
      db.parent.count({
        where: {
          schoolId,
          students: {
            some: {}
          }
        }
      }),
      
      // Parents without children
      db.parent.count({
        where: {
          schoolId,
          students: {
            none: {}
          }
        }
      }),
    ]);

    return {
      totalParents,
      activeParents,
      inactiveParents,
      parentsWithMultipleChildren,
      parentsWithoutChildren,
    };

  } catch (error) {
    console.error("❌ Error fetching parent statistics:", error);
    return {
      totalParents: 0,
      activeParents: 0,
      inactiveParents: 0,
      parentsWithMultipleChildren: 0,
      parentsWithoutChildren: 0,
    };
  }
}

/**
 * Get parents who haven't logged in for a certain period
 */
export async function getInactiveParentAccounts(schoolId: string, daysInactive: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const parents = await db.parent.findMany({
      where: {
        schoolId,
        user: {
          sessions: {
            none: {
              expires: {
                gte: cutoffDate
              }
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          }
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return parents;

  } catch (error) {
    console.error("❌ Error fetching inactive parent accounts:", error);
    return [];
  }
}