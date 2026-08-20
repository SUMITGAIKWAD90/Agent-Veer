"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field
} from "@/components/ui/field";
import Link from "next/link";
import FormField from "./FormField";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "@firebase/auth";
import { auth } from "@/firebase/client";
import { signIn, signUp } from "@/lib/actions/auth.action";

// const formSchema = z.object({
//   username: z
//     .string()
//     .min(3, "Username must be at least 3 characters.")
//     .max(10, "Username must be at most 10 characters.")
//     .regex(
//       /^[a-zA-Z0-9_]+$/,
//       "Username can only contain letters, numbers, and underscores.",
//     ),
// });

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  })
}

export function FormRhfInput({ type }: { type: FormType }) {
  const router = useRouter();
  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (type === 'sign-up') {
        const {name, email, password } = values;

        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);

        const result = await signUp({
          uid: userCredentials.user.uid,
          name: name!,
          email,
          password,
        })

        if(!result?.success){
          toast.error(result?.message);
          return;
        }

        toast.success('Account created Successfully. Please Sign in !')
        router.push('/sign-in')

      } else {
        const { email, password } = values;

        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const idToken = await userCredential.user.getIdToken();

        if(!idToken) {
          toast.error('Sign in failed')
          return;
        }

        await signIn({
          email, idToken
        })
        
        toast.success('Signed in Successfully')
        router.push('/')
      }

    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`)
    }
  }

  const isSignIn = type === 'sign-in';

  return (
    <div>
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image
            src="/logo.svg"
            alt="logo"
            height={32}
            width={38}
          />
          <h2 className="text-primary-100">Agent-Veer</h2>
        </div>
        <h3>Practice job interview with AI</h3>

        <form id="form-rhf-input" onSubmit={form.handleSubmit(onSubmit)}>

          {!isSignIn && (
            <FormField control={form.control}
              name="name"
              lable="Name"
              placeholder="Enter Your Name"
              type="text"
            />
          )}
          <FormField control={form.control}
            name="email"
            lable="Email"
            placeholder="Enter Your Email"
            type="email"
          />
          <FormField control={form.control}
            name="password"
            lable="Password"
            placeholder="Enter Your Password"
            type="password"
          />

        </form>
        <Field orientation="horizontal">
          <Button className="btn" type="submit" form="form-rhf-input">
            {isSignIn ? 'Sign in' : 'Create an Account'}
          </Button>
        </Field>
        <p className="text-center">
          {isSignIn ? 'No account yet?' : 'Have an account already?'}

          <Link href={!isSignIn ? '/sign-in' :
            '/sign-up'} className="font-bold text-user-primary ml-1">
            {!isSignIn ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default FormRhfInput;
