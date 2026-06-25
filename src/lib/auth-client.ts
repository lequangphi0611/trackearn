import { createAuthClient } from "better-auth/react";

// Client tương tác Better Auth từ phía browser (signOut, useSession…).
// baseURL mặc định = origin hiện tại.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
