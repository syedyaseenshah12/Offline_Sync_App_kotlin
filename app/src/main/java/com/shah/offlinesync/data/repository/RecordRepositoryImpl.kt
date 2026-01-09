package com.shah.offlinesync.data.repository

import com.shah.offlinesync.data.local.RecordDao
import com.shah.offlinesync.data.local.RecordEntity
import com.shah.offlinesync.data.local.SyncStatus
import com.shah.offlinesync.data.remote.ApiService
import com.shah.offlinesync.data.remote.PostRequestDTO
import kotlinx.coroutines.flow.Flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RecordRepositoryImpl @Inject constructor(
    private val recordDao: RecordDao,
    private val apiService: ApiService
) {
    fun getAllRecords(): Flow<List<RecordEntity>> = recordDao.getAllRecords()

    suspend fun getRecordById(id: String): RecordEntity? = recordDao.getRecordById(id)

    suspend fun createRecord(title: String, body: String): RecordEntity {
        val entity = RecordEntity(
            id = java.util.UUID.randomUUID().toString(),
            title = title,
            body = body,
            createdAt = System.currentTimeMillis(),
            syncStatus = SyncStatus.PENDING
        )
        recordDao.insertRecord(entity)
        return entity
    }

    suspend fun syncRecord(recordId: String): Result<Unit> {
        val record = recordDao.getRecordById(recordId) ?: return Result.failure(Exception("Record not found"))
        
        if (record.syncStatus == SyncStatus.SYNCED) return Result.success(Unit)

        return try {
            recordDao.updateSyncStatus(recordId, SyncStatus.SYNCING, System.currentTimeMillis())
            
            val response = apiService.createPost(
                PostRequestDTO(title = record.title, body = record.body)
            )

            recordDao.updateSyncStatus(
                id = recordId,
                status = SyncStatus.SYNCED,
                timestamp = System.currentTimeMillis(),
                remoteId = response.id
            )
            Result.success(Unit)
        } catch (e: Exception) {
            val isPermanent = when (e) {
                is HttpException -> e.code() in 400..499
                is IOException -> false // Network issues are never permanent
                else -> false
            }
            
            val nextStatus = if (isPermanent) SyncStatus.FAILED else SyncStatus.PENDING
            
            recordDao.updateSyncStatus(
                id = recordId,
                status = nextStatus,
                timestamp = System.currentTimeMillis(),
                error = e.message
            )
            Result.failure(e)
        }
    }

    suspend fun getPendingRecords() = recordDao.getRecordsByStatus(SyncStatus.PENDING)
    
    suspend fun getSyncStats(): Map<String, Int> {
        return mapOf(
            "synced" to recordDao.getCountByStatus(SyncStatus.SYNCED),
            "pending" to recordDao.getCountByStatus(SyncStatus.PENDING),
            "failed" to recordDao.getCountByStatus(SyncStatus.FAILED)
        )
    }
}
