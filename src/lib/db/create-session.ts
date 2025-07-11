import { desc, eq, inArray } from 'drizzle-orm';
import type { RawDrizzleDependency } from './client';

type CreateSessionParams = {
  drizzle: Pick<RawDrizzleDependency['drizzle'], 'insert' | 'transaction' | '_'>;
  userId: string;
  nextRefreshToken: string;
};

/**
 * Creates a new session for the user, ensuring that the user has less than 5 active sessions.
 * If the user has 5 or more active sessions, it deletes the oldest sessions until only 4 remain.
 * Throws an error if the session creation fails.
 *
 **/
export const createSession = async ({
  drizzle,
  userId,
  nextRefreshToken,
}: CreateSessionParams): Promise<{ sessionId: string }> => {
  const sessionsTable = drizzle._.fullSchema.sessions;

  // Ensure user has less than 5 active sessions
  const { sessionId } = await drizzle.transaction(async (tx) => {
    const sessions = await tx
      .select({
        id: sessionsTable.id,
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, userId))
      .orderBy(desc(sessionsTable.lastAccessed));
    if (sessions.length >= 5) {
      // Delete sessions until there are only 4 left
      const sessionsToDelete = sessions.slice(4);
      await tx.delete(sessionsTable).where(
        inArray(
          sessionsTable.id,
          sessionsToDelete.map((s) => s.id),
        ),
      );
    }
    const insertResult = await tx
      .insert(sessionsTable)
      .values({
        userId,
        nextRefreshToken,
      })
      .returning({
        sessionId: sessionsTable.id,
      });
    // Create new session
    const sessionId = insertResult[0]?.sessionId;

    if (!sessionId) throw new Error('Failed to create session');

    return { sessionId };
  });

  return { sessionId };
};
