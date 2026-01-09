# Offline-First Native Android Sync System

A production-grade, mission-critical offline-first Android application built with Kotlin and Jetpack. This system is designed for 100% data integrity, idempotent synchronization, and resilience against process death, network flapping, and device reboots.

## Architectural Decision Records (ADR)

### 1. Offline-First Strategy
- **Client-Side ID Generation**: Uses UUID v4 for all records at creation time. This allows the system to be fully functional offline and ensures sync operations are **idempotent**.
- **State Machine Persistence**: Records transition through `PENDING` -> `SYNCING` -> `SYNCED` or `FAILED`. This state is persisted in Room to survive app kills.
- **Immediate Consistency (Local)**: UI reacts to Room Flow/LiveData. The user never waits for a network response.

### 2. Technology Stack
- **Kotlin**: Primary language for type safety and Coroutines.
- **Room**: Local persistence with transaction safety and schema migration support.
- **Retrofit + OkHttp**: Network layer with interceptors for logging and error categorization.
- **WorkManager**: Guaranteed background execution for sync tasks.
- **Hilt (Dagger)**: Dependency Injection for modularity and testability.
- **Firebase Crashlytics**: Real-time production monitoring of sync failures.

### 3. Clean Architecture Layers
- **Data Layer**: Room DAOs, Retrofit Services, and Repository implementation. Handles data mapping and sync state orchestration.
- **Domain Layer**: Pure Kotlin Use Cases. Contains business rules (e.g., "Record title must not be empty").
- **Presentation Layer**: ViewModels and UI. Uses reactive streams to observe database changes.

## Sync Guarantees

- **Resilience**: Sync tasks are persisted in the WorkManager database, meaning they will resume even after a device reboot or OS-initiated process death.
- **Idempotency**: The API uses the client-side UUID as an idempotency key (simulated here via POST /posts), preventing duplicate data if a network request is retried after a partial success.
- **Exponential Backoff**: WorkManager is configured with `BackoffPolicy.EXPONENTIAL` to prevent API hammering during outages.
- **Network Awareness**: Sync only triggers when `Constraints.NetworkType == CONNECTED`.

## Project Structure

```
com.shah.offlinesync/
├── data/
│   ├── local/          # Room DB, Entities, DAOs
│   ├── remote/         # Retrofit API, DTOs
│   └── repository/     # Repository Implementation
├── domain/
│   ├── model/          # Domain Entities
│   └── usecase/        # CreateRecord, GetRecords, SyncRecords
├── presentation/
│   ├── viewmodel/      # ViewModel with StateFlow
│   └── ui/             # Activities/Fragments
├── sync/               # WorkManager SyncWorker
└── di/                 # Hilt Modules
```

## Error Handling Matrix

| Scenario | Logic | Recovery |
| :--- | :--- | :--- |
| Network Timeout | Retry via WorkManager | Exponential Backoff |
| 5xx Server Error | Retry via WorkManager | Automatic |
| 4xx Client Error | Mark as FAILED | Manual Intervention Required |
| App Force-Kill | Room persists state | WorkManager resumes task |
| Database I/O Error| Log to Crashlytics | Fail-fast to protect data |
