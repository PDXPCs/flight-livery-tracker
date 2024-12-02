import React, { useEffect, useState } from 'react';
import { Text, View, Button, StyleSheet, ActivityIndicator, Image, SafeAreaView, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import NearbyPlanes from 'components/NearbyPlanes'; // Import NearbyPlanes component

// Define the Flight type
interface Flight {
    icao24: string;
    flightNumber: string | null;
    imageUrl: string | null;
}

export default function TabOneScreen() {
    const [data, setData] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    // Fetch image by ICAO24 code
    const getPlaneImageByIcao24 = async (icao24: string): Promise<string | null> => {
        try {
            console.log(`Fetching image for ICAO24 code: ${icao24}`);
            const response = await fetch(`https://api.planespotters.net/pub/photos/hex/${icao24}`);

            if (response.status === 429) {
                console.log('Rate limit hit, retrying after 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return getPlaneImageByIcao24(icao24); // Retry the request
            }

            const data = await response.json();
            console.log(`API Response for ICAO24 ${icao24}:`, data);

            if (data.photos && data.photos.length > 0) {
                const imageUrl = data.photos[0].thumbnail_large.src; 
                console.log(`Fetched Image URL for ICAO24 ${icao24}:`, imageUrl);
                return imageUrl;
            } else {
                console.log(`No images found for ICAO24 ${icao24}`);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching plane image for ICAO24 ${icao24}:`, error);
            return null;
        }
    };

    // Fetch flights nearby based on the user's location
    const fetchData = async () => {
        if (!userLocation) return;
        setLoading(true);
        try {
            const response = await fetch(`https://opensky-network.org/api/states/all?lamin=${userLocation.latitude - 0.5}&lamax=${userLocation.latitude + 0.5}&lomin=${userLocation.longitude - 0.5}&lomax=${userLocation.longitude + 0.5}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const json = await response.json();

            if (json.states) {
                const flightsWithImages = [];
                for (const flight of json.states) {
                    const icao24 = flight[0]; 
                    const flightNumber = flight[1] || 'N/A'; 
                    const imageUrl = await getPlaneImageByIcao24(icao24); 
                    flightsWithImages.push({ icao24, flightNumber, imageUrl });

                    console.log(`Flight Data: ICAO24: ${icao24}, Flight Number: ${flightNumber}, Image URL: ${imageUrl}`);
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                setData(flightsWithImages);
            } else {
                setData([]);
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error(err);
                setError(err.message);
            } else {
                console.error('An unknown error occurred:', err);
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    // Get user's location
    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;
                setUserLocation({ latitude, longitude });
            } else {
                setError('Location permission denied');
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error(err);
                setError(err.message);
            } else {
                console.error('An unknown error occurred:', err);
                setError('An unknown error occurred');
            }
        }
    };

    // Run when the component mounts to get user location
    useEffect(() => {
        getUserLocation();
    }, []);

    // Run when userLocation is updated to fetch flight data
    useEffect(() => {
        if (userLocation) {
            fetchData();
        }
    }, [userLocation]);

    return (
        <SafeAreaView style={styles.container}>
            <Button title="Refresh Data" onPress={getUserLocation} color="#007BFF" />
            {loading ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : error ? (
                <Text style={styles.errorText}>Error: {error}</Text>
            ) : !userLocation ? (
                <Text style={styles.infoText}>Waiting for location...</Text>
            ) : data.length > 0 ? (
                <ScrollView style={styles.scrollView}>
                    {data.map((flight) => (
                        <View key={flight.icao24} style={styles.flightContainer}>
                            <Text style={styles.icaoText}>ICAO24: {flight.icao24}</Text>
                            <Text style={styles.flightNumberText}>Flight Number: {flight.flightNumber}</Text> 
                            {flight.imageUrl ? (
                                <Image source={{ uri: flight.imageUrl }} style={styles.image} />
                            ) : (
                                <Text style={styles.noImageText}>No Image Available</Text> 
                            )}
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <Text style={styles.infoText}>No flight data available.</Text>
            )}
            {/* Integrate NearbyPlanes component */}
            {userLocation && <NearbyPlanes userLocation={userLocation} />} 
        </SafeAreaView>
    );
} 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5', // Light background color
    },
    scrollView: {
        width: '100%', 
    },
    flightContainer: {
        marginVertical: 10,
        padding: 15,
        backgroundColor: '#ffffff', // White background for each flight card
        borderRadius: 10,
        elevation: 3, // Adds a subtle shadow
    },
    icaoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333', // Darker text color
    },
    flightNumberText: {
        fontSize: 16,
        color: '#555', // Medium grey text
    },
    noImageText: {
        fontSize: 14,
        color: '#999', // Lighter grey text for fallback
    },
    image: {
        width: '100%',
        height: 150,
        resizeMode: 'cover', // Changed to cover for a modern look
        borderRadius: 10, // Rounded corners for the image
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginTop: 10,
    },
    infoText: {
        color: '#007BFF', // Blue color for informational text
        fontSize: 16,
        marginTop: 10,
    },
});

