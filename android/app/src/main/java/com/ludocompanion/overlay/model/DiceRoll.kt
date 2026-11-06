package com.ludocompanion.overlay.model

enum class RollSource {
    PLAYER_SELECTED,
    OPPONENT_RANDOM
}

data class DiceRoll(
    val id: Long = System.currentTimeMillis(),
    val value: Int,
    val source: RollSource,
    val timestamp: Long = System.currentTimeMillis()
) {
    val formattedTime: String
        get() {
            val sdf = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
            return sdf.format(java.util.Date(timestamp))
        }
}
