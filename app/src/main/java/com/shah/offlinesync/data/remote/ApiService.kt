package com.shah.offlinesync.data.remote

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
    @GET("posts")
    suspend fun getAllPosts(): List<PostResponseDTO>

    @GET("posts/{id}")
    suspend fun getPostById(@Path("id") id: Int): PostResponseDTO

    @POST("posts")
    suspend fun createPost(@Body post: PostRequestDTO): PostResponseDTO
}
