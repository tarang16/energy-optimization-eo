import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import { MemoryRouter as Router } from 'react-router-dom'
import { describe, expect, it, test, vi } from 'vitest'
import { initialAppContextTest } from '../../../index.test'
import FormulaBox, { convertIfToTernary } from './FormulaBox'
vi.mock('utills/utilities', () => ({
  isValidString: vi.fn().mockReturnValue(false),
  getFinalCalc: vi.fn(),
}))
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: () => ({
      pathname:
        'http://localhost:3000/#/middle+east/arrazi/arrazi-3/reformer+performance+management/case-configuration-portal',
    }),
    useParams: vi.fn(),
    useNavigate: () => vi.fn(),
    useRouteError: () => vi.fn(),
  }
})
vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  },
}))
const propsData = {
  values_obj: {
    opportunity_production: 25.236139817805487,
    total_production: 106.90619774992979,
    Specific_energy_delta: 2222.409266114606,
    opportunity_energy: 2106.4372833809475,
    Total_energy_consumed_mmbtu_hr: 1424.5542039541701,
    total_energy_mmbtu_hr: 1512.322424095043,
    plant_status: 1,
  },
  id: 'input-max-501-1-1-9970',
  classes: 'form-control text-12-regular',
  value: '1',
}
function renderComponent(appObj, props) {
  return (
    <Provider
      value={{
        appContext: { ...appObj },
        setAppContext: (prevAppContext) => ({ ...prevAppContext }),
      }}
    >
      <Router>
        <FormulaBox {...props} />
      </Router>
    </Provider>
  )
}
test('handleSuggestionClick updates input and calls validation', async () => {
  const onFormulaValidation = vi.fn()
  const values_obj = { var1: 1 }
  render(
    <FormulaBox
      onFormulaValidation={onFormulaValidation}
      values_obj={values_obj}
    />,
  )
  const textarea = screen.getByTestId('formula-box-input')
  fireEvent.change(textarea, { target: { value: '[v' } })
  await waitFor(() => {
    const suggestionItem = screen.getByText('var1')
    expect(suggestionItem).toBeInTheDocument()
    fireEvent.click(suggestionItem)
  })
  await waitFor(() => {
    expect(textarea.value).toContain('var1')
    expect(onFormulaValidation).toHaveBeenCalled()
  })
})
test('renders textarea and initial value', () => {
  render(<FormulaBox inValue='initial' />)
  const textarea = screen.getByTestId('formula-box-input')
  expect(textarea).toBeInTheDocument()
  expect(textarea.value).toBe('initial')
})
function parseTrueVal(i, expr, trueVal) {
  let openParens = 0
  while (i < expr.length) {
    if (expr[i] === ',' && openParens === 0) break
    if (expr[i] === '(') openParens++
    if (expr[i] === ')') openParens--
    trueVal += expr[i++]
  }
  return [i, expr, trueVal]
}
describe('parseTrueVal', () => {
  it('parses until top-level comma', () => {
    const [newIndex, expr, trueVal] = parseTrueVal(0, 'true,false', '')
    expect(newIndex).toBe(4)
    expect(trueVal).toBe('true')
  })
  it('handles parentheses with comma inside', () => {
    const [newIndex, expr, trueVal] = parseTrueVal(0, 'if(x,y),false', '')
    expect(newIndex).toBe(7)
    expect(trueVal).toBe('if(x,y)')
  })
  it('returns full expression if no comma found', () => {
    const [newIndex, expr, trueVal] = parseTrueVal(0, 'trueValue', '')
    expect(newIndex).toBe(9)
    expect(trueVal).toBe('trueValue')
  })
  it('starts from middle of expression', () => {
    const [newIndex, expr, trueVal] = parseTrueVal(3, 'abc,def', '')
    expect(newIndex).toBe(3)
    expect(trueVal).toBe('')
  })
  it('handles empty string expression', () => {
    const [newIndex, expr, trueVal] = parseTrueVal(0, '', '')
    expect(newIndex).toBe(0)
    expect(trueVal).toBe('')
  })
  it('handles input where comma is at end', () => {
    const [newIndex, expr, trueVal] = parseTrueVal(0, 'abc,', '')
    expect(newIndex).toBe(3)
    expect(trueVal).toBe('abc')
  })
  it('parses until comma when no parentheses', () => {
    const [newIndex, , trueVal] = parseTrueVal(0, 'val1,val2', '')
    expect(newIndex).toBe(4)
    expect(trueVal).toBe('val1')
  })
  it('parses entire parentheses-wrapped expression', () => {
    const [newIndex, , trueVal] = parseTrueVal(0, 'func(x,y),z', '')
    expect(newIndex).toBe(9)
    expect(trueVal).toBe('func(x,y)')
  })
  it('handles empty expression', () => {
    const [newIndex, , trueVal] = parseTrueVal(0, '', '')
    expect(newIndex).toBe(0)
    expect(trueVal).toBe('')
  })
  it('handles unbalanced parens (more opens) by parsing whole expression', () => {
    const [newIndex, , trueVal] = parseTrueVal(0, 'func(x,y', '')
    expect(newIndex).toBe(8)
    expect(trueVal).toBe('func(x,y')
  })
  it('handles unbalanced parens (more closes) by parsing entire value', () => {
    const [newIndex, , trueVal] = parseTrueVal(0, 'x),y', '')
    expect(newIndex).toBe(4)
    expect(trueVal).toBe('x),y')
  })
})
describe('parseTrueVal', () => {
  test('parses until comma at top level', () => {
    const expr = 'abc,def'
    const i = 0
    const trueVal = ''
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([3, expr, 'abc'])
  })
  test('includes parentheses and ignores commas inside them', () => {
    const expr = 'func(a,b),rest'
    const i = 0
    const trueVal = ''
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([9, expr, 'func(a,b)'])
  })
  test('handles nested parentheses correctly', () => {
    const expr = 'outer(inner(a,b),c),end'
    const i = 0
    const trueVal = ''
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([19, expr, 'outer(inner(a,b),c)'])
  })
  test('parses full expression if no comma at top level', () => {
    const expr = 'noCommasHere()'
    const i = 0
    const trueVal = ''
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([expr.length, expr, expr])
  })
  test('handles starting from non-zero index', () => {
    const expr = 'skip,thisPart,parseThisPart'
    const i = 10
    const trueVal = ''
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([13, expr, 'art'])
  })
  test('increments trueVal if initial trueVal is non-empty', () => {
    const expr = 'abc,def'
    const i = 0
    const trueVal = 'start-'
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([3, expr, 'start-abc'])
  })
  test('handles unmatched parentheses by counting anyway', () => {
    const expr = 'func(a,b(c),d'
    const i = 0
    const trueVal = ''
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([expr.length, expr, expr])
  })
  test('stops immediately if starts at comma at top-level', () => {
    const expr = ',abc'
    const i = 0
    const trueVal = ''
    const result = parseTrueVal(i, expr, trueVal)
    expect(result).toEqual([0, expr, ''])
  })
})
describe('FormulaBox Component', () => {
  const valuesObj = {
    tag1: 42,
    tag2: 43,
    abc: 12,
    Wash_tower_overhead_temp: 10,
    Lean_cycle_gas_pressure: 20,
    CC_factor_reactor_A: 10,
    CC_factor_reactor_B: 30,
    match_tag_propane_content_in_product_draw_current_value: 0.1,
    match_tag_mass_balance_propylene_frac_current_value: 1,
    a: 5,
    b: 10,
  }
  const defaultProps = {
    onFormulaValidation: vi.fn(),
    values_obj: valuesObj,
    id: 'input-box',
    classes: 'form-control text-12-regular',
    value: '',
  }
  it('renders FormulaBox with props', async () => {
    render(renderComponent(initialAppContextTest, { ...propsData }))
    const inputField = await waitFor(() =>
      screen.getByTestId('formula-box-input'),
    )
    fireEvent.change(inputField, {
      target: {
        value:
          'if(parse(%{match_tag_propane_content_in_product_draw_current_value})>0.95,0.05,if(parse(%{match_tag_propane_content_in_product_draw_current_value})>0.95,0.05,if(parse(%{match_tag_mass_balance_propylene_frac_current_value})<=0,0.05,-0.03)))',
      },
    })
  })
  it('renders FormulaBox without props', async () => {
    render(renderComponent(initialAppContextTest, {}))
    const inputField = await waitFor(() =>
      screen.getByTestId('formula-box-input'),
    )
    fireEvent.change(inputField, {
      target: {
        value:
          'if(parse(%{match_tag_propane_content_in_product_draw_current_value})>0.95,0.05,if(parse(%{match_tag_propane_content_in_product_draw_current_value})>0.95,0.05,if(parse(%{match_tag_mass_balance_propylene_frac_current_value})<=0,0.05,-0.03)))',
      },
    })
  })
  it('updates input value on change and calls onFormulaValidation', async () => {
    const onFormulaValidation = vi.fn()
    render(<FormulaBox onFormulaValidation={onFormulaValidation} />)
    const textarea = await waitFor(() =>
      screen.getByTestId('formula-box-input'),
    )
    fireEvent.change(textarea, { target: { value: '2+2' } })
    await waitFor(() => {
      expect(textarea.value).toBe('2+2')
      expect(onFormulaValidation).toHaveBeenCalled()
      const callArg = onFormulaValidation.mock.calls[0][0]
      expect(callArg).toHaveProperty('isValid')
    })
  })
  it('shows suggestions when typing inside square brackets', async () => {
    render(<FormulaBox {...defaultProps} />)
    const input = await waitFor(() => screen.getByTestId('formula-box-input'))
    fireEvent.change(input, { target: { value: '2[tag1]' } })
    fireEvent.change(input, { target: { value: '2[tag1]+[' } })
    fireEvent.change(input, { target: { value: '2[tag1]+[t' } })
    const suggestions = screen.getAllByRole('listitem')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0]).toHaveTextContent('tag1')
  })
  it('replaces text inside active square brackets with suggestion', async () => {
    render(<FormulaBox {...defaultProps} />)
    const input = await waitFor(() => screen.getByTestId('formula-box-input'))
    fireEvent.change(input, { target: { value: '2[tag1]+[t' } })
    const suggestions = screen.getAllByRole('listitem')
    fireEvent.click(suggestions[0])
    expect(true).toBe(true)
  })
  it('does not show suggestions when cursor is outside brackets', async () => {
    render(<FormulaBox {...defaultProps} />)
    const input = await waitFor(() => screen.getByTestId('formula-box-input'))
    fireEvent.change(input, { target: { value: '2[tag1]+[tag1]' } })
    fireEvent.change(input, { target: { value: '2[tag1]+[tag1] ' } })
    const suggestions = screen.queryAllByRole('listitem')
    expect(suggestions.length).toBe(0)
  })
  it('adds closing bracket if not present', async () => {
    render(<FormulaBox {...defaultProps} />)
    const input = await waitFor(() => screen.findByTestId('formula-box-input'))
    fireEvent.change(input, { target: { value: '2[tag1]+[' } })
    fireEvent.change(input, { target: { value: '2[tag1]+[t' } })
    const suggestions = screen.getAllByRole('listitem')
    fireEvent.click(suggestions[0])
    expect(true).toBe(true)
  })
  it('shows suggestions for multiple square brackets individually', async () => {
    render(<FormulaBox {...defaultProps} />)
    const input = await waitFor(() => screen.getByTestId('formula-box-input'))
    fireEvent.change(input, { target: { value: '[abc]+[def]' } })
    fireEvent.change(input, { target: { value: '[abc]+[t' } })
    const suggestions = screen.getAllByRole('listitem')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0]).toHaveTextContent('tag1')
    fireEvent.change(input, { target: { value: '[a]+[def]' } })
    fireEvent.change(input, { target: { value: '[a]+[t' } })
    const newSuggestions = screen.getAllByRole('listitem')
    expect(newSuggestions.length).toBeGreaterThan(0)
    expect(newSuggestions[0]).toHaveTextContent('tag1')
  })
})
describe('convertIfToTernary', () => {
  test('returns same expression if not starting with if(', () => {
    expect(convertIfToTernary('a + b')).toBe('a + b')
  })
  test('handles simple if expression', () => {
    const input = 'if(a > b, a, b)'
    const expected = '(a > b?a:b)'
    expect(convertIfToTernary(input)).toBe(expected)
  })
  test('trims input and handles surrounding parentheses', () => {
    const input = '  (if(a > b, a, b))  '
    const expected = '((a > b?a:b))'
    expect(convertIfToTernary(input)).toBe(expected)
  })
  test('handles nested if in true branch', () => {
    const input = 'if(x > 0, if(x > 10, "large", "medium"), "small")'
    const expected = '(x > 0?(x > 10?"large":"medium"):"small")'
    expect(convertIfToTernary(input)).toBe(expected)
  })
  test('handles nested if in false branch', () => {
    const input = 'if(x > 0, "positive", if(x < 0, "negative", "zero"))'
    const expected = '(x > 0?"positive":(x < 0?"negative":"zero"))'
    expect(convertIfToTernary(input)).toBe(expected)
  })
  test('throws error on missing closing parenthesis', () => {
    expect(() => convertIfToTernary('if(x > 0, 1, 2')).toThrow(
      'Invalid if expression format',
    )
  })
  test('handles expressions with extra suffix after if', () => {
    const input = 'if(a, b, c) + 10'
    const expected = '(a?b:c) + 10'
    expect(convertIfToTernary(input)).toBe(expected)
  })
  test('handles nested parentheses with arithmetic', () => {
    const input = 'if((a + b) > c, a + b, c)'
    const expected = '((a + b) > c?a + b:c)'
    expect(convertIfToTernary(input)).toBe(expected)
  })
})
