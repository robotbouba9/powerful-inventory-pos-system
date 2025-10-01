import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface SyncUserRequest {
  email: string;
  fullName: string;
  avatarUrl?: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  avatarUrl: string | null;
}

// Syncs user data from Clerk to the database
export const sync = api(
  { auth: true, expose: true, method: "POST", path: "/users/sync" },
  async (req: SyncUserRequest): Promise<User> => {
    const auth = getAuthData()!;

    const existing = await db.queryRow<User>`
      SELECT id, email, full_name as "fullName", role, status, avatar_url as "avatarUrl"
      FROM users 
      WHERE id = ${auth.userID}
    `;

    if (existing) {
      await db.exec`
        UPDATE users 
        SET email = ${req.email},
            full_name = ${req.fullName},
            avatar_url = ${req.avatarUrl || null},
            updated_at = NOW()
        WHERE id = ${auth.userID}
      `;
      
      return {
        ...existing,
        email: req.email,
        fullName: req.fullName,
        avatarUrl: req.avatarUrl || null,
      };
    }

    await db.exec`
      INSERT INTO users (id, email, full_name, role, avatar_url)
      VALUES (${auth.userID}, ${req.email}, ${req.fullName}, 'admin', ${req.avatarUrl || null})
    `;

    const user = await db.queryRow<User>`
      SELECT id, email, full_name as "fullName", role, status, avatar_url as "avatarUrl"
      FROM users 
      WHERE id = ${auth.userID}
    `;

    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }
);
