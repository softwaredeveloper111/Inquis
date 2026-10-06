import {z} from "zod";




export const loginSchema = z.object({
email:z
.string()
.trim()
.min(1, "email is required"),

password:z
.string()
.trim()
.min(1,"password is required")

});
 



export const signupSchema = z.object({
  username:z
  .string()
  .trim()
  .min(1,"username is required")
   .regex(/^[a-z0-9_]{3,30}$/, "Username contains invalid characters")
    .refine(
      (value) => value === value.toLowerCase(),
      "Username should be in lowercase"
    )
    .min(3, "Username should be between 3 and 30 characters")
    .max(30, "Username should be between 3 and 30 characters"),



    email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address")
    .refine(
      (value) => value === value.toLowerCase(),
      "Email should be in lowercase"
    )
    .transform((value) => value.toLowerCase()),


    
  password: z
    .string()
    .trim()
    .min(1, "Password is required")
    .regex( /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/,"please provide a valid password")
    .min(8, "Password should be between 8 and 72 characters")
    .max(72, "Password should be between 8 and 72 characters"),
})