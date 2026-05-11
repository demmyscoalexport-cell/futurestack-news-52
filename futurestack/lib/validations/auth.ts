import { z } from "zod";

export const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirm_password: z.string(),
    role: z.enum(["freelancer", "agency", "saas-founder"], {
      required_error: "Please select your role",
    }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
