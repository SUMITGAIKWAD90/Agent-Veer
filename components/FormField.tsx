import {
  Field,
  FieldContent,
  FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Control, Controller, FieldValues, Path } from "react-hook-form";



interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  lable: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'file'
}

const FormField = <T extends FieldValues>({
  control,
  name,
  lable,
  placeholder,
  type = "text",
}: FormFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <Field>
        <FieldLabel className="label">{lable}</FieldLabel>
        <FieldContent>
          <Input
            className=" !bg-dark-200 !rounded-full !min-h-12 !px-5 placeholder:!text-light-100 "
            placeholder={placeholder}
            type={type}
            {...field}
          />
        </FieldContent>
      </Field>
    )}
  />
);

export default FormField;