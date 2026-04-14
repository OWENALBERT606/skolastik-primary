"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ImageInput from "@/components/FormInputs/ImageInput";
import { generateSlug } from "@/lib/generateSlug";
import TextInput from "@/components/FormInputs/TextInput";
import TextArea from "@/components/FormInputs/TextAreaInput";
import { IdCard, Lock, Mail, Phone } from "lucide-react";
import PasswordInput from "@/components/FormInputs/PasswordInput";
import FormSelectInput from "@/components/FormInputs/FormSelectInput";
import FormHeader from "./FormHeader";
import FormFooter from "./FormFooter";
import toast from "react-hot-toast";
import { createParentWithUser, updateParent } from "@/actions/parents";

export type SelectOptionProps = {
  label: string;
  value: string;
};
type CategoryFormProps = {
  editingId?: string | undefined;
  initialData?: any | undefined | null;
  schoolId:any;
  slug:any
};
export default function CreateParentsForm({
  schoolId,
  slug,
  editingId,
  initialData,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
  defaultValues: {
    title: initialData?.title || "",
    relationship: initialData?.relationship || "",
    gender: initialData?.gender || "",
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "", // format to yyyy-mm-dd for input[type=date]
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    phone: initialData?.phone || "",
    altNo: initialData?.altNo || "",
    email: initialData?.email || "",
    idNo: initialData?.idNo || "",
    occupation: initialData?.occupation || "",
    address: initialData?.address || "",
    village: initialData?.village || "",
    country: initialData?.country || "",
    religion: initialData?.religion || "",
    schoolId:initialData?.schoolId || "",
    imageUrl: initialData?.imageUrl || "/images.jpg",
  },
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const initialImage = initialData?.imageUrl || "/images.jpg";
  const [imageUrl, setImageUrl] = useState(initialImage);

  const titles=[
    {
      label:"Mr",
      value:"345678"
    },
    {
      label:"Mrs",
      value:"345678"
    },
    {
      label:"Rev",
      value:"345678"
    },
    {
      label:"Ms",
      value:"345678"
    },
  ]
  const relationships=[
    {
      label:"Mother",
      value:"345678"
    },
    {
      label:"Father",
      value:"345678"
    },
    {
      label:"Gurdian",
      value:"345678"
    }
  ]
  
  const genders=[
    {
      label:"Male",
      value:"345678"
    },
    {
      label:"Female",
      value:"345678"
    }
  ]
  const countries=[
    {
      label:"Uganda",
      value:"345678"
    },
    {
      label:"Kenya",
      value:"345678"
    },
    {
      label:"Tanzania",
      value:"345678"
    },
    {
      label:"Rwanda",
      value:"345678"
    },
    {
      label:"Sudan",
      value:"345678"
    },
    {
      label:"DRC",
      value:"345678"
    }
  ]
  const religions=[
    {
      label:"Catholic",
      value:"345678"
    },
    {
      label:"Seventh Day Adventist",
      value:"345678"
    },
    {
      label:"Islam",
      value:"345678"
    },
    {
      label:"Pentecostalism",
      value:"345678"
    }
  ]

  const [selectedTitle,setSelectedTitle]=useState<any>(titles?.[0]);
  const [selectedRelationship,setSelectedRelationship]=useState<any>(relationships?.[0]);
  const [selectedGender,setSelectedGender]=useState<any>(genders?.[0]);
  const [selectedCountry,setSelectedCountry]=useState<any>(countries?.[0]);
  const [selectedReligion,setSelectedReligion]=useState<any>(religions?.[0]);

  async function saveParent(data: any) {
    try {
      setLoading(true);
      data.imageUrl = imageUrl;
      data.title =selectedTitle.label
      data.relationship=selectedRelationship.label
      data.gender=selectedGender?.label
      data.country=selectedCountry.label
      data.religion=selectedReligion.label
      data.schoolId=schoolId
      data.dob=data.dob

      console.log(data)
      
      if (editingId) {
        await updateParent(editingId, data);
        setLoading(false);
        // Toast
        toast.success("Updated Successfully!");
        //reset
        reset();
        //route
        router.push(`/school/${slug}/users/parents`);
        setImageUrl("/placeholder.svg");
      } else {
        await createParentWithUser(data);
        setLoading(false);
        console.log(data);
        // Toast
        toast.success("Successfully Registered!");
        //reset
        reset();
        setImageUrl("/placeholder.svg");
        //route
        router.push(`/school/${slug}/users/parents`);
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }
  return (
    <form className="" onSubmit={handleSubmit(saveParent)}>
      
      <FormHeader
        href="/parents"
        parent=""
        title="Parent"
        editingId={editingId}
        loading={loading}
      />

      <div className="grid grid-cols-12 gap-6 py-8">
        <div className="col-span-12 space-y-3">
        <div className="grid gap-6">
                <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-3">
                <FormSelectInput
                label="Nationality"
                options={countries}
                option={selectedCountry}
                setOption={setSelectedCountry}
                toolTipText="Add New country"
                href="/dashboard/countries/new"
              />
                  <FormSelectInput
                label="Relationship"
                options={relationships}
                option={selectedRelationship}
                setOption={setSelectedRelationship}
                toolTipText="Add New Relationship"
                href="/dashboard/relationships/new"
              />
                 
                    <FormSelectInput
                label="Title"
                options={titles}
                option={selectedTitle}
                setOption={setSelectedTitle}
                toolTipText="Add New Title"
                href="/dashboard/titles/new"
              />
                </div> 
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <FormSelectInput
                label="Religion"
                options={religions}
                option={selectedReligion}
                setOption={setSelectedReligion}
                toolTipText="Add New Religion"
                href="/dashboard/religions/new"
              />
               <TextInput
                    register={register}
                    errors={errors}
                    label="Parent Surname"
                    name="firstName"
                  />
                   <PasswordInput
                                  register={register}
                                  errors={errors}
                                  label="Password for parents portal"
                                  name="password"
                                  icon={Lock}
                                  placeholder="password"
                                  type="password"
                                />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <TextInput
                    register={register}
                    errors={errors}
                    label="Parent Last Name"
                    name="lastName"
                  />
              <TextInput
                    register={register}
                    errors={errors}
                    label="Phone number"
                    name="phone"
                    type="tel"
                    icon={Phone}
                  />
              <TextInput
                    register={register}
                    errors={errors}
                    label="Email Address"
                    name="email"
                    type="email"
                    icon={Mail}
                  />
                  
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              
               <TextInput
                    register={register}
                    errors={errors}
                    label="ID / Passport Number"
                    name="idNo"
                    type="text"
                    icon={IdCard}
                  />
                    <TextInput
                    register={register}
                    errors={errors}
                    label="State/Village"
                    name="village"
                    type="text"
                  />
                   <TextInput
                    register={register}
                    errors={errors}
                    label="Date of birth"
                    name="dob"
                    type="date"
                  />
                </div>
                <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-3">
                     <TextInput
                    register={register}
                    errors={errors}
                    label="Alternative No"
                    name="altNo"
                    type="tel"
                  />
                  
                 <TextInput
                    register={register}
                    errors={errors}
                    label="Occupation"
                    name="occupation"
                    type="text"
                  />
                      <FormSelectInput
                label="Gender"
                options={genders}
                option={selectedGender}
                setOption={setSelectedGender}
              />
               
               
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                <div className="grid gap-3">
                 
              
                  
                 <TextArea
                    register={register}
                    errors={errors}
                    label="Address"
                    name="address"
                  />
                </div>
                <ImageInput
              title="Parents Photo"
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              endpoint="parentImage"
            />


                </div>
                
               
              
              </div>
        </div>
        
      </div>
      <FormFooter
        href="/parents"
        editingId={editingId}
        loading={loading}
        title="Parent"
        parent="users"
      />
    </form>
  );
}
