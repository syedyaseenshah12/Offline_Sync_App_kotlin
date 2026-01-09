package com.shah.offlinesync.domain.usecase

import com.shah.offlinesync.data.repository.RecordRepositoryImpl
import javax.inject.Inject

class CreateRecordUseCase @Inject constructor(
    private val repository: RecordRepositoryImpl
) {
    suspend operator fun invoke(title: String, body: String) {
        if (title.isBlank()) throw IllegalArgumentException("Title cannot be empty")
        repository.createRecord(title, body)
    }
}
