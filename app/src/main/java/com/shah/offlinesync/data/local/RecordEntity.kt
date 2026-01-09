package com.shah.offlinesync.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "records",
    indices = [
        Index(value = ["syncStatus"]),
        Index(value = ["createdAt"])
    ]
)
data class RecordEntity(
    @PrimaryKey
    val id: String, // Client-side UUID
    val title: String,
    val body: String,
    val createdAt: Long,
    val syncStatus: SyncStatus,
    val remoteId: Int? = null,
    val lastSyncAttempt: Long? = null,
    val syncError: String? = null
)

enum class SyncStatus {
    PENDING,
    SYNCING,
    SYNCED,
    FAILED
}
