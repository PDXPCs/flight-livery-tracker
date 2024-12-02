import React from 'react';
import { View, Text } from 'react-native';
import EditScreenInfo from '../components/EditScreenInfo'; // Your import here

const IndexScreen = () => {
    return (
        <View>
            <Text>Welcome to the Flight Livery Tracker!</Text>
            <EditScreenInfo />
        </View>
    );
};

export default IndexScreen;
