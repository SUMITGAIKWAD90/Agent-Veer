"use server";

import { cookies } from "next/headers";

import { auth, db } from "@/firebase/admin";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

type AuthResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export async function setSessionCookie(
  idToken: string
): Promise<void> {
  if (!idToken) {
    throw new Error("ID token is required.");
  }

  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000,
  });

  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function signUp(
  params: SignUpParams
): Promise<AuthResult> {
  const { uid, name, email } = params;

  try {
    if (!uid || !email || !name) {
      return {
        success: false,
        message: "Name, email, and user ID are required.",
      };
    }

    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    if (userSnapshot.exists) {
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };
    }

    await userRef.set({
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      return {
        success: false,
        message: "This email is already in use.",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}


export async function signIn(
  params: SignInParams
): Promise<AuthResult> {
  const { idToken } = params;

  try {
    if (!idToken) {
      return {
        success: false,
        message: "Authentication token is required.",
      };
    }

    // Verify the ID token before creating a session.
    const decodedToken = await auth.verifyIdToken(idToken);

    // Make sure the Firebase Auth user still exists.
    await auth.getUser(decodedToken.uid);

    await setSessionCookie(idToken);

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error: unknown) {
    console.error("Error signing in:", error);

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}


export async function signOut(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}


export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify session and revoke-check the Firebase session.
    const decodedClaims = await auth.verifySessionCookie(
      sessionCookie,
      true
    );

    const userSnapshot = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userSnapshot.exists) {
      return null;
    }

    return {
      id: userSnapshot.id,
      ...userSnapshot.data(),
    } as User;
  } catch (error: unknown) {
    console.error("Error getting current user:", error);

    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();

  return user !== null;
}