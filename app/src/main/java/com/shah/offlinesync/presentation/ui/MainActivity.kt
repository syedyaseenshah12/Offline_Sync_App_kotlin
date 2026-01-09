package com.shah.offlinesync.presentation.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.widget.EditText
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.shah.offlinesync.R
import com.shah.offlinesync.databinding.ActivityMainBinding
import com.shah.offlinesync.presentation.viewmodel.RecordViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: RecordViewModel by viewModels()
    private val adapter = RecordAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
    }

    private fun setupUI() {
        binding.recyclerView.adapter = adapter
        
        binding.fabAdd.setOnClickListener {
            showAddRecordDialog()
        }

        binding.toolbar.setOnMenuItemClickListener {
            if (it.itemId == R.id.action_sync) {
                viewModel.triggerSync()
                true
            } else false
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.records.collect { records ->
                    adapter.submitList(records)
                }
            }
        }
    }

    private fun showAddRecordDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_record, null)
        val etTitle = dialogView.findViewById<EditText>(R.id.etTitle)
        val etBody = dialogView.findViewById<EditText>(R.id.etBody)

        AlertDialog.Builder(this)
            .setTitle("New Record")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val title = etTitle.text.toString()
                val body = etBody.text.toString()
                if (title.isNotBlank() && body.isNotBlank()) {
                    viewModel.addRecord(title, body)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
