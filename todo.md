# Project TODO

## Data Layer
- [x] Set up expo-sqlite database with schema
- [x] Create Record entity with sync status fields
- [x] Implement database initialization and migrations
- [x] Create repository for CRUD operations
- [x] Build API client with axios for REST endpoints
- [x] Implement DTO to Entity mappers
- [x] Create sync manager for orchestrating sync operations

## Domain Layer
- [x] Define domain models and types
- [x] Implement CreateRecord use case
- [x] Implement FetchRecords use case
- [x] Implement SyncRecords use case
- [x] Implement RetryFailedSync use case
- [x] Add business validation rules

## Presentation Layer
- [x] Update Home Screen to display records list
- [x] Add sync status indicators and badges
- [x] Implement pull-to-refresh functionality
- [x] Create floating action button for new record
- [x] Build Create Record screen with form
- [x] Build Record Detail screen
- [x] Add retry button for failed syncs
- [x] Implement ViewModels with React hooks
- [x] Add empty state for no records

## Background Sync
- [x] Set up expo-task-manager for background tasks
- [x] Configure expo-background-fetch
- [x] Implement network connectivity detection
- [x] Add exponential backoff retry logic
- [x] Handle sync on app foreground
- [x] Handle sync on network state change
- [x] Implement periodic background sync

## Error Handling
- [x] Create error logging system
- [x] Add structured error reporting
- [x] Handle network errors gracefully
- [x] Handle API errors (4xx, 5xx)
- [x] Handle database errors
- [x] Add user-facing error messages
- [x] Log all sync failures

## Testing
- [ ] Write unit tests for use cases
- [ ] Write tests for repository operations
- [ ] Write tests for sync manager
- [ ] Write integration tests for sync flow
- [ ] Test offline functionality
- [ ] Test crash recovery
- [ ] Test network interruption scenarios

## Documentation
- [x] Create comprehensive README
- [x] Document architecture decisions
- [x] Document sync strategy
- [x] Document error handling approach
- [x] Add code comments for complex logic

## Polish
- [x] Generate custom app logo
- [x] Update app branding in app.config.ts
- [x] Ensure proper SafeArea handling
- [x] Add loading states
- [x] Add haptic feedback for interactions
- [ ] Test on iOS and Android
