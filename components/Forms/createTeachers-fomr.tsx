

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ImageInput from "@/components/FormInputs/ImageInput";
import TextInput from "@/components/FormInputs/TextInput";
import TextArea from "@/components/FormInputs/TextAreaInput";
import FormSelectInput from "@/components/FormInputs/FormSelectInput";
import FormHeader from "./FormHeader";
import FormFooter from "./FormFooter";
import toast from "react-hot-toast";
import { IdCard, Mail, Phone, BookOpen } from "lucide-react";
import { createTeacherWithUser, updateTeacher } from "@/actions/teachers";
import PdfInput from "../FormInputs/PdfInput";
import { Dropzone, FileWithMetadata } from "../ui/dropzone";
import PasswordInput from "../FormInputs/PasswordInput";

type TeacherFormProps = {
  editingId?: string;
  initialData?: any | null;
  schoolId: any;
  slug: any;
};

export default function CreateTeacherForm({
  schoolId,
  slug,
  editingId,
  initialData,
}: TeacherFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      staffNo: initialData?.staffNo || "",
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      gender: initialData?.gender || "",
      dateOfBirth: initialData?.dateOfBirth
        ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
        : "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      nationalId: initialData?.nationalId || "",
      address: initialData?.address || "",
      nationality: initialData?.nationality || "",
      maritalStatus: initialData?.maritalStatus || "",
      emergencyContactName: initialData?.emergencyContactName || "",
      emergencyRelationship: initialData?.emergencyRelationship || "",
      emergencyPhone: initialData?.emergencyPhone || "",
      emergencyEmail: initialData?.emergencyEmail || "",
      qualification: initialData?.qualification || "",
      specialization: initialData?.specialization || "",
      teachingLevel: initialData?.teachingLevel || "",
      experienceYears: initialData?.experienceYears || "",
      dateOfHire: initialData?.dateOfHire
        ? new Date(initialData.dateOfHire).toISOString().split("T")[0]
        : "",
      employmentType: initialData?.employmentType || "",
      role: initialData?.role || "",
      assignedSubjects: initialData?.assignedSubjects || "",
      assignedClasses: initialData?.assignedClasses || "",
      salary: initialData?.salary || "",
      allowances: initialData?.allowances || "",
      status: initialData?.status || "ACTIVE",
      highestQualification: initialData?.highestQualification || "",
      institutionAttended: initialData?.institutionAttended || "",
      professionalTraining: initialData?.professionalTraining || "",
      ongoingStudies: initialData?.ongoingStudies || "",
      previousSchools: initialData?.previousSchools || "",
      healthInfo: initialData?.healthInfo || "",
      profilePhoto: initialData?.profilePhoto || "/placeholder.svg",
      documents: initialData?.documents || "",
      schoolId: initialData?.schoolId || schoolId,
    },
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    initialData?.profilePhoto || "/placeholder.svg"
  );

  // Options
  const genders = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];
  const employmentTypes = [
    { label: "Full-time", value: "fulltime" },
    { label: "Part-time", value: "parttime" },
    { label: "Contract", value: "contract" },
  ];
  const teachingLevels = [
    { label: "Primary", value: "primary" },
    { label: "Secondary", value: "secondary" },
    { label: "Tertiary", value: "tertiary" },
  ];
  const countries = [
    { label: "Uganda", value: "uganda" },
    { label: "Kenya", value: "kenya" },
    { label: "Tanzania", value: "tanzania" },
    { label: "Rwanda", value: "rwanda" },
    { label: "Sudan", value: "sudan" },
    { label: "DRC", value: "drc" },
  ];
  const marital = [
    { label: "Married", value: "married" },
    { label: "Single", value: "single" },
    { label: "Divorced", value: "divorced" },
    { label: "Widowed", value: "widowed" },
  ];
  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Leave", value: "LEAVE" },
    { label: "Resigned", value: "RESIGNED" },
    { label: "Retired", value: "RETIRED" },
  ];

  // Selected states
  const [selectedGender, setSelectedGender] = useState(
    genders.find((g) => g.value === initialData?.gender) || null
  );
  const [selectedEmployment, setSelectedEmployment] = useState(
    employmentTypes.find((e) => e.value === initialData?.employmentType) || null
  );
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((c) => c.label === initialData?.nationality) || null
  );
  const [selectedMarital, setSelectedMarital] = useState(
    marital.find((m) => m.label === initialData?.maritalStatus) || null
  );
  const [selectedStatus, setSelectedStatus] = useState(
    statusOptions.find((s) => s.value === initialData?.status) || null
  );
  const [files, setFiles] = useState<FileWithMetadata[]>();
  const [documents, setDocuments] = useState<string>(initialData?.documents || []);

  const [selectedTeachingLevel, setSelectedTeachingLevel] = useState(
    teachingLevels.find((t) => t.value === initialData?.teachingLevel) || null
  );

  function generateStaffNo(): string {
    const initials = "TCH";
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    return `${initials}${randomPart}`;
  }

  async function saveTeacher(data: any) {
    try {
      setLoading(true);
      // Assign images and documents
    data.profilePhoto = files?.[0]?.publicUrl;
    data.documents = documents || null; // single string

    // Assign selected dropdowns
    data.gender = selectedGender?.value;
    data.nationality = selectedCountry?.label;
    data.maritalStatus = selectedMarital?.label;
    data.employmentType = selectedEmployment?.value;
    data.teachingLevel = selectedTeachingLevel?.value;
    data.status = selectedStatus?.value;
    data.schoolId = schoolId;
    data.staffNo = generateStaffNo();

    // Convert dates
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth).toISOString();
    if (data.dateOfHire) data.dateOfHire = new Date(data.dateOfHire).toISOString();

    // Convert strings to numbers
    data.experienceYears = data.experienceYears ? parseInt(data.experienceYears) : null;
    data.salary = data.salary ? parseFloat(data.salary) : null;
    data.allowances = data.allowances ? parseFloat(data.allowances) : null;

    // Convert previousSchools comma-separated string to array
    data.previousSchools = data.previousSchools
      ? data.previousSchools.split(",").map((s: string) => s.trim())
      : [];

      console.log(data);

      if (editingId) {
        await updateTeacher(editingId, data);
        toast.success("Teacher updated successfully!");
      } else {
        await createTeacherWithUser(data);
        toast.success("Teacher registered successfully!");
      }

      reset();
      setImageUrl("/placeholder.svg");
      router.push(`/school/${slug}/users/teachers`);
    } catch (error) {
      console.error("❌ Error saving teacher:", error);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(saveTeacher)}>
      <FormHeader
        href="/teachers"
        parent=""
        title="Teacher"
        editingId={editingId}
        loading={loading}
      />

      {/* PERSONAL INFO */}
      <div className="grid grid-cols-12 gap-6 px-4 py-8">
        <div className="col-span-12 space-y-6">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <TextInput register={register} errors={errors} label="First Name" name="firstName" />
            <TextInput register={register} errors={errors} label="Last Name" name="lastName" />
            <FormSelectInput label="Gender" options={genders} option={selectedGender} setOption={setSelectedGender} />
            <TextInput register={register} errors={errors} label="Date of Birth" name="dateOfBirth" type="date" />
            <FormSelectInput label="Nationality" options={countries} option={selectedCountry} setOption={setSelectedCountry} />
            <FormSelectInput label="Marital Status" options={marital} option={selectedMarital} setOption={setSelectedMarital} />
            <TextInput register={register} errors={errors} label="National ID / Passport" name="nationalId" icon={IdCard} />
            <TextInput register={register} errors={errors} label="Phone" name="phone" type="tel" icon={Phone} />
            <TextInput register={register} errors={errors} label="Email" name="email" type="email" icon={Mail} />
            <TextInput register={register} errors={errors} label="Address" name="address" />
            <PasswordInput register={register} errors={errors} label="Password for staff portal" name="password" type="password" />
          </div>

          {/* EMERGENCY CONTACT */}
          <h3 className="font-semibold text-lg">Emergency Contact</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <TextInput register={register} errors={errors} label="Contact Name" name="emergencyContactName" />
            <TextInput register={register} errors={errors} label="Relationship" name="emergencyRelationship" />
            <TextInput register={register} errors={errors} label="Phone" name="emergencyPhone" type="tel" />
            <TextInput register={register} errors={errors} label="Email" name="emergencyEmail" type="email" />
          </div>

          {/* PROFESSIONAL & EMPLOYMENT INFO */}
          <h3 className="font-semibold text-lg">Professional & Employment</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <TextInput register={register} errors={errors} label="Qualification" name="qualification" />
            <TextInput register={register} errors={errors} label="Specialization" name="specialization" icon={BookOpen} />
            <FormSelectInput label="Teaching Level" options={teachingLevels} option={selectedTeachingLevel} setOption={setSelectedTeachingLevel} />
            <TextInput register={register} errors={errors} label="Experience Years" name="experienceYears" type="number" />
            <TextInput register={register} errors={errors} label="Role" name="role" />
            <TextInput register={register} errors={errors} label="Assigned Subjects" name="assignedSubjects" />
            <TextInput register={register} errors={errors} label="Assigned Classes" name="assignedClasses" />
            <TextInput register={register} errors={errors} label="Salary" name="salary" type="number" />
            <TextInput register={register} errors={errors} label="Allowances" name="allowances" type="number" />
            <TextInput register={register} errors={errors} label="Date of Hire" name="dateOfHire" type="date" />
            <FormSelectInput label="Employment Type" options={employmentTypes} option={selectedEmployment} setOption={setSelectedEmployment} />
            <FormSelectInput label="Status" options={statusOptions} option={selectedStatus} setOption={setSelectedStatus} />
          </div>

          {/* ACADEMIC RECORDS */}
          <h3 className="font-semibold text-lg">Academic & Professional Development</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <TextInput register={register} errors={errors} label="Highest Qualification" name="highestQualification" />
            <TextInput register={register} errors={errors} label="Institution Attended" name="institutionAttended" />
            <TextInput register={register} errors={errors} label="Professional Training" name="professionalTraining" />
            <TextInput register={register} errors={errors} label="Ongoing Studies" name="ongoingStudies" />
            <TextArea register={register} errors={errors} label="Previous Schools separate with commas" name="previousSchools" />
          </div>
           <TextArea register={register} errors={errors} label="Health Information" name="healthInfo" />

          {/* DOCUMENTS & PHOTO */}
          <h3 className="font-semibold text-lg">Documents & Photo</h3>
          <div className=" gap-6">
             {/* Image */}
                        <div className="grid grid-cols-2  md:w-full gap-8">
                   <div className="">
                           <h2>Upload student photo here</h2>
                          <Dropzone
                    provider="cloudflare-r2"
                    variant="compact"
                    maxFiles={1}
                    maxSize={1024 * 1024 * 50} // 50MB
                    onFilesChange={(files) => setFiles(files)}
                  />
                   </div>
                  <div>
                            <h2>Upload academic documents here</h2>
                          <Dropzone
                    provider="cloudflare-r2"
                    variant="compact"
                    maxFiles={1}
                    maxSize={1024 * 1024 * 5} // 5MB
                    onFilesChange={(documents) => setFiles(documents)}
                  />
                  </div>
          </div>
        </div>
      </div>
      </div>

      <FormFooter
        href="/teachers"
        editingId={editingId}
        loading={loading}
        title="Teacher"
        parent="users"
      />
    </form>
  );
}
