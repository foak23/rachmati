# Rachmati authentication and private owner uploads

Customers must sign in with a Google account before the app loads the pattern catalog. The Login and Sign Up buttons use the same Google OAuth flow: Google accounts that have not used the app before are registered automatically. Supabase stores the session on the device.

The owner-management entry is hidden from the customer header. The owner can open it by pressing and holding the Rachmati brand mark for about one second, then signing in with the owner account. Management tools are shown only for the configured owner email. Supabase policies independently restrict creating, editing, and deleting catalog entries and their DST/image files to one Auth user UUID. Authenticated customers can read the published catalog. Because the Storage bucket is public, anyone with a file URL can download its files.

When publishing a design, the owner must select both a DST file (up to 25 MB) and its design image (up to 10 MB). The image appears on the public catalog card. New image paths are derived from the DST storage path, so no database schema change or SQL migration is required. Older catalog entries without an image continue to show their category artwork.

Uploaded designs show a download button in the public catalog. Each download on Android or iOS opens the system folder picker so the visitor can choose where to save the DST file. If that filename already exists, the app keeps the existing file and saves this download with a numbered filename instead. The app uses the system-granted folder access rather than requesting broad storage permission. On web, the public file URL opens in the browser.

## One-time setup

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In **Authentication > Users**, create your owner account. Keep public sign-ups enabled so new customers can use Google sign-in; catalog read and owner write access remain controlled by the app and database policies.
3. Copy the owner's user UUID from the Users page.
4. Open `setup.sql`, replace every `REPLACE_WITH_OWNER_USER_UUID` with that UUID, and run the complete script in the project's **SQL Editor**.
5. In Google Cloud Console, configure the OAuth consent screen and create a **Web application** OAuth client. Add this Supabase callback as an authorized redirect URI: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`.
6. In Supabase, open **Authentication > Providers > Google**, enable Google, and enter the Google client ID and client secret. Keep the secret in the Supabase dashboard only; never put it in the app.
7. In **Authentication > URL Configuration**, add `rachmati://auth/callback` to the allowed redirect URLs. This is the app's production/development-build callback scheme.
8. For Expo Go, add the current Expo Go callback URL to the same allowed redirect URLs. It is generated at runtime and typically looks like `exp://<development-server-host>:<port>/--/auth/callback`; if the host or port changes, update the URL in Supabase. Google itself redirects to Supabase's callback from step 5, not directly to the app.
9. Copy `.env.example` to `.env`. Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` with the project's URL and **publishable key** (or legacy `anon` key). Set `EXPO_PUBLIC_ADMIN_EMAIL` to the exact owner email; it is only required for owner pattern-management tools.
10. Never put a Supabase `service_role` or secret key in `.env` or in the mobile app. The publishable/anon key is exposed in the app by design; the SQL row-level security policies enforce owner-only writes.
11. Restart Expo so it reads the environment values: stop the current server with Ctrl+C, then run `npx.cmd expo start --lan --clear`.
12. In the app, press and hold the Rachmati brand mark in the header to open owner sign-in. Sign in with the owner account and select both the `.DST` file and its design image before publishing. The owner UUID in SQL and `EXPO_PUBLIC_ADMIN_EMAIL` must match.

If the SQL script is rerun, first replace the UUID placeholder again. Google sign-in and customer accounts do not change the owner-only RLS policies.
