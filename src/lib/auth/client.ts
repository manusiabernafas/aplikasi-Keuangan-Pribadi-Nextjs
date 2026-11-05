"use client";

import { createAuthClient } from "better-auth/react";

/** Klien browser, hanya untuk redirect OAuth Google; aksi lain lewat server action. */
export const authClient = createAuthClient();
