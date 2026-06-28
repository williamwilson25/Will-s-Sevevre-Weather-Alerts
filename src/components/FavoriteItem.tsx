import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Joke } from '../services/jokeService';

interface FavoriteItemProps {
  joke: Joke;
  onPress: () => void;
  onRemove: () => void;
}

export default function FavoriteItem({ joke, onPress, onRemove }: FavoriteItemProps) {
  const jokeText = joke.type === 'single' ? joke.joke : `${joke.setup} - ${joke.delivery}`;

  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{joke.category}</Text>
        </View>
        <Text style={styles.jokeText} numberOfLines={2}>
          {jokeText}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <MaterialCommunityIcons name="trash-can" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  content: {
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 10,
  },
  jokeText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  removeButton: {
    padding: 8,
  },
});