import AsyncStorage from '@react-native-async-storage/async-storage';
import { Joke } from './jokeService';

const FAVORITES_KEY = 'joke_favorites';
const JOKE_HISTORY_KEY = 'joke_history';
const MAX_HISTORY = 100;

export async function saveFavorite(joke: Joke): Promise<void> {
  try {
    const favorites = await getFavorites();
    const jokeExists = favorites.some(fav => 
      (fav.joke === joke.joke && joke.type === 'single') ||
      (fav.setup === joke.setup && joke.type === 'twopart')
    );
    
    if (!jokeExists) {
      const updatedFavorites = [...favorites, joke];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    }
  } catch (error) {
    console.error('Error saving favorite:', error);
  }
}

export async function removeFavorite(jokeId: number): Promise<void> {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== jokeId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

export async function getFavorites(): Promise<Joke[]> {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error retrieving favorites:', error);
    return [];
  }
}

export async function isFavorite(joke: Joke): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    return favorites.some(fav =>
      (fav.joke === joke.joke && joke.type === 'single') ||
      (fav.setup === joke.setup && joke.type === 'twopart')
    );
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

export async function addToHistory(joke: Joke): Promise<void> {
  try {
    const history = await getHistory();
    const updatedHistory = [joke, ...history].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(JOKE_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error adding to history:', error);
  }
}

export async function getHistory(): Promise<Joke[]> {
  try {
    const history = await AsyncStorage.getItem(JOKE_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving history:', error);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(JOKE_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}