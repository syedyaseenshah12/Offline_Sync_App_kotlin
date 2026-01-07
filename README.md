# Offline-First Sync App

A production-ready offline-first mobile application built with React Native and Expo. This app demonstrates enterprise-grade architecture for creating and synchronizing text records with a remote REST API, guaranteeing data integrity under all conditions.

## Overview

This application implements a robust offline-first architecture that allows users to create and view text records without requiring internet connectivity. All data is persisted locally using SQLite, and automatically synchronized with a remote API when network connectivity is available.

### Key Features

- **Fully Offline-First**: All operations work without network connectivity
- **Reliable Background Sync**: Automatic synchronization with exponential backoff retry logic
- **Data Integrity Guarantees**: No data loss, duplication, or corruption under any circumstances
- **Crash-Safe**: Survives app crashes, force-kills, device reboots, and network failures
- **Clean Architecture**: Strict separation between Data, Domain, and Presentation layers
- **Production-Ready**: Comprehensive error handling, logging, and monitoring

## Architecture

### Clean Architecture Layers

The application follows Clean Architecture principles with three distinct layers:

#### 1. Data Layer (`/lib/data`)

Responsible for data persistence and API communication:

- **Database** (`database.ts`): SQLite initialization, schema management, and low-level operations
- **API Client** (`api.ts`): REST API communication with structured error handling
- **Repository** (`repository.ts`): High-level data access abstraction
- **Mappers** (`mappers.ts`): DTO ↔️ Entity conversions
- **Types** (`types.ts`): Data structure definitions

**Database Schema:**

```sql
CREATE TABLE records (
  id TEXT PRIMARY KEY,           -- UUID generated locally
  title TEXT NOT NULL,           -- Record title (max 200 chars)
  body TEXT NOT NULL,            -- Record body (max 5000 chars)
  createdAt INTEGER NOT NULL,    -- Unix timestamp
  syncStatus TEXT NOT NULL,      -- 'PENDING' | 'SYNCED' | 'FAILED'
  remoteId INTEGER,              -- API-assigned ID after sync
  lastSyncAttempt INTEGER,       -- Unix timestamp of last sync
  syncError TEXT                 -- Error message if sync failed
);
```

#### 2. Domain Layer (`/lib/domain`)

Contains business logic and use cases:

- **Use Cases** (`use-cases.ts`): Business operations (CreateRecord, FetchRecords, SyncRecords, RetryFailedSyncs)
- **Validation**: Input validation and business rules
- **No Framework Dependencies**: Pure business logic

#### 3. Presentation Layer (`/app`, `/components`)

User interface and interaction:

- **Home Screen**: List of all records with sync status indicators
- **Create Record Screen**: Form to create new text records
- **Record Detail Screen**: Full record view with retry functionality
- **Custom Hooks**: React hooks for state management (`use-records.ts`)

### Background Sync Strategy

The application implements a sophisticated background synchronization system:

#### Sync Triggers

1. **Network State Change**: Automatically syncs when device comes online
2. **App Foreground**: Checks for pending records when app becomes active
3. **Periodic Background Fetch**: Runs every 15 minutes (iOS minimum)
4. **Manual Pull-to-Refresh**: User-initiated sync

#### Sync Guarantees

- **Idempotent Operations**: Safe to retry without side effects
- **Client-Generated UUIDs**: Prevents duplicate records
- **Atomic Transactions**: Database writes are crash-safe
- **Exponential Backoff**: Intelligent retry with increasing delays (1s, 2s, 4s, 8s, 16s, 30s max)
- **Status Tracking**: Explicit sync state (PENDING, SYNCED, FAILED)

#### Error Handling

The sync system handles various error scenarios:

- **Network Errors**: Marked as PENDING, retried automatically
- **Server Errors (5xx)**: Marked as PENDING, retried with backoff
- **Client Errors (4xx)**: Marked as FAILED, requires manual intervention
- **Database Errors**: Logged and reported to error tracking

### Technology Stack

**Core Framework:**
- React Native 0.81
- Expo SDK 54
- TypeScript 5.9

**Data Persistence:**
- expo-sqlite (local database)
- AsyncStorage (key-value storage)

**Networking:**
- axios (HTTP client)
- @react-native-community/netinfo (connectivity detection)

**Background Processing:**
- expo-task-manager (background tasks)
- expo-background-fetch (periodic sync)

**UI:**
- NativeWind 4 (Tailwind CSS for React Native)
- expo-haptics (tactile feedback)

## API Integration

The app integrates with the JSONPlaceholder REST API:

**Base URL:** `https://jsonplaceholder.typicode.com`

**Endpoints:**
- `GET /posts` - Fetch all posts
- `POST /posts` - Create new post

**Request Format:**
```json
{
  "title": "Record title",
  "body": "Record body text",
  "userId": 1
}
```

**Response Format:**
```json
{
  "id": 101,
  "title": "Record title",
  "body": "Record body text",
  "userId": 1
}
```

## Project Structure

```
offline-sync-app/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   └── index.tsx            # Home screen (records list)
│   ├── create.tsx               # Create record screen
│   ├── record/
│   │   └── [id].tsx             # Record detail screen
│   └── _layout.tsx              # Root layout with providers
├── lib/
│   ├── data/                    # Data layer
│   │   ├── database.ts          # SQLite operations
│   │   ├── api.ts               # REST API client
│   │   ├── repository.ts        # Data access abstraction
│   │   ├── mappers.ts           # DTO/Entity conversions
│   │   └── types.ts             # Type definitions
│   ├── domain/                  # Domain layer
│   │   └── use-cases.ts         # Business logic
│   ├── sync/                    # Background sync
│   │   └── background-sync.ts   # Sync orchestration
│   ├── database-provider.tsx    # Database initialization
│   ├── sync-provider.tsx        # Sync lifecycle management
│   └── error-logger.ts          # Error logging system
├── hooks/
│   └── use-records.ts           # Records state management
├── components/
│   └── screen-container.tsx     # SafeArea wrapper
├── assets/
│   └── images/
│       └── icon.png             # App icon
└── design.md                    # Architecture documentation
```

## User Flows

### Creating a Record (Offline)

1. User taps the floating action button (+) on Home Screen
2. Create Record Screen opens
3. User enters title and body text
4. User taps Save button
5. Record is immediately saved to local SQLite database with PENDING status
6. User is returned to Home Screen
7. New record appears at the top of the list with "Pending" badge

### Viewing Record Details

1. User taps a record card on Home Screen
2. Record Detail Screen opens
3. User sees full title, body, creation timestamp, and sync status
4. If sync failed, user can tap "Retry Sync" button

### Background Synchronization

1. App detects network connectivity (online)
2. Background sync task fetches all PENDING records from database
3. For each record:
   - Convert to API DTO format
   - Send POST request to API
   - On success: Update record with SYNCED status and remote ID
   - On retryable error: Keep as PENDING, schedule retry with backoff
   - On permanent error: Mark as FAILED with error message
4. UI automatically updates to reflect new sync statuses

## Reliability Features

### Offline-First Guarantees

- **No Blocking**: All user operations complete immediately without waiting for network
- **Local Persistence**: Every record is saved to SQLite before any network call
- **Immediate Feedback**: UI updates instantly, sync happens in background

### Crash Safety

- **Atomic Writes**: SQLite transactions ensure all-or-nothing database updates
- **Idempotent Sync**: Safe to retry sync operations without creating duplicates
- **State Recovery**: App resumes from last known state after crash

### Network Resilience

- **Automatic Retry**: Failed syncs are retried automatically with exponential backoff
- **Network Detection**: Monitors connectivity and triggers sync when online
- **Timeout Handling**: 10-second timeout prevents indefinite hangs

### Data Integrity

- **UUID-Based IDs**: Client-generated UUIDs prevent ID collisions
- **Sync Status Tracking**: Explicit state machine (PENDING → SYNCED/FAILED)
- **Remote ID Storage**: Prevents duplicate uploads of already-synced records

## Error Handling

### Error Categories

The app handles errors in structured categories:

1. **Network Errors**: Connection timeout, DNS failure, no internet
2. **API Errors**: HTTP 4xx (client error), 5xx (server error)
3. **Database Errors**: Write failure, constraint violation
4. **Validation Errors**: Invalid input, business rule violation

### Error Recovery Strategies

| Error Type | Status | Retry Strategy |
|------------|--------|----------------|
| Network timeout | PENDING | Automatic retry with backoff |
| Server error (5xx) | PENDING | Automatic retry with backoff |
| Client error (4xx) | FAILED | Manual retry required |
| Database error | N/A | Logged, user notified |

### Error Logging

All errors are logged with:
- Timestamp
- Error category
- Error message and stack trace
- Context (record ID, sync attempt count)
- Device information

Logs are stored locally in AsyncStorage and can be exported for debugging.

## Development

### Prerequisites

- Node.js 18+
- pnpm package manager
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd offline-sync-app
pnpm install
```

### Running the App

```bash
# Start development server
pnpm dev

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Generate QR code for Expo Go
pnpm qr
```

### Testing

The app can be tested in various scenarios:

**Offline Mode:**
1. Enable Airplane Mode on device
2. Create records - they should save with PENDING status
3. Disable Airplane Mode
4. Records should automatically sync

**App Crash:**
1. Create a record
2. Force-kill the app immediately
3. Reopen the app
4. Record should still exist with PENDING status

**Network Interruption:**
1. Start creating a record
2. Disable network mid-sync
3. Record should remain PENDING
4. Re-enable network - sync should resume

## Production Considerations

### Monitoring

In a production environment, integrate with:
- **Crashlytics**: Real-time crash reporting
- **Analytics**: User behavior and sync success rates
- **APM**: Performance monitoring for database and API calls

### Scalability

The current implementation handles:
- Thousands of local records (SQLite is efficient)
- Concurrent sync operations (sequential with 100ms delay)
- Large text content (up to 5000 characters per record)

For larger scale:
- Implement pagination for record list
- Add batch sync API endpoint
- Compress large text bodies

### Security

Current implementation:
- No authentication (as per requirements)
- HTTPS for API calls
- Local data not encrypted

For production:
- Add user authentication
- Encrypt sensitive data in SQLite
- Implement API key management

## Known Limitations

1. **No User Authentication**: All data is local-only, no user accounts
2. **No Cloud Backup**: Data only exists on device and API
3. **No Conflict Resolution**: Last-write-wins for duplicate syncs
4. **No Offline Edits**: Records are immutable after creation
5. **No File Attachments**: Text-only records

## Design Decisions

### Why SQLite?

SQLite provides:
- ACID transactions for crash safety
- Efficient indexing for fast queries
- Built-in support in React Native via expo-sqlite
- No external dependencies

### Why Exponential Backoff?

Exponential backoff prevents:
- Overwhelming the API with rapid retries
- Battery drain from constant network requests
- Network congestion during outages

### Why Client-Generated UUIDs?

UUIDs enable:
- Offline record creation without server coordination
- Idempotent sync operations
- Collision-free distributed systems

### Why Clean Architecture?

Clean Architecture provides:
- Testability (pure business logic)
- Maintainability (clear separation of concerns)
- Flexibility (easy to swap data sources)
- Scalability (independent layer evolution)

## Troubleshooting

### Records Not Syncing

1. Check network connectivity indicator in app
2. Verify API is accessible: `curl https://jsonplaceholder.typicode.com/posts`
3. Check error logs in Record Detail screen
4. Try manual pull-to-refresh

### App Crashes on Startup

1. Clear app data: Settings → Apps → Offline Sync → Clear Data
2. Reinstall the app
3. Check error logs in console

### Sync Status Stuck on Pending

1. Check if device has internet connectivity
2. Force-close and reopen app to trigger foreground sync
3. Check if API is returning errors (view error logs)

## License

This is a demonstration project for educational purposes.

## Credits

Built with:
- React Native & Expo
- JSONPlaceholder API (test data)
- NativeWind (Tailwind CSS)
