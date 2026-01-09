package com.shah.offlinesync.domain.model

import com.shah.offlinesync.data.local.SyncStatus

/**
 * Pure Domain Model - Independent of Frameworks
 */
data class Record(
    val id: String,
    val title: String,
    val body: String,
    val createdAt: Long,
    val syncStatus: SyncStatus,
    val remoteId: Int? = null,
    val syncError: String? = null
)
