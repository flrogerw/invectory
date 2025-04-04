import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Keyboard,
    ImageBackground,
} from 'react-native';
import ImageGrid from './ImageGrid';
import { searchImageEmbeddings } from '../utils/database';
import { getTextEmbedding } from '../utils/embedding';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';



const TextSearchScreen = () => {
    const [uri, setUri] = useState<string | null>('');
    const [results, setResults] = useState<{ id: number; path: string; distance?: number | null | undefined }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const backgroundSource = uri ? { uri } : require('../assets/icon.png');



    // Reset state when the screen loses focus (for example, when switching tabs)
    useFocusEffect(
        React.useCallback(() => {
            return () => {
                // On blur, reset state so that when you return the screen starts fresh
                setUri(null);
                setResults([]);
                setLoading(false);
                setSelectedImageId(null);
            };
        }, [])
    );

    const handleSearch = async () => {
        setLoading(true);
        setQuery('');
        try {
            const vectorEmbedding = await getTextEmbedding(query);
            const embedding = new Float32Array(vectorEmbedding);
            const searchResults = await searchImageEmbeddings(embedding);
            setUri(searchResults[0].path)
            setResults(searchResults);
        } catch (error) {
            console.error("Error searching image embeddings:", error);
            Alert.alert("Error", "Failed to search image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Resets state to allow a new search.
    const handleSearchAgain = () => {
        setUri(null);
        setResults([]);
        setLoading(false);
        setSelectedImageId(null);
        setQuery('');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#e0caa2' }}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            ) : !results.length ? (
                <>
                    <ImageBackground
                        source={backgroundSource}
                        resizeMode="contain"
                        style={styles.container}
                        imageStyle={styles.imageStyle}
                    />
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter search query..."
                            value={query}
                            onChangeText={setQuery}
                        />
                        <Pressable style={styles.button} onPress={handleSearch}>
                            <MaterialIcons name="search" size={24} color="#fff" />
                        </Pressable>
                        <Pressable onPress={Keyboard.dismiss} style={styles.button}>
                            <MaterialIcons name="cancel-presentation" size={24} color="#fff" />
                        </Pressable>
                    </View>

                </>
            ) : (
                <>
                    <ImageBackground source={backgroundSource} resizeMode="contain" style={styles.container} imageStyle={styles.imageStyle} />
                    <View>
                        <ImageGrid images={results} onImagePress={(id) => setSelectedImageId(id)} />
                    </View>
                    <View>
                        <Pressable style={styles.searchAgainBtn} onPress={handleSearchAgain}>
                            <Text style={styles.searchAgainText}>Search Again</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "80%",
        aspectRatio: 1,
        borderRadius: 5,
        marginBottom: 20,
        marginTop: 20,
        alignSelf: 'center',
        backgroundColor: '#e69d50', // Ensure a background color is set
        shadowColor: "#2a241d",
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 5, // This affects Android
    },
    imageStyle: {
        borderRadius: 5,
        width: "100%",
    },
    inputRow: {
        flexDirection: 'row', // Place items horizontally
        alignItems: 'center', // Center vertically
        justifyContent: 'space-between', // Optional, depending on layout
        paddingHorizontal: 20, // Adjust spacing as needed
    },
    input: {
        flex: 1, // Input takes up remaining space
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: "#d39a64",
        marginRight: 10, // Space between input and button
    },
    button: {
        backgroundColor: "#316b99",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: "center",
        marginHorizontal: 1,
        //width: "30%",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    searchAgainBtn: {
        position: "absolute",
        bottom: 10,
        backgroundColor: "#316b99",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignSelf: "center",
        width: "70%",
    },
    searchAgainText: {
        color: "#e69d50",
        fontSize: 16,
        fontWeight: "600",
        alignSelf: "center",
    },
    loadingContainer: {
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: "#316b99",
    },
});

export default TextSearchScreen;
