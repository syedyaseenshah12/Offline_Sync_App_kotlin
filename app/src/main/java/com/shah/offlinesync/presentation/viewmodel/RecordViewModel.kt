package com.shah.offlinesync.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shah.offlinesync.domain.model.Record
import com.shah.offlinesync.domain.usecase.CreateRecordUseCase
import com.shah.offlinesync.domain.usecase.GetRecordsUseCase
import com.shah.offlinesync.domain.usecase.SyncRecordsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RecordViewModel @Inject constructor(
    private val getRecordsUseCase: GetRecordsUseCase,
    private val createRecordUseCase: CreateRecordUseCase,
    private val syncRecordsUseCase: SyncRecordsUseCase
) : ViewModel() {

    // Now using the pure domain model 'Record' instead of 'RecordEntity'
    val records: StateFlow<List<Record>> = getRecordsUseCase()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun addRecord(title: String, body: String) {
        viewModelScope.launch {
            try {
                createRecordUseCase(title, body)
                syncRecordsUseCase()
            } catch (e: Exception) {
                // Production-grade error handling would use a UI event channel here
            }
        }
    }

    fun triggerSync() {
        syncRecordsUseCase()
    }
}
