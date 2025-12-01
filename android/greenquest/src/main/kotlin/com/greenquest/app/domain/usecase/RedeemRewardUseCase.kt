package com.greenquest.app.domain.usecase

import com.greenquest.app.data.repository.RewardRepository

class RedeemRewardUseCase(private val rewardRepository: RewardRepository) {
    suspend operator fun invoke(rewardId: String) = rewardRepository.redeemReward(rewardId)
}
