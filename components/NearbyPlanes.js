// app/components/NearbyPlanes.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';

// Function to calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
};

const NearbyPlanes = ({ userLocation }) => { // Receive userLocation as a prop
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nearbyPlanes, setNearbyPlanes] = useState([]);

    useEffect(() => {
        // Function to fetch nearby planes
        const fetchNearbyPlanes = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/planes'); // Replace with your actual API endpoint
                const data = await response.json();
                setPlanes(data); // Store all planes

                // Filter nearby planes based on user location
                const nearbyRadius = 10; // Define your nearby radius in kilometers
                const filteredNearbyPlanes = data.filter(plane => {
                    if (plane.latitude && plane.longitude && userLocation) {
                        const distance = calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            plane.latitude,
                            plane.longitude
                        );
                        return distance <= nearbyRadius; // Only include planes within the radius
                    }
                    return false; // Exclude planes without location data
                });
                setNearbyPlanes(filteredNearbyPlanes); // Store nearby planes
            } catch (error) {
                console.error('Error fetching planes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNearbyPlanes();
    }, [userLocation]); // Depend on userLocation to refetch when it changes

    // Render loading indicator
    if (loading) {
        return <ActivityIndicator size="large" color="#007BFF" />;
    }

    return (
        <View style={styles.container}>
            {/* Check if there is exactly one nearby plane */}
            {nearbyPlanes.length === 1 && (
                <View>
                    <Text style={styles.title}>Nearby Plane</Text>
                    <View style={styles.planeItem}>
                        <Text>Airline: {nearbyPlanes[0].airline}</Text>
                        <Text>Registration: {nearbyPlanes[0].registration}</Text>
                        <Text>Model: {nearbyPlanes[0].aircraft_model}</Text>
                        <Text>Location: {nearbyPlanes[0].location}</Text>
                        <Text>Image URL: {nearbyPlanes[0].image_url}</Text>
                    </View>
                </View>
            )}

            {/* Show all nearby planes regardless of the count */}
            <Text style={styles.title}>All Nearby Planes</Text>
            <FlatList
                data={planes}
                keyExtractor={(item) => item.registration} // Adjust based on your unique identifier
                renderItem={({ item }) => (
                    <View style={styles.planeItem}>
                        <Text>Airline: {item.airline}</Text>
                        <Text>Registration: {item.registration}</Text>
                        <Text>Model: {item.aircraft_model}</Text>
                        <Text>Location: {item.location}</Text>
                        <Text>Image URL: {item.image_url}</Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    planeItem: {
        marginBottom: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
});

export default NearbyPlanes; >export from NearbyPlanes to "/app.json"; 
retreive from > "/index.tsx"; export new clientInformation, then>if; 
