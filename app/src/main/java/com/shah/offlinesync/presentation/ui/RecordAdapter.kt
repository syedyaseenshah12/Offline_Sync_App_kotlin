package com.shah.offlinesync.presentation.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.shah.offlinesync.data.local.SyncStatus
import com.shah.offlinesync.databinding.ItemRecordBinding
import com.shah.offlinesync.domain.model.Record
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class RecordAdapter : ListAdapter<Record, RecordAdapter.RecordViewHolder>(RecordDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecordViewHolder {
        val binding = ItemRecordBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return RecordViewHolder(binding)
    }

    override fun onBindViewHolder(holder: RecordViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class RecordViewHolder(private val binding: ItemRecordBinding) : RecyclerView.ViewHolder(binding.root) {
        private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

        fun bind(record: Record) {
            binding.tvTitle.text = record.title
            binding.tvBody.text = record.body
            binding.tvTimestamp.text = dateFormat.format(Date(record.createdAt))
            
            binding.chipStatus.text = record.syncStatus.name
            
            when (record.syncStatus) {
                SyncStatus.SYNCED -> {
                    binding.chipStatus.setChipBackgroundColorResource(android.R.color.holo_green_light)
                }
                SyncStatus.PENDING -> {
                    binding.chipStatus.setChipBackgroundColorResource(android.R.color.holo_orange_light)
                }
                SyncStatus.SYNCING -> {
                    binding.chipStatus.setChipBackgroundColorResource(android.R.color.holo_blue_light)
                }
                SyncStatus.FAILED -> {
                    binding.chipStatus.setChipBackgroundColorResource(android.R.color.holo_red_light)
                }
            }
        }
    }

    class RecordDiffCallback : DiffUtil.ItemCallback<Record>() {
        override fun areItemsTheSame(oldItem: Record, newItem: Record): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Record, newItem: Record): Boolean {
            return oldItem == newItem
        }
    }
}
