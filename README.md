# Rachmati

Rachmati is an Expo / React Native app for browsing and downloading embroidery `.DST` designs. The same app runs on Android, iOS, and the web.

## Run locally

Requirements: Node.js and npm.

```sh
npm ci
```

Copy `.env.example` to `.env` and set:

- `EXPO_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_KEY` — your Supabase publishable key (or legacy anon key)
- `EXPO_PUBLIC_ADMIN_EMAIL` — the owner account email used for pattern management

Then start the app:

```sh
npm run web
```

## Build for web hosting

```sh
npx expo export --platform web
```

The static website is generated in `dist`. For Vercel or Netlify, use `npx expo export --platform web` as the build command and `dist` as the output directory. Set the three `EXPO_PUBLIC_` variables in the hosting provider before building. These values are included in the public client bundle; never use a Supabase service-role or secret key.

After deployment, set the production URL as the Supabase Auth Site URL and add it to the allowed redirect URLs. Configure the Google provider's authorized redirect URI to the Supabase Auth callback URL. See [Supabase setup and authentication](./supabase/README.md) for the full instructions.

## Owner tools and data access

Press and hold the Rachmati logo in the app to open owner sign-in. Supabase row-level security restricts catalog changes to the owner account. Published catalog files are in a public Storage bucket, so anyone with their file URLs can download them.
