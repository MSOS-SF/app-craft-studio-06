# GreenQuest

GreenQuest is an Android-first AR mission app that blends environmental tasks with telecom-aware gameplay. The Kotlin scaffolding in this repo follows MVVM with Clean Architecture and includes in-memory repositories so you can exercise the mission engine, telecom signal logic, and reward flows without wiring a backend yet.

## Documentation

- [GreenQuest Developer Guide](docs/GreenQuest-Developer-Guide.md) – full architecture, feature breakdowns, schema, testing, and setup notes.
- Kotlin MVVM scaffolding lives under [`android/greenquest/src/main/kotlin/com/greenquest/app`](android/greenquest/src/main/kotlin/com/greenquest/app).

## Repository layout

- `android/greenquest/` – Kotlin domain, data, and device-layer scaffolding for GreenQuest (mission engine, generators, telecom analyzers, in-memory repositories, and ViewModels).
- `docs/` – developer documentation, including the GreenQuest guide.
- `src/`, `public/`, `index.html` – Vite/React front-end resources you can adapt for companion tooling or prototypes.

## Getting started (Android Kotlin scaffold)

1. Open `android/greenquest` in Android Studio (Flamingo or newer).
2. Sync Gradle and ensure camera, location, and phone/network state permissions are enabled on your device/emulator.
3. Run or debug domain flows using the in-memory repositories; extend with Room/remote data when ready.

## Getting started (web tools)

If you want to work on the Vite/React assets (for dashboards or ops tooling):

```sh
npm install
npm run dev
```

## Deployment

For Android, create signed `release` builds when integrating with telecom partner APIs. For any web companions, build with `npm run build` and host the `dist/` output on your preferred platform.
