// frontend/src/components/DealerSelection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Dealer {
id: string;
name: string;
}

interface DealerSelectionProps {
dealers: Dealer[];
selectedDealerIds: string[];
onDealerToggle: (dealerId: string) => void;
}

const DealerSelection: React.FC<DealerSelectionProps> = ({
dealers,
selectedDealerIds,
onDealerToggle,
}) => {
return (
  <View style={styles.container}>
    {dealers.map((dealer) => {
      const isSelected = selectedDealerIds.includes(dealer.id);
      return (
        <TouchableOpacity
          key={dealer.id}
          style={[styles.dealerButton, isSelected ? styles.selectedButton : styles.unselectedButton]}
          onPress={() => onDealerToggle(dealer.id)}
        >
          <Text style={[styles.buttonText, isSelected ? styles.selectedText : styles.unselectedText]}>
            {dealer.name}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
};

const styles = StyleSheet.create({
container: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginBottom: 10,
},
dealerButton: {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 20,
  borderWidth: 1,
  margin: 5,
},
selectedButton: {
  backgroundColor: '#007bff',
  borderColor: '#007bff',
},
unselectedButton: {
  backgroundColor: '#fff',
  borderColor: '#ccc',
},
buttonText: {
  fontSize: 14,
},
selectedText: {
  color: '#fff',
  fontWeight: 'bold',
},
unselectedText: {
  color: '#555',
},
});

export default DealerSelection;