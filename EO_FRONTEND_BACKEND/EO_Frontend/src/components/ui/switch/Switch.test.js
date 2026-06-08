import { fireEvent, render, screen } from '@testing-library/react'
import { uuid4 } from 'utills/utilities'
import Switch from './Switch'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
// Mock the utilities
vi.mock('utills/utilities', () => ({
  uuid4: vi.fn(),
}))
describe('Switch Component', () => {
  const mockUuid = 'test-uuid-123'
  const mockOnChange = vi.fn()
  beforeEach(() => {
    uuid4.mockReturnValue(mockUuid)
    mockOnChange.mockClear()
  })
  // describe("Basic Rendering", () => {
  //   it("should render Switch component with default props", () => {
  //     render(<Switch />);

  //     // Check if the toggle text is rendered
  //     expect(screen.getByText("Toggle")).toBeInTheDocument();

  //     // Check if input element exists with correct attributes
  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toBeInTheDocument();
  //     expect(inputElement).toHaveAttribute("type", "checkbox");
  //     expect(inputElement).toHaveAttribute("id", mockUuid);
  //     expect(inputElement).not.toBeChecked();
  //     expect(inputElement).not.toBeDisabled();
  //   });
  //   it("should render with custom id when provided", () => {
  //     const customId = "custom-switch-id";
  //     render(<Switch id={customId} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toHaveAttribute("id", customId);
  //   });
  //   it("should use generated uuid when id is not provided", () => {
  //     render(<Switch />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toHaveAttribute("id", mockUuid);
  //     expect(uuid4).toHaveBeenCalled();
  //   });
  // });
  // describe("Checked States", () => {
  //   it("should render checked switch when checked prop is true", () => {
  //     render(<Switch checked={true} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toBeChecked();
  //   });
  //   it("should render unchecked switch when checked prop is false", () => {
  //     render(<Switch checked={false} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).not.toBeChecked();
  //   });
  //   it("should render with defaultChecked prop", () => {
  //     render(<Switch defaultChecked={true} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toBeChecked();
  //   });
  //   it("should prioritize checked prop over defaultChecked", () => {
  //     render(<Switch checked={false} defaultChecked={true} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).not.toBeChecked();
  //   });
  // });
  describe('Event Handling', () => {
    it('should call onChange when switch is toggled', () => {
      render(<Switch onChange={mockOnChange} />)

      const inputElement = screen.getByRole('checkbox')
      fireEvent.click(inputElement)

      expect(mockOnChange).toHaveBeenCalledTimes(1)
    })
    // it("should not call onChange when disabled", () => {
    //   render(<Switch onChange={mockOnChange} disabled={true} />);

    //   const inputElement = screen.getByRole("checkbox");
    //   fireEvent.click(inputElement);

    //   expect(mockOnChange).not.toHaveBeenCalled();
    // });
    it('should handle click event without onChange handler', () => {
      render(<Switch />)

      const inputElement = screen.getByRole('checkbox')
      expect(() => fireEvent.click(inputElement)).not.toThrow()
    })
  })
  // describe("Disabled State", () => {
  //   it("should render disabled switch when disabled prop is true", () => {
  //     render(<Switch disabled={true} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toBeDisabled();
  //   });
  //   it("should not be disabled when disabled prop is false", () => {
  //     render(<Switch disabled={false} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).not.toBeDisabled();
  //   });
  //   it("should have disabled class on label when disabled", () => {
  //     render(<Switch disabled={true} />);

  //     const labelElement = screen.getByText("Toggle").closest("label");
  //     expect(labelElement).toHaveClass("disbaledSwitchStyle");
  //     expect(labelElement).not.toHaveClass("cursor-pointer");
  //   });
  //   it("should have cursor-pointer class on label when not disabled", () => {
  //     render(<Switch disabled={false} />);

  //     const labelElement = screen.getByText("Toggle").closest("label");
  //     expect(labelElement).toHaveClass("cursor-pointer");
  //     expect(labelElement).toHaveClass("extraClassLabel");
  //     expect(labelElement).not.toHaveClass("disbaledSwitchStyle");
  //   });
  // });
  // describe("Styling and Classes", () => {
  //   it("should apply custom toggle style class", () => {
  //     const customStyle = "custom-switch-style";
  //     render(<Switch customToggleStyle={customStyle} />);

  //     const container = screen.getByText("Toggle").closest("div");
  //     expect(container).toHaveClass(customStyle);
  //   });
  //   it("should have correct container classes", () => {
  //     render(<Switch />);

  //     const switchContainer = screen.getByText("Toggle").closest("div");
  //     expect(switchContainer).toHaveClass("switchContainer");

  //     const subContainer = switchContainer.querySelector(".subSwitchContainer");
  //     expect(subContainer).toBeInTheDocument();
  //   });
  // });
  // describe("Test ID", () => {
  //   it("should apply custom testId to input element", () => {
  //     const customTestId = "custom-test-id";
  //     render(<Switch testId={customTestId} />);

  //     const inputElement = screen.getByTestId(customTestId);
  //     expect(inputElement).toBeInTheDocument();
  //     expect(inputElement).toHaveAttribute("type", "checkbox");
  //   });
  //   it("should be accessible by role when testId is not provided", () => {
  //     render(<Switch />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toBeInTheDocument();
  //   });
  // });
  // describe("Accessibility", () => {
  //   it("should have proper label association", () => {
  //     render(<Switch id="test-switch" />);

  //     const inputElement = screen.getByRole("checkbox");
  //     const labelElement = screen.getByText("Toggle");

  //     expect(labelElement).toHaveAttribute("for", "test-switch");
  //     expect(inputElement).toHaveAttribute("id", "test-switch");
  //   });
  //   it("should be accessible via keyboard", () => {
  //     render(<Switch onChange={mockOnChange} />);

  //     const inputElement = screen.getByRole("checkbox");

  //     // Test space key
  //     fireEvent.keyDown(inputElement, { key: " ", code: "Space" });
  //     expect(mockOnChange).toHaveBeenCalledTimes(1);

  //     // Test enter key
  //     fireEvent.keyDown(inputElement, { key: "Enter", code: "Enter" });
  //     expect(mockOnChange).toHaveBeenCalledTimes(2);
  //   });
  //   it("should have proper ARIA attributes", () => {
  //     render(<Switch checked={true} disabled={false} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toHaveAttribute("type", "checkbox");
  //     expect(inputElement).toBeChecked();
  //     expect(inputElement).not.toBeDisabled();
  //   });
  // });
  describe('Edge Cases', () => {
    // it("should handle null and undefined props gracefully", () => {
    //   render(<Switch id={null} checked={null} disabled={null} />);

    //   const inputElement = screen.getByRole("checkbox");
    //   expect(inputElement).toBeInTheDocument();
    //   expect(inputElement).not.toBeChecked();
    //   expect(inputElement).not.toBeDisabled();
    // });
    // it("should render without any props", () => {
    //   render(<Switch />);

    //   const inputElement = screen.getByRole("checkbox");
    //   expect(inputElement).toBeInTheDocument();
    // });
    it('should handle multiple rapid clicks', () => {
      render(<Switch onChange={mockOnChange} />)

      const inputElement = screen.getByRole('checkbox')

      // Simulate multiple rapid clicks
      fireEvent.click(inputElement)
      fireEvent.click(inputElement)
      fireEvent.click(inputElement)

      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })
    it('should handle undefined onChange prop', () => {
      render(<Switch onChange={undefined} />)

      const inputElement = screen.getByRole('checkbox')
      expect(() => fireEvent.click(inputElement)).not.toThrow()
    })
  })
  // describe("Prop Combinations", () => {
  //   it("should handle checked and disabled states together", () => {
  //     render(<Switch checked={true} disabled={true} />);

  //     const inputElement = screen.getByRole("checkbox");
  //     expect(inputElement).toBeChecked();
  //     expect(inputElement).toBeDisabled();
  //   });
  //   it("should handle custom id with testId", () => {
  //     const customId = "custom-id";
  //     const testId = "test-id";
  //     render(<Switch id={customId} testId={testId} />);

  //     const inputElement = screen.getByTestId(testId);
  //     expect(inputElement).toHaveAttribute("id", customId);
  //   });
  //   it("should handle all props together", () => {
  //     render(
  //       <Switch
  //         id="test-id"
  //         checked={true}
  //         defaultChecked={false}
  //         onChange={mockOnChange}
  //         testId="complete-test"
  //         disabled={false}
  //         customToggleStyle="custom-style"
  //       />
  //     );

  //     const inputElement = screen.getByTestId("complete-test");
  //     expect(inputElement).toBeChecked();
  //     expect(inputElement).toHaveAttribute("id", "test-id");
  //     expect(inputElement).not.toBeDisabled();
  //   });
  // });
})
