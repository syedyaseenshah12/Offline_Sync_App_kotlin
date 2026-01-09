package com.shah.offlinesync.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface RecordDao {
    @Query("SELECT * FROM records ORDER BY createdAt DESC")
    fun getAllRecords(): Flow<List<RecordEntity>>

    @Query("SELECT * FROM records WHERE id = :id")
    suspend fun getRecordById(id: String): RecordEntity?

    @Query("SELECT * FROM records WHERE syncStatus = :status")
    suspend fun getRecordsByStatus(status: SyncStatus): List<RecordEntity>

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertRecord(record: RecordEntity)

    @Update
    suspend fun updateRecord(record: RecordEntity)

    @Query("UPDATE records SET syncStatus = :status, remoteId = :remoteId, lastSyncAttempt = :timestamp, syncError = :error WHERE id = :id")
    suspend fun updateSyncStatus(
        id: String,
        status: SyncStatus,
        timestamp: Long,
        remoteId: Int? = null,
        error: String? = null
    )

    @Query("SELECT COUNT(*) FROM records WHERE syncStatus = :status")
    suspend fun getCountByStatus(status: SyncStatus): Int
}
