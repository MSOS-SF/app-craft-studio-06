package com.greenquest.app.device.location

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

data class LocationSample(val latitude: Double, val longitude: Double)

class LocationProvider {
    private val locationFlow = MutableStateFlow(LocationSample(0.0, 0.0))

    fun observeLocation(): Flow<LocationSample> = locationFlow

    fun updateLocation(latitude: Double, longitude: Double) {
        locationFlow.value = LocationSample(latitude, longitude)
    }
}
