import { View } from '@react-pdf/renderer'
import { render } from '@testing-library/react'
import PdfTable from './PDFTable'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
// Mock the utility functions
vi.mock('../AlertStatistics', () => ({
  formatDateWithoutTime: vi.fn((epoch) => `formatted-date-${epoch}`),
  formatDateWithTime: vi.fn((epoch) => `formatted-datetime-${epoch}`),
  getValOrEmptyStr: vi.fn((val) => val || ''),
}))
// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  Text: vi.fn(({ children, style }) => <text style={style}>{children}</text>),
  View: vi.fn(({ children, style }) => <view style={style}>{children}</view>),
}))
describe('PdfTable', () => {
  const mockColumnConfig = [
    {
      field: 'name',
      displayName: 'Name',
      flex: 2,
      columnAlign: 'left',
      contentAlign: 'left',
    },
    {
      field: 'age',
      displayName: 'Age',
      flex: 1,
      columnAlign: 'center',
      contentAlign: 'center',
    },
    {
      field: 'dueDateEpoch',
      displayName: 'Due Date',
      flex: 1.5,
      columnAlign: 'right',
      contentAlign: 'right',
    },
  ]
  const mockRowData = [
    { name: 'John Doe', age: 30, dueDateEpoch: 1633046400 },
    { name: 'Jane Smith', age: 25, dueDateEpoch: 1633132800 },
  ]
  beforeEach(() => {
    vi.clearAllMocks()
  })
  // describe('getCellValue', () => {
  //     it('should format dueDateEpoch using formatDateWithoutTime', () => {
  //         const result = getCellValue('dueDateEpoch', 1633046400);
  //         expect(result).toBe('formatted-date-1633046400');
  //     });
  //     it('should format inProgressSinceEpoch using formatDateWithTime', () => {
  //         const result = getCellValue('inProgressSinceEpoch', 1633046400);
  //         expect(result).toBe('formatted-datetime-1633046400');
  //     });
  //     it('should format pendingSinceEpoch using formatDateWithTime', () => {
  //         const result = getCellValue('pendingSinceEpoch', 1633046400);
  //         expect(result).toBe('formatted-datetime-1633046400');
  //     });
  //     it('should use getValOrEmptyStr for other fields', () => {
  //         const result = getCellValue('name', 'John Doe');
  //         expect(result).toBe('John Doe');
  //     });
  //     it('should handle empty values with getValOrEmptyStr', () => {
  //         const result = getCellValue('age', '');
  //         expect(result).toBe('');
  //     });
  // });
  describe('PdfTable Component', () => {
    // it('should render "No data available" when columnConfig is missing', () => {
    //     const { getByText } = render(<PdfTable rowData={mockRowData} />);
    //     expect(getByText('No data available')).toBeInTheDocument();
    // });
    // it('should render "No data available" when rowData is missing', () => {
    //     const { getByText } = render(<PdfTable columnConfig={mockColumnConfig} />);
    //     expect(getByText('No data available')).toBeInTheDocument();
    // });
    // it('should render "No data available" when columnConfig is not an array', () => {
    //     const { getByText } = render(<PdfTable columnConfig={null} rowData={mockRowData} />);
    //     expect(getByText('No data available')).toBeInTheDocument();
    // });
    // it('should render "No data available" when rowData is not an array', () => {
    //     const { getByText } = render(<PdfTable columnConfig={mockColumnConfig} rowData={null} />);
    //     expect(getByText('No data available')).toBeInTheDocument();
    // });
    // it('should render table header with correct column names', () => {
    //     render(<PdfTable columnConfig={mockColumnConfig} rowData={mockRowData} />);

    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: 'Name',
    //             style: expect.objectContaining({ textAlign: 'left' })
    //         }),
    //         expect.anything()
    //     );

    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: 'Age',
    //             style: expect.objectContaining({ textAlign: 'center' })
    //         }),
    //         expect.anything()
    //     );

    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: 'Due Date',
    //             style: expect.objectContaining({ textAlign: 'right' })
    //         }),
    //         expect.anything()
    //     );
    // });
    // it('should render table rows with correct data', () => {
    //     render(<PdfTable columnConfig={mockColumnConfig} rowData={mockRowData} />);
    //     // Check if row data is rendered
    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: 'John Doe'
    //         }),
    //         expect.anything()
    //     );

    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: '30'
    //         }),
    //         expect.anything()
    //     );
    // });
    it('should apply custom styles when provided', () => {
      const customTableStyle = { borderColor: 'red' }
      const customHeaderStyle = { backgroundColor: 'blue' }
      const customRowStyle = { minHeight: 40 }
      const customCellStyle = { padding: 10 }
      render(
        <PdfTable
          columnConfig={mockColumnConfig}
          rowData={mockRowData}
          tableStyle={customTableStyle}
          headerStyle={customHeaderStyle}
          rowStyle={customRowStyle}
          cellStyle={customCellStyle}
        />,
      )
      // Check if custom styles are applied
      expect(View).toHaveBeenCalledWith(
        expect.objectContaining({
          style: expect.arrayContaining([expect.any(Object), customTableStyle]),
        }),
        expect.anything(),
      )
    })
    // it('should handle empty rowData array', () => {
    //     const { queryByText } = render(<PdfTable columnConfig={mockColumnConfig} rowData={[]} />);

    //     // Should not show "No data available" for empty array
    //     expect(queryByText('No data available')).not.toBeInTheDocument();

    //     // Header should still be rendered
    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: 'Name'
    //         }),
    //         expect.anything()
    //     );
    // });
    // it('should apply zebra striping to rows', () => {
    //     render(<PdfTable columnConfig={mockColumnConfig} rowData={mockRowData} />);
    //     // Check if zebra striping is applied
    //     expect(View).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             style: expect.arrayContaining([
    //                 expect.any(Object),
    //                 { backgroundColor: '#ffffff' } // First row
    //             ])
    //         }),
    //         expect.anything()
    //     );
    //     expect(View).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             style: expect.arrayContaining([
    //                 expect.any(Object),
    //                 { backgroundColor: '#fafafa' } // Second row
    //             ])
    //         }),
    //         expect.anything()
    //     );
    // });
    // it('should handle columns without displayName', () => {
    //     const columnsWithoutDisplayName = [
    //         { field: 'name', flex: 1 },
    //         { field: 'age', flex: 1 },
    //     ];
    //     render(<PdfTable columnConfig={columnsWithoutDisplayName} rowData={mockRowData} />);
    //     // Should use field name when displayName is not provided
    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: 'name'
    //         }),
    //         expect.anything()
    //     );
    // });
    // it('should handle styleConditon function correctly', () => {
    //     // This tests the internal styleConditon function through the component rendering
    //     render(<PdfTable columnConfig={mockColumnConfig} rowData={mockRowData} />);
    //     // Check if justifyContent is set correctly based on textAlign
    //     expect(View).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             style: expect.arrayContaining([
    //                 expect.any(Object),
    //                 expect.objectContaining({
    //                     justifyContent: 'flex-start' // for 'left' alignment
    //                 })
    //             ])
    //         }),
    //         expect.anything()
    //     );
    // });
    // it('should handle missing field values gracefully', () => {
    //     const rowWithMissingFields = [
    //         { name: 'John Doe', age: 30 }, // missing dueDateEpoch
    //     ];
    //     render(<PdfTable columnConfig={mockColumnConfig} rowData={rowWithMissingFields} />);
    //     // Should handle missing fields without crashing
    //     expect(Text).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             children: '' // empty string for missing dueDateEpoch
    //         }),
    //         expect.anything()
    //     );
    // });
  })
})
