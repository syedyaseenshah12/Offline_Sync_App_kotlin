package com.shah.offlinesync.domain.usecase

import com.shah.offlinesync.data.mapper.toDomain
import com.shah.offlinesync.data.repository.RecordRepositoryImpl
import com.shah.offlinesync.domain.model.Record
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class GetRecordsUseCase @Inject constructor(
    private val repository: RecordRepositoryImpl
) {
    operator fun invoke(): Flow<List<Record>> = 
        repository.getAllRecords().map { entities -> entities.toDomain() }
}
