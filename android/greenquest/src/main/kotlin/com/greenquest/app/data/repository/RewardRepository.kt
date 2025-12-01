package com.greenquest.app.data.repository

import com.greenquest.app.domain.model.Reward
import kotlinx.coroutines.flow.Flow

interface RewardRepository {
    fun observeWallet(): Flow<List<Reward>>
    suspend fun addReward(reward: Reward)
    suspend fun redeemReward(rewardId: String): Boolean
}
