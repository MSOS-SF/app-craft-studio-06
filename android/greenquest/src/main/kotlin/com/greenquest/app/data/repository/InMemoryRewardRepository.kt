package com.greenquest.app.data.repository

import com.greenquest.app.domain.model.Reward
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update

/** In-memory reward wallet to support local testing without a backend. */
class InMemoryRewardRepository : RewardRepository {
    private val wallet = MutableStateFlow<List<Reward>>(emptyList())

    override fun observeWallet(): Flow<List<Reward>> = wallet

    override suspend fun addReward(reward: Reward) {
        wallet.update { current -> current + reward }
    }

    override suspend fun redeemReward(rewardId: String): Boolean {
        var removed = false
        wallet.update { current ->
            val remaining = current.filterNot {
                val match = it.id == rewardId && !removed
                if (match) removed = true
                match
            }
            remaining
        }
        return removed
    }
}
