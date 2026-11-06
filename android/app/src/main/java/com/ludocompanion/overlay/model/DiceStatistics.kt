package com.ludocompanion.overlay.model

data class DiceStatistics(
    val totalRolls: Int = 0,
    val playerRolls: Int = 0,
    val opponentRolls: Int = 0,
    val counts: Map<Int, Int> = mapOf(1 to 0, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0),
    val lastRoll: DiceRoll? = null,
    val sixCount: Int = 0,
    val sixPercentage: Float = 0f
) {
    companion object {
        fun compute(rolls: List<DiceRoll>): DiceStatistics {
            if (rolls.isEmpty()) return DiceStatistics()

            val counts = mutableMapOf(1 to 0, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0)
            var pCount = 0
            var oCount = 0

            rolls.forEach { roll ->
                counts[roll.value] = (counts[roll.value] ?: 0) + 1
                if (roll.source == RollSource.PLAYER_SELECTED) pCount++ else oCount++
            }

            val total = rolls.size
            val sixes = counts[6] ?: 0
            val sixPercent = if (total > 0) (sixes.toFloat() / total) * 100f else 0f

            return DiceStatistics(
                totalRolls = total,
                playerRolls = pCount,
                opponentRolls = oCount,
                counts = counts,
                lastRoll = rolls.lastOrNull(),
                sixCount = sixes,
                sixPercentage = sixPercent
            )
        }
    }
}
