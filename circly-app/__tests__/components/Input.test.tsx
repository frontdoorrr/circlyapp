import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../../src/components/common/Input';

describe('Input Component', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" />
    );
    
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <Input label="Test Label" placeholder="Enter text" />
    );
    
    expect(getByText('Test Label')).toBeTruthy();
  });

  it('shows error message when error prop is provided', () => {
    const { getByText } = render(
      <Input placeholder="Enter text" error="This field is required" />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onChangeText={mockOnChangeText} />
    );
    
    const input = getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'test input');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('test input');
  });

  it('displays value correctly', () => {
    const { getByDisplayValue } = render(
      <Input placeholder="Enter text" value="test value" />
    );
    
    expect(getByDisplayValue('test value')).toBeTruthy();
  });
});