import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  avatarUrl: string | null;
}

// Gets the current authenticated user
export const getCurrent = api<void, User>(
  { auth: true, expose: true, method: "GET", path: "/users/me" },
  async () => {
    const auth = getAuthData()!;

    const user = await db.queryRow<User>`
      SELECT id, email, full_name as "fullName", role, status, avatar_url as "avatarUrl"
      FROM users 
      WHERE id = ${auth.userID}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    return user;
  }
);
