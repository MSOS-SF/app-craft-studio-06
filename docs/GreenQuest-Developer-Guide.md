# GreenQuest Developer Guide (v1.0)

## Project Overview
GreenQuest is an Android application that blends augmented reality, environmental missions, and telecom network data. Users scan their surroundings with the camera to discover missions, complete eco-tasks, and earn telecom rewards such as data, minutes, or coupons. Mission difficulty dynamically adapts to GPS location, network signal strength (dBm), network type (3G/4G/5G), cell tower ID, and connectivity state. Anonymous network-quality data is crowdsourced to help operators improve coverage.

## Architecture
The app follows MVVM with clean architecture boundaries across presentation, domain, data, and device layers.

- **Presentation**: Activities/fragments for camera, map, missions, rewards; ViewModels; UI state via LiveData/StateFlow.
- **Domain**: Use cases, mission generation logic, telecom rules, reward management.
- **Data**: Repositories backed by Room (local) and API (remote).
- **Device**: CameraX/ARCore, GPS (FusedLocationProviderClient), TelephonyManager, Connectivity callbacks, Wi-Fi Direct/Bluetooth mesh.

### Package Structure (`com.greenquest.app`)
- `ui/` camera, mission, rewards, team, dashboard, components
- `viewmodel/`
- `domain/` usecase, model, mission, telecom, rewards
- `data/` repository, local, remote
- `device/` location, camera, telecom, connectivity
- `util/`

> Kotlin scaffolding in `android/greenquest/src/main/kotlin/com/greenquest/app` includes in-memory repositories for missions, rewards, and telemetry so you can exercise the domain layer (mission engine, generators, signal analyzer, ViewModels) without wiring a backend or Room yet.

## Feature Breakdown

### AR Camera Layer
- Renders live camera background and overlays (2D/3D) for mission markers.
- Detects mission proximity and updates mission UI in real time.
- Key classes: `CameraActivity`, `CameraViewModel`, `AROverlayRenderer`.

### Mission System
Mission types include cleanup, dump reports, pollution capture, hotspot scans, 5G boost missions, and weak-signal missions. Missions carry metadata like ID, title, description, coordinates, radius, required actions, reward, network conditions, and optional time limits. Core classes: `Mission`, `MissionGenerator`, `MissionRepository`, `MissionEngine`.

### Telecom Integration
Anonymous telemetry collected: `networkType`, `signalStrength` (dBm), `cellTowerId`, `handoverEvents`, `lat/lng`. Gameplay effects respond to conditions like strong 5G (bonus missions), weak signal (cover dead zones), cell tower ID (team assignment), and congestion (crowd reports). Core classes: `TelecomManagerService`, `SignalAnalyzer`, `TowerZoneMapper`.

### Rewards System
Rewards include mobile data, minutes, SMS, coupons, and XP. Features cover reward inventory, redemption, mission-to-reward linking, and optional telecom partner integration. Core classes: `Reward`, `RewardManager`, `RewardRepository`.

### Offline & P2P Sync
Wi-Fi Direct and Bluetooth mesh support syncing mission progress with nearby devices, storing offline actions, and auto-uploading when online. Core classes: `OfflineSyncService`, `MeshNetworkService`, `PendingActionQueue`.

## Database Schema (Room)
- **Mission**: `missionId` (PK), `title`, `description`, `latitude`, `longitude`, `radius`, `requiredActions`, `rewardId` (FK), `isCompleted`, `timestampCreated`, `timestampExpires`.
- **Reward**: `rewardId` (PK), `dataMb`, `minutes`, `sms`, `couponText`, `xp`.
- **Telemetry**: `telemetryId` (PK), `signalDbm`, `networkType`, `cellTowerId`, `lat`, `lng`, `timestamp`.

## State Management
MVVM flow: UI observes LiveData/StateFlow; ViewModels coordinate use cases; domain layer contains mission and telecom rules; repositories fetch/store data; device layer handles hardware interactions.

**Mission detection flow**: Camera movement → location updates → MissionEngine checks proximity → UI updates showing mission → user completes mission → RewardManager grants reward → Room DB stores completion → optional backend upload.

## Testing Strategy
- **Unit**: mission generation, reward calculation, telecom signal classification, offline queue behavior.
- **Integration**: camera plus overlay binding, GPS-driven mission spawning, telecom API effects on missions.
- **Device**: battery usage, network switching, camera performance, location accuracy.

## Backend API (Optional)
Example endpoints: `POST /telemetry`, `GET /missions`, `POST /mission/complete`, `GET /rewards`, `POST /rewards/redeem`, `GET /tower/leaderboard`.

## UI/UX Guidelines
Style cues: dark mode, neon green/teal accents, rounded cards, minimalist AR overlays, smooth transitions. Key screens: camera AR view, mission list, rewards wallet, profile/stats, team leaderboard, optional map view.

## Developer Setup
Install Android Studio Flamingo or newer. Clone the project, open it in Android Studio, and ensure camera, location, and phone/network state permissions are enabled. Test on physical hardware, allow ARCore installation prompts, and accept Google Play Services updates.

## Build & Deployment
Build variants: `debug` (local) and `release` (signed for telecom integration). Use Android App Bundles (`.aab`) for Play Store.

## Roadmap Highlights
- **v1.1**: Team leaderboard, mission rarity, additional telecom conditions.
- **v1.2**: Offline mesh networking improvements, real-time AR objects, power-saving mode.
- **v2.0**: Telecom operator backend, seasonal competitions, 3D AR mascots, full eco-event system.

