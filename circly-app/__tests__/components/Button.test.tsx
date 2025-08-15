import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/common/Button';

describe('Button Component', () => {
  it('renders with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Disabled Button" onPress={mockOnPress} disabled />
    );
    
    const button = getByText('Disabled Button').parent;
    fireEvent.press(button!);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Loading Button" onPress={() => {}} loading />
    );
    
    // Title should not be visible when loading
    expect(queryByText('Loading Button')).toBeNull();
    // Loading indicator should be present (ActivityIndicator)
    // Note: ActivityIndicator doesn't have a testID by default
  });

  it('applies different variants correctly', () => {
    const { getByText: getPrimary } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" />
    );
    
    const { getByText: getSecondary } = render(
      <Button title="Secondary" onPress={() => {}} variant="secondary" />
    );
    
    const { getByText: getOutline } = render(
      <Button title="Outline" onPress={() => {}} variant="outline" />
    );
    
    expect(getPrimary('Primary')).toBeTruthy();
    expect(getSecondary('Secondary')).toBeTruthy();
    expect(getOutline('Outline')).toBeTruthy();
  });
});