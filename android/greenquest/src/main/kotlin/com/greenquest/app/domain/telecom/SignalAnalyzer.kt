package com.greenquest.app.domain.telecom

import com.greenquest.app.domain.model.NetworkCondition
import com.greenquest.app.domain.model.NetworkType

object SignalAnalyzer {
    fun classifyRewardMultiplier(dbm: Int, networkType: NetworkType): Double = when {
        networkType == NetworkType.FIVE_G && dbm >= -95 -> 1.5
        dbm <= -110 -> 0.75
        else -> 1.0
    }

    fun matchesCondition(dbm: Int, networkType: NetworkType, condition: NetworkCondition?): Boolean {
        condition ?: return true
        val aboveMin = condition.minDbm?.let { dbm >= it } ?: true
        val belowMax = condition.maxDbm?.let { dbm <= it } ?: true
        val typeMatches = condition.requiredNetworkType?.let { it == networkType } ?: true
        return aboveMin && belowMax && typeMatches
    }
}
