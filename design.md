# Offline-First Sync App - Design Document

## Architecture Overview

This is a **production-ready offline-first mobile application** built with React Native and Expo. The app follows Clean Architecture principles with strict layer separation and implements reliable background synchronization with a REST API.

### Core Principles

1. **Offline-First**: All operations work without network connectivity
2. **Data Integrity**: No data loss, duplication, or corruption under any circumstances
3. **Reliability**: Survives app crashes, force-kills, device reboots, and network failures
4. **Clean Architecture**: Strict separation between Data, Domain, and Presentation layers
5. **Idempotent Sync**: Safe to retry operations without side effects

## Technology Stack

### Core Technologies
- **React Native 0.81** with **Expo SDK 54**
- **TypeScript 5.9** for type safety
- **NativeWind 4** (Tailwind CSS) for styling

### Data Layer
- **expo-sqlite** for local persistence (Room equivalent for React Native)
- **AsyncStorage** for simple key-value storage (sync metadata)
- **axios** for REST API calls (Retrofit equivalent)

### Background Processing
- **expo-task-manager** + **expo-background-fetch** for background sync (WorkManager equivalent)
- Exponential backoff for retry logic

### Error Tracking
- Built-in error logging system (Crashlytics equivalent)
- Structured error reporting to backend

## Architecture Layers

### 1. Data Layer (`/lib/data`)

**Responsibilities:**
- SQLite database management
- API communication
- DTO ↔️ Entity mapping
- Repository implementation
- Sync state management

**Components:**
- `database.ts` - SQLite initialization and schema
- `entities.ts` - Database entity definitions
- `api.ts` - REST API client
- `repository.ts` - Data access abstraction
- `sync-manager.ts` - Sync orchestration

**Database Schema:**
```typescript
Record {
  id: string (UUID)
  title: string
  body: string
  createdAt: number (timestamp)
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'
  remoteId: number | null
  lastSyncAttempt: number | null
  syncError: string | null
}
```

### 2. Domain Layer (`/lib/domain`)

**Responsibilities:**
- Business logic
- Use cases
- Domain models
- No framework dependencies

**Use Cases:**
- `CreateRecord` - Create new text record locally
- `FetchRecords` - Retrieve all records
- `SyncRecords` - Synchronize pending records with API
- `RetryFailedSync` - Retry failed sync operations

### 3. Presentation Layer (`/app`, `/components`)

**Responsibilities:**
- UI components
- ViewModels (React hooks)
- User interactions
- State management

**Screens:**
- Home Screen - List of all records
- Create Record Screen - Form to create new record
- Record Detail Screen - View single record details

## Screen Design

### Mobile Portrait Orientation (9:16)

All screens are designed for **one-handed usage** following **Apple Human Interface Guidelines**.

### Screen List

1. **Home Screen** (`app/(tabs)/index.tsx`)
   - **Primary Content**: FlatList of text records
   - **Functionality**: 
     - Display all records (synced and pending)
     - Visual indicator for sync status
     - Pull-to-refresh to trigger sync
     - Floating action button to create new record
   - **Layout**: 
     - Header with app title and sync status indicator
     - List of record cards showing title, preview, timestamp, and sync badge
     - Empty state when no records exist

2. **Create Record Screen** (`app/create.tsx`)
   - **Primary Content**: Form with text inputs
   - **Functionality**:
     - Title input (single line)
     - Body input (multiline)
     - Save button (creates record immediately)
     - Cancel button
   - **Layout**:
     - Full-screen modal
     - Title input at top
     - Body textarea below
     - Action buttons at bottom (within safe area)

3. **Record Detail Screen** (`app/record/[id].tsx`)
   - **Primary Content**: Full record display
   - **Functionality**:
     - Display full title and body
     - Show creation timestamp
     - Show sync status with details
     - Retry button for failed syncs
   - **Layout**:
     - Scrollable content
     - Sync status banner at top
     - Record content below

### Key User Flows

**Flow 1: Create Record (Offline)**
1. User taps FAB on Home Screen
2. Create Record Screen opens
3. User enters title and body
4. User taps Save
5. Record created with PENDING status
6. Navigate back to Home Screen
7. New record appears at top of list with pending badge

**Flow 2: View Record Details**
1. User taps record card on Home Screen
2. Record Detail Screen opens
3. User views full content and sync status

**Flow 3: Background Sync**
1. App detects network connectivity
2. Background task fetches pending records
3. Uploads each record to API
4. Updates sync status to SYNCED
5. UI automatically reflects changes

**Flow 4: Retry Failed Sync**
1. User opens failed record detail
2. User taps Retry button
3. Sync attempt initiated
4. Status updates based on result

### Color Choices

**Brand Colors** (Reliability & Trust theme):
- **Primary**: `#0a7ea4` (Teal) - Represents stability and trust
- **Success**: `#22C55E` (Green) - Synced status
- **Warning**: `#F59E0B` (Amber) - Pending status
- **Error**: `#EF4444` (Red) - Failed status

**UI Colors**:
- **Background**: White (light) / `#151718` (dark)
- **Surface**: `#f5f5f5` (light) / `#1e2022` (dark) - Card backgrounds
- **Foreground**: `#11181C` (light) / `#ECEDEE` (dark) - Primary text
- **Muted**: `#687076` (light) / `#9BA1A6` (dark) - Secondary text
- **Border**: `#E5E7EB` (light) / `#334155` (dark)

## Sync Strategy

### Sync Guarantees

1. **No Data Loss**: All records persisted locally before sync
2. **No Duplication**: Idempotent sync with UUID-based deduplication
3. **Crash Safety**: SQLite transactions ensure atomic writes
4. **Eventual Consistency**: All pending records eventually sync when network available

### Sync State Machine

```
PENDING → (sync attempt) → SYNCED (success)
                        → FAILED (error) → PENDING (retry)
```

### Background Execution

**Triggers:**
- Network connectivity change (offline → online)
- App foreground (if pending records exist)
- Periodic background fetch (every 15 minutes)
- Manual pull-to-refresh

**Constraints:**
- Requires network connectivity
- Exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
- Maximum 3 retry attempts per sync session
- Logs all failures for monitoring

### Idempotency Strategy

1. **Client-Generated UUIDs**: Each record has unique ID before sync
2. **Server Deduplication**: API checks for duplicate UUIDs (if supported)
3. **Sync Status Tracking**: Only PENDING records are synced
4. **Remote ID Storage**: Store API-returned ID to prevent re-upload

## Error Handling

### Error Categories

1. **Network Errors**: Timeout, no connection, DNS failure
2. **API Errors**: 4xx (client error), 5xx (server error)
3. **Database Errors**: Write failure, constraint violation
4. **Serialization Errors**: Invalid JSON, type mismatch

### Error Recovery

- **Network Errors**: Mark as PENDING, retry with backoff
- **API 4xx**: Mark as FAILED, log error, require manual intervention
- **API 5xx**: Mark as PENDING, retry with backoff
- **Database Errors**: Log to error tracking, show user alert
- **Serialization Errors**: Log to error tracking, mark as FAILED

### Error Logging

All errors logged with:
- Error type and message
- Stack trace
- User context (record ID, sync attempt count)
- Device context (OS, app version, network status)
- Timestamp

## Testing Strategy

### Unit Tests
- Use case logic
- Repository operations
- Sync manager state transitions
- Error handling paths

### Integration Tests
- Database operations with real SQLite
- API mocking with deterministic responses
- Sync flow with network simulation

### Reliability Tests
- App crash during sync
- Network interruption during upload
- Concurrent record creation
- Database corruption recovery

## Non-Functional Requirements

### Performance
- List rendering: < 16ms per frame (60 FPS)
- Record creation: < 100ms
- Database queries: < 50ms
- Sync operation: < 5s per record

### Reliability
- Zero data loss under all conditions
- 99.9% sync success rate (with network)
- Graceful degradation without network

### Maintainability
- TypeScript strict mode
- Comprehensive error logging
- Clear separation of concerns
- Documented architecture decisions

## Implementation Notes

### No User Authentication
- Per requirements, no user auth system needed
- All data stored locally
- No user-specific filtering on API

### No Cloud Storage
- Local SQLite only
- API sync for backup/redundancy
- No file uploads

### Minimal UI Polish
- Focus on functionality over aesthetics
- Standard iOS/Android patterns
- Clear status indicators
- Accessible and readable

## Success Criteria

✅ **Core Functionality**
- Create records offline
- View all records
- Records persist across restarts

✅ **Offline-First**
- All operations work without network
- No blocking on network calls
- Immediate UI feedback

✅ **Reliable Sync**
- Pending records sync when online
- Survives app crashes and kills
- Idempotent operations
- Proper error handling

✅ **Production Quality**
- Clean architecture
- Type safety
- Error logging
- Comprehensive testing
- Clear documentation
