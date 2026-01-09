package com.shah.offlinesync.data.remote

data class PostRequestDTO(
    val title: String,
    val body: String,
    val userId: Int = 1
)

data class PostResponseDTO(
    val id: Int,
    val title: String,
    val body: String,
    val userId: Int
)
