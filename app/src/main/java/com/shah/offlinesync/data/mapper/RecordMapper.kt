package com.shah.offlinesync.data.mapper

import com.shah.offlinesync.data.local.RecordEntity
import com.shah.offlinesync.domain.model.Record

/**
 * Mapper to convert between Data Layer entities and Domain Layer models.
 */
fun RecordEntity.toDomain(): Record {
    return Record(
        id = id,
        title = title,
        body = body,
        createdAt = createdAt,
        syncStatus = syncStatus,
        remoteId = remoteId,
        syncError = syncError
    )
}

fun List<RecordEntity>.toDomain(): List<Record> = map { it.toDomain() }
